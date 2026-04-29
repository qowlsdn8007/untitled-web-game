import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { Server } from "socket.io";
import {
  ROUND_RESTART_DELAY_MS,
  SERVER_TICK_MS,
  MAX_PLAYERS,
  type BombPlacedPayload,
  type ClientToServerEvents,
  type JoinPayload,
  type PlayerInputPayload,
  type PlayerUpdatedPayload,
  type ServerToClientEvents,
  type WorldUpdatedPayload
} from "../shared/protocol.js";
import { canPlaceBomb, createBomb } from "./game/bombs.js";
import { addBotPlayer, shouldBotTryPlaceBomb, updateBotInputs } from "./game/bots.js";
import { resolveExplosions } from "./game/explosions.js";
import { clearPendingStart, resetPlayerReadiness, setPlayerReady, syncMatchLifecycle } from "./game/match.js";
import { emitMatchState } from "./game/match.js";
import {
  createFinishedMatchState,
  createPlayerState,
  createWaitingMatchState,
  createWorldSnapshot,
  type GameState,
  resetRoundState
} from "./game/state.js";
import { stepPlayerMovement } from "./game/movement.js";
import { collectPowerUps } from "./game/powerups.js";
import { applyFlameDamage, getRoundOutcome } from "./game/round.js";
import {
  cleanupRoomIfEmpty,
  getOrCreateRoomState,
  resolveJoinRoomId,
  type RoomRegistry
} from "./game/rooms.js";

type InterServerEvents = Record<string, never>;
type SocketData = {
  playerId?: string;
  roomId?: string;
};

const app = express();
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173"
  })
);

const roomStates: RoomRegistry = new Map();

app.get("/health", (_req, res) => {
  const rooms = [...roomStates.values()];
  const totalPlayers = rooms.reduce((count, roomState) => count + roomState.players.size, 0);

  res.json({
    ok: true,
    players: totalPlayers,
    rooms: roomStates.size,
    mapId: rooms[0]?.mapId ?? null
  });
});

const server = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173"
  }
});

io.on("connection", (socket) => {
  socket.on("player:join", (payload: JoinPayload) => {
    const { nickname } = payload;
    const normalizedRoomId = resolveJoinRoomId(roomStates, payload);
    const roomState = getOrCreateRoomState(roomStates, normalizedRoomId);
    const player = createPlayerState(socket.id, sanitizeNickname(nickname), roomState.players.size);

    socket.join(normalizedRoomId);
    socket.data.playerId = player.id;
    socket.data.roomId = normalizedRoomId;
    roomState.players.set(player.id, player);

    socket.emit("world:init", createWorldSnapshot(roomState, player.id, normalizedRoomId));
    socket.to(normalizedRoomId).emit("player:joined", player);

    syncMatchLifecycle(io, roomState, normalizedRoomId);
  });

  socket.on("player:ready", ({ ready }) => {
    const playerId = socket.data.playerId;
    const roomId = socket.data.roomId;
    if (!playerId || !roomId) {
      return;
    }

    const roomState = roomStates.get(roomId);
    const player = roomState?.players.get(playerId);
    if (!roomState || !player) {
      return;
    }

    if (!setPlayerReady(player, ready, roomState.match.status)) {
      return;
    }

    io.to(roomId).emit("player:updated", toPlayerUpdatedPayload(player));
    syncMatchLifecycle(io, roomState, roomId);
  });

  socket.on("room:bot:add", () => {
    const roomId = socket.data.roomId;
    if (!roomId) {
      return;
    }

    const roomState = roomStates.get(roomId);
    if (!roomState || roomState.players.size >= MAX_PLAYERS || roomState.match.status === "running") {
      return;
    }

    const bot = addBotPlayer(roomState, roomId);
    io.to(roomId).emit("player:joined", bot);
    io.to(roomId).emit("player:updated", toPlayerUpdatedPayload(bot));
    syncMatchLifecycle(io, roomState, roomId);
  });

  socket.on("player:input", (payload: PlayerInputPayload) => {
    const playerId = socket.data.playerId;
    const roomId = socket.data.roomId;
    if (!playerId) {
      return;
    }

    if (!roomId) {
      return;
    }

    const roomState = roomStates.get(roomId);
    if (!roomState || !roomState.players.has(playerId)) {
      return;
    }

    roomState.playerInputs.set(playerId, payload);
  });

  socket.on("bomb:place", () => {
    const playerId = socket.data.playerId;
    const roomId = socket.data.roomId;
    if (!playerId) {
      return;
    }

    if (!roomId) {
      return;
    }

    const roomState = roomStates.get(roomId);
    if (!roomState) {
      return;
    }

    const player = roomState.players.get(playerId);
    if (!player) {
      return;
    }

    if (!canPlaceBomb(player, roomState.grid, roomState.bombs.values(), roomState.match.status)) {
      return;
    }

    const bomb = createBomb(playerId, player, Date.now());
    roomState.bombs.set(bomb.id, bomb);
    player.activeBombs += 1;

    io.to(roomId).emit("bomb:placed", toBombPlacedPayload(bomb, player));
    io.to(roomId).emit("player:updated", toPlayerUpdatedPayload(player));
  });

  socket.on("disconnect", () => {
    const playerId = socket.data.playerId;
    const roomId = socket.data.roomId;
    if (!playerId) {
      return;
    }

    if (!roomId) {
      return;
    }

    const roomState = roomStates.get(roomId);
    if (!roomState) {
      return;
    }

    roomState.players.delete(playerId);
    roomState.playerInputs.delete(playerId);
    socket.to(roomId).emit("player:left", { id: playerId });
    syncMatchLifecycle(io, roomState, roomId);
    cleanupRoomIfEmpty(roomStates, roomId, clearPendingStart);
  });
});

const tickTimer = setInterval(() => {
  roomStates.forEach((roomState, roomId) => {
    if (roomState.match.status !== "running") {
      return;
    }

    const now = Date.now();
    updateBotInputs(roomState, now);

    roomState.players.forEach((player, playerId) => {
      const input = roomState.playerInputs.get(playerId);
      const nextState = stepPlayerMovement(player, input, roomState.grid, roomState.bombs.values(), SERVER_TICK_MS);

      if (didPlayerChange(player, nextState)) {
        roomState.players.set(playerId, nextState);
        io.to(roomId).emit("player:updated", toPlayerUpdatedPayload(nextState));
      }

      if (shouldBotTryPlaceBomb(playerId, now) && canPlaceBomb(nextState, roomState.grid, roomState.bombs.values(), roomState.match.status)) {
        const bomb = createBomb(playerId, nextState, now);
        roomState.bombs.set(bomb.id, bomb);
        nextState.activeBombs += 1;
        roomState.players.set(playerId, nextState);
        io.to(roomId).emit("bomb:placed", toBombPlacedPayload(bomb, nextState));
        io.to(roomId).emit("player:updated", toPlayerUpdatedPayload(nextState));
      }
    });

    const collectedPowerUps = collectPowerUps(roomState.players.values(), roomState.powerUps);
    collectedPowerUps.updatedPlayers.forEach((player) => {
      io.to(roomId).emit("player:updated", toPlayerUpdatedPayload(player));
    });

    const worldUpdate = resolveExplosions(roomState, Date.now());
    if (worldUpdate) {
      io.to(roomId).emit("world:updated", toWorldUpdatedPayload(worldUpdate));
    }

    if (collectedPowerUps.collectedPowerUps.length > 0) {
      emitWorldState(roomId, roomState);
    }

    const defeatedPlayers = applyFlameDamage(roomState.players.values(), roomState.flames);
    defeatedPlayers.forEach((player) => {
      io.to(roomId).emit("player:updated", toPlayerUpdatedPayload(player));
    });

    const outcome = getRoundOutcome(roomState.players.values());
    if (outcome && !roomState.pendingRestartTimer) {
      finishRound(roomId, roomState, outcome.winnerId);
    }
  });
}, SERVER_TICK_MS);

const port = Number(process.env.PORT ?? 3001);
server.listen(port, () => {
  console.log(`Multiplayer map server listening on http://localhost:${port}`);
});

process.on("SIGTERM", () => {
  roomStates.forEach((roomState) => {
    clearPendingStart(roomState);
  });
  clearInterval(tickTimer);
});

process.on("SIGINT", () => {
  roomStates.forEach((roomState) => {
    clearPendingStart(roomState);
  });
  clearInterval(tickTimer);
});

function sanitizeNickname(nickname: string): string {
  const trimmed = nickname.trim().slice(0, 16);
  return trimmed.length > 0 ? trimmed : "guest";
}

function toPlayerUpdatedPayload(player: import("../shared/protocol.js").PlayerState): PlayerUpdatedPayload {
  return {
    id: player.id,
    ready: player.ready,
    tileX: player.tileX,
    tileY: player.tileY,
    pixelX: player.pixelX,
    pixelY: player.pixelY,
    direction: player.direction,
    moving: player.moving,
    alive: player.alive,
    maxBombs: player.maxBombs,
    activeBombs: player.activeBombs,
    flameRange: player.flameRange,
    moveSpeed: player.moveSpeed
  };
}

function toBombPlacedPayload(
  bomb: import("../shared/protocol.js").BombState,
  player: import("../shared/protocol.js").PlayerState
): BombPlacedPayload {
  return {
    bomb: { ...bomb },
    playerId: player.id,
    activeBombs: player.activeBombs
  };
}

function toWorldUpdatedPayload(payload: WorldUpdatedPayload): WorldUpdatedPayload {
  return {
    grid: payload.grid.map((row) => [...row]),
    bombs: payload.bombs.map((bomb) => ({ ...bomb })),
    flames: payload.flames.map((flame) => ({ ...flame })),
    powerUps: payload.powerUps.map((powerUp) => ({ ...powerUp })),
    playerBombs: payload.playerBombs.map((playerBomb) => ({ ...playerBomb }))
  };
}

function finishRound(roomId: string, roomState: GameState, winnerId: string | null) {
  roomState.match = createFinishedMatchState(roomState.match.round, winnerId, Date.now());
  emitMatchState(io, roomState, roomId);

  roomState.pendingRestartTimer = setTimeout(() => {
    roomState.pendingRestartTimer = null;
    resetRoundState(roomState);
    resetPlayerReadiness(roomState.players.values());
    roomState.match = createWaitingMatchState(roomState.match.round + 1);

    emitMatchState(io, roomState, roomId);
    emitWorldState(roomId, roomState);
    roomState.players.forEach((player) => {
      io.to(roomId).emit("player:updated", toPlayerUpdatedPayload(player));
    });
  }, ROUND_RESTART_DELAY_MS);
}

function emitWorldState(roomId: string, roomState: GameState) {
  io.to(roomId).emit(
    "world:updated",
    toWorldUpdatedPayload({
      grid: roomState.grid,
      bombs: [...roomState.bombs.values()],
      flames: roomState.flames,
      powerUps: [...roomState.powerUps.values()],
      playerBombs: [...roomState.players.values()].map((player) => ({
        id: player.id,
        activeBombs: player.activeBombs
      }))
    })
  );
}

function didPlayerChange(previous: import("../shared/protocol.js").PlayerState, next: import("../shared/protocol.js").PlayerState): boolean {
  return (
    previous.tileX !== next.tileX ||
    previous.tileY !== next.tileY ||
    previous.pixelX !== next.pixelX ||
    previous.pixelY !== next.pixelY ||
    previous.direction !== next.direction ||
    previous.moving !== next.moving
  );
}

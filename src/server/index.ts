import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { Server } from "socket.io";
import {
  MIN_PLAYERS_TO_START,
  ROUND_RESTART_DELAY_MS,
  SERVER_TICK_MS,
  type BombPlacedPayload,
  type ClientToServerEvents,
  type JoinPayload,
  type PlayerInputPayload,
  type PlayerUpdatedPayload,
  type ServerToClientEvents,
  type WorldUpdatedPayload
} from "../shared/protocol.js";
import { canPlaceBomb, createBomb } from "./game/bombs.js";
import { resolveExplosions } from "./game/explosions.js";
import { clearPendingStart, syncMatchLifecycle } from "./game/match.js";
import { emitMatchState } from "./game/match.js";
import {
  createFinishedMatchState,
  createInitialGameState,
  createPlayerState,
  createRunningMatchState,
  createWaitingMatchState,
  createWorldSnapshot,
  resetRoundState
} from "./game/state.js";
import { stepPlayerMovement } from "./game/movement.js";
import { collectPowerUps } from "./game/powerups.js";
import { applyFlameDamage, getRoundOutcome } from "./game/round.js";

type InterServerEvents = Record<string, never>;
type SocketData = {
  playerId?: string;
};

const app = express();
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173"
  })
);

const gameState = createInitialGameState();

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    players: gameState.players.size,
    mapId: gameState.mapId,
    matchStatus: gameState.match.status,
    round: gameState.match.round
  });
});

const server = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173"
  }
});

io.on("connection", (socket) => {
  socket.on("player:join", ({ nickname }: JoinPayload) => {
    const player = createPlayerState(socket.id, sanitizeNickname(nickname), gameState.players.size);

    socket.data.playerId = player.id;
    gameState.players.set(player.id, player);

    socket.emit("world:init", createWorldSnapshot(gameState, player.id));
    socket.broadcast.emit("player:joined", player);

    syncMatchLifecycle(io, gameState);
  });

  socket.on("player:input", (payload: PlayerInputPayload) => {
    const playerId = socket.data.playerId;
    if (!playerId) {
      return;
    }

    if (!gameState.players.has(playerId)) {
      return;
    }

    gameState.playerInputs.set(playerId, payload);
  });

  socket.on("bomb:place", () => {
    const playerId = socket.data.playerId;
    if (!playerId) {
      return;
    }

    const player = gameState.players.get(playerId);
    if (!player) {
      return;
    }

    if (!canPlaceBomb(player, gameState.grid, gameState.bombs.values(), gameState.match.status)) {
      return;
    }

    const bomb = createBomb(playerId, player, Date.now());
    gameState.bombs.set(bomb.id, bomb);
    player.activeBombs += 1;

    io.emit("bomb:placed", toBombPlacedPayload(bomb, player));
    io.emit("player:updated", toPlayerUpdatedPayload(player));
  });

  socket.on("disconnect", () => {
    const playerId = socket.data.playerId;
    if (!playerId) {
      return;
    }

    gameState.players.delete(playerId);
    gameState.playerInputs.delete(playerId);
    socket.broadcast.emit("player:left", { id: playerId });
    syncMatchLifecycle(io, gameState);
  });
});

const tickTimer = setInterval(() => {
  if (gameState.match.status !== "running") {
    return;
  }

  gameState.players.forEach((player, playerId) => {
    const input = gameState.playerInputs.get(playerId);
    const nextState = stepPlayerMovement(player, input, gameState.grid, gameState.bombs.values(), SERVER_TICK_MS);

    if (!didPlayerChange(player, nextState)) {
      return;
    }

    gameState.players.set(playerId, nextState);
    io.emit("player:updated", toPlayerUpdatedPayload(nextState));
  });

  const collectedPowerUps = collectPowerUps(gameState.players.values(), gameState.powerUps);
  collectedPowerUps.updatedPlayers.forEach((player) => {
    io.emit("player:updated", toPlayerUpdatedPayload(player));
  });

  const worldUpdate = resolveExplosions(gameState, Date.now());
  if (worldUpdate) {
    io.emit("world:updated", toWorldUpdatedPayload(worldUpdate));
  }

  if (collectedPowerUps.collectedPowerUps.length > 0) {
    emitWorldState();
  }

  const defeatedPlayers = applyFlameDamage(gameState.players.values(), gameState.flames);
  defeatedPlayers.forEach((player) => {
    io.emit("player:updated", toPlayerUpdatedPayload(player));
  });

  const outcome = getRoundOutcome(gameState.players.values());
  if (outcome && !gameState.pendingRestartTimer) {
    finishRound(outcome.winnerId);
  }
}, SERVER_TICK_MS);

const port = Number(process.env.PORT ?? 3001);
server.listen(port, () => {
  console.log(`Multiplayer map server listening on http://localhost:${port}`);
});

process.on("SIGTERM", () => {
  clearPendingStart(gameState);
  clearInterval(tickTimer);
});

process.on("SIGINT", () => {
  clearPendingStart(gameState);
  clearInterval(tickTimer);
});

function sanitizeNickname(nickname: string): string {
  const trimmed = nickname.trim().slice(0, 16);
  return trimmed.length > 0 ? trimmed : "guest";
}

function toPlayerUpdatedPayload(player: import("../shared/protocol.js").PlayerState): PlayerUpdatedPayload {
  return {
    id: player.id,
    tileX: player.tileX,
    tileY: player.tileY,
    pixelX: player.pixelX,
    pixelY: player.pixelY,
    direction: player.direction,
    moving: player.moving,
    alive: player.alive,
    activeBombs: player.activeBombs,
    flameRange: player.flameRange
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

function finishRound(winnerId: string | null) {
  gameState.match = createFinishedMatchState(gameState.match.round, winnerId, Date.now());
  emitMatchState(io, gameState);

  gameState.pendingRestartTimer = setTimeout(() => {
    gameState.pendingRestartTimer = null;
    resetRoundState(gameState);

    if (gameState.players.size < MIN_PLAYERS_TO_START) {
      gameState.match = createWaitingMatchState(gameState.match.round + 1);
    } else {
      gameState.match = createRunningMatchState(gameState.match.round + 1, Date.now());
    }

    emitMatchState(io, gameState);
    emitWorldState();
    gameState.players.forEach((player) => {
      io.emit("player:updated", toPlayerUpdatedPayload(player));
    });
  }, ROUND_RESTART_DELAY_MS);
}

function emitWorldState() {
  io.emit(
    "world:updated",
    toWorldUpdatedPayload({
      grid: gameState.grid,
      bombs: [...gameState.bombs.values()],
      flames: gameState.flames,
      powerUps: [...gameState.powerUps.values()],
      playerBombs: [...gameState.players.values()].map((player) => ({
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

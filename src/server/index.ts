import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { Server } from "socket.io";
import {
  SERVER_TICK_MS,
  type ClientToServerEvents,
  type JoinPayload,
  type PlayerInputPayload,
  type PlayerUpdatedPayload,
  type ServerToClientEvents
} from "../shared/protocol.js";
import { clearPendingStart, syncMatchLifecycle } from "./game/match.js";
import { createInitialGameState, createPlayerState, createWorldSnapshot } from "./game/state.js";
import { stepPlayerMovement } from "./game/movement.js";

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
    const nextState = stepPlayerMovement(player, input, gameState.grid, SERVER_TICK_MS);

    if (!didPlayerChange(player, nextState)) {
      return;
    }

    gameState.players.set(playerId, nextState);
    io.emit("player:updated", toPlayerUpdatedPayload(nextState));
  });
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

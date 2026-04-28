import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { Server } from "socket.io";
import {
  TILE_SIZE,
  type ClientToServerEvents,
  type Direction,
  type JoinPayload,
  type MovePayload,
  type PlayerState,
  type PlayerUpdatedPayload,
  type ServerToClientEvents
} from "../shared/protocol.js";
import { isBlockedAt } from "../shared/map.js";
import { clearPendingStart, syncMatchLifecycle } from "./game/match.js";
import { createInitialGameState, createPlayerState, createWorldSnapshot } from "./game/state.js";

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

  socket.on("player:move", (payload: MovePayload) => {
    const playerId = socket.data.playerId;
    if (!playerId) {
      return;
    }

    const currentPlayer = gameState.players.get(playerId);
    if (!currentPlayer) {
      return;
    }

    const nextState = normalizeMove(currentPlayer, payload);
    gameState.players.set(playerId, nextState);

    const playerUpdatedPayload: PlayerUpdatedPayload = {
      id: playerId,
      tileX: nextState.tileX,
      tileY: nextState.tileY,
      pixelX: nextState.pixelX,
      pixelY: nextState.pixelY,
      direction: nextState.direction,
      moving: nextState.moving,
      alive: nextState.alive,
      activeBombs: nextState.activeBombs,
      flameRange: nextState.flameRange
    };

    io.emit("player:updated", playerUpdatedPayload);
  });

  socket.on("disconnect", () => {
    const playerId = socket.data.playerId;
    if (!playerId) {
      return;
    }

    gameState.players.delete(playerId);
    socket.broadcast.emit("player:left", { id: playerId });
    syncMatchLifecycle(io, gameState);
  });
});

const port = Number(process.env.PORT ?? 3001);
server.listen(port, () => {
  console.log(`Multiplayer map server listening on http://localhost:${port}`);
});

process.on("SIGTERM", () => {
  clearPendingStart(gameState);
});

function sanitizeNickname(nickname: string): string {
  const trimmed = nickname.trim().slice(0, 16);
  return trimmed.length > 0 ? trimmed : "guest";
}

function normalizeMove(currentPlayer: PlayerState, payload: MovePayload): PlayerState {
  const half = 14;
  const maxPixelX = gameState.grid[0].length * TILE_SIZE - half;
  const maxPixelY = gameState.grid.length * TILE_SIZE - half;
  const pixelX = clamp(payload.x, half, maxPixelX);
  const pixelY = clamp(payload.y, half, maxPixelY);
  const direction = sanitizeDirection(payload.direction);
  const canOccupy =
    !isBlockedAt(pixelX - half, pixelY - half, gameState.grid) &&
    !isBlockedAt(pixelX + half, pixelY - half, gameState.grid) &&
    !isBlockedAt(pixelX - half, pixelY + half, gameState.grid) &&
    !isBlockedAt(pixelX + half, pixelY + half, gameState.grid);

  const resolvedX = canOccupy ? pixelX : currentPlayer.pixelX;
  const resolvedY = canOccupy ? pixelY : currentPlayer.pixelY;

  return {
    ...currentPlayer,
    tileX: Math.floor(resolvedX / TILE_SIZE),
    tileY: Math.floor(resolvedY / TILE_SIZE),
    pixelX: resolvedX,
    pixelY: resolvedY,
    direction,
    moving: Boolean(payload.moving)
  };
}

function sanitizeDirection(direction: Direction): Direction {
  if (direction === "up" || direction === "down" || direction === "left" || direction === "right") {
    return direction;
  }

  return "down";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

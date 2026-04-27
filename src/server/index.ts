import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { Server } from "socket.io";
import {
  MAP_ID,
  MAP_HEIGHT,
  MAP_WIDTH,
  SPAWN_POINT,
  TILE_SIZE,
  type ClientToServerEvents,
  type Direction,
  type MovePayload,
  type JoinPayload,
  type PlayerState,
  type ServerToClientEvents
} from "../shared/protocol.js";
import { isBlockedAt } from "../shared/map.js";

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

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    players: players.size,
    mapId: MAP_ID
  });
});

const server = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173"
  }
});

const players = new Map<string, PlayerState>();

io.on("connection", (socket) => {
  socket.on("player:join", ({ nickname }: JoinPayload) => {
    const player: PlayerState = {
      id: socket.id,
      nickname: sanitizeNickname(nickname),
      x: SPAWN_POINT.x,
      y: SPAWN_POINT.y,
      direction: "down",
      moving: false
    };

    socket.data.playerId = player.id;
    players.set(player.id, player);

    socket.emit("world:init", {
      selfId: player.id,
      mapId: MAP_ID,
      players: [...players.values()]
    });

    socket.broadcast.emit("player:joined", player);
  });

  socket.on("player:move", (payload: MovePayload) => {
    const playerId = socket.data.playerId;
    if (!playerId) {
      return;
    }

    const currentPlayer = players.get(playerId);
    if (!currentPlayer) {
      return;
    }

    const nextState = normalizeMove(currentPlayer, payload);
    players.set(playerId, nextState);

    io.emit("player:moved", {
      id: playerId,
      x: nextState.x,
      y: nextState.y,
      direction: nextState.direction,
      moving: nextState.moving
    });
  });

  socket.on("disconnect", () => {
    const playerId = socket.data.playerId;
    if (!playerId) {
      return;
    }

    players.delete(playerId);
    socket.broadcast.emit("player:left", { id: playerId });
  });
});

const port = Number(process.env.PORT ?? 3001);
server.listen(port, () => {
  console.log(`Multiplayer map server listening on http://localhost:${port}`);
});

function sanitizeNickname(nickname: string): string {
  const trimmed = nickname.trim().slice(0, 16);
  return trimmed.length > 0 ? trimmed : "guest";
}

function normalizeMove(currentPlayer: PlayerState, payload: MovePayload): PlayerState {
  const half = 14;
  const x = clamp(payload.x, half, MAP_WIDTH * TILE_SIZE - half);
  const y = clamp(payload.y, half, MAP_HEIGHT * TILE_SIZE - half);
  const direction = sanitizeDirection(payload.direction);
  const canOccupy =
    !isBlockedAt(x - half, y - half) &&
    !isBlockedAt(x + half, y - half) &&
    !isBlockedAt(x - half, y + half) &&
    !isBlockedAt(x + half, y + half);

  return {
    ...currentPlayer,
    x: canOccupy ? x : currentPlayer.x,
    y: canOccupy ? y : currentPlayer.y,
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

import { io, type Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  ServerToClientEvents
} from "../../shared/protocol";

export type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function createGameSocket(): GameSocket {
  const serverUrl = import.meta.env.VITE_SERVER_URL ?? "http://localhost:3001";

  return io(serverUrl, {
    transports: ["websocket"]
  });
}

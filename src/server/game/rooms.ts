import { MAX_PLAYERS, type JoinPayload } from "../../shared/protocol.js";
import { createInitialGameState, type GameState } from "./state.js";

export type RoomRegistry = Map<string, GameState>;

export function resolveJoinRoomId(roomStates: RoomRegistry, payload: JoinPayload): string {
  if (payload.joinMode === "quick") {
    return findQuickMatchRoomId(roomStates);
  }

  return normalizeRoomId(payload.roomId);
}

export function getOrCreateRoomState(roomStates: RoomRegistry, roomId: string): GameState {
  const existing = roomStates.get(roomId);
  if (existing) {
    return existing;
  }

  const next = createInitialGameState();
  roomStates.set(roomId, next);
  return next;
}

export function cleanupRoomIfEmpty(roomStates: RoomRegistry, roomId: string, onCleanup: (roomState: GameState) => void): boolean {
  const roomState = roomStates.get(roomId);
  if (!roomState || roomState.players.size > 0) {
    return false;
  }

  onCleanup(roomState);
  roomStates.delete(roomId);
  return true;
}

export function normalizeRoomId(rawRoomId: string | undefined): string {
  const normalized = (rawRoomId ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24);

  return normalized.length > 0 ? normalized : "public-1";
}

function findQuickMatchRoomId(roomStates: RoomRegistry): string {
  for (const [roomId, roomState] of roomStates) {
    if (roomState.players.size < MAX_PLAYERS && roomState.match.status !== "finished") {
      return roomId;
    }
  }

  return createQuickRoomId(roomStates);
}

function createQuickRoomId(roomStates: RoomRegistry): string {
  let roomNumber = roomStates.size + 1;
  let roomId = `quick-${roomNumber}`;

  while (roomStates.has(roomId)) {
    roomNumber += 1;
    roomId = `quick-${roomNumber}`;
  }

  return roomId;
}

import { MATCH_START_DELAY_MS, MIN_PLAYERS_TO_START, type MatchStatePayload, type ServerToClientEvents } from "../../shared/protocol.js";
import type { Server } from "socket.io";
import {
  createRunningMatchState,
  createStartingMatchState,
  resetRoundState,
  type GameState
} from "./state.js";

type InterServerEvents = Record<string, never>;
type SocketData = {
  playerId?: string;
};

export function syncMatchLifecycle(
  io: Server<Record<string, never>, ServerToClientEvents, InterServerEvents, SocketData>,
  state: GameState
) {
  if (state.players.size < MIN_PLAYERS_TO_START) {
    clearPendingStart(state);
    state.match = {
      ...state.match,
      status: "waiting",
      countdownStartedAt: null,
      startedAt: null
    };
    emitMatchState(io, state);
    return;
  }

  if (state.match.status === "waiting") {
    const countdownStartedAt = Date.now();
    state.match = createStartingMatchState(state.match.round, countdownStartedAt);
    emitMatchState(io, state);

    state.pendingStartTimer = setTimeout(() => {
      resetRoundState(state);
      state.match = createRunningMatchState(state.match.round, Date.now());
      state.pendingStartTimer = null;
      emitMatchState(io, state);
    }, MATCH_START_DELAY_MS);
  }
}

export function clearPendingStart(state: GameState) {
  if (state.pendingStartTimer) {
    clearTimeout(state.pendingStartTimer);
    state.pendingStartTimer = null;
  }
}

export function emitMatchState(
  io: Server<Record<string, never>, ServerToClientEvents, InterServerEvents, SocketData>,
  state: GameState
) {
  io.emit("match:state", createMatchPayload(state));
}

function createMatchPayload(state: GameState): MatchStatePayload {
  return {
    match: { ...state.match },
    playerCount: state.players.size
  };
}

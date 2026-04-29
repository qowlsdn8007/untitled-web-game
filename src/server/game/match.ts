import {
  MATCH_START_DELAY_MS,
  MIN_PLAYERS_TO_START,
  type MatchStatePayload,
  type MatchStatus,
  type PlayerState,
  type ServerToClientEvents
} from "../../shared/protocol.js";
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
  state: GameState,
  roomId: string
) {
  if (!canStartMatch(state.players.values())) {
    clearPendingStart(state);
    state.match = {
      ...state.match,
      status: "waiting",
      countdownStartedAt: null,
      startedAt: null
    };
    emitMatchState(io, state, roomId);
    return;
  }

  if (state.match.status === "waiting") {
    const countdownStartedAt = Date.now();
    state.match = createStartingMatchState(state.match.round, countdownStartedAt);
    emitMatchState(io, state, roomId);

    state.pendingStartTimer = setTimeout(() => {
      resetRoundState(state);
      state.match = createRunningMatchState(state.match.round, Date.now());
      state.pendingStartTimer = null;
      emitMatchState(io, state, roomId);
    }, MATCH_START_DELAY_MS);
  }
}

export function clearPendingStart(state: GameState) {
  if (state.pendingStartTimer) {
    clearTimeout(state.pendingStartTimer);
    state.pendingStartTimer = null;
  }

  if (state.pendingRestartTimer) {
    clearTimeout(state.pendingRestartTimer);
    state.pendingRestartTimer = null;
  }
}

export function emitMatchState(
  io: Server<Record<string, never>, ServerToClientEvents, InterServerEvents, SocketData>,
  state: GameState,
  roomId: string
) {
  io.to(roomId).emit("match:state", createMatchPayload(state, roomId));
}

function createMatchPayload(state: GameState, roomId: string): MatchStatePayload {
  return {
    roomId,
    match: { ...state.match },
    playerCount: state.players.size,
    readyCount: countReadyPlayers(state.players.values())
  };
}

export function canStartMatch(players: Iterable<PlayerState>): boolean {
  const playerList = [...players];
  return playerList.length >= MIN_PLAYERS_TO_START && playerList.every((player) => player.ready);
}

export function countReadyPlayers(players: Iterable<PlayerState>): number {
  return [...players].filter((player) => player.ready).length;
}

export function setPlayerReady(player: PlayerState, ready: boolean, matchStatus: MatchStatus): boolean {
  if (matchStatus === "running" || matchStatus === "finished") {
    return false;
  }

  player.ready = ready;
  return true;
}

export function resetPlayerReadiness(players: Iterable<PlayerState>): void {
  [...players].forEach((player) => {
    player.ready = false;
  });
}

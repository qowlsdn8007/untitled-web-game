import {
  DEFAULT_BOMB_CAPACITY,
  DEFAULT_FLAME_RANGE,
  MAP_ID,
  PLAYER_SPEED,
  SPAWN_TILES,
  type BombState,
  type FlameState,
  type MatchState,
  type PlayerState,
  type TileType,
  tileToPixelCenter
} from "../../shared/protocol.js";
import { cloneGrid, createRoundGrid } from "../../shared/map.js";

export type GameState = {
  mapId: string;
  grid: TileType[][];
  players: Map<string, PlayerState>;
  bombs: Map<string, BombState>;
  flames: FlameState[];
  match: MatchState;
  pendingStartTimer: NodeJS.Timeout | null;
};

export function createInitialGameState(): GameState {
  return {
    mapId: MAP_ID,
    grid: createRoundGrid(),
    players: new Map<string, PlayerState>(),
    bombs: new Map<string, BombState>(),
    flames: [],
    match: createWaitingMatchState(),
    pendingStartTimer: null
  };
}

export function createPlayerState(id: string, nickname: string, playerIndex: number): PlayerState {
  const spawn = SPAWN_TILES[playerIndex % SPAWN_TILES.length];

  return {
    id,
    nickname,
    tileX: spawn.tileX,
    tileY: spawn.tileY,
    pixelX: tileToPixelCenter(spawn.tileX),
    pixelY: tileToPixelCenter(spawn.tileY),
    direction: "down",
    moving: false,
    alive: true,
    maxBombs: DEFAULT_BOMB_CAPACITY,
    activeBombs: 0,
    flameRange: DEFAULT_FLAME_RANGE,
    moveSpeed: PLAYER_SPEED
  };
}

export function createWaitingMatchState(round = 1): MatchState {
  return {
    status: "waiting",
    round,
    winnerId: null,
    startedAt: null,
    finishedAt: null,
    countdownStartedAt: null
  };
}

export function createStartingMatchState(round: number, countdownStartedAt: number): MatchState {
  return {
    status: "starting",
    round,
    winnerId: null,
    startedAt: null,
    finishedAt: null,
    countdownStartedAt
  };
}

export function createRunningMatchState(round: number, startedAt: number): MatchState {
  return {
    status: "running",
    round,
    winnerId: null,
    startedAt,
    finishedAt: null,
    countdownStartedAt: null
  };
}

export function resetRoundState(state: GameState): void {
  state.grid = createRoundGrid();
  state.bombs.clear();
  state.flames = [];

  const players = [...state.players.values()];
  players.forEach((player, index) => {
    const spawn = SPAWN_TILES[index % SPAWN_TILES.length];
    player.tileX = spawn.tileX;
    player.tileY = spawn.tileY;
    player.pixelX = tileToPixelCenter(spawn.tileX);
    player.pixelY = tileToPixelCenter(spawn.tileY);
    player.direction = "down";
    player.moving = false;
    player.alive = true;
    player.activeBombs = 0;
    player.flameRange = DEFAULT_FLAME_RANGE;
    player.maxBombs = DEFAULT_BOMB_CAPACITY;
    player.moveSpeed = PLAYER_SPEED;
  });
}

export function createWorldSnapshot(state: GameState, selfId: string) {
  return {
    selfId,
    mapId: state.mapId,
    grid: cloneGrid(state.grid),
    players: [...state.players.values()].map((player) => ({ ...player })),
    bombs: [...state.bombs.values()].map((bomb) => ({ ...bomb })),
    flames: state.flames.map((flame) => ({ ...flame })),
    match: { ...state.match }
  };
}

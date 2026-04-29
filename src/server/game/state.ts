import {
  DEFAULT_BOMB_CAPACITY,
  DEFAULT_FLAME_RANGE,
  MAP_ID,
  PLAYER_SPEED,
  SPAWN_TILES,
  type BombState,
  type FlameState,
  type MatchState,
  type PlayerInputState,
  type PlayerState,
  type PowerUpState,
  type ArenaId,
  type TileType,
  tileToPixelCenter
} from "../../shared/protocol.js";
import { cloneGrid, createRoundGrid, DEFAULT_ARENA_ID, getArenaDefinition } from "../../shared/map.js";

export type GameState = {
  mapId: string;
  arenaId: ArenaId;
  arenaName: string;
  grid: TileType[][];
  players: Map<string, PlayerState>;
  playerInputs: Map<string, PlayerInputState>;
  botDecisions: Map<string, number>;
  bombs: Map<string, BombState>;
  flames: FlameState[];
  powerUps: Map<string, PowerUpState>;
  match: MatchState;
  pendingStartTimer: NodeJS.Timeout | null;
  pendingRestartTimer: NodeJS.Timeout | null;
};

export function createInitialGameState(arenaId: ArenaId = DEFAULT_ARENA_ID): GameState {
  const arena = getArenaDefinition(arenaId);

  return {
    mapId: MAP_ID,
    arenaId: arena.id,
    arenaName: arena.name,
    grid: createRoundGrid(arena.id),
    players: new Map<string, PlayerState>(),
    playerInputs: new Map<string, PlayerInputState>(),
    botDecisions: new Map<string, number>(),
    bombs: new Map<string, BombState>(),
    flames: [],
    powerUps: new Map<string, PowerUpState>(),
    match: createWaitingMatchState(),
    pendingStartTimer: null,
    pendingRestartTimer: null
  };
}

export function createPlayerState(id: string, nickname: string, playerIndex: number, isBot = false): PlayerState {
  const spawn = SPAWN_TILES[playerIndex % SPAWN_TILES.length];

  return {
    id,
    nickname,
    isBot,
    ready: false,
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

export function createFinishedMatchState(round: number, winnerId: string | null, finishedAt: number): MatchState {
  return {
    status: "finished",
    round,
    winnerId,
    startedAt: null,
    finishedAt,
    countdownStartedAt: null
  };
}

export function resetRoundState(state: GameState): void {
  state.grid = createRoundGrid(state.arenaId);
  state.bombs.clear();
  state.flames = [];
  state.powerUps.clear();
  state.playerInputs.clear();
  state.botDecisions.clear();

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

export function createWorldSnapshot(state: GameState, selfId: string, roomId: string) {
  return {
    selfId,
    roomId,
    mapId: state.mapId,
    arenaId: state.arenaId,
    arenaName: state.arenaName,
    grid: cloneGrid(state.grid),
    players: [...state.players.values()].map((player) => ({ ...player })),
    bombs: [...state.bombs.values()].map((bomb) => ({ ...bomb })),
    flames: state.flames.map((flame) => ({ ...flame })),
    powerUps: [...state.powerUps.values()].map((powerUp) => ({ ...powerUp })),
    match: { ...state.match }
  };
}

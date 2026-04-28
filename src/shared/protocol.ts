export const MAP_ID = "starter-plaza";
export const TILE_SIZE = 48;
export const MAP_WIDTH = 13;
export const MAP_HEIGHT = 11;
export const PLAYER_SPEED = 220;
export const MIN_PLAYERS_TO_START = 2;
export const MAX_PLAYERS = 4;
export const MATCH_START_DELAY_MS = 2_000;
export const ROUND_RESTART_DELAY_MS = 3_000;
export const BOMB_FUSE_MS = 2_000;
export const FLAME_DURATION_MS = 500;
export const SERVER_TICK_MS = 50;
export const DEFAULT_BOMB_CAPACITY = 1;
export const DEFAULT_FLAME_RANGE = 1;

export type Direction = "up" | "down" | "left" | "right";
export type TileType = "empty" | "solid" | "breakable";
export type MatchStatus = "waiting" | "starting" | "running" | "finished";

export type SpawnTile = {
  tileX: number;
  tileY: number;
};

export const SPAWN_TILES: readonly SpawnTile[] = [
  { tileX: 1, tileY: 1 },
  { tileX: MAP_WIDTH - 2, tileY: 1 },
  { tileX: 1, tileY: MAP_HEIGHT - 2 },
  { tileX: MAP_WIDTH - 2, tileY: MAP_HEIGHT - 2 }
] as const;

export const SPAWN_POINT = {
  x: tileToPixelCenter(SPAWN_TILES[0].tileX),
  y: tileToPixelCenter(SPAWN_TILES[0].tileY)
} as const;

export type PlayerState = {
  id: string;
  nickname: string;
  tileX: number;
  tileY: number;
  pixelX: number;
  pixelY: number;
  direction: Direction;
  moving: boolean;
  alive: boolean;
  maxBombs: number;
  activeBombs: number;
  flameRange: number;
  moveSpeed: number;
};

export type BombState = {
  id: string;
  ownerId: string;
  tileX: number;
  tileY: number;
  placedAt: number;
  explodeAt: number;
  flameRange: number;
};

export type FlameState = {
  tileX: number;
  tileY: number;
  expiresAt: number;
};

export type BombPlacedPayload = {
  bomb: BombState;
  playerId: string;
  activeBombs: number;
};

export type MatchState = {
  status: MatchStatus;
  round: number;
  winnerId: string | null;
  startedAt: number | null;
  finishedAt: number | null;
  countdownStartedAt: number | null;
};

export type JoinPayload = {
  nickname: string;
};

export type MovePayload = {
  x: number;
  y: number;
  direction: Direction;
  moving: boolean;
  seq: number;
};

export type PlayerInputPayload = {
  direction: Direction;
  moving: boolean;
  seq: number;
};

export type PlayerInputState = {
  direction: Direction;
  moving: boolean;
  seq: number;
};

export type WorldInitPayload = {
  selfId: string;
  mapId: string;
  grid: TileType[][];
  players: PlayerState[];
  bombs: BombState[];
  flames: FlameState[];
  match: MatchState;
};

export type MatchStatePayload = {
  match: MatchState;
  playerCount: number;
};

export type PlayerUpdatedPayload = {
  id: string;
  tileX: number;
  tileY: number;
  pixelX: number;
  pixelY: number;
  direction: Direction;
  moving: boolean;
  alive: boolean;
  activeBombs: number;
  flameRange: number;
};

export type PlayerLeftPayload = {
  id: string;
};

export type ServerToClientEvents = {
  "world:init": (payload: WorldInitPayload) => void;
  "match:state": (payload: MatchStatePayload) => void;
  "player:joined": (payload: PlayerState) => void;
  "player:updated": (payload: PlayerUpdatedPayload) => void;
  "bomb:placed": (payload: BombPlacedPayload) => void;
  "player:left": (payload: PlayerLeftPayload) => void;
};

export type ClientToServerEvents = {
  "player:join": (payload: JoinPayload) => void;
  "player:input": (payload: PlayerInputPayload) => void;
  "bomb:place": () => void;
};

export function tileToPixelCenter(tileCoordinate: number): number {
  return tileCoordinate * TILE_SIZE + TILE_SIZE / 2;
}

export function pixelToTileCoordinate(pixelCoordinate: number): number {
  return Math.floor(pixelCoordinate / TILE_SIZE);
}

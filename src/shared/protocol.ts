export const MAP_ID = "starter-plaza";
export const TILE_SIZE = 48;
export const MAP_WIDTH = 20;
export const MAP_HEIGHT = 14;
export const PLAYER_SPEED = 220;
export const SPAWN_POINT = {
  x: TILE_SIZE * 2,
  y: TILE_SIZE * 2
} as const;

export type Direction = "up" | "down" | "left" | "right";

export type PlayerState = {
  id: string;
  nickname: string;
  x: number;
  y: number;
  direction: Direction;
  moving: boolean;
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

export type WorldInitPayload = {
  selfId: string;
  mapId: string;
  players: PlayerState[];
};

export type PlayerMovedPayload = {
  id: string;
  x: number;
  y: number;
  direction: Direction;
  moving: boolean;
};

export type PlayerLeftPayload = {
  id: string;
};

export type ServerToClientEvents = {
  "world:init": (payload: WorldInitPayload) => void;
  "player:joined": (payload: PlayerState) => void;
  "player:moved": (payload: PlayerMovedPayload) => void;
  "player:left": (payload: PlayerLeftPayload) => void;
};

export type ClientToServerEvents = {
  "player:join": (payload: JoinPayload) => void;
  "player:move": (payload: MovePayload) => void;
};

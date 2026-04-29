import {
  MAP_HEIGHT,
  MAP_WIDTH,
  SPAWN_TILES,
  TILE_SIZE,
  type ArenaId,
  type SpawnTile,
  type TileType
} from "./protocol.js";

export type ArenaDefinition = {
  id: ArenaId;
  name: string;
};

export const ARENAS: readonly ArenaDefinition[] = [
  { id: "classic-yard", name: "Classic Yard" },
  { id: "tight-corners", name: "Tight Corners" },
  { id: "crossfire", name: "Crossfire" },
  { id: "islands", name: "Islands" }
] as const;

export const DEFAULT_ARENA_ID: ArenaId = "classic-yard";
export const DEFAULT_ROUND_GRID = createRoundGrid(DEFAULT_ARENA_ID);
export const blockedTiles = toBlockedTileSet(DEFAULT_ROUND_GRID);

export function createRoundGrid(arenaId: ArenaId = DEFAULT_ARENA_ID): TileType[][] {
  const grid = createEmptyGrid();
  const safeTiles = createSpawnSafeTileSet(SPAWN_TILES);

  for (let y = 0; y < MAP_HEIGHT; y += 1) {
    for (let x = 0; x < MAP_WIDTH; x += 1) {
      if (isOuterWall(x, y) || isInteriorPillar(x, y)) {
        grid[y][x] = "solid";
        continue;
      }

      if (safeTiles.has(tileKey(x, y))) {
        continue;
      }

      if (shouldPlaceBreakableWall(x, y, arenaId)) {
        grid[y][x] = "breakable";
      }
    }
  }

  return grid;
}

export function getArenaDefinition(arenaId: ArenaId): ArenaDefinition {
  return ARENAS.find((arena) => arena.id === arenaId) ?? ARENAS[0];
}

export function selectArenaIdForRoom(roomId: string): ArenaId {
  const hash = [...roomId].reduce((total, character) => total + character.charCodeAt(0), 0);
  return ARENAS[hash % ARENAS.length].id;
}

export function cloneGrid(grid: TileType[][]): TileType[][] {
  return grid.map((row) => [...row]);
}

export function getTileType(grid: TileType[][], tileX: number, tileY: number): TileType | null {
  if (!isWithinBounds(tileX, tileY)) {
    return null;
  }

  return grid[tileY][tileX];
}

export function isWalkableTile(grid: TileType[][], tileX: number, tileY: number): boolean {
  return getTileType(grid, tileX, tileY) === "empty";
}

export function isBlockedAt(x: number, y: number, grid: TileType[][] = DEFAULT_ROUND_GRID): boolean {
  const tileX = Math.floor(x / TILE_SIZE);
  const tileY = Math.floor(y / TILE_SIZE);

  if (!isWithinBounds(tileX, tileY)) {
    return true;
  }

  return !isWalkableTile(grid, tileX, tileY);
}

export function createSpawnSafeTileSet(spawns: readonly SpawnTile[]): Set<string> {
  const safeTiles = new Set<string>();

  for (const spawn of spawns) {
    safeTiles.add(tileKey(spawn.tileX, spawn.tileY));

    for (const [offsetX, offsetY] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1]
    ]) {
      const tileX = spawn.tileX + offsetX;
      const tileY = spawn.tileY + offsetY;
      if (isWithinBounds(tileX, tileY)) {
        safeTiles.add(tileKey(tileX, tileY));
      }
    }
  }

  return safeTiles;
}

export function toBlockedTileSet(grid: TileType[][]): Set<string> {
  const blocked = new Set<string>();

  for (let y = 0; y < grid.length; y += 1) {
    for (let x = 0; x < grid[y].length; x += 1) {
      if (grid[y][x] !== "empty") {
        blocked.add(tileKey(x, y));
      }
    }
  }

  return blocked;
}

function createEmptyGrid(): TileType[][] {
  return Array.from({ length: MAP_HEIGHT }, () => Array.from({ length: MAP_WIDTH }, () => "empty" as TileType));
}

function isOuterWall(tileX: number, tileY: number): boolean {
  return tileX === 0 || tileY === 0 || tileX === MAP_WIDTH - 1 || tileY === MAP_HEIGHT - 1;
}

function isInteriorPillar(tileX: number, tileY: number): boolean {
  return tileX % 2 === 0 && tileY % 2 === 0;
}

function shouldPlaceBreakableWall(tileX: number, tileY: number, arenaId: ArenaId): boolean {
  switch (arenaId) {
    case "tight-corners":
      return (tileX + tileY) % 2 === 1 || (tileX % 3 === 1 && tileY % 3 !== 0);
    case "crossfire":
      if (tileX === Math.floor(MAP_WIDTH / 2) || tileY === Math.floor(MAP_HEIGHT / 2)) {
        return false;
      }
      return (tileX + tileY) % 3 === 0 || (tileX % 4 === 1 && tileY % 2 === 1);
    case "islands":
      if ((tileX === 3 || tileX === MAP_WIDTH - 4) && tileY > 2 && tileY < MAP_HEIGHT - 3) {
        return false;
      }
      return (tileX + tileY) % 4 === 0 || (tileX % 3 === 1 && tileY % 2 === 1);
    case "classic-yard":
      return (tileX + tileY) % 3 === 0 || (tileX % 3 === 1 && tileY % 2 === 1);
  }
}

function isWithinBounds(tileX: number, tileY: number): boolean {
  return tileX >= 0 && tileX < MAP_WIDTH && tileY >= 0 && tileY < MAP_HEIGHT;
}

function tileKey(tileX: number, tileY: number): string {
  return `${tileX},${tileY}`;
}

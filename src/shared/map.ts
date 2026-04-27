import { MAP_HEIGHT, MAP_WIDTH, TILE_SIZE } from "./protocol.js";

export const blockedTiles = new Set<string>();

for (let x = 0; x < MAP_WIDTH; x += 1) {
  blockedTiles.add(`${x},0`);
  blockedTiles.add(`${x},${MAP_HEIGHT - 1}`);
}

for (let y = 0; y < MAP_HEIGHT; y += 1) {
  blockedTiles.add(`0,${y}`);
  blockedTiles.add(`${MAP_WIDTH - 1},${y}`);
}

for (let x = 4; x <= 7; x += 1) {
  blockedTiles.add(`${x},4`);
}

for (let y = 7; y <= 10; y += 1) {
  blockedTiles.add(`10,${y}`);
}

for (let x = 12; x <= 16; x += 1) {
  blockedTiles.add(`${x},9`);
}

export function isBlockedAt(x: number, y: number): boolean {
  const tileX = Math.floor(x / TILE_SIZE);
  const tileY = Math.floor(y / TILE_SIZE);

  if (tileX < 0 || tileX >= MAP_WIDTH || tileY < 0 || tileY >= MAP_HEIGHT) {
    return true;
  }

  return blockedTiles.has(`${tileX},${tileY}`);
}

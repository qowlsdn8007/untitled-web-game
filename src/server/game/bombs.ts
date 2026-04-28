import { BOMB_FUSE_MS, type BombState, type PlayerState, type TileType } from "../../shared/protocol.js";

export function canPlaceBomb(player: PlayerState, grid: TileType[][], bombs: Iterable<BombState>, matchStatus: string): boolean {
  if (!player.alive) {
    return false;
  }

  if (matchStatus !== "running") {
    return false;
  }

  if (player.activeBombs >= player.maxBombs) {
    return false;
  }

  if (!isInsideGrid(player.tileX, player.tileY, grid)) {
    return false;
  }

  if (grid[player.tileY][player.tileX] !== "empty") {
    return false;
  }

  for (const bomb of bombs) {
    if (bomb.tileX === player.tileX && bomb.tileY === player.tileY) {
      return false;
    }
  }

  return true;
}

export function createBomb(ownerId: string, player: PlayerState, now: number): BombState {
  return {
    id: `${ownerId}:${now}`,
    ownerId,
    tileX: player.tileX,
    tileY: player.tileY,
    placedAt: now,
    explodeAt: now + BOMB_FUSE_MS,
    flameRange: player.flameRange
  };
}

function isInsideGrid(tileX: number, tileY: number, grid: TileType[][]): boolean {
  return tileY >= 0 && tileY < grid.length && tileX >= 0 && tileX < grid[0].length;
}

import { FLAME_DURATION_MS, type BombState, type FlameState, type TileType } from "../../shared/protocol.js";
import { cloneGrid, getTileType } from "../../shared/map.js";
import type { GameState } from "./state.js";

type PlayerBombInventory = {
  id: string;
  activeBombs: number;
};

export type ExplosionResolution = {
  changed: boolean;
  grid: TileType[][];
  bombs: BombState[];
  flames: FlameState[];
  playerBombs: PlayerBombInventory[];
};

type ExplosionMutableState = Pick<GameState, "grid" | "bombs" | "flames" | "players">;

export function resolveExplosions(state: ExplosionMutableState, now: number): ExplosionResolution | null {
  const activeFlames = state.flames.filter((flame) => flame.expiresAt > now);
  const expiredBombIds = [...state.bombs.values()].filter((bomb) => bomb.explodeAt <= now).map((bomb) => bomb.id);

  const hadExpiredFlames = activeFlames.length !== state.flames.length;
  if (expiredBombIds.length === 0 && !hadExpiredFlames) {
    return null;
  }

  const processedBombIds = new Set<string>();
  const pendingBombIds = [...expiredBombIds];
  const updatedPlayers = new Set<string>();
  const nextFlames = new Map<string, FlameState>();

  for (const flame of activeFlames) {
    nextFlames.set(toTileKey(flame.tileX, flame.tileY), flame);
  }

  while (pendingBombIds.length > 0) {
    const bombId = pendingBombIds.shift();
    if (!bombId || processedBombIds.has(bombId)) {
      continue;
    }

    const bomb = state.bombs.get(bombId);
    if (!bomb) {
      continue;
    }

    processedBombIds.add(bomb.id);
    state.bombs.delete(bomb.id);

    const owner = state.players.get(bomb.ownerId);
    if (owner) {
      owner.activeBombs = Math.max(0, owner.activeBombs - 1);
      updatedPlayers.add(owner.id);
    }

    addFlame(nextFlames, bomb.tileX, bomb.tileY, now + FLAME_DURATION_MS);

    for (const [offsetX, offsetY] of DIRECTIONS) {
      for (let step = 1; step <= bomb.flameRange; step += 1) {
        const tileX = bomb.tileX + offsetX * step;
        const tileY = bomb.tileY + offsetY * step;
        const tileType = getTileType(state.grid, tileX, tileY);

        if (tileType === null || tileType === "solid") {
          break;
        }

        addFlame(nextFlames, tileX, tileY, now + FLAME_DURATION_MS);

        if (tileType === "breakable") {
          state.grid[tileY][tileX] = "empty";
          break;
        }

        const chainedBombId = findBombIdAtTile(state.bombs, tileX, tileY);
        if (chainedBombId) {
          pendingBombIds.push(chainedBombId);
          break;
        }
      }
    }
  }

  state.flames = [...nextFlames.values()];

  return {
    changed: processedBombIds.size > 0 || hadExpiredFlames,
    grid: cloneGrid(state.grid),
    bombs: [...state.bombs.values()].map((bomb) => ({ ...bomb })),
    flames: state.flames.map((flame) => ({ ...flame })),
    playerBombs: [...updatedPlayers].map((playerId) => {
      const player = state.players.get(playerId);
      return {
        id: playerId,
        activeBombs: player?.activeBombs ?? 0
      };
    })
  };
}

const DIRECTIONS = [
  [0, -1],
  [0, 1],
  [-1, 0],
  [1, 0]
] as const;

function addFlame(flames: Map<string, FlameState>, tileX: number, tileY: number, expiresAt: number) {
  const key = toTileKey(tileX, tileY);
  const existing = flames.get(key);

  if (!existing || existing.expiresAt < expiresAt) {
    flames.set(key, { tileX, tileY, expiresAt });
  }
}

function findBombIdAtTile(bombs: Map<string, BombState>, tileX: number, tileY: number): string | null {
  for (const bomb of bombs.values()) {
    if (bomb.tileX === tileX && bomb.tileY === tileY) {
      return bomb.id;
    }
  }

  return null;
}

function toTileKey(tileX: number, tileY: number): string {
  return `${tileX},${tileY}`;
}

import type { FlameState, PlayerState } from "../../shared/protocol.js";

export type RoundOutcome =
  | {
      winnerId: string;
      draw: false;
    }
  | {
      winnerId: null;
      draw: true;
    };

export function applyFlameDamage(players: Iterable<PlayerState>, flames: readonly FlameState[]): PlayerState[] {
  if (flames.length === 0) {
    return [];
  }

  const flameTiles = new Set(flames.map((flame) => toTileKey(flame.tileX, flame.tileY)));
  const defeatedPlayers: PlayerState[] = [];

  for (const player of players) {
    if (!player.alive) {
      continue;
    }

    if (!flameTiles.has(toTileKey(player.tileX, player.tileY))) {
      continue;
    }

    player.alive = false;
    player.moving = false;
    defeatedPlayers.push(player);
  }

  return defeatedPlayers;
}

export function getRoundOutcome(players: Iterable<PlayerState>): RoundOutcome | null {
  const alivePlayers = [...players].filter((player) => player.alive);

  if (alivePlayers.length > 1) {
    return null;
  }

  if (alivePlayers.length === 1) {
    return {
      winnerId: alivePlayers[0].id,
      draw: false
    };
  }

  return {
    winnerId: null,
    draw: true
  };
}

function toTileKey(tileX: number, tileY: number): string {
  return `${tileX},${tileY}`;
}

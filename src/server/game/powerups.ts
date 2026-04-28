import {
  POWER_UP_DROP_CHANCE,
  POWER_UP_MAX_BOMBS,
  POWER_UP_MAX_FLAME_RANGE,
  POWER_UP_MAX_SPEED,
  POWER_UP_SPEED_INCREMENT,
  type PlayerState,
  type PowerUpState,
  type PowerUpType,
  type TileType
} from "../../shared/protocol.js";

type PowerUpCollectionResult = {
  updatedPlayers: PlayerState[];
  collectedPowerUps: PowerUpState[];
};

export function spawnPowerUpFromDestroyedWall(
  destroyedTileType: TileType,
  tileX: number,
  tileY: number,
  now: number,
  dropRoll: number = Math.random(),
  typeRoll: number = Math.random()
): PowerUpState | null {
  if (destroyedTileType !== "breakable") {
    return null;
  }

  if (dropRoll >= POWER_UP_DROP_CHANCE) {
    return null;
  }

  return {
    id: `power-up:${tileX}:${tileY}:${now}`,
    type: toPowerUpType(typeRoll),
    tileX,
    tileY,
    spawnedAt: now
  };
}

export function collectPowerUps(players: Iterable<PlayerState>, powerUps: Map<string, PowerUpState>): PowerUpCollectionResult {
  const updatedPlayers: PlayerState[] = [];
  const collectedPowerUps: PowerUpState[] = [];

  for (const player of players) {
    if (!player.alive) {
      continue;
    }

    const powerUp = findPowerUpAtTile(powerUps, player.tileX, player.tileY);
    if (!powerUp) {
      continue;
    }

    applyPowerUpToPlayer(player, powerUp);
    powerUps.delete(powerUp.id);
    updatedPlayers.push(player);
    collectedPowerUps.push(powerUp);
  }

  return {
    updatedPlayers,
    collectedPowerUps
  };
}

export function applyPowerUpToPlayer(player: PlayerState, powerUp: PowerUpState) {
  switch (powerUp.type) {
    case "bomb_up":
      player.maxBombs = Math.min(POWER_UP_MAX_BOMBS, player.maxBombs + 1);
      return;
    case "flame_up":
      player.flameRange = Math.min(POWER_UP_MAX_FLAME_RANGE, player.flameRange + 1);
      return;
    case "speed_up":
      player.moveSpeed = Math.min(POWER_UP_MAX_SPEED, player.moveSpeed + POWER_UP_SPEED_INCREMENT);
      return;
  }
}

function toPowerUpType(roll: number): PowerUpType {
  if (roll < 0.34) {
    return "bomb_up";
  }

  if (roll < 0.67) {
    return "flame_up";
  }

  return "speed_up";
}

function findPowerUpAtTile(powerUps: Map<string, PowerUpState>, tileX: number, tileY: number): PowerUpState | null {
  for (const powerUp of powerUps.values()) {
    if (powerUp.tileX === tileX && powerUp.tileY === tileY) {
      return powerUp;
    }
  }

  return null;
}

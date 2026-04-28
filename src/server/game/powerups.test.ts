import test from "node:test";
import assert from "node:assert/strict";
import type { PlayerState, PowerUpState } from "../../shared/protocol.js";
import {
  PLAYER_SPEED,
  POWER_UP_MAX_BOMBS,
  POWER_UP_MAX_FLAME_RANGE,
  POWER_UP_MAX_SPEED,
  tileToPixelCenter
} from "../../shared/protocol.js";
import { applyPowerUpToPlayer, collectPowerUps, spawnPowerUpFromDestroyedWall } from "./powerups.js";

test("spawns a power-up from a destroyed breakable wall when the drop roll succeeds", () => {
  const powerUp = spawnPowerUpFromDestroyedWall("breakable", 4, 5, 1000, 0.2, 0.1);

  assert.deepEqual(powerUp, {
    id: "power-up:4:5:1000",
    type: "bomb_up",
    tileX: 4,
    tileY: 5,
    spawnedAt: 1000
  });
});

test("does not spawn a power-up from a solid or empty tile", () => {
  assert.equal(spawnPowerUpFromDestroyedWall("solid", 1, 1, 1000, 0.1, 0.1), null);
  assert.equal(spawnPowerUpFromDestroyedWall("empty", 1, 1, 1000, 0.1, 0.1), null);
});

test("does not spawn a power-up when the drop roll fails", () => {
  assert.equal(spawnPowerUpFromDestroyedWall("breakable", 2, 3, 1000, 0.9, 0.1), null);
});

test("collects a power-up when a living player stands on its tile", () => {
  const player = createPlayer({ tileX: 3, tileY: 4 });
  const powerUp = createPowerUp({ tileX: 3, tileY: 4, type: "flame_up" });
  const powerUps = new Map([[powerUp.id, powerUp]]);

  const collected = collectPowerUps([player], powerUps);

  assert.equal(collected.updatedPlayers.length, 1);
  assert.equal(collected.collectedPowerUps.length, 1);
  assert.equal(player.flameRange, 2);
  assert.equal(powerUps.size, 0);
});

test("does not let a dead player collect a power-up", () => {
  const player = createPlayer({ tileX: 3, tileY: 4, alive: false });
  const powerUp = createPowerUp({ tileX: 3, tileY: 4 });
  const powerUps = new Map([[powerUp.id, powerUp]]);

  const collected = collectPowerUps([player], powerUps);

  assert.equal(collected.updatedPlayers.length, 0);
  assert.equal(collected.collectedPowerUps.length, 0);
  assert.equal(powerUps.size, 1);
});

test("applies bomb_up, flame_up, and speed_up with caps", () => {
  const bombPlayer = createPlayer({ maxBombs: POWER_UP_MAX_BOMBS - 1 });
  applyPowerUpToPlayer(bombPlayer, createPowerUp({ type: "bomb_up" }));
  applyPowerUpToPlayer(bombPlayer, createPowerUp({ type: "bomb_up" }));
  assert.equal(bombPlayer.maxBombs, POWER_UP_MAX_BOMBS);

  const flamePlayer = createPlayer({ flameRange: POWER_UP_MAX_FLAME_RANGE - 1 });
  applyPowerUpToPlayer(flamePlayer, createPowerUp({ type: "flame_up" }));
  applyPowerUpToPlayer(flamePlayer, createPowerUp({ type: "flame_up" }));
  assert.equal(flamePlayer.flameRange, POWER_UP_MAX_FLAME_RANGE);

  const speedPlayer = createPlayer({ moveSpeed: POWER_UP_MAX_SPEED - 10 });
  applyPowerUpToPlayer(speedPlayer, createPowerUp({ type: "speed_up" }));
  assert.equal(speedPlayer.moveSpeed, POWER_UP_MAX_SPEED);
});

function createPlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id: "player-1",
    nickname: "tester",
    tileX: 1,
    tileY: 1,
    pixelX: tileToPixelCenter(1),
    pixelY: tileToPixelCenter(1),
    direction: "down",
    moving: false,
    alive: true,
    maxBombs: 1,
    activeBombs: 0,
    flameRange: 1,
    moveSpeed: PLAYER_SPEED,
    ...overrides
  };
}

function createPowerUp(overrides: Partial<PowerUpState> = {}): PowerUpState {
  return {
    id: "power-up:1:1:1000",
    type: "bomb_up",
    tileX: 1,
    tileY: 1,
    spawnedAt: 1000,
    ...overrides
  };
}

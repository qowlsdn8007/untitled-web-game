import test from "node:test";
import assert from "node:assert/strict";
import { createRoundGrid } from "../../shared/map.js";
import type { BombState } from "../../shared/protocol.js";
import { PLAYER_SPEED, tileToPixelCenter, type PlayerInputState, type PlayerState } from "../../shared/protocol.js";
import { stepPlayerMovement } from "./movement.js";

function createPlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id: "player-1",
    nickname: "tester",
    ready: false,
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

function createInput(direction: PlayerInputState["direction"], moving = true): PlayerInputState {
  return {
    direction,
    moving,
    seq: 1
  };
}

function createBomb(overrides: Partial<BombState> = {}): BombState {
  return {
    id: "bomb-1",
    ownerId: "other-player",
    tileX: 2,
    tileY: 1,
    placedAt: 1000,
    explodeAt: 3000,
    flameRange: 1,
    ...overrides
  };
}

test("starts moving into a walkable adjacent tile", () => {
  const grid = createRoundGrid();
  const player = createPlayer();

  const next = stepPlayerMovement(player, createInput("right"), grid, [], 50);

  assert.equal(next.tileX, 2);
  assert.equal(next.tileY, 1);
  assert.equal(next.direction, "right");
  assert.equal(next.moving, true);
  assert.ok(next.pixelX > player.pixelX);
});

test("does not enter a blocked tile", () => {
  const grid = createRoundGrid();
  const player = createPlayer({ tileX: 1, tileY: 2, pixelX: tileToPixelCenter(1), pixelY: tileToPixelCenter(2) });

  const next = stepPlayerMovement(player, createInput("right"), grid, [], 50);

  assert.equal(next.tileX, 1);
  assert.equal(next.tileY, 2);
  assert.equal(next.moving, false);
});

test("finishes movement at the target tile center", () => {
  const grid = createRoundGrid();
  let player = createPlayer();

  for (let index = 0; index < 5; index += 1) {
    player = stepPlayerMovement(player, createInput("right"), grid, [], 50);
  }

  assert.equal(player.tileX, 2);
  assert.equal(player.pixelX, tileToPixelCenter(2));
  assert.equal(player.pixelY, tileToPixelCenter(1));
  assert.equal(player.moving, false);
});

test("does not enter a tile occupied by a bomb", () => {
  const grid = createRoundGrid();
  const player = createPlayer();

  const next = stepPlayerMovement(player, createInput("right"), grid, [createBomb()], 50);

  assert.equal(next.tileX, 1);
  assert.equal(next.tileY, 1);
  assert.equal(next.moving, false);
});

test("allows the owner to step off the bomb tile they are standing on", () => {
  const grid = createRoundGrid();
  const player = createPlayer();
  const bomb = createBomb({ tileX: 1, tileY: 1, ownerId: player.id });

  const next = stepPlayerMovement(player, createInput("right"), grid, [bomb], 50);

  assert.equal(next.tileX, 2);
  assert.equal(next.tileY, 1);
  assert.equal(next.moving, true);
});

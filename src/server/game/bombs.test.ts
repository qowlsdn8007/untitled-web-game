import test from "node:test";
import assert from "node:assert/strict";
import { createRoundGrid } from "../../shared/map.js";
import { createPlayerState } from "./state.js";
import { canPlaceBomb, createBomb } from "./bombs.js";

test("allows placing a bomb on an empty tile during a running match", () => {
  const grid = createRoundGrid();
  const player = createPlayerState("player-1", "tester", 0);

  assert.equal(canPlaceBomb(player, grid, [], "running"), true);
});

test("prevents placing a bomb when the player has no remaining capacity", () => {
  const grid = createRoundGrid();
  const player = {
    ...createPlayerState("player-1", "tester", 0),
    activeBombs: 1
  };

  assert.equal(canPlaceBomb(player, grid, [], "running"), false);
});

test("prevents placing a second bomb on the same tile", () => {
  const grid = createRoundGrid();
  const player = createPlayerState("player-1", "tester", 0);
  const existingBomb = createBomb(player.id, player, 1000);

  assert.equal(canPlaceBomb(player, grid, [existingBomb], "running"), false);
});

test("creates a bomb with owner, tile, and fuse timing", () => {
  const player = createPlayerState("player-1", "tester", 0);
  const bomb = createBomb(player.id, player, 2000);

  assert.equal(bomb.ownerId, player.id);
  assert.equal(bomb.tileX, player.tileX);
  assert.equal(bomb.tileY, player.tileY);
  assert.equal(bomb.placedAt, 2000);
  assert.ok(bomb.explodeAt > bomb.placedAt);
});

import test from "node:test";
import assert from "node:assert/strict";
import type { BombState, FlameState, PlayerState, TileType } from "../../shared/protocol.js";
import { PLAYER_SPEED, tileToPixelCenter } from "../../shared/protocol.js";
import { resolveExplosions } from "./explosions.js";

test("detonates an expired bomb into a cross-shaped flame and decrements owner capacity", () => {
  const owner = createPlayer({ id: "player-1", activeBombs: 1 });
  const state = createExplosionState({
    players: [owner],
    bombs: [createBomb({ ownerId: owner.id, explodeAt: 1000, tileX: 3, tileY: 3 })]
  });

  const result = resolveExplosions(state, 1000);

  assert.ok(result);
  assert.equal(state.bombs.size, 0);
  assert.equal(owner.activeBombs, 0);
  assert.deepEqual(
    sortTiles(result.flames.map((flame) => ({ tileX: flame.tileX, tileY: flame.tileY }))),
    sortTiles([
      { tileX: 3, tileY: 3 },
      { tileX: 3, tileY: 2 },
      { tileX: 3, tileY: 4 },
      { tileX: 2, tileY: 3 },
      { tileX: 4, tileY: 3 }
    ])
  );
});

test("destroys the first breakable wall and stops flame propagation past it", () => {
  const grid = createArenaGrid();
  grid[3][4] = "breakable";
  const owner = createPlayer({ id: "player-1", activeBombs: 1 });
  const state = createExplosionState({
    grid,
    players: [owner],
    bombs: [createBomb({ ownerId: owner.id, explodeAt: 1000, tileX: 2, tileY: 3, flameRange: 3 })]
  });

  const result = resolveExplosions(state, 1000);

  assert.ok(result);
  assert.equal(state.grid[3][4], "empty");
  assert.equal(
    result.flames.some((flame) => flame.tileX === 5 && flame.tileY === 3),
    false
  );
  assert.equal(
    result.flames.some((flame) => flame.tileX === 4 && flame.tileY === 3),
    true
  );
});

test("triggers a chain reaction when a flame reaches another bomb", () => {
  const firstOwner = createPlayer({ id: "player-1", activeBombs: 1 });
  const secondOwner = createPlayer({ id: "player-2", activeBombs: 1, tileX: 5, tileY: 3, pixelX: tileToPixelCenter(5), pixelY: tileToPixelCenter(3) });
  const state = createExplosionState({
    players: [firstOwner, secondOwner],
    bombs: [
      createBomb({ id: "bomb-a", ownerId: firstOwner.id, explodeAt: 1000, tileX: 3, tileY: 3, flameRange: 2 }),
      createBomb({ id: "bomb-b", ownerId: secondOwner.id, explodeAt: 2000, tileX: 5, tileY: 3, flameRange: 1 })
    ]
  });

  const result = resolveExplosions(state, 1000);

  assert.ok(result);
  assert.equal(state.bombs.size, 0);
  assert.equal(firstOwner.activeBombs, 0);
  assert.equal(secondOwner.activeBombs, 0);
  assert.equal(
    result.flames.some((flame) => flame.tileX === 5 && flame.tileY === 3),
    true
  );
});

test("clears expired flames even when no new bomb explodes", () => {
  const activeFlame: FlameState = { tileX: 2, tileY: 2, expiresAt: 1600 };
  const expiredFlame: FlameState = { tileX: 3, tileY: 2, expiresAt: 900 };
  const state = createExplosionState({
    flames: [activeFlame, expiredFlame]
  });

  const result = resolveExplosions(state, 1000);

  assert.ok(result);
  assert.deepEqual(state.flames, [activeFlame]);
  assert.deepEqual(result.flames, [activeFlame]);
});

function createExplosionState({
  grid = createArenaGrid(),
  players = [],
  bombs = [],
  flames = []
}: {
  grid?: TileType[][];
  players?: PlayerState[];
  bombs?: BombState[];
  flames?: FlameState[];
}) {
  return {
    grid,
    players: new Map(players.map((player) => [player.id, player])),
    bombs: new Map(bombs.map((bomb) => [bomb.id, bomb])),
    flames,
    powerUps: new Map()
  };
}

function createArenaGrid(): TileType[][] {
  return Array.from({ length: 7 }, (_, tileY) =>
    Array.from({ length: 7 }, (_, tileX) =>
      tileX === 0 || tileY === 0 || tileX === 6 || tileY === 6 ? "solid" : "empty"
    )
  );
}

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

function createBomb(overrides: Partial<BombState> = {}): BombState {
  return {
    id: "bomb-1",
    ownerId: "player-1",
    tileX: 3,
    tileY: 3,
    placedAt: 0,
    explodeAt: 1000,
    flameRange: 1,
    ...overrides
  };
}

function sortTiles(tiles: Array<{ tileX: number; tileY: number }>) {
  return [...tiles].sort((left, right) => {
    if (left.tileY === right.tileY) {
      return left.tileX - right.tileX;
    }

    return left.tileY - right.tileY;
  });
}

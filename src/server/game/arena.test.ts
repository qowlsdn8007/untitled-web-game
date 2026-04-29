import test from "node:test";
import assert from "node:assert/strict";
import { MAP_HEIGHT, MAP_WIDTH, SPAWN_TILES } from "../../shared/protocol.js";
import { ARENAS, createRoundGrid, selectArenaIdForRoom } from "../../shared/map.js";

test("selects a stable arena for the same room id", () => {
  assert.equal(selectArenaIdForRoom("public-1"), selectArenaIdForRoom("public-1"));
});

test("keeps every arena spawn and adjacent escape tiles walkable", () => {
  for (const arena of ARENAS) {
    const grid = createRoundGrid(arena.id);

    for (const spawn of SPAWN_TILES) {
      const safeTiles = [
        [spawn.tileX, spawn.tileY],
        [spawn.tileX + 1, spawn.tileY],
        [spawn.tileX - 1, spawn.tileY],
        [spawn.tileX, spawn.tileY + 1],
        [spawn.tileX, spawn.tileY - 1]
      ];

      for (const [tileX, tileY] of safeTiles) {
        if (tileX <= 0 || tileX >= MAP_WIDTH - 1 || tileY <= 0 || tileY >= MAP_HEIGHT - 1) {
          continue;
        }

        assert.equal(grid[tileY][tileX], "empty", `${arena.id} blocks spawn-safe tile ${tileX},${tileY}`);
      }
    }
  }
});

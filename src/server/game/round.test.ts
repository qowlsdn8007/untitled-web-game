import test from "node:test";
import assert from "node:assert/strict";
import type { FlameState, PlayerState } from "../../shared/protocol.js";
import { PLAYER_SPEED, tileToPixelCenter } from "../../shared/protocol.js";
import { applyFlameDamage, getRoundOutcome } from "./round.js";

test("marks an alive player as defeated when standing on a flame tile", () => {
  const player = createPlayer({ tileX: 3, tileY: 4, pixelX: tileToPixelCenter(3), pixelY: tileToPixelCenter(4) });
  const flames: FlameState[] = [{ tileX: 3, tileY: 4, expiresAt: 1500 }];

  const defeatedPlayers = applyFlameDamage([player], flames);

  assert.equal(defeatedPlayers.length, 1);
  assert.equal(player.alive, false);
  assert.equal(player.moving, false);
});

test("does not defeat players outside the flame coverage", () => {
  const player = createPlayer({ tileX: 2, tileY: 2 });
  const flames: FlameState[] = [{ tileX: 3, tileY: 2, expiresAt: 1500 }];

  const defeatedPlayers = applyFlameDamage([player], flames);

  assert.equal(defeatedPlayers.length, 0);
  assert.equal(player.alive, true);
});

test("returns the last alive player as the round winner", () => {
  const winner = createPlayer({ id: "winner", alive: true });
  const defeated = createPlayer({ id: "loser", alive: false });

  assert.deepEqual(getRoundOutcome([winner, defeated]), {
    winnerId: "winner",
    draw: false
  });
});

test("returns draw when no player remains alive", () => {
  const first = createPlayer({ id: "first", alive: false });
  const second = createPlayer({ id: "second", alive: false });

  assert.deepEqual(getRoundOutcome([first, second]), {
    winnerId: null,
    draw: true
  });
});

test("does not finish the round while more than one player is alive", () => {
  const first = createPlayer({ id: "first", alive: true });
  const second = createPlayer({ id: "second", alive: true });

  assert.equal(getRoundOutcome([first, second]), null);
});

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

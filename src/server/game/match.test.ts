import test from "node:test";
import assert from "node:assert/strict";
import { PLAYER_SPEED, tileToPixelCenter, type PlayerState } from "../../shared/protocol.js";
import { canStartMatch, countReadyPlayers, resetPlayerReadiness, setPlayerReady } from "./match.js";

test("does not allow a match to start until enough players are ready", () => {
  const first = createPlayer({ id: "first", ready: true });
  const second = createPlayer({ id: "second", ready: false });

  assert.equal(canStartMatch([first]), false);
  assert.equal(canStartMatch([first, second]), false);

  second.ready = true;
  assert.equal(canStartMatch([first, second]), true);
});

test("counts ready players for match state payloads", () => {
  const players = [createPlayer({ ready: true }), createPlayer({ id: "second", ready: false })];

  assert.equal(countReadyPlayers(players), 1);
});

test("only updates readiness before the round is running or finished", () => {
  const player = createPlayer();

  assert.equal(setPlayerReady(player, true, "waiting"), true);
  assert.equal(player.ready, true);
  assert.equal(setPlayerReady(player, false, "starting"), true);
  assert.equal(player.ready, false);
  assert.equal(setPlayerReady(player, true, "running"), false);
  assert.equal(player.ready, false);
  assert.equal(setPlayerReady(player, true, "finished"), false);
  assert.equal(player.ready, false);
});

test("resets all player readiness for the next round lobby", () => {
  const players = [createPlayer({ ready: true }), createPlayer({ id: "second", ready: true })];

  resetPlayerReadiness(players);

  assert.deepEqual(
    players.map((player) => player.ready),
    [false, false]
  );
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

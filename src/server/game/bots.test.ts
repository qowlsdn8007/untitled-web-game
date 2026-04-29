import test from "node:test";
import assert from "node:assert/strict";
import { addBotPlayer, hasHumanPlayers, isBotPlayerId, shouldBotTryPlaceBomb, updateBotInputs } from "./bots.js";
import { createInitialGameState, createPlayerState } from "./state.js";

test("adds a ready bot player to a room state", () => {
  const state = createInitialGameState();

  const bot = addBotPlayer(state, "room-1", 1000);

  assert.equal(isBotPlayerId(bot.id), true);
  assert.equal(bot.isBot, true);
  assert.equal(bot.ready, true);
  assert.equal(state.players.has(bot.id), true);
});

test("detects whether a room still has human players", () => {
  const state = createInitialGameState();
  const bot = addBotPlayer(state, "room-1", 1000);

  assert.equal(hasHumanPlayers(state), false);

  state.players.set("human-1", createPlayerState("human-1", "tester", 1));
  assert.equal(hasHumanPlayers(state), true);
  assert.equal(isBotPlayerId(bot.id), true);
});

test("updates bot movement input on its decision interval", () => {
  const state = createInitialGameState();
  const bot = addBotPlayer(state, "room-1", 1000);

  updateBotInputs(state, 1500);

  assert.equal(state.playerInputs.has(bot.id), true);
  assert.equal(state.playerInputs.get(bot.id)?.moving, true);
});

test("only bot players can use bot bomb placement cadence", () => {
  assert.equal(shouldBotTryPlaceBomb("human-1", 5000), false);
  assert.equal(typeof shouldBotTryPlaceBomb("bot:room:1", 5000), "boolean");
});

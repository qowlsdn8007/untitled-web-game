import test from "node:test";
import assert from "node:assert/strict";
import { isWithinCooldown } from "./rateLimit.js";

test("allows an action when there is no previous timestamp", () => {
  assert.equal(isWithinCooldown(undefined, 1000, 250), false);
});

test("detects actions inside a cooldown window", () => {
  assert.equal(isWithinCooldown(900, 1000, 250), true);
  assert.equal(isWithinCooldown(700, 1000, 250), false);
});

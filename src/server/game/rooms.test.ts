import test from "node:test";
import assert from "node:assert/strict";
import { MAX_PLAYERS } from "../../shared/protocol.js";
import { createPlayerState } from "./state.js";
import { addBotPlayer } from "./bots.js";
import {
  cleanupRoomIfEmpty,
  getOrCreateRoomState,
  normalizeRoomId,
  resolveJoinRoomId,
  type RoomRegistry
} from "./rooms.js";

test("normalizes custom room ids for stable room keys", () => {
  assert.equal(normalizeRoomId("  My Room!!  "), "my-room");
  assert.equal(normalizeRoomId(""), "public-1");
  assert.equal(normalizeRoomId(undefined), "public-1");
});

test("resolves direct room joins to the requested room id", () => {
  const rooms: RoomRegistry = new Map();

  assert.equal(resolveJoinRoomId(rooms, { nickname: "tester", roomId: "Arena-01", joinMode: "room" }), "arena-01");
});

test("quick match reuses the first joinable room", () => {
  const rooms: RoomRegistry = new Map();
  const roomState = getOrCreateRoomState(rooms, "public-1");
  roomState.players.set("player-1", createPlayerState("player-1", "tester", 0));

  assert.equal(resolveJoinRoomId(rooms, { nickname: "tester", joinMode: "quick" }), "public-1");
});

test("quick match creates a new room when existing rooms are full", () => {
  const rooms: RoomRegistry = new Map();
  const roomState = getOrCreateRoomState(rooms, "public-1");
  for (let index = 0; index < MAX_PLAYERS; index += 1) {
    const playerId = `player-${index}`;
    roomState.players.set(playerId, createPlayerState(playerId, "tester", index));
  }

  assert.equal(resolveJoinRoomId(rooms, { nickname: "tester", joinMode: "quick" }), "quick-2");
});

test("cleanup removes only empty rooms", () => {
  const rooms: RoomRegistry = new Map();
  const occupiedRoom = getOrCreateRoomState(rooms, "occupied");
  occupiedRoom.players.set("player-1", createPlayerState("player-1", "tester", 0));
  getOrCreateRoomState(rooms, "empty");
  let cleanupCount = 0;

  assert.equal(cleanupRoomIfEmpty(rooms, "occupied", () => (cleanupCount += 1)), false);
  assert.equal(cleanupRoomIfEmpty(rooms, "empty", () => (cleanupCount += 1)), true);
  assert.equal(rooms.has("occupied"), true);
  assert.equal(rooms.has("empty"), false);
  assert.equal(cleanupCount, 1);
});

test("cleanup removes rooms that only contain bot players", () => {
  const rooms: RoomRegistry = new Map();
  const botOnlyRoom = getOrCreateRoomState(rooms, "bot-only");
  addBotPlayer(botOnlyRoom, "bot-only", 1000);

  assert.equal(cleanupRoomIfEmpty(rooms, "bot-only", () => undefined), true);
  assert.equal(rooms.has("bot-only"), false);
});

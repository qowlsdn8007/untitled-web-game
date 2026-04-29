import { type PlayerInputState } from "../../shared/protocol.js";
import { createPlayerState, type GameState } from "./state.js";

const BOT_ID_PREFIX = "bot:";
const BOT_DECISION_INTERVAL_MS = 500;

export function isBotPlayerId(playerId: string): boolean {
  return playerId.startsWith(BOT_ID_PREFIX);
}

export function addBotPlayer(state: GameState, roomId: string, now = Date.now()) {
  const botCount = [...state.players.keys()].filter(isBotPlayerId).length;
  const botId = `${BOT_ID_PREFIX}${roomId}:${now}:${botCount + 1}`;
  const bot = createPlayerState(botId, `Bot ${botCount + 1}`, state.players.size, true);
  bot.ready = true;
  state.players.set(bot.id, bot);
  state.botDecisions.set(bot.id, 0);
  return bot;
}

export function hasHumanPlayers(state: GameState): boolean {
  return [...state.players.keys()].some((playerId) => !isBotPlayerId(playerId));
}

export function updateBotInputs(state: GameState, now = Date.now()) {
  state.players.forEach((player, playerId) => {
    if (!isBotPlayerId(playerId) || !player.alive) {
      return;
    }

    const lastDecisionAt = state.botDecisions.get(playerId) ?? 0;
    if (now - lastDecisionAt < BOT_DECISION_INTERVAL_MS) {
      return;
    }

    state.botDecisions.set(playerId, now);
    state.playerInputs.set(playerId, createBotInput(playerId, now));
  });
}

export function shouldBotTryPlaceBomb(playerId: string, now = Date.now()): boolean {
  if (!isBotPlayerId(playerId)) {
    return false;
  }

  return Math.floor(now / 1000 + playerId.length) % 5 === 0;
}

function createBotInput(playerId: string, now: number): PlayerInputState {
  const directions: readonly PlayerInputState["direction"][] = ["up", "right", "down", "left"];
  const directionIndex = Math.abs(Math.floor(now / BOT_DECISION_INTERVAL_MS) + playerId.length) % directions.length;

  return {
    direction: directions[directionIndex],
    moving: true,
    seq: now
  };
}

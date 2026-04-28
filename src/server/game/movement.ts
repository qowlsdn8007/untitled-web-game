import {
  type Direction,
  type PlayerInputState,
  type PlayerState,
  type TileType,
  tileToPixelCenter
} from "../../shared/protocol.js";
import { isWalkableTile } from "../../shared/map.js";

const CENTER_EPSILON = 0.001;

export function stepPlayerMovement(
  player: PlayerState,
  input: PlayerInputState | undefined,
  grid: TileType[][],
  deltaMs: number
): PlayerState {
  if (!player.alive) {
    return {
      ...player,
      moving: false
    };
  }

  const currentCenterX = tileToPixelCenter(player.tileX);
  const currentCenterY = tileToPixelCenter(player.tileY);
  const isCentered =
    Math.abs(player.pixelX - currentCenterX) <= CENTER_EPSILON &&
    Math.abs(player.pixelY - currentCenterY) <= CENTER_EPSILON;

  let nextState = { ...player };

  if (isCentered) {
    if (!input || !input.moving) {
      return {
        ...nextState,
        moving: false
      };
    }

    nextState.direction = input.direction;
    const candidate = getAdjacentTile(player.tileX, player.tileY, input.direction);
    if (!isWalkableTile(grid, candidate.tileX, candidate.tileY)) {
      return {
        ...nextState,
        moving: false
      };
    }

    nextState.tileX = candidate.tileX;
    nextState.tileY = candidate.tileY;
    nextState.moving = true;
  }

  const targetX = tileToPixelCenter(nextState.tileX);
  const targetY = tileToPixelCenter(nextState.tileY);
  const step = (nextState.moveSpeed * deltaMs) / 1000;

  const resolvedX = moveAxisToward(nextState.pixelX, targetX, step);
  const remainingStep = Math.max(0, step - Math.abs(resolvedX - nextState.pixelX));
  const resolvedY = moveAxisToward(nextState.pixelY, targetY, remainingStep > 0 ? remainingStep : step);

  nextState.pixelX = resolvedX;
  nextState.pixelY = resolvedY;
  nextState.moving =
    Math.abs(nextState.pixelX - targetX) > CENTER_EPSILON || Math.abs(nextState.pixelY - targetY) > CENTER_EPSILON;

  return nextState;
}

function getAdjacentTile(tileX: number, tileY: number, direction: Direction) {
  switch (direction) {
    case "up":
      return { tileX, tileY: tileY - 1 };
    case "down":
      return { tileX, tileY: tileY + 1 };
    case "left":
      return { tileX: tileX - 1, tileY };
    case "right":
      return { tileX: tileX + 1, tileY };
  }
}

function moveAxisToward(current: number, target: number, step: number): number {
  if (current === target) {
    return current;
  }

  if (current < target) {
    return Math.min(current + step, target);
  }

  return Math.max(current - step, target);
}

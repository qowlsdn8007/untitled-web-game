import type { PowerUpType } from "../../../shared/protocol";

export const GAME_ASSETS = {
  playerLocal: "player.local",
  playerLocalMoving: "player.local.moving",
  playerRemote: "player.remote",
  playerRemoteMoving: "player.remote.moving",
  playerKo: "player.ko",
  bomb: "bomb.default",
  flame: "flame.default",
  powerUpBomb: "powerup.bomb",
  powerUpFlame: "powerup.flame",
  powerUpSpeed: "powerup.speed"
} as const;

export type GameAssetKey = (typeof GAME_ASSETS)[keyof typeof GAME_ASSETS];

export type ImageAssetDefinition = {
  key: GameAssetKey;
  path: string;
};

export const EXTERNAL_IMAGE_ASSETS: readonly ImageAssetDefinition[] = [
  { key: GAME_ASSETS.playerLocal, path: "/assets/raceway/player-local.png" },
  { key: GAME_ASSETS.playerLocalMoving, path: "/assets/raceway/player-local-moving.png" },
  { key: GAME_ASSETS.playerRemote, path: "/assets/raceway/player-remote.png" },
  { key: GAME_ASSETS.playerRemoteMoving, path: "/assets/raceway/player-remote-moving.png" },
  { key: GAME_ASSETS.playerKo, path: "/assets/raceway/player-ko.png" },
  { key: GAME_ASSETS.bomb, path: "/assets/raceway/bomb.png" },
  { key: GAME_ASSETS.flame, path: "/assets/raceway/flame.png" },
  { key: GAME_ASSETS.powerUpBomb, path: "/assets/raceway/powerup-bomb.png" },
  { key: GAME_ASSETS.powerUpFlame, path: "/assets/raceway/powerup-flame.png" },
  { key: GAME_ASSETS.powerUpSpeed, path: "/assets/raceway/powerup-speed.png" }
] as const;

export function getPlayerTexture(isLocal: boolean, alive: boolean, moving: boolean) {
  if (!alive) {
    return GAME_ASSETS.playerKo;
  }

  if (isLocal) {
    return moving ? GAME_ASSETS.playerLocalMoving : GAME_ASSETS.playerLocal;
  }

  return moving ? GAME_ASSETS.playerRemoteMoving : GAME_ASSETS.playerRemote;
}

export function getPowerUpTexture(type: PowerUpType) {
  switch (type) {
    case "bomb_up":
      return GAME_ASSETS.powerUpBomb;
    case "flame_up":
      return GAME_ASSETS.powerUpFlame;
    case "speed_up":
      return GAME_ASSETS.powerUpSpeed;
  }
}

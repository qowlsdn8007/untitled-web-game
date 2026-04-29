import Phaser from "phaser";
import type { PowerUpType } from "../../shared/protocol";

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

export function createGeneratedGameTextures(scene: Phaser.Scene) {
  createPlayerTexture(scene, GAME_ASSETS.playerLocal, 0xf59e0b, 0xffedd5, 0x7c2d12);
  createPlayerTexture(scene, GAME_ASSETS.playerLocalMoving, 0xfb923c, 0xffedd5, 0x7c2d12);
  createPlayerTexture(scene, GAME_ASSETS.playerRemote, 0x38bdf8, 0xe0f2fe, 0x075985);
  createPlayerTexture(scene, GAME_ASSETS.playerRemoteMoving, 0x7dd3fc, 0xe0f2fe, 0x075985);
  createPlayerTexture(scene, GAME_ASSETS.playerKo, 0x7f1d1d, 0xfca5a5, 0x450a0a);
  createBombTexture(scene);
  createFlameTexture(scene);
  createPowerUpTexture(scene, GAME_ASSETS.powerUpBomb, 0x2563eb);
  createPowerUpTexture(scene, GAME_ASSETS.powerUpFlame, 0xea580c);
  createPowerUpTexture(scene, GAME_ASSETS.powerUpSpeed, 0x16a34a);
}

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

function createPlayerTexture(scene: Phaser.Scene, key: string, fillColor: number, highlightColor: number, shadowColor: number) {
  if (scene.textures.exists(key)) {
    return;
  }

  const graphics = scene.make.graphics({ x: 0, y: 0 }, false);
  graphics.fillStyle(0x000000, 0.22);
  graphics.fillEllipse(16, 26, 24, 8);
  graphics.fillStyle(fillColor, 1);
  graphics.fillRoundedRect(4, 4, 24, 24, 8);
  graphics.fillStyle(highlightColor, 0.95);
  graphics.fillCircle(12, 13, 3);
  graphics.fillCircle(20, 13, 3);
  graphics.fillStyle(shadowColor, 0.85);
  graphics.fillRoundedRect(10, 20, 12, 3, 2);
  graphics.lineStyle(3, highlightColor, 0.8);
  graphics.strokeRoundedRect(4, 4, 24, 24, 8);
  graphics.generateTexture(key, 32, 32);
  graphics.destroy();
}

function createBombTexture(scene: Phaser.Scene) {
  if (scene.textures.exists(GAME_ASSETS.bomb)) {
    return;
  }

  const graphics = scene.make.graphics({ x: 0, y: 0 }, false);
  graphics.fillStyle(0x000000, 0.25);
  graphics.fillEllipse(18, 28, 24, 7);
  graphics.fillStyle(0x111827, 1);
  graphics.fillCircle(18, 18, 13);
  graphics.lineStyle(3, 0x94a3b8, 1);
  graphics.strokeCircle(18, 18, 13);
  graphics.fillStyle(0xf59e0b, 1);
  graphics.fillRoundedRect(16, 2, 5, 10, 2);
  graphics.lineStyle(2, 0xfef3c7, 1);
  graphics.strokeRoundedRect(16, 2, 5, 10, 2);
  graphics.generateTexture(GAME_ASSETS.bomb, 36, 36);
  graphics.destroy();
}

function createFlameTexture(scene: Phaser.Scene) {
  if (scene.textures.exists(GAME_ASSETS.flame)) {
    return;
  }

  const graphics = scene.make.graphics({ x: 0, y: 0 }, false);
  graphics.fillStyle(0xf97316, 0.82);
  graphics.fillRoundedRect(5, 5, 38, 38, 14);
  graphics.fillStyle(0xfacc15, 0.72);
  graphics.fillRoundedRect(13, 10, 22, 28, 10);
  graphics.lineStyle(3, 0xfef08a, 0.95);
  graphics.strokeRoundedRect(5, 5, 38, 38, 14);
  graphics.generateTexture(GAME_ASSETS.flame, 48, 48);
  graphics.destroy();
}

function createPowerUpTexture(scene: Phaser.Scene, key: string, fillColor: number) {
  if (scene.textures.exists(key)) {
    return;
  }

  const graphics = scene.make.graphics({ x: 0, y: 0 }, false);
  graphics.fillStyle(0x000000, 0.2);
  graphics.fillEllipse(14, 27, 20, 6);
  graphics.fillStyle(fillColor, 1);
  graphics.fillRoundedRect(3, 3, 22, 22, 7);
  graphics.lineStyle(2, 0xf8fafc, 0.86);
  graphics.strokeRoundedRect(3, 3, 22, 22, 7);
  graphics.generateTexture(key, 28, 28);
  graphics.destroy();
}

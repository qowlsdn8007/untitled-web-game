import Phaser from "phaser";
import { createGeneratedGameTextures } from "./generated";
import { EXTERNAL_IMAGE_ASSETS } from "./manifest";

const USE_EXTERNAL_ASSETS = false;

export function preloadGameAssets(scene: Phaser.Scene) {
  if (!USE_EXTERNAL_ASSETS) {
    return;
  }

  EXTERNAL_IMAGE_ASSETS.forEach((asset) => {
    scene.load.image(asset.key, asset.path);
  });
}

export function ensureFallbackGameAssets(scene: Phaser.Scene) {
  if (USE_EXTERNAL_ASSETS && EXTERNAL_IMAGE_ASSETS.every((asset) => scene.textures.exists(asset.key))) {
    return;
  }

  createGeneratedGameTextures(scene);
}

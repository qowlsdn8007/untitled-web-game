import Phaser from "phaser";
import { MAP_HEIGHT, MAP_WIDTH, TILE_SIZE, SPAWN_POINT } from "../../shared/protocol";
import { blockedTiles } from "../../shared/map";

export function drawMap(graphics: Phaser.GameObjects.Graphics) {
  graphics.clear();
  graphics.fillStyle(0x0b1220, 1);
  graphics.fillRect(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE);

  for (let y = 0; y < MAP_HEIGHT; y += 1) {
    for (let x = 0; x < MAP_WIDTH; x += 1) {
      const key = `${x},${y}`;
      const worldX = x * TILE_SIZE;
      const worldY = y * TILE_SIZE;
      const isBlocked = blockedTiles.has(key);

      graphics.fillStyle(isBlocked ? 0x334155 : 0x172033, 1);
      graphics.fillRect(worldX + 1, worldY + 1, TILE_SIZE - 2, TILE_SIZE - 2);

      graphics.lineStyle(1, isBlocked ? 0x475569 : 0x22304f, 0.8);
      graphics.strokeRect(worldX, worldY, TILE_SIZE, TILE_SIZE);
    }
  }

  graphics.fillStyle(0x22c55e, 1);
  graphics.fillRoundedRect(SPAWN_POINT.x - 16, SPAWN_POINT.y - 16, 32, 32, 8);
}

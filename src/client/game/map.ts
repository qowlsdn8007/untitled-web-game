import Phaser from "phaser";
import { MAP_HEIGHT, MAP_WIDTH, SPAWN_TILES, TILE_SIZE, type TileType, tileToPixelCenter } from "../../shared/protocol";
import { DEFAULT_ROUND_GRID } from "../../shared/map";

export function drawMap(graphics: Phaser.GameObjects.Graphics, grid: TileType[][] = DEFAULT_ROUND_GRID) {
  graphics.clear();
  graphics.fillStyle(0x142033, 1);
  graphics.fillRect(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE);

  for (let y = 0; y < MAP_HEIGHT; y += 1) {
    for (let x = 0; x < MAP_WIDTH; x += 1) {
      const worldX = x * TILE_SIZE;
      const worldY = y * TILE_SIZE;
      const tile = grid[y][x];

      drawTrackTile(graphics, worldX, worldY);

      if (tile === "solid") {
        drawTireStack(graphics, worldX, worldY);
      }

      if (tile === "breakable") {
        drawTrafficCone(graphics, worldX, worldY);
      }
    }
  }

  graphics.fillStyle(0x22c55e, 0.9);
  SPAWN_TILES.forEach((spawn) => {
    graphics.fillRoundedRect(tileToPixelCenter(spawn.tileX) - 16, tileToPixelCenter(spawn.tileY) - 16, 32, 32, 8);
    graphics.lineStyle(2, 0xbbf7d0, 0.8);
    graphics.strokeRoundedRect(tileToPixelCenter(spawn.tileX) - 16, tileToPixelCenter(spawn.tileY) - 16, 32, 32, 8);
  });
}

function drawTrackTile(graphics: Phaser.GameObjects.Graphics, worldX: number, worldY: number) {
  graphics.fillStyle(0x7d8590, 1);
  graphics.fillRoundedRect(worldX + 2, worldY + 2, TILE_SIZE - 4, TILE_SIZE - 4, 5);
  graphics.fillStyle(0x9aa2ad, 0.36);
  graphics.fillRoundedRect(worldX + 6, worldY + 6, TILE_SIZE - 12, 7, 3);
  graphics.lineStyle(1, 0x5f6875, 0.74);
  graphics.strokeRoundedRect(worldX + 2, worldY + 2, TILE_SIZE - 4, TILE_SIZE - 4, 5);
}

function drawTireStack(graphics: Phaser.GameObjects.Graphics, worldX: number, worldY: number) {
  const centers = [
    [16, 15],
    [31, 15],
    [16, 31],
    [31, 31]
  ] as const;

  graphics.fillStyle(0x020617, 0.32);
  graphics.fillEllipse(worldX + 24, worldY + 39, 38, 9);

  centers.forEach(([offsetX, offsetY]) => {
    const centerX = worldX + offsetX;
    const centerY = worldY + offsetY;
    graphics.fillStyle(0x111827, 1);
    graphics.fillCircle(centerX, centerY, 11);
    graphics.lineStyle(3, 0x374151, 1);
    graphics.strokeCircle(centerX, centerY, 10);
    graphics.fillStyle(0x030712, 1);
    graphics.fillCircle(centerX, centerY, 5);
    graphics.lineStyle(1, 0x64748b, 0.7);
    graphics.strokeCircle(centerX - 2, centerY - 2, 8);
  });
}

function drawTrafficCone(graphics: Phaser.GameObjects.Graphics, worldX: number, worldY: number) {
  const centerX = worldX + TILE_SIZE / 2;

  graphics.fillStyle(0x020617, 0.24);
  graphics.fillEllipse(centerX, worldY + 40, 28, 8);

  graphics.fillStyle(0xdc2626, 1);
  graphics.fillRoundedRect(centerX - 15, worldY + 35, 30, 7, 2);
  graphics.fillTriangle(centerX, worldY + 7, centerX - 12, worldY + 36, centerX + 12, worldY + 36);

  graphics.fillStyle(0xf8fafc, 1);
  graphics.fillRoundedRect(centerX - 9, worldY + 22, 18, 5, 2);
  graphics.fillStyle(0xffedd5, 0.9);
  graphics.fillTriangle(centerX, worldY + 7, centerX - 4, worldY + 17, centerX + 4, worldY + 17);

  graphics.lineStyle(2, 0x7f1d1d, 0.86);
  graphics.strokeTriangle(centerX, worldY + 7, centerX - 12, worldY + 36, centerX + 12, worldY + 36);
}

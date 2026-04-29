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
  const left = worldX + 3;
  const right = worldX + TILE_SIZE - 3;
  const top = worldY + 5;
  const bottom = worldY + TILE_SIZE - 4;
  const mid = worldY + TILE_SIZE - 11;

  graphics.fillStyle(0x4b5563, 1);
  graphics.fillPoints(
    [
      new Phaser.Geom.Point(left, mid),
      new Phaser.Geom.Point(right, mid),
      new Phaser.Geom.Point(right - 5, bottom),
      new Phaser.Geom.Point(left + 5, bottom)
    ],
    true
  );

  graphics.fillStyle(0x8b95a3, 1);
  graphics.fillPoints(
    [
      new Phaser.Geom.Point(left + 3, top),
      new Phaser.Geom.Point(right - 3, top),
      new Phaser.Geom.Point(right, mid),
      new Phaser.Geom.Point(left, mid)
    ],
    true
  );

  graphics.fillStyle(0xaab2bd, 0.32);
  graphics.fillRoundedRect(worldX + 10, worldY + 11, TILE_SIZE - 20, 5, 2);
  graphics.lineStyle(1, 0x667180, 0.82);
  graphics.strokePoints(
    [
      new Phaser.Geom.Point(left + 3, top),
      new Phaser.Geom.Point(right - 3, top),
      new Phaser.Geom.Point(right, mid),
      new Phaser.Geom.Point(right - 5, bottom),
      new Phaser.Geom.Point(left + 5, bottom),
      new Phaser.Geom.Point(left, mid)
    ],
    true
  );
}

function drawTireStack(graphics: Phaser.GameObjects.Graphics, worldX: number, worldY: number) {
  const centers = [
    [16, 17],
    [31, 17],
    [16, 30],
    [31, 30]
  ] as const;

  graphics.fillStyle(0x020617, 0.32);
  graphics.fillEllipse(worldX + 25, worldY + 41, 39, 11);

  graphics.fillStyle(0x020617, 0.82);
  graphics.fillRoundedRect(worldX + 6, worldY + 27, TILE_SIZE - 12, 11, 5);
  graphics.fillStyle(0x1f2937, 1);
  graphics.fillRoundedRect(worldX + 6, worldY + 22, TILE_SIZE - 12, 10, 5);

  centers.forEach(([offsetX, offsetY]) => {
    const centerX = worldX + offsetX;
    const centerY = worldY + offsetY;
    graphics.fillStyle(0x111827, 1);
    graphics.fillEllipse(centerX, centerY + 3, 23, 17);
    graphics.fillStyle(0x020617, 1);
    graphics.fillEllipse(centerX, centerY + 6, 15, 8);
    graphics.fillStyle(0x1f2937, 1);
    graphics.fillEllipse(centerX, centerY, 23, 17);
    graphics.lineStyle(3, 0x4b5563, 1);
    graphics.strokeEllipse(centerX, centerY, 22, 16);
    graphics.fillStyle(0x030712, 1);
    graphics.fillEllipse(centerX, centerY + 1, 10, 7);
    graphics.lineStyle(1, 0x64748b, 0.7);
    graphics.strokeEllipse(centerX - 2, centerY - 2, 15, 9);
  });
}

function drawTrafficCone(graphics: Phaser.GameObjects.Graphics, worldX: number, worldY: number) {
  const centerX = worldX + TILE_SIZE / 2;

  graphics.fillStyle(0x020617, 0.28);
  graphics.fillEllipse(centerX + 2, worldY + 42, 31, 9);

  graphics.fillStyle(0x991b1b, 1);
  graphics.fillRoundedRect(centerX - 15, worldY + 36, 30, 7, 2);
  graphics.fillStyle(0xdc2626, 1);
  graphics.fillRoundedRect(centerX - 15, worldY + 32, 30, 7, 2);
  graphics.fillStyle(0x991b1b, 1);
  graphics.fillTriangle(centerX, worldY + 10, centerX + 12, worldY + 34, centerX, worldY + 38);
  graphics.fillStyle(0xef4444, 1);
  graphics.fillTriangle(centerX, worldY + 7, centerX - 12, worldY + 34, centerX + 12, worldY + 34);

  graphics.fillStyle(0xf8fafc, 1);
  graphics.fillRoundedRect(centerX - 9, worldY + 21, 18, 5, 2);
  graphics.fillStyle(0xffedd5, 0.9);
  graphics.fillTriangle(centerX, worldY + 7, centerX - 4, worldY + 17, centerX + 4, worldY + 17);

  graphics.lineStyle(2, 0x7f1d1d, 0.86);
  graphics.strokeTriangle(centerX, worldY + 7, centerX - 12, worldY + 34, centerX + 12, worldY + 34);
}

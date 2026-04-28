import Phaser from "phaser";
import { MAP_HEIGHT, MAP_WIDTH, SPAWN_TILES, TILE_SIZE, type TileType, tileToPixelCenter } from "../../shared/protocol";
import { DEFAULT_ROUND_GRID } from "../../shared/map";

export function drawMap(graphics: Phaser.GameObjects.Graphics, grid: TileType[][] = DEFAULT_ROUND_GRID) {
  graphics.clear();
  graphics.fillStyle(0x0b1220, 1);
  graphics.fillRect(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE);

  for (let y = 0; y < MAP_HEIGHT; y += 1) {
    for (let x = 0; x < MAP_WIDTH; x += 1) {
      const worldX = x * TILE_SIZE;
      const worldY = y * TILE_SIZE;
      const tile = grid[y][x];
      const fillColor = tile === "solid" ? 0x475569 : tile === "breakable" ? 0x7c5c33 : 0x172033;
      const strokeColor = tile === "solid" ? 0x64748b : tile === "breakable" ? 0xa16207 : 0x22304f;

      graphics.fillStyle(fillColor, 1);
      graphics.fillRect(worldX + 1, worldY + 1, TILE_SIZE - 2, TILE_SIZE - 2);

      graphics.lineStyle(1, strokeColor, 0.8);
      graphics.strokeRect(worldX, worldY, TILE_SIZE, TILE_SIZE);
    }
  }

  graphics.fillStyle(0x22c55e, 1);
  SPAWN_TILES.forEach((spawn) => {
    graphics.fillRoundedRect(tileToPixelCenter(spawn.tileX) - 16, tileToPixelCenter(spawn.tileY) - 16, 32, 32, 8);
  });
}

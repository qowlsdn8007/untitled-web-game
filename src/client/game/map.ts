import Phaser from "phaser";
import { MAP_HEIGHT, MAP_WIDTH, SPAWN_TILES, TILE_SIZE, type TileType, tileToPixelCenter } from "../../shared/protocol";
import { DEFAULT_ROUND_GRID } from "../../shared/map";

export function drawMap(graphics: Phaser.GameObjects.Graphics, grid: TileType[][] = DEFAULT_ROUND_GRID) {
  graphics.clear();
  graphics.fillStyle(0x101827, 1);
  graphics.fillRect(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE);

  for (let y = 0; y < MAP_HEIGHT; y += 1) {
    for (let x = 0; x < MAP_WIDTH; x += 1) {
      const worldX = x * TILE_SIZE;
      const worldY = y * TILE_SIZE;
      const tile = grid[y][x];
      const fillColor = tile === "solid" ? 0x516070 : tile === "breakable" ? 0x9a6a37 : 0x18243a;
      const strokeColor = tile === "solid" ? 0x7b8796 : tile === "breakable" ? 0xd08a34 : 0x253856;
      const highlightColor = tile === "solid" ? 0x7f8ea3 : tile === "breakable" ? 0xc78b4a : 0x20304d;

      graphics.fillStyle(fillColor, 1);
      graphics.fillRoundedRect(worldX + 3, worldY + 3, TILE_SIZE - 6, TILE_SIZE - 6, 9);
      graphics.fillStyle(highlightColor, 0.5);
      graphics.fillRoundedRect(worldX + 7, worldY + 7, TILE_SIZE - 14, 8, 4);

      graphics.lineStyle(1, strokeColor, 0.8);
      graphics.strokeRoundedRect(worldX + 3, worldY + 3, TILE_SIZE - 6, TILE_SIZE - 6, 9);
    }
  }

  graphics.fillStyle(0x22c55e, 1);
  SPAWN_TILES.forEach((spawn) => {
    graphics.fillRoundedRect(tileToPixelCenter(spawn.tileX) - 16, tileToPixelCenter(spawn.tileY) - 16, 32, 32, 8);
  });
}

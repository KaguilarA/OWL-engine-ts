/**
 * Configuration for a grid rendered from a tileset image.
 * @interface TilemapOptions
 */
export interface TilemapOptions {
  image: CanvasImageSource;
  columns: number;
  tileWidth: number;
  tileHeight: number;
  mapWidth: number;
  mapHeight: number;
  x?: number;
  y?: number;
  spacing?: number;
  margin?: number;
  drawTileWidth?: number;
  drawTileHeight?: number;
}

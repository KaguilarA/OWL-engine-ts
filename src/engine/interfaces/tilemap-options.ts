/**
 * Configuration for a grid rendered from a tileset image.
 * @interface TilemapOptions
 */
export interface TilemapOptions {
  /**
   * Image source used to render the associated content.
   * @property {CanvasImageSource} image
   */
  image: CanvasImageSource;
  /**
   * Number or contents of the grid columns.
   * @property {number} columns
   */
  columns: number;
  /**
   * Tile width configuration or state owned by TilemapOptions.
   * @property {number} tileWidth
   */
  tileWidth: number;
  /**
   * Tile height configuration or state owned by TilemapOptions.
   * @property {number} tileHeight
   */
  tileHeight: number;
  /**
   * Map width configuration or state owned by TilemapOptions.
   * @property {number} mapWidth
   */
  mapWidth: number;
  /**
   * Map height configuration or state owned by TilemapOptions.
   * @property {number} mapHeight
   */
  mapHeight: number;
  /**
   * Horizontal coordinate in the owning coordinate space.
   * @property {number | undefined} x
   */
  x?: number;
  /**
   * Vertical coordinate in the owning coordinate space.
   * @property {number | undefined} y
   */
  y?: number;
  /**
   * Spacing configuration or state owned by TilemapOptions.
   * @property {number | undefined} spacing
   */
  spacing?: number;
  /**
   * Margin configuration or state owned by TilemapOptions.
   * @property {number | undefined} margin
   */
  margin?: number;
  /**
   * Draw tile width configuration or state owned by TilemapOptions.
   * @property {number | undefined} drawTileWidth
   */
  drawTileWidth?: number;
  /**
   * Draw tile height configuration or state owned by TilemapOptions.
   * @property {number | undefined} drawTileHeight
   */
  drawTileHeight?: number;
}

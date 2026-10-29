/**
 * Defines the board layout contract shared by its consumers.
 * @interface BoardLayout
 */
export interface BoardLayout {
  /**
   * Origin x configuration or state owned by BoardLayout.
   * @property {number} originX
   */
  originX: number;
  /**
   * Origin y configuration or state owned by BoardLayout.
   * @property {number} originY
   */
  originY: number;
  /**
   * Tile size configuration or state owned by BoardLayout.
   * @property {number} tileSize
   */
  tileSize: number;
}

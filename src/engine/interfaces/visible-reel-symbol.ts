/**
 * Defines the visible reel symbol contract shared by its consumers.
 * @interface VisibleReelSymbol
 */
export interface VisibleReelSymbol {
  /**
   * Symbol configuration or state owned by VisibleReelSymbol.
   * @property {string} symbol
   */
  symbol: string;
  /**
   * Row index within the grid.
   * @property {number} row
   */
  row: number;
  /**
   * Offset cells configuration or state owned by VisibleReelSymbol.
   * @property {number} offsetCells
   */
  offsetCells: number;
  /**
   * Blur amount configuration or state owned by VisibleReelSymbol.
   * @property {number} blurAmount
   */
  blurAmount: number;
}

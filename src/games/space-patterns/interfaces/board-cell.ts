/**
 * Defines the board cell contract shared by its consumers.
 * @interface BoardCell
 */
export interface BoardCell {
  /**
   * Column index within the grid.
   * @property {number} column
   */
  column: number;
  /**
   * Row index within the grid.
   * @property {number} row
   */
  row: number;
}

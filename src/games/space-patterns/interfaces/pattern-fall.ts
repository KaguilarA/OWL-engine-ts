/**
 * Defines the pattern fall contract shared by its consumers.
 * @interface PatternFall
 */
export interface PatternFall {
  /**
   * Column index within the grid.
   * @property {number} column
   * @readonly
   */
  readonly column: number;
  /**
   * Pattern configuration or state owned by PatternFall.
   * @property {number} pattern
   * @readonly
   */
  readonly pattern: number;
  /**
   * From row configuration or state owned by PatternFall.
   * @property {number} fromRow
   * @readonly
   */
  readonly fromRow: number;
  /**
   * To row configuration or state owned by PatternFall.
   * @property {number} toRow
   * @readonly
   */
  readonly toRow: number;
}

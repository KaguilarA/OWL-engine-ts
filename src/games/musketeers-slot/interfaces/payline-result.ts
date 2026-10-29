/**
 * Defines the winning cell contract shared by its consumers.
 * @typedef {`${number}:${number}`} WinningCell
 */
export type WinningCell = `${number}:${number}`;

/**
 * Defines the payline result contract shared by its consumers.
 * @interface PaylineResult
 */
export interface PaylineResult {
  /**
   * Win configuration or state owned by PaylineResult.
   * @property {number} win
   */
  win: number;
  /**
   * Winning cells configuration or state owned by PaylineResult.
   * @property {ReadonlySet<`${number}:${number}`>} winningCells
   */
  winningCells: ReadonlySet<WinningCell>;
}

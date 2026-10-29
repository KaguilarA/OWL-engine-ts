import type { BoardCell } from './';

/**
 * Defines the swap animation contract shared by its consumers.
 * @interface SwapAnimation
 */
export interface SwapAnimation {
  /**
   * First configuration or state owned by SwapAnimation.
   * @property {BoardCell} first
   */
  first: BoardCell;
  /**
   * Second configuration or state owned by SwapAnimation.
   * @property {BoardCell} second
   */
  second: BoardCell;
  /**
   * First pattern configuration or state owned by SwapAnimation.
   * @property {number} firstPattern
   */
  firstPattern: number;
  /**
   * Second pattern configuration or state owned by SwapAnimation.
   * @property {number} secondPattern
   */
  secondPattern: number;
  /**
   * Matches configuration or state owned by SwapAnimation.
   * @property {BoardCell[]} matches
   */
  matches: BoardCell[];
  /**
   * Elapsed configuration or state owned by SwapAnimation.
   * @property {number} elapsed
   */
  elapsed: number;
}

import type { ReelSymbolVisual } from './';

/**
 * Defines the reel bank options contract shared by its consumers.
 * @interface ReelBankOptions
 */
export interface ReelBankOptions {
  /**
   * Number of reels managed by the bank.
   * @property {number} reelCount
   */
  reelCount: number;
  /**
   * Number of visible symbol rows in each reel.
   * @property {number} rowCount
   */
  rowCount: number;
  /**
   * Factory selecting a symbol for a generated reel column.
   * @property {() => string} randomSymbol
   */
  randomSymbol: () => string;
  /**
   * Multiplier applied to reel spin timing and motion.
   * @property {number | undefined} spinSpeedMultiplier
   */
  spinSpeedMultiplier?: number;
  /**
   * Factory constructing the visual for a specific reel and icon slot.
   * @property {((reelIndex: number, iconIndex: number) => ReelSymbolVisual) | undefined} createVisual
   */
  createVisual?: (reelIndex: number, iconIndex: number) => ReelSymbolVisual;
}

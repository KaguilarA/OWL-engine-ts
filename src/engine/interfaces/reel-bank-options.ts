import type { ReelSymbolVisual } from './';

/**
 * Defines the reel bank options contract shared by its consumers.
 * @interface ReelBankOptions
 */
export interface ReelBankOptions {
  /**
   * Reel count configuration or state owned by ReelBankOptions.
   * @property {number} reelCount
   */
  reelCount: number;
  /**
   * Row count configuration or state owned by ReelBankOptions.
   * @property {number} rowCount
   */
  rowCount: number;
  /**
   * Random symbol configuration or state owned by ReelBankOptions.
   * @property {() => string} randomSymbol
   */
  randomSymbol: () => string;
  /**
   * Spin speed multiplier configuration or state owned by ReelBankOptions.
   * @property {number | undefined} spinSpeedMultiplier
   */
  spinSpeedMultiplier?: number;
  /**
   * Create visual configuration or state owned by ReelBankOptions.
   * @property {((reelIndex: number, iconIndex: number) => ReelSymbolVisual) | undefined} createVisual
   */
  createVisual?: (reelIndex: number, iconIndex: number) => ReelSymbolVisual;
}

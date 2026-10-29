import type { SignalValue } from 'reactive-values';

/**
 * Collectible geometry and collection state shared by gameplay and rendering.
 * @typedef {Coin} Coin
 */
type Coin = {
  /**
   * Horizontal center of the collectible in world coordinates.
   * @property {number} x
   */
  x: number;
  /**
   * Vertical center of the collectible in world coordinates.
   * @property {number} y
   */
  y: number;
  /**
   * Whether its contact sensor has already awarded points.
   * @property {SignalValue<boolean>} collected
   */
  collected: SignalValue<boolean>;
};

export type { Coin as default };

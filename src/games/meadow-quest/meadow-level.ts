import type { Coin, Platform } from './';

/**
 * Responsive platformer layout with fresh reactive collectible state.
 * @interface MeadowLevel
 */
export interface MeadowLevel {
  /**
   * Floor and one-way ledges rendered by the scene.
   * @property {Platform[]} platforms
   */
  platforms: Platform[];
  /**
   * Collectibles whose collected flags are reactive values.
   * @property {Coin[]} coins
   */
  coins: Coin[];
}

import type { Rect } from './';

/**
 * Defines the wall contract shared by its consumers.
 * @interface Wall
 */
export interface Wall extends Rect {
  /**
   * Health configuration or state owned by Wall.
   * @property {number} health
   */
  health: number;
  /**
   * Destructible configuration or state owned by Wall.
   * @property {boolean} destructible
   */
  destructible: boolean;
}

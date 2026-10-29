import type { PhysicsBody } from '../../../engine';

/**
 * Defines the shot contract shared by its consumers.
 * @interface Shot
 */
export interface Shot {
  /**
   * Motion configuration or state owned by Shot.
   * @property {default} motion
   */
  motion: PhysicsBody;
  /**
   * Direction configuration or state owned by Shot.
   * @property {1 | -1} direction
   * @readonly
   */
  readonly direction: -1 | 1;
}

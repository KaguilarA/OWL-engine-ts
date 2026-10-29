import type { PhysicsBody } from '../../../engine';
import type { PatternFall } from './';

/**
 * Defines the falling pattern contract shared by its consumers.
 * @interface FallingPattern
 */
export interface FallingPattern extends PatternFall {
  /**
   * Motion configuration or state owned by FallingPattern.
   * @property {default} motion
   * @readonly
   */
  readonly motion: PhysicsBody;
}

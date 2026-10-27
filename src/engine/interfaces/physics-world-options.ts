/**
 * Configuration for a scene-scoped 2D physics world.
 * @interface PhysicsWorldOptions
 */
export interface PhysicsWorldOptions {
  /**
   * Downward acceleration applied to all bodies, in world units per second squared.
   * @property {number} gravityY
   */
  gravityY?: number;

  /**
   * Duration of each fixed simulation step, in seconds.
   * @property {number} fixedTimeStep
   */
  fixedTimeStep?: number;

  /**
   * Maximum fixed steps simulated during one update.
   * @property {number} maxSubSteps
   */
  maxSubSteps?: number;

  /**
   * Bounciness used when resolving body-to-body contacts, from zero to one.
   * @property {number} restitution
   */
  restitution?: number;
}

import type { PhysicsBody } from '../core';

/**
 * Movement and jump settings for a platforming character controller.
 * @interface PlatformerOptions
 */
export interface PlatformerOptions {
  /**
   * Existing reactive motion to control when a PhysicsWorld owns integration.
   * @property {PhysicsBody | undefined} body
   */
  body?: PhysicsBody;

  /**
   * Horizontal movement speed in world units per second.
   * @property {number} moveSpeed
   */
  moveSpeed?: number;

  /**
   * Downward acceleration in world units per second squared.
   * @property {number} gravityY
   */
  gravityY?: number;

  /**
   * Upward jump speed in world units per second.
   * @property {number} jumpVelocity
   */
  jumpVelocity?: number;

  /**
   * Duration a jump input remains buffered, in seconds.
   * @property {number} jumpBufferDuration
   */
  jumpBufferDuration?: number;

  /**
   * Time after leaving a surface during which jumping remains allowed.
   * @property {number} coyoteDuration
   */
  coyoteDuration?: number;
}

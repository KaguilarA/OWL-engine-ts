/**
 * Acceleration and speed limits for a top-down character or ship controller.
 * @interface TopDownOptions
 */
export interface TopDownOptions {
  /**
   * Maximum world speed.
   * @property {number} maxSpeed
   */
  maxSpeed?: number;

  /**
   * Acceleration toward the requested movement direction.
   * @property {number} acceleration
   */
  acceleration?: number;

  /**
   * Deceleration applied when no directional input is held.
   * @property {number} friction
   */
  friction?: number;
}

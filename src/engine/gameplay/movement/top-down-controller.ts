import { PhysicsBody } from '../../core';
import type { TopDownOptions } from '../../interfaces';

/**
 * Accelerated eight-direction movement for ships and top-down action games.
 * @class TopDownController
 */
export default class {
  /**
   * Physics body containing the controller's reactive position and velocity.
   * @property {PhysicsBody} body
   * @public
   * @readonly
   */
  public readonly body: PhysicsBody;

  /**
   * Maximum world movement speed.
   * @property {number} maxSpeed
   * @public
   * @readonly
   */
  public readonly maxSpeed: number;

  /**
   * Acceleration toward the requested input direction.
   * @property {number} acceleration
   * @public
   * @readonly
   */
  public readonly acceleration: number;

  /**
   * Deceleration applied when input is released.
   * @property {number} friction
   * @public
   * @readonly
   */
  public readonly friction: number;

  /**
   * Creates a top-down controller at the supplied position.
   * @param x Initial horizontal position.
   * @param y Initial vertical position.
   * @param options Speed, acceleration, and friction settings.
   * @public
   * @return {void}
   * @constructor
   */
  public constructor(x = 0, y = 0, options: TopDownOptions = {}) {
    this.body = new PhysicsBody(x, y);
    this.maxSpeed = options.maxSpeed ?? 260;
    this.acceleration = options.acceleration ?? 1800;
    this.friction = options.friction ?? 2200;
    this.validateOptions();
  }

  /**
   * Advances velocity and position from normalized directional input.
   * @param deltaSeconds Duration of the frame in seconds.
   * @param inputX Horizontal input, normally from -1 to 1.
   * @param inputY Vertical input, normally from -1 to 1.
   * @public
   * @return {void}
   */
  public update(deltaSeconds: number, inputX: number, inputY: number): void {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0) {
      throw new RangeError('Top-down delta seconds must be finite and non-negative.');
    }
    if (!Number.isFinite(inputX) || !Number.isFinite(inputY)) {
      throw new RangeError('Top-down input values must be finite.');
    }
    const delta = Math.min(deltaSeconds, 0.1);
    const magnitude = Math.hypot(inputX, inputY);
    const directionX = magnitude > 1 ? inputX / magnitude : inputX;
    const directionY = magnitude > 1 ? inputY / magnitude : inputY;
    const rate = magnitude > 0 ? this.acceleration : this.friction;
    const targetX = magnitude > 0 ? directionX * this.maxSpeed : 0;
    const targetY = magnitude > 0 ? directionY * this.maxSpeed : 0;
    this.body.velocityX.set(this.moveToward(this.body.velocityX(), targetX, rate * delta));
    this.body.velocityY.set(this.moveToward(this.body.velocityY(), targetY, rate * delta));
    this.body.update(delta);
  }

  /**
   * Moves a scalar value toward a target by a bounded amount.
   * @param current Current value.
   * @param target Desired value.
   * @param maximumDelta Maximum absolute change.
   * @private
   * @return {number}
   */
  private moveToward(current: number, target: number, maximumDelta: number): number {
    if (Math.abs(target - current) <= maximumDelta) return target;
    return current + Math.sign(target - current) * maximumDelta;
  }

  /**
   * Rejects non-finite and negative movement settings.
   * @private
   * @return {void}
   */
  private validateOptions(): void {
    if ([this.maxSpeed, this.acceleration, this.friction]
      .some((value) => !Number.isFinite(value) || value < 0)) {
      throw new RangeError('Top-down movement settings must be finite and non-negative.');
    }
  }
}

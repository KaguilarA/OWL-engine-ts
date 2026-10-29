import { signalValue, type SignalValue } from 'reactive-values';
import { PhysicsBody } from '../../core';
import type { PlatformerOptions } from '../../interfaces';

/**
 * Side-scrolling character movement with gravity, buffered jumps, and coyote time.
 * @class PlatformerController
 */
export default class {
  /**
   * Physics body containing the character's reactive position and velocity.
   * @property {PhysicsBody} body
   * @public
   * @readonly
   */
  public readonly body: PhysicsBody;

  /**
   * Whether the character is grounded on a surface.
   * @property {SignalValue<boolean>} grounded
   * @public
   * @readonly
   */
  public readonly grounded: SignalValue<boolean> = signalValue(false);

  /**
   * Horizontal movement speed.
   * @property {number} moveSpeed
   * @public
   * @readonly
   */
  public readonly moveSpeed: number;

  /**
   * Downward gravity acceleration.
   * @property {number} gravityY
   * @public
   * @readonly
   */
  public readonly gravityY: number;

  /**
   * Upward jump velocity magnitude.
   * @property {number} jumpVelocity
   * @public
   * @readonly
   */
  public readonly jumpVelocity: number;

  /**
   * Remaining jump input buffer duration.
   * @property {SignalValue<number>} jumpBufferRemaining
   * @private
   * @readonly
   */
  private readonly jumpBufferRemaining: SignalValue<number> = signalValue(0);

  /**
   * Remaining coyote-time duration.
   * @property {SignalValue<number>} coyoteRemaining
   * @private
   * @readonly
   */
  private readonly coyoteRemaining: SignalValue<number> = signalValue(0);

  /**
   * Configured jump input buffer duration.
   * @property {number} jumpBufferDuration
   * @private
   * @readonly
   */
  private readonly jumpBufferDuration: number;

  /**
   * Configured coyote-time duration.
   * @property {number} coyoteDuration
   * @private
   * @readonly
   */
  private readonly coyoteDuration: number;

  /**
   * Creates a platforming controller with a body and movement settings.
   * @param x Initial horizontal position.
   * @param y Initial vertical position.
   * @param options Movement settings.
   * @public
   * @return {void}
   * @constructor
   */
  public constructor(x = 0, y = 0, options: PlatformerOptions = {}) {
    this.body = new PhysicsBody(x, y);
    this.moveSpeed = options.moveSpeed ?? 260;
    this.gravityY = options.gravityY ?? 1200;
    this.jumpVelocity = options.jumpVelocity ?? 480;
    this.jumpBufferDuration = options.jumpBufferDuration ?? 0.12;
    this.coyoteDuration = options.coyoteDuration ?? 0.1;
    this.validateOptions();
  }

  /**
   * Queues a jump input to bridge small gaps between input and landing.
   * @public
   * @return {void}
   */
  public requestJump(): void {
    this.jumpBufferRemaining.set(this.jumpBufferDuration);
  }

  /**
   * Advances movement and applies a buffered jump when grounded or in coyote time.
   * @param deltaSeconds Duration of the frame in seconds.
   * @param horizontalInput Horizontal input in the range -1 to 1.
   * @param isGrounded Whether collision resolution found a supporting surface.
   * @public
   * @return {void}
   */
  public update(deltaSeconds: number, horizontalInput: number, isGrounded: boolean): void {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0) {
      throw new RangeError('Platformer delta seconds must be finite and non-negative.');
    }
    if (!Number.isFinite(horizontalInput)) throw new RangeError('Horizontal input must be finite.');
    const delta = Math.min(deltaSeconds, 0.1);
    this.grounded.set(isGrounded);
    this.coyoteRemaining.set(isGrounded
      ? this.coyoteDuration
      : Math.max(0, this.coyoteRemaining() - delta));
    this.jumpBufferRemaining.set(Math.max(0, this.jumpBufferRemaining() - delta));
    const input = Math.max(-1, Math.min(1, horizontalInput));
    this.body.velocityX.set(input * this.moveSpeed);

    if (this.jumpBufferRemaining() > 0 && this.coyoteRemaining() > 0) {
      this.body.velocityY.set(-this.jumpVelocity);
      this.jumpBufferRemaining.set(0);
      this.coyoteRemaining.set(0);
      this.grounded.set(false);
    }

    this.body.update(delta, this.gravityY);
    if (isGrounded && this.body.velocityY() > 0 && this.coyoteRemaining() > 0) {
      this.body.velocityY.set(0);
    }
  }

  /**
   * Validates movement values and timing settings.
   * @private
   * @return {void}
   */
  private validateOptions(): void {
    const positiveValues = [this.moveSpeed, this.jumpVelocity];
    if (positiveValues.some((value) => !Number.isFinite(value) || value <= 0)) {
      throw new RangeError('Platformer movement speed and jump velocity must be positive and finite.');
    }
    const nonNegativeValues = [this.gravityY, this.jumpBufferDuration, this.coyoteDuration];
    if (nonNegativeValues.some((value) => !Number.isFinite(value) || value < 0)) {
      throw new RangeError('Platformer gravity and jump timing values must be finite and non-negative.');
    }
  }
}

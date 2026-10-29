import { signalValue } from 'reactive-values';
import {
  GameContext,
  PhysicsBody
} from '../../engine';

import { POLARITY_COLORS, type Polarity } from './';

/**
 * Vertical projectile whose color and collision state follow its polarity.
 * @class PolarityProjectile
 */
export default class {
  /**
   * Stores the active state.
   * @property {boolean} active
   * @public
   */
  private readonly activeState = signalValue(false);
  /**
   * Returns active from the current PolarityProjectile state.
   * @returns {boolean} active from the current PolarityProjectile state.
   * @public
   */
  public get active(): boolean { return this.activeState(); }
  /**
   * Updates active in the PolarityProjectile state.
   * @param {boolean} value Value to read, validate, format, or assign.
   * @returns {void}
   * @public
   */
  public set active(value: boolean) { this.activeState.set(value); }
  /**
   * Stores the x state.
   * @property {number} x
   * @public
   */
  private readonly motion = new PhysicsBody();
  /**
   * Stores the y state.
   * @property {number} y
   * @public
   */
  /**
   * Stores the radius state.
   * @property {number} radius
   * @public
   * @readonly
   */
  public readonly radius: number;
  /**
   * Stores the speed state.
   * @property {number} speed
   * @private
   * @readonly
   */
  private readonly speed: number;
  /**
   * Stores the polarity state.
   * @property {Polarity} polarity
   * @private
   */
  private polarity: Polarity;
  /**
   * Stores the direction state.
   * @property {number} direction
   * @private
   */
  private direction = -1;

  /**
   * Creates a pooled projectile with fixed speed and rendered radius.
   * @public
   * @return {void}
   * @constructor
   * @param {number} speed The speed supplied to this operation.
   * @param {Polarity} polarity The polarity supplied to this operation.
   * @param {number} radius Radius of the circular shape.
   */
  public constructor(speed: number, polarity: Polarity, radius: number) {
    this.speed = speed;
    this.polarity = polarity;
    this.radius = radius;
  }

  /**
   * Current horizontal world coordinate.
   * @returns {number}
   * @public
   */
  public get x(): number {
    return this.motion.x();
  }

  /**
   * Current vertical world coordinate.
   * @returns {number}
   * @public
   */
  public get y(): number {
    return this.motion.y();
  }

  /**
   * Activates or reuses the projectile at a position and travel direction.
   * @public
   * @return {void}
   * @param {number} x Horizontal coordinate in the owning coordinate space.
   * @param {number} y Vertical coordinate in the owning coordinate space.
   * @param {1 | -1} direction The direction supplied to this operation.
   * @param {Polarity} [polarity] The polarity supplied to this operation.
   */
  public start(
    x: number,
    y: number,
    direction: -1 | 1,
    polarity = this.polarity
  ): void {
    this.motion.setPosition(x, y);
    this.motion.setVelocity(0, this.direction * this.speed);
    this.direction = direction;
    this.polarity = polarity;
    this.active = true;
  }

  /**
   * Moves the projectile and deactivates it after it leaves the viewport.
   * @public
   * @return {void}
   * @param {number} deltaSeconds Elapsed simulation time in seconds.
   */
  public update(deltaSeconds: number): void {
    if (!this.active) return;

    this.motion.update(deltaSeconds);

    const height = GameContext.gameDimensionsModel.getHeight();
    if (this.y < -this.radius || this.y > height + this.radius) {
      this.active = false;
    }
  }

  /**
   * Draws the active projectile using its polarity color.
   * @public
   * @return {void}
   */
  public draw(): void {
    if (!this.active) return;

    GameContext.drawCircle(
      this.x,
      this.y,
      this.radius,
      POLARITY_COLORS[this.polarity]
    );
  }

  /**
   * Returns the projectile's current polarity.
   * @public
   * @return {Polarity}
   */
  public getPolarity(): Polarity {
    return this.polarity;
  }
}

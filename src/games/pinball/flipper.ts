import { signalValue } from 'reactive-values';
import { CircleBody, Collision2D, GameContext } from '../../engine';

import type { PinballBounds } from './';

/**
 * Defines the flipper side contract shared by its consumers.
 * @typedef {FlipperSide} FlipperSide
 */
export type FlipperSide = 'left' | 'right';

/**
 * Rotating bat controlled by keyboard or a held touch button.
 * @class PinballFlipper
 */
export default class {
  /**
   * Side configuration or state owned by PinballFlipper.
   * @property {FlipperSide} side
   * @readonly
   * @private
   */
  private readonly side: FlipperSide;
  /**
   * Reactive angle state owned by PinballFlipper.
   * @property {SignalValue<number> & (() => number)} angle
   * @readonly
   * @private
   */
  private readonly angle = signalValue(0);
  /**
   * Reactive pivot x state owned by PinballFlipper.
   * @property {SignalValue<number> & (() => number)} pivotX
   * @readonly
   * @private
   */
  private readonly pivotX = signalValue(0);
  /**
   * Reactive pivot y state owned by PinballFlipper.
   * @property {SignalValue<number> & (() => number)} pivotY
   * @readonly
   * @private
   */
  private readonly pivotY = signalValue(0);
  /**
   * Reactive length state owned by PinballFlipper.
   * @property {SignalValue<number> & (() => number)} length
   * @readonly
   * @private
   */
  private readonly length = signalValue(0);
  /**
   * Reactive thickness state owned by PinballFlipper.
   * @property {SignalValue<number> & (() => number)} thickness
   * @readonly
   * @private
   */
  private readonly thickness = signalValue(0);
  /**
   * Whether this object participates in its owning system.
   * @property {SignalValue<boolean> & (() => boolean)} active
   * @readonly
   * @private
   */
  private readonly active = signalValue(false);
  /**
   * Reactive previous angle state owned by PinballFlipper.
   * @property {SignalValue<number> & (() => number)} previousAngle
   * @readonly
   * @private
   */
  private readonly previousAngle = signalValue(0);
  /**
   * Reactive impact cooldown state owned by PinballFlipper.
   * @property {SignalValue<number> & (() => number)} impactCooldown
   * @readonly
   * @private
   */
  private readonly impactCooldown = signalValue(0);

  /**
   * Initializes PinballFlipper and its owned resources from the supplied arguments.
   * @constructor
   * @param {FlipperSide} side The side supplied to this operation.
   * @returns {void}
   * @public
   */
  public constructor(side: FlipperSide) {
    this.side = side;
  }

  /**
   * Advances PinballFlipper simulation and dependent presentation state for one frame.
   * @param {PinballBounds} bounds Bounds used to position, constrain, or query the object.
   * @param {boolean} pressed The pressed supplied to this operation.
   * @param {number} deltaSeconds Elapsed simulation time in seconds.
   * @returns {void}
   * @public
   */
  public update(bounds: PinballBounds, pressed: boolean, deltaSeconds: number): void {
    this.impactCooldown.set(Math.max(0, this.impactCooldown() - deltaSeconds));
    const isLeft = this.side === 'left';
    const center = bounds.x + bounds.width * 0.5;
    this.pivotX.set(center + (isLeft ? -1 : 1) * bounds.width * 0.26);
    this.pivotY.set(bounds.y + bounds.height * 0.8);
    this.length.set(bounds.width * 0.25);
    this.thickness.set(Math.max(10, bounds.width * 0.027));
    this.active.set(pressed);
    const restAngle = isLeft ? 0.5 : Math.PI - 0.5;
    const activeAngle = isLeft ? -0.05 : Math.PI + 0.05;
    const destination = pressed ? activeAngle : restAngle;
    this.previousAngle.set(this.angle());
    const blend = Math.min(1, deltaSeconds * 18);
    this.angle.set(this.angle() + (destination - this.angle()) * blend);
  }

  /**
   * Applies the collide operation to PinballFlipper.
   * @param {CircleBody} body The body supplied to this operation.
   * @param {boolean} pressed The pressed supplied to this operation.
   * @returns {boolean} Applies the collide operation to PinballFlipper.
   * @public
   */
  public collide(body: CircleBody, pressed: boolean): boolean {
    const endX = this.pivotX() + Math.cos(this.angle()) * this.length();
    const endY = this.pivotY() + Math.sin(this.angle()) * this.length();
    const collided = Collision2D.resolveCircleAgainstSegment(
      body,
      this.pivotX(),
      this.pivotY(),
      endX,
      endY,
      this.thickness(),
      pressed ? 0.92 : 0.78
    );
    if (!collided || !pressed || this.impactCooldown() > 0) return collided;

    const direction = this.side === 'left' ? 1 : -1;
    const swingSpeed = Math.abs(this.angle() - this.previousAngle()) * 900;
    body.addVelocity(direction * Math.min(180, swingSpeed * 0.08), -Math.max(460, Math.min(760, swingSpeed)));
    this.impactCooldown.set(0.14);
    return true;
  }

  /**
   * Renders PinballFlipper using its current geometry and presentation state.
   * @returns {void}
   * @public
   */
  public draw(): void {
    const endX = this.pivotX() + Math.cos(this.angle()) * this.length();
    const endY = this.pivotY() + Math.sin(this.angle()) * this.length();
    const context = GameContext.context;
    context.save();
    context.lineCap = 'round';
    context.lineWidth = this.thickness() + 8;
    context.strokeStyle = '#07172e';
    context.beginPath();
    context.moveTo(this.pivotX(), this.pivotY());
    context.lineTo(endX, endY);
    context.stroke();
    context.lineWidth = this.thickness();
    context.strokeStyle = this.active() ? '#54e4e9' : '#f2b958';
    context.beginPath();
    context.moveTo(this.pivotX(), this.pivotY());
    context.lineTo(endX, endY);
    context.stroke();
    context.lineWidth = Math.max(2, this.thickness() * 0.18);
    context.strokeStyle = 'rgba(255, 255, 255, 0.72)';
    context.beginPath();
    context.moveTo(this.pivotX(), this.pivotY() - this.thickness() * 0.12);
    context.lineTo(endX, endY - this.thickness() * 0.12);
    context.stroke();
    context.restore();
    GameContext.drawCircle(this.pivotX(), this.pivotY(), this.thickness() * 0.65, '#ffe4a1');
  }

}

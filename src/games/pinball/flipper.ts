import { signalValue } from 'reactive-values';
import { CircleBody, RigidBody2D, GameContext, type CollisionRect } from '../../engine';

import type { FlipperSide } from './';

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
   * Swept circle samples forming a rounded, prescribed kinematic bat.
   * @property {SignalValue<readonly RigidBody2D[]>} bodies
   */
  public readonly bodies = signalValue<readonly RigidBody2D[]>([]);
  /**
   * Angular input speed used only to tune the gameplay strike impulse.
   * @property {SignalValue<number>} swingSpeed
   * @private
   */
  private readonly swingSpeed = signalValue(0);
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
    this.angle.set(side === 'left' ? 0.5 : Math.PI - 0.5);
  }

  /**
   * Rebuilds responsive bat samples at their current prescribed angle.
   * @param {CollisionRect} bounds Responsive table rectangle.
   * @returns {void}
   */
  public configure(bounds: CollisionRect): void {
    const isLeft = this.side === 'left';
    this.pivotX.set(bounds.x + bounds.width * (isLeft ? 0.24 : 0.76));
    this.pivotY.set(bounds.y + bounds.height * 0.8);
    this.length.set(bounds.width * 0.25);
    this.thickness.set(Math.max(10, bounds.width * 0.027));
    const count = Math.ceil(this.length() / (this.thickness() * 0.4)) + 1;
    this.bodies.set(Array.from({ length: count }, (_, index) => {
      const distance = this.length() * index / (count - 1);
      return new RigidBody2D({ type: 'kinematic', layer: 8, mask: 1, restitution: 0.78,
        x: this.pivotX() + Math.cos(this.angle()) * distance,
        y: this.pivotY() + Math.sin(this.angle()) * distance,
        shape: { kind: 'circle', radius: this.thickness() / 2 } });
    }));
  }

  /**
   * Prescribes each sample's velocity for the next world step, including bat sweeps.
   * @param {boolean} pressed Whether keyboard or touch input holds this flipper.
   * @param {number} deltaSeconds Fixed physics interval in seconds.
   * @returns {void}
   */
  public update(pressed: boolean, deltaSeconds: number): void {
    this.impactCooldown.set(Math.max(0, this.impactCooldown() - deltaSeconds));
    this.active.set(pressed);
    const rest = this.side === 'left' ? 0.5 : Math.PI - 0.5;
    const raised = this.side === 'left' ? -0.05 : Math.PI + 0.05;
    const previous = this.angle();
    this.angle.set(previous + ((pressed ? raised : rest) - previous) * Math.min(1, deltaSeconds * 18));
    this.swingSpeed.set(deltaSeconds > 0 ? Math.abs(this.angle() - previous) / deltaSeconds : 0);
    this.bodies().forEach((body, index, samples) => {
      const distance = this.length() * index / (samples.length - 1);
      const x = this.pivotX() + Math.cos(this.angle()) * distance;
      const y = this.pivotY() + Math.sin(this.angle()) * distance;
      body.setVelocity(deltaSeconds > 0 ? (x - body.x) / deltaSeconds : 0,
        deltaSeconds > 0 ? (y - body.y) / deltaSeconds : 0);
    });
  }

  /**
   * Adds the powered-flipper gameplay impulse after a world-confirmed upper contact.
   * This method does not detect or resolve collisions.
   * @param {CircleBody} body Ball involved in the committed physics contact.
   * @returns {boolean} Whether a new powered strike was applied.
   */
  public strike(body: CircleBody): boolean {
    if (!this.active() || this.impactCooldown() > 0) return false;
    const speed = this.swingSpeed() * 50;
    body.addVelocity((this.side === 'left' ? 1 : -1) * Math.min(180, speed * 0.08),
      -Math.max(460, Math.min(760, speed)));
    this.impactCooldown.set(0.14);
    return true;
  }

  /**
   * Returns the bat to rest before a new ball or run without retaining input.
   * @returns {void}
   */
  public reset(): void {
    this.active.set(false); this.impactCooldown.set(0); this.swingSpeed.set(0);
    this.angle.set(this.side === 'left' ? 0.5 : Math.PI - 0.5);
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

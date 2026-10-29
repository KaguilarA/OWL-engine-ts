import type { Camera2DOptions } from '../interfaces';
import { signalValue, type SignalValue } from 'reactive-values';
import { GameContext, type Dimensions } from '../core';

/**
 * Applies a world-to-screen transform and converts coordinates between spaces.
 * @class Camera2D
 */
export default class {
  /**
   * Horizontal world look-at coordinate.
   * @property {SignalValue<number>} x
   * @public
   * @readonly
   */
  public readonly x: SignalValue<number> = signalValue(0);

  /**
   * Vertical world look-at coordinate.
   * @property {SignalValue<number>} y
   * @public
   * @readonly
   */
  public readonly y: SignalValue<number> = signalValue(0);

  /**
   * Camera zoom magnification factor.
   * @property {SignalValue<number>} zoom
   * @public
   * @readonly
   */
  public readonly zoom: SignalValue<number> = signalValue(1);

  /**
   * Viewport pixel width.
   * @property {SignalValue<number>} viewportWidth
   * @private
   * @readonly
   */
  private readonly viewportWidth: SignalValue<number> = signalValue(0);

  /**
   * Viewport pixel height.
   * @property {SignalValue<number>} viewportHeight
   * @private
   * @readonly
   */
  private readonly viewportHeight: SignalValue<number> = signalValue(0);

  /**
   * Target dimensions model to follow.
   * @property {SignalValue<Dimensions | undefined>} target
   * @private
   * @readonly
   */
  private readonly target: SignalValue<Dimensions | undefined> = signalValue<Dimensions | undefined>(undefined);

  /**
   * Follow smoothing interpolation factor.
   * @property {SignalValue<number>} smoothing
   * @private
   * @readonly
   */
  private readonly smoothing: SignalValue<number> = signalValue(1);

  /**
   * Whether to auto-center horizontally when viewport resizes.
   * @property {boolean} autoCenterX
   * @private
   * @readonly
   */
  private readonly autoCenterX: boolean;

  /**
   * Whether to auto-center vertically when viewport resizes.
   * @property {boolean} autoCenterY
   * @private
   * @readonly
   */
  private readonly autoCenterY: boolean;

  /**
   * Creates a camera instance with configured viewport and smoothing.
   * @public
   * @return {void}
   * @constructor
   * @param {Camera2DOptions} [options] Configuration controlling construction or behavior.
   */
  public constructor(options: Camera2DOptions = {}) {
    this.autoCenterX = options.x === undefined;
    this.autoCenterY = options.y === undefined;
    this.x.set(options.x ?? GameContext.gameDimensionsModel.getWidth() / 2);
    this.y.set(options.y ?? GameContext.gameDimensionsModel.getHeight() / 2);
    this.zoom.set(options.zoom ?? 1);
    this.viewportWidth.set(options.viewportWidth ?? GameContext.gameDimensionsModel.getWidth());
    this.viewportHeight.set(options.viewportHeight ?? GameContext.gameDimensionsModel.getHeight());
    this.smoothing.set(options.smoothing ?? 1);
    this.validate();
  }

  /**
   * Follows a target dimensions model with smoothing.
   * @public
   * @return {void}
   * @param {default} target The target supplied to this operation.
   * @param {number} [smoothing] The smoothing supplied to this operation.
   */
  public follow(target: Dimensions, smoothing = this.smoothing()): void {
    this.target.set(target);
    this.setSmoothing(smoothing);
  }

  /**
   * Stops following any active target.
   * @public
   * @return {void}
   */
  public stopFollowing(): void {
    this.target.set(undefined);
  }

  /**
   * Configures smoothing interpolation speed.
   * @public
   * @return {void}
   * @param {number} value Value to read, validate, format, or assign.
   */
  public setSmoothing(value: number): void {
    if (!Number.isFinite(value) || value <= 0 || value > 1) {
      throw new RangeError('Camera smoothing must be greater than 0 and at most 1.');
    }
    this.smoothing.set(value);
  }

  /**
   * Updates camera follow position and synchronizes viewport dimensions.
   * @public
   * @return {void}
   * @param {number} deltaSeconds Elapsed simulation time in seconds.
   */
  public update(deltaSeconds: number): void {
    const width = GameContext.gameDimensionsModel.getWidth();
    const height = GameContext.gameDimensionsModel.getHeight();
    if (this.viewportWidth() !== width) {
      this.viewportWidth.set(width);
      if (this.autoCenterX && !this.target()) this.x.set(width / 2);
    }
    if (this.viewportHeight() !== height) {
      this.viewportHeight.set(height);
      if (this.autoCenterY && !this.target()) this.y.set(height / 2);
    }
    const target = this.target();
    if (!target) return;
    const targetX = target.getX();
    const targetY = target.getY();
    const smoothing = this.smoothing();
    const alpha = smoothing >= 1
      ? 1
      : 1 - Math.pow(1 - smoothing, Math.max(0, deltaSeconds) * 60);
    this.x.set(this.x() + (targetX - this.x()) * alpha);
    this.y.set(this.y() + (targetY - this.y()) * alpha);
  }

  /**
   * Converts world coordinates to screen pixel coordinates.
   * @public
   * @return {{ x: number; y: number }}
   * @param {number} x Horizontal coordinate in the owning coordinate space.
   * @param {number} y Vertical coordinate in the owning coordinate space.
   */
  public worldToScreen(x: number, y: number): {
  /**
   * Horizontal coordinate in the owning coordinate space.
   * @property {number} x
   */
  x: number;
  /**
   * Vertical coordinate in the owning coordinate space.
   * @property {number} y
   */
  y: number } {
    return {
      x: (x - this.x()) * this.zoom() + this.viewportWidth() / 2,
      y: (y - this.y()) * this.zoom() + this.viewportHeight() / 2
    };
  }

  /**
   * Converts screen pixel coordinates to world coordinates.
   * @public
   * @return {{ x: number; y: number }}
   * @param {number} x Horizontal coordinate in the owning coordinate space.
   * @param {number} y Vertical coordinate in the owning coordinate space.
   */
  public screenToWorld(x: number, y: number): {
  /**
   * Horizontal coordinate in the owning coordinate space.
   * @property {number} x
   */
  x: number;
  /**
   * Vertical coordinate in the owning coordinate space.
   * @property {number} y
   */
  y: number } {
    return {
      x: (x - this.viewportWidth() / 2) / this.zoom() + this.x(),
      y: (y - this.viewportHeight() / 2) / this.zoom() + this.y()
    };
  }

  /**
   * Executes a render closure under camera matrix transformation with parallax.
   * @public
   * @return {void}
   * @param {() => void} draw The draw supplied to this operation.
   * @param {number} [parallaxX] The parallax x supplied to this operation.
   * @param {number} [parallaxY] The parallax y supplied to this operation.
   */
  public withTransform(draw: () => void, parallaxX = 1, parallaxY = 1): void {
    const context = GameContext.context;
    context.save();
    context.translate(this.viewportWidth() / 2, this.viewportHeight() / 2);
    context.scale(this.zoom(), this.zoom());
    context.translate(-this.x() * parallaxX, -this.y() * parallaxY);
    try {
      draw();
    } finally {
      context.restore();
    }
  }

  /**
   * Validates camera numeric attributes.
   * @private
   * @return {void}
   */
  private validate(): void {
    if (!Number.isFinite(this.x()) || !Number.isFinite(this.y())) {
      throw new RangeError('Camera position must be finite.');
    }
    if (!Number.isFinite(this.zoom()) || this.zoom() <= 0) {
      throw new RangeError('Camera zoom must be greater than zero.');
    }
    if (!Number.isFinite(this.viewportWidth()) || this.viewportWidth() < 0
      || !Number.isFinite(this.viewportHeight()) || this.viewportHeight() < 0) {
      throw new RangeError('Camera viewport dimensions must be finite and non-negative.');
    }
  }
}

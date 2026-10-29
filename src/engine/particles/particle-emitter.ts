import type { ParticleEmitterOptions } from '../interfaces';
import { signalValue, type SignalValue } from 'reactive-values';
import { MathUtils } from '../core';
import type { Camera2D } from '../scene';
import { ParticleSystem, type ParticleShape } from './';

/**
 * Reactive particle emitter driving a contiguous ParticleSystem.
 * @class ParticleEmitter
 */
export default class {
  /**
   * Stores the reactive horizontal origin coordinate.
   * @property {SignalValue<number>} xPos
   * @private
   * @readonly
   */
  private readonly xPos: SignalValue<number>;

  /**
   * Stores the reactive vertical origin coordinate.
   * @property {SignalValue<number>} yPos
   * @private
   * @readonly
   */
  private readonly yPos: SignalValue<number>;

  /**
   * Stores whether the emitter is actively generating particles.
   * @property {SignalValue<boolean>} activeState
   * @private
   * @readonly
   */
  private readonly activeState: SignalValue<boolean>;

  /**
   * Stores the reactive emission rate per second.
   * @property {SignalValue<number>} rateState
   * @private
   * @readonly
   */
  private readonly rateState: SignalValue<number>;

  /**
   * Stores the horizontal spread area.
   * @property {number} areaWidth
   * @public
   */
  public areaWidth: number;

  /**
   * Stores the vertical spread area.
   * @property {number} areaHeight
   * @public
   */
  public areaHeight: number;

  /**
   * Stores the lifetime range configuration.
   * @property {{ min: number; max: number }} lifetime
   * @public
   */
  public lifetime: {
  /**
   * Min configuration or state owned by ParticleEmitter.
   * @property {number} min
   */
  min: number;
  /**
   * Max configuration or state owned by ParticleEmitter.
   * @property {number} max
   */
  max: number };

  /**
   * Stores the velocity speed range.
   * @property {{ min: number; max: number }} speed
   * @public
   */
  public speed: {
  /**
   * Min configuration or state owned by ParticleEmitter.
   * @property {number} min
   */
  min: number;
  /**
   * Max configuration or state owned by ParticleEmitter.
   * @property {number} max
   */
  max: number };

  /**
   * Stores the emission angle range in radians.
   * @property {{ min: number; max: number }} angle
   * @public
   */
  public angle: {
  /**
   * Min configuration or state owned by ParticleEmitter.
   * @property {number} min
   */
  min: number;
  /**
   * Max configuration or state owned by ParticleEmitter.
   * @property {number} max
   */
  max: number };

  /**
   * Stores the gravitational acceleration vector.
   * @property {{ x: number; y: number }} gravity
   * @public
   */
  public gravity: {
  /**
   * Horizontal coordinate in the owning coordinate space.
   * @property {number} x
   */
  x: number;
  /**
   * Vertical coordinate in the owning coordinate space.
   * @property {number} y
   */
  y: number };

  /**
   * Stores initial particle size range.
   * @property {{ min: number; max: number }} startSize
   * @public
   */
  public startSize: {
  /**
   * Min configuration or state owned by ParticleEmitter.
   * @property {number} min
   */
  min: number;
  /**
   * Max configuration or state owned by ParticleEmitter.
   * @property {number} max
   */
  max: number };

  /**
   * Stores final particle size range.
   * @property {{ min: number; max: number }} endSize
   * @public
   */
  public endSize: {
  /**
   * Min configuration or state owned by ParticleEmitter.
   * @property {number} min
   */
  min: number;
  /**
   * Max configuration or state owned by ParticleEmitter.
   * @property {number} max
   */
  max: number };

  /**
   * Stores initial alpha range.
   * @property {{ min: number; max: number }} startAlpha
   * @public
   */
  public startAlpha: {
  /**
   * Min configuration or state owned by ParticleEmitter.
   * @property {number} min
   */
  min: number;
  /**
   * Max configuration or state owned by ParticleEmitter.
   * @property {number} max
   */
  max: number };

  /**
   * Stores final alpha range.
   * @property {{ min: number; max: number }} endAlpha
   * @public
   */
  public endAlpha: {
  /**
   * Min configuration or state owned by ParticleEmitter.
   * @property {number} min
   */
  min: number;
  /**
   * Max configuration or state owned by ParticleEmitter.
   * @property {number} max
   */
  max: number };

  /**
   * Stores base RGB color.
   * @property {{ r: number; g: number; b: number }} color
   * @public
   */
  public color: {
  /**
   * R configuration or state owned by ParticleEmitter.
   * @property {number} r
   */
  r: number;
  /**
   * G configuration or state owned by ParticleEmitter.
   * @property {number} g
   */
  g: number;
  /**
   * B configuration or state owned by ParticleEmitter.
   * @property {number} b
   */
  b: number };

  /**
   * Stores color variance ratio.
   * @property {number} colorVariation
   * @public
   */
  public colorVariation: number;

  /**
   * Stores angular rotation speed range.
   * @property {{ min: number; max: number }} rotationSpeed
   * @public
   */
  public rotationSpeed: {
  /**
   * Min configuration or state owned by ParticleEmitter.
   * @property {number} min
   */
  min: number;
  /**
   * Max configuration or state owned by ParticleEmitter.
   * @property {number} max
   */
  max: number };

  /**
   * Stores particle geometry shape.
   * @property {ParticleShape} shape
   * @public
   */
  public shape: ParticleShape;

  /**
   * Stores the underlying particle simulation engine.
   * @property {ParticleSystem} system
   * @public
   * @readonly
   */
  public readonly system: ParticleSystem;

  /**
   * Accumulator for fractional frame emission steps.
   * @property {number} accumulator
   * @private
   */
  private accumulator = 0;

  /**
   * Returns the horizontal position.
   * @public
   * @return {number}
   */
  public get x(): number {
    return this.xPos();
  }

  /**
   * Sets the horizontal position.
   * @public
   * @return {void}
   * @param {number} value Value to read, validate, format, or assign.
   */
  public set x(value: number) {
    this.xPos.set(value);
  }

  /**
   * Returns the vertical position.
   * @public
   * @return {number}
   */
  public get y(): number {
    return this.yPos();
  }

  /**
   * Sets the vertical position.
   * @public
   * @return {void}
   * @param {number} value Value to read, validate, format, or assign.
   */
  public set y(value: number) {
    this.yPos.set(value);
  }

  /**
   * Returns whether emission is active.
   * @public
   * @return {boolean}
   */
  public get active(): boolean {
    return this.activeState();
  }

  /**
   * Sets whether emission is active.
   * @public
   * @return {void}
   * @param {boolean} value Value to read, validate, format, or assign.
   */
  public set active(value: boolean) {
    this.activeState.set(value);
  }

  /**
   * Returns the emission rate per second.
   * @public
   * @return {number}
   */
  public get rate(): number {
    return this.rateState();
  }

  /**
   * Sets the emission rate per second.
   * @public
   * @return {void}
   * @param {number} value Value to read, validate, format, or assign.
   */
  public set rate(value: number) {
    this.rateState.set(value);
  }

  /**
   * Creates a reactive particle emitter.
   * @public
   * @return {void}
   * @constructor
   * @param {number} [x] Horizontal coordinate in the owning coordinate space.
   * @param {number} [y] Vertical coordinate in the owning coordinate space.
   * @param {ParticleEmitterOptions} [options] Configuration controlling construction or behavior.
   */
  public constructor(x = 0, y = 0, options: ParticleEmitterOptions = {}) {
    this.xPos = signalValue(x);
    this.yPos = signalValue(y);
    this.activeState = signalValue(options.active ?? true);
    this.rateState = signalValue(options.rate ?? 50);
    this.areaWidth = options.areaWidth ?? 0;
    this.areaHeight = options.areaHeight ?? 0;

    this.lifetime = options.lifetime ?? { min: 0.5, max: 1.2 };
    this.speed = options.speed ?? { min: 60, max: 180 };
    this.angle = options.angle ?? { min: 0, max: Math.PI * 2 };
    this.gravity = options.gravity ?? { x: 0, y: 0 };
    this.startSize = options.startSize ?? { min: 8, max: 16 };
    this.endSize = options.endSize ?? { min: 0, max: 4 };
    this.startAlpha = options.startAlpha ?? { min: 1, max: 1 };
    this.endAlpha = options.endAlpha ?? { min: 0, max: 0 };
    this.color = options.color ?? { r: 255, g: 200, b: 50 };
    this.colorVariation = options.colorVariation ?? 0.1;
    this.rotationSpeed = options.rotationSpeed ?? { min: -2, max: 2 };
    this.shape = options.shape ?? 'circle';

    this.system = options.system ?? new ParticleSystem(options.maxParticles ?? 800);
    if (options.blendMode) this.system.blendMode = options.blendMode;
    if (options.texture) this.system.texture = options.texture;
  }

  /**
   * Spawns an immediate burst of particles at origin coordinates.
   * @public
   * @return {void}
   * @param {number} count The count supplied to this operation.
   * @param {number} [originX] The origin x supplied to this operation.
   * @param {number} [originY] The origin y supplied to this operation.
   */
  public burst(count: number, originX = this.x, originY = this.y): void {
    for (let index = 0; index < count; index++) {
      this.emitOne(originX, originY);
    }
  }

  /**
   * Advances emitter emission and particle updates.
   * @public
   * @return {void}
   * @param {number} deltaSeconds Elapsed simulation time in seconds.
   */
  public update(deltaSeconds: number): void {
    if (this.activeState() && this.rateState() > 0) {
      this.accumulator += this.rateState() * deltaSeconds;
      while (this.accumulator >= 1) {
        this.emitOne(this.xPos(), this.yPos());
        this.accumulator -= 1;
      }
    }
    this.system.update(deltaSeconds);
  }

  /**
   * Draws active particles to the graphics context.
   * @public
   * @return {void}
   * @param {CanvasRenderingContext2D | undefined} [context] The context supplied to this operation.
   * @param {Camera2D | undefined} [camera] The camera supplied to this operation.
   */
  public draw(context?: CanvasRenderingContext2D, camera?: Camera2D): void {
    this.system.draw(context, camera);
  }

  /**
   * Clears particles and resets accumulation.
   * @public
   * @return {void}
   */
  public clear(): void {
    this.system.clear();
    this.accumulator = 0;
  }

  /**
   * Emits a single particle into the system.
   * @private
   * @return {void}
   * @param {number} baseX The base x supplied to this operation.
   * @param {number} baseY The base y supplied to this operation.
   */
  private emitOne(baseX: number, baseY: number): void {
    const spawnX = baseX + (this.areaWidth > 0 ? (Math.random() - 0.5) * this.areaWidth : 0);
    const spawnY = baseY + (this.areaHeight > 0 ? (Math.random() - 0.5) * this.areaHeight : 0);

    const ang = MathUtils.randomFloat(this.angle.min, this.angle.max);
    const spd = MathUtils.randomFloat(this.speed.min, this.speed.max);
    const vx = Math.cos(ang) * spd;
    const vy = Math.sin(ang) * spd;

    const life = MathUtils.randomFloat(this.lifetime.min, this.lifetime.max);
    const sSize = MathUtils.randomFloat(this.startSize.min, this.startSize.max);
    const eSize = MathUtils.randomFloat(this.endSize.min, this.endSize.max);
    const sAlpha = MathUtils.randomFloat(this.startAlpha.min, this.startAlpha.max);
    const eAlpha = MathUtils.randomFloat(this.endAlpha.min, this.endAlpha.max);

    const variation = (Math.random() - 0.5) * this.colorVariation;
    const r = Math.max(0, Math.min(255, Math.floor(this.color.r * (1 + variation))));
    const g = Math.max(0, Math.min(255, Math.floor(this.color.g * (1 + variation))));
    const b = Math.max(0, Math.min(255, Math.floor(this.color.b * (1 + variation))));

    const rot = Math.random() * Math.PI * 2;
    const rotSpeed = MathUtils.randomFloat(this.rotationSpeed.min, this.rotationSpeed.max);

    this.system.spawn(
      spawnX,
      spawnY,
      vx,
      vy,
      this.gravity.x,
      this.gravity.y,
      life,
      sSize,
      eSize,
      sAlpha,
      eAlpha,
      r,
      g,
      b,
      rot,
      rotSpeed,
      this.shape
    );
  }
}

import type { ParticleSystem, ParticleShape } from '../particles';

/**
 * Defines the particle emitter options contract shared by its consumers.
 * @interface ParticleEmitterOptions
 */
export interface ParticleEmitterOptions {
  /**
   * Particle system receiving emitted particles; a system is created when omitted.
   * @property {ParticleSystem | undefined} system
   */
  system?: ParticleSystem;
  /**
   * Maximum particle capacity used when constructing the emitter-owned system.
   * @property {number | undefined} maxParticles
   */
  maxParticles?: number;
  /**
   * Continuous emission rate in particles per second.
   * @property {number | undefined} rate
   */
  rate?: number;
  /**
   * Whether this object participates in its owning system.
   * @property {boolean | undefined} active
   */
  active?: boolean;
  /**
   * Range of initial particle lifetimes in seconds.
   * @property {{ min: number; max: number; } | undefined} lifetime
   */
  lifetime?: {
  /**
   * Lower bound of this sampled range.
   * @property {number} min
   */
  min: number;
  /**
   * Upper bound of this sampled range.
   * @property {number} max
   */
  max: number };
  /**
   * Range of initial particle speed magnitudes.
   * @property {{ min: number; max: number; } | undefined} speed
   */
  speed?: {
  /**
   * Lower bound of this sampled range.
   * @property {number} min
   */
  min: number;
  /**
   * Upper bound of this sampled range.
   * @property {number} max
   */
  max: number };
  /**
   * Range of initial emission directions in radians.
   * @property {{ min: number; max: number; } | undefined} angle
   */
  angle?: {
  /**
   * Lower bound of this sampled range.
   * @property {number} min
   */
  min: number;
  /**
   * Upper bound of this sampled range.
   * @property {number} max
   */
  max: number };
  /**
   * Acceleration applied to emitted particles along each axis.
   * @property {{ x: number; y: number; } | undefined} gravity
   */
  gravity?: {
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
   * Range of particle sizes sampled at birth.
   * @property {{ min: number; max: number; } | undefined} startSize
   */
  startSize?: {
  /**
   * Lower bound of this sampled range.
   * @property {number} min
   */
  min: number;
  /**
   * Upper bound of this sampled range.
   * @property {number} max
   */
  max: number };
  /**
   * Range of particle sizes approached at the end of their lifetimes.
   * @property {{ min: number; max: number; } | undefined} endSize
   */
  endSize?: {
  /**
   * Lower bound of this sampled range.
   * @property {number} min
   */
  min: number;
  /**
   * Upper bound of this sampled range.
   * @property {number} max
   */
  max: number };
  /**
   * Range of opacity values sampled at particle birth.
   * @property {{ min: number; max: number; } | undefined} startAlpha
   */
  startAlpha?: {
  /**
   * Lower bound of this sampled range.
   * @property {number} min
   */
  min: number;
  /**
   * Upper bound of this sampled range.
   * @property {number} max
   */
  max: number };
  /**
   * Range of opacity values approached at the end of particle lifetimes.
   * @property {{ min: number; max: number; } | undefined} endAlpha
   */
  endAlpha?: {
  /**
   * Lower bound of this sampled range.
   * @property {number} min
   */
  min: number;
  /**
   * Upper bound of this sampled range.
   * @property {number} max
   */
  max: number };
  /**
   * Base RGB color used for emitted particles.
   * @property {{ r: number; g: number; b: number; } | undefined} color
   */
  color?: {
  /**
   * Red channel of the base particle color.
   * @property {number} r
   */
  r: number;
  /**
   * Green channel of the base particle color.
   * @property {number} g
   */
  g: number;
  /**
   * Blue channel of the base particle color.
   * @property {number} b
   */
  b: number };
  /**
   * Amount of random variation applied to the base particle color.
   * @property {number | undefined} colorVariation
   */
  colorVariation?: number;
  /**
   * Range of angular velocities sampled for emitted particles.
   * @property {{ min: number; max: number; } | undefined} rotationSpeed
   */
  rotationSpeed?: {
  /**
   * Lower bound of this sampled range.
   * @property {number} min
   */
  min: number;
  /**
   * Upper bound of this sampled range.
   * @property {number} max
   */
  max: number };
  /**
   * Primitive shape used to render particles without a texture.
   * @property {ParticleShape | undefined} shape
   */
  shape?: ParticleShape;
  /**
   * Optional image used to render particles instead of a primitive shape.
   * @property {HTMLImageElement | undefined} texture
   */
  texture?: HTMLImageElement;
  /**
   * Canvas compositing operation used when drawing particles.
   * @property {GlobalCompositeOperation | undefined} blendMode
   */
  blendMode?: GlobalCompositeOperation;
  /**
   * Horizontal extent of the area from which particles are emitted.
   * @property {number | undefined} areaWidth
   */
  areaWidth?: number;
  /**
   * Vertical extent of the area from which particles are emitted.
   * @property {number | undefined} areaHeight
   */
  areaHeight?: number;
}

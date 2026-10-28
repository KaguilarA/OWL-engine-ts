import type { ParticleSystem, ParticleShape } from '../particles';

/**
 * Defines the particle emitter options contract shared by its consumers.
 * @interface ParticleEmitterOptions
 */
export interface ParticleEmitterOptions {
  /**
   * System configuration or state owned by ParticleEmitterOptions.
   * @property {ParticleSystem | undefined} system
   */
  system?: ParticleSystem;
  /**
   * Max particles configuration or state owned by ParticleEmitterOptions.
   * @property {number | undefined} maxParticles
   */
  maxParticles?: number;
  /**
   * Rate configuration or state owned by ParticleEmitterOptions.
   * @property {number | undefined} rate
   */
  rate?: number;
  /**
   * Whether this object participates in its owning system.
   * @property {boolean | undefined} active
   */
  active?: boolean;
  /**
   * Lifetime configuration or state owned by ParticleEmitterOptions.
   * @property {{ min: number; max: number; } | undefined} lifetime
   */
  lifetime?: { 
  /**
   * Min configuration or state owned by ParticleEmitterOptions.
   * @property {number} min
   */
  min: number; 
  /**
   * Max configuration or state owned by ParticleEmitterOptions.
   * @property {number} max
   */
  max: number };
  /**
   * Speed configuration or state owned by ParticleEmitterOptions.
   * @property {{ min: number; max: number; } | undefined} speed
   */
  speed?: { 
  /**
   * Min configuration or state owned by ParticleEmitterOptions.
   * @property {number} min
   */
  min: number; 
  /**
   * Max configuration or state owned by ParticleEmitterOptions.
   * @property {number} max
   */
  max: number };
  /**
   * Angle configuration or state owned by ParticleEmitterOptions.
   * @property {{ min: number; max: number; } | undefined} angle
   */
  angle?: { 
  /**
   * Min configuration or state owned by ParticleEmitterOptions.
   * @property {number} min
   */
  min: number; 
  /**
   * Max configuration or state owned by ParticleEmitterOptions.
   * @property {number} max
   */
  max: number };
  /**
   * Gravity configuration or state owned by ParticleEmitterOptions.
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
   * Start size configuration or state owned by ParticleEmitterOptions.
   * @property {{ min: number; max: number; } | undefined} startSize
   */
  startSize?: { 
  /**
   * Min configuration or state owned by ParticleEmitterOptions.
   * @property {number} min
   */
  min: number; 
  /**
   * Max configuration or state owned by ParticleEmitterOptions.
   * @property {number} max
   */
  max: number };
  /**
   * End size configuration or state owned by ParticleEmitterOptions.
   * @property {{ min: number; max: number; } | undefined} endSize
   */
  endSize?: { 
  /**
   * Min configuration or state owned by ParticleEmitterOptions.
   * @property {number} min
   */
  min: number; 
  /**
   * Max configuration or state owned by ParticleEmitterOptions.
   * @property {number} max
   */
  max: number };
  /**
   * Start alpha configuration or state owned by ParticleEmitterOptions.
   * @property {{ min: number; max: number; } | undefined} startAlpha
   */
  startAlpha?: { 
  /**
   * Min configuration or state owned by ParticleEmitterOptions.
   * @property {number} min
   */
  min: number; 
  /**
   * Max configuration or state owned by ParticleEmitterOptions.
   * @property {number} max
   */
  max: number };
  /**
   * End alpha configuration or state owned by ParticleEmitterOptions.
   * @property {{ min: number; max: number; } | undefined} endAlpha
   */
  endAlpha?: { 
  /**
   * Min configuration or state owned by ParticleEmitterOptions.
   * @property {number} min
   */
  min: number; 
  /**
   * Max configuration or state owned by ParticleEmitterOptions.
   * @property {number} max
   */
  max: number };
  /**
   * Color applied when rendering this content.
   * @property {{ r: number; g: number; b: number; } | undefined} color
   */
  color?: { 
  /**
   * R configuration or state owned by ParticleEmitterOptions.
   * @property {number} r
   */
  r: number; 
  /**
   * G configuration or state owned by ParticleEmitterOptions.
   * @property {number} g
   */
  g: number; 
  /**
   * B configuration or state owned by ParticleEmitterOptions.
   * @property {number} b
   */
  b: number };
  /**
   * Color variation configuration or state owned by ParticleEmitterOptions.
   * @property {number | undefined} colorVariation
   */
  colorVariation?: number;
  /**
   * Rotation speed configuration or state owned by ParticleEmitterOptions.
   * @property {{ min: number; max: number; } | undefined} rotationSpeed
   */
  rotationSpeed?: { 
  /**
   * Min configuration or state owned by ParticleEmitterOptions.
   * @property {number} min
   */
  min: number; 
  /**
   * Max configuration or state owned by ParticleEmitterOptions.
   * @property {number} max
   */
  max: number };
  /**
   * Shape configuration or state owned by ParticleEmitterOptions.
   * @property {ParticleShape | undefined} shape
   */
  shape?: ParticleShape;
  /**
   * Texture configuration or state owned by ParticleEmitterOptions.
   * @property {HTMLImageElement | undefined} texture
   */
  texture?: HTMLImageElement;
  /**
   * Blend mode configuration or state owned by ParticleEmitterOptions.
   * @property {GlobalCompositeOperation | undefined} blendMode
   */
  blendMode?: GlobalCompositeOperation;
  /**
   * Area width configuration or state owned by ParticleEmitterOptions.
   * @property {number | undefined} areaWidth
   */
  areaWidth?: number;
  /**
   * Area height configuration or state owned by ParticleEmitterOptions.
   * @property {number | undefined} areaHeight
   */
  areaHeight?: number;
}

import type { ParticleSystem } from '../particles';

/**
 * Defines the preset options contract shared by its consumers.
 * @interface PresetOptions
 */
export interface PresetOptions {
  /**
   * Horizontal coordinate in the owning coordinate space.
   * @property {number | undefined} x
   */
  x?: number;
  /**
   * Vertical coordinate in the owning coordinate space.
   * @property {number | undefined} y
   */
  y?: number;
  /**
   * Particle system receiving emitted particles; a system is created when omitted.
   * @property {ParticleSystem | undefined} system
   */
  system?: ParticleSystem;
  /**
   * Optional image used to render particles instead of a primitive shape.
   * @property {HTMLImageElement | undefined} texture
   */
  texture?: HTMLImageElement;
}

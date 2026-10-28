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
   * System configuration or state owned by PresetOptions.
   * @property {ParticleSystem | undefined} system
   */
  system?: ParticleSystem;
  /**
   * Texture configuration or state owned by PresetOptions.
   * @property {HTMLImageElement | undefined} texture
   */
  texture?: HTMLImageElement;
}

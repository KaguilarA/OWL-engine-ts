import type { AtlasRegion } from './';

/**
 * Defines the parsed atlas region contract shared by its consumers.
 * @interface ParsedAtlasRegion
 */
export interface ParsedAtlasRegion extends AtlasRegion {
  /**
   * Animation playback rate in frames per second.
   * @property {number} frameRate
   */
  frameRate: number;
  /**
   * Whether playback repeats after reaching the final frame.
   * @property {boolean} loop
   */
  loop: boolean;
}

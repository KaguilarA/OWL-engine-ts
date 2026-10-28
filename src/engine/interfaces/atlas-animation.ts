import type { AtlasRegion } from './';

/**
 * Defines the atlas animation contract shared by its consumers.
 * @interface AtlasAnimation
 */
export interface AtlasAnimation {
  /**
   * Name used to identify or look up this resource.
   * @property {string} name
   */
  name: string;
  /**
   * Ordered frame regions used by the animation.
   * @property {AtlasRegion[]} frames
   */
  frames: AtlasRegion[];
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

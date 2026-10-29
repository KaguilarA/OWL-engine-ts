import type { Atlas } from '../assets';
import type { SpineRecord } from './';

/**
 * Defines the loaded spine asset contract shared by its consumers.
 * @interface LoadedSpineAsset
 */
export interface LoadedSpineAsset {
  /**
   * Texture atlas supplying the skeletal asset regions and page image.
   * @property {Atlas} atlas
   * @readonly
   */
  readonly atlas: Atlas;
  /**
   * Parsed Spine skeleton and animation data paired with the atlas.
   * @property {SpineRecord} data
   * @readonly
   */
  readonly data: SpineRecord;
}

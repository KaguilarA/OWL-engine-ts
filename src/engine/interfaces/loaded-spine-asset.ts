import type { Atlas } from '../assets';
import type { SpineRecord } from './';

/**
 * Defines the loaded spine asset contract shared by its consumers.
 * @interface LoadedSpineAsset
 */
export interface LoadedSpineAsset {
  /**
   * Atlas configuration or state owned by LoadedSpineAsset.
   * @property {Atlas} atlas
   * @readonly
   */
  readonly atlas: Atlas;
  /**
   * Snapshot payload persisted by the save service.
   * @property {SpineRecord} data
   * @readonly
   */
  readonly data: SpineRecord;
}

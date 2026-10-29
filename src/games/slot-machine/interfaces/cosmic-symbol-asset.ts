import type { AtlasAnimation } from '../../../engine/interfaces';

/**
 * Defines the cosmic symbol asset contract shared by its consumers.
 * @interface CosmicSymbolAsset
 */
export interface CosmicSymbolAsset {
  /**
   * Image source used to render the associated content.
   * @property {HTMLImageElement} image
   */
  image: HTMLImageElement;
  /**
   * Idle animation configuration or state owned by CosmicSymbolAsset.
   * @property {AtlasAnimation} idleAnimation
   */
  idleAnimation: AtlasAnimation;
}

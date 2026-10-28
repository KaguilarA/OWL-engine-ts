import type { Sprite } from '../animations/sprites';
import type { SpineSprite } from '../animations/spine';

/**
 * Defines the texture visual contract shared by its consumers.
 * @typedef {TextureVisual} TextureVisual
 */
export type TextureVisual = CanvasImageSource | Sprite | SpineSprite;
/**
 * Defines the texture state name contract shared by its consumers.
 * @typedef {TextureStateName} TextureStateName
 */
export type TextureStateName = 'idle' | 'blocked' | 'disabled' | 'hover';

/**
 * Defines the texture states contract shared by its consumers.
 * @interface TextureStates
 */
export interface TextureStates {
  /**
   * Idle configuration or state owned by TextureStates.
   * @property {TextureVisual | undefined} idle
   */
  idle?: TextureVisual;
  /**
   * Blocked configuration or state owned by TextureStates.
   * @property {TextureVisual | undefined} blocked
   */
  blocked?: TextureVisual;
  /**
   * Disabled configuration or state owned by TextureStates.
   * @property {TextureVisual | undefined} disabled
   */
  disabled?: TextureVisual;
  /**
   * Hover configuration or state owned by TextureStates.
   * @property {TextureVisual | undefined} hover
   */
  hover?: TextureVisual;
}

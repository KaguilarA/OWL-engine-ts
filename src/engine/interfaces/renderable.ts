import type { Dimensions } from '../core';

/**
 * A drawable engine object that may also advance its own animation state.
 * @interface Renderable
 */
export interface Renderable {
  /**
   * Optional reactive bounds used by layout and scrollable containers.
   * @property {default | undefined} dimensions
   */
  dimensions?: Dimensions;
  /**
   * Renders Renderable using its current geometry and presentation state.
   * @returns {void}
   */
  draw(): void;
  /**
   * Advances Renderable simulation and dependent presentation state for one frame.
   * @param {number} deltaSeconds Elapsed simulation time in seconds.
   * @returns {void}
   */
  update?(deltaSeconds: number): void;
}

/**
 * A scene drawable; updates are registered separately to avoid coupling layers to game-specific update signatures.
 * @typedef {SceneDrawable} SceneDrawable
 */
export type SceneDrawable = Pick<Renderable, 'dimensions' | 'draw'>;

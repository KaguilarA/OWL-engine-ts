import type { GameControlCircle } from './';

/**
 * Defines the game controls layout contract shared by its consumers.
 * @interface GameControlsLayout
 */
export interface GameControlsLayout {
  /**
   * Fullscreen button configuration or state owned by GameControlsLayout.
   * @property {GameControlCircle} fullscreenButton
   */
  fullscreenButton: GameControlCircle;
  /**
   * Pause button configuration or state owned by GameControlsLayout.
   * @property {GameControlCircle} pauseButton
   */
  pauseButton: GameControlCircle;
  /**
   * Reset button configuration or state owned by GameControlsLayout.
   * @property {GameControlCircle} resetButton
   */
  resetButton: GameControlCircle;
  /**
   * Menu button configuration or state owned by GameControlsLayout.
   * @property {GameControlCircle} menuButton
   */
  menuButton: GameControlCircle;
}

/**
 * Defines the game controls options contract shared by its consumers.
 * @interface GameControlsOptions
 */
export interface GameControlsOptions {
  /**
   * Show reset button configuration or state owned by GameControlsOptions.
   * @property {boolean | undefined} showResetButton
   */
  showResetButton?: boolean;
  /**
   * Menu alignment configuration or state owned by GameControlsOptions.
   * @property {"left" | "right" | undefined} menuAlignment
   */
  menuAlignment?: 'left' | 'right';
}

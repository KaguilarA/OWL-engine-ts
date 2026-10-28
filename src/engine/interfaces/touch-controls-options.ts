/**
 * Visibility configuration for scene-scoped touch controls.
 * @interface TouchControlsOptions
 */
export interface TouchControlsOptions {
  /**
   * Show vertical controls configuration or state owned by TouchControlsOptions.
   * @property {boolean | undefined} showVerticalControls
   */
  showVerticalControls?: boolean;
  /**
   * Semantic action assigned to the main button (attack by default).
   * @property {string | undefined} primaryAction
   */
  primaryAction?: string;
}

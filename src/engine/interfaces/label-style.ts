/**
 * Defines the label style contract shared by its consumers.
 * @interface LabelStyle
 */
export interface LabelStyle {
  /**
   * Font size used to render the label.
   * @property {number} fontSize
   */
  fontSize: number;
  /**
   * Font family configuration or state owned by LabelStyle.
   * @property {string} fontFamily
   */
  fontFamily: string;
  /**
   * Color applied when rendering this content.
   * @property {string} color
   */
  color: string;
  /**
   * Align configuration or state owned by LabelStyle.
   * @property {CanvasTextAlign} align
   */
  align: CanvasTextAlign;
  /**
   * Baseline configuration or state owned by LabelStyle.
   * @property {CanvasTextBaseline} baseline
   */
  baseline: CanvasTextBaseline;
}

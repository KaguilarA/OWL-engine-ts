/**
 * Defines the label options contract shared by its consumers.
 * @interface LabelOptions
 */
export interface LabelOptions {
  /**
   * Horizontal coordinate in the owning coordinate space.
   * @property {number | undefined} x
   */
  x?: number;
  /**
   * Vertical coordinate in the owning coordinate space.
   * @property {number | undefined} y
   */
  y?: number;
  /**
   * Width of the represented area.
   * @property {number | undefined} width
   */
  width?: number;
  /**
   * Height of the represented area.
   * @property {number | undefined} height
   */
  height?: number;
  /**
   * Pivot x configuration or state owned by LabelOptions.
   * @property {number | undefined} pivotX
   */
  pivotX?: number;
  /**
   * Pivot y configuration or state owned by LabelOptions.
   * @property {number | undefined} pivotY
   */
  pivotY?: number;
  /**
   * Font size used to render the label.
   * @property {number | undefined} fontSize
   */
  fontSize?: number;
  /**
   * Font family configuration or state owned by LabelOptions.
   * @property {string | undefined} fontFamily
   */
  fontFamily?: string;
  /**
   * Color applied when rendering this content.
   * @property {string | undefined} color
   */
  color?: string;
  /**
   * Align configuration or state owned by LabelOptions.
   * @property {CanvasTextAlign | undefined} align
   */
  align?: CanvasTextAlign;
  /**
   * Baseline configuration or state owned by LabelOptions.
   * @property {CanvasTextBaseline | undefined} baseline
   */
  baseline?: CanvasTextBaseline;
  /**
   * Resize to text configuration or state owned by LabelOptions.
   * @property {boolean | undefined} resizeToText
   */
  resizeToText?: boolean;
}

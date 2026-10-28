/**
 * Cached text and layout properties used to avoid redundant label updates.
 * @typedef {object} LabelRenderState
 */
type LabelRenderState = {
  /**
   * Text to parse, display, or assign.
   * @property {string} text
   */
  text: string;
  /**
   * Font size used to render the label.
   * @property {number} fontSize
   */
  fontSize: number;
  /**
   * Fitted font size configuration or state owned by LabelRenderState.
   * @property {number} fittedFontSize
   */
  fittedFontSize: number;
  /**
   * Width of the represented area.
   * @property {number} width
   */
  width: number;
  /**
   * Color applied when rendering this content.
   * @property {string} color
   */
  color: string;
  /**
   * Align configuration or state owned by LabelRenderState.
   * @property {CanvasTextAlign} align
   */
  align: CanvasTextAlign;
  /**
   * Horizontal coordinate in the owning coordinate space.
   * @property {number} x
   */
  x: number;
  /**
   * Vertical coordinate in the owning coordinate space.
   * @property {number} y
   */
  y: number;
};

export type { LabelRenderState as default };

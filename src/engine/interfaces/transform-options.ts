/**
 * Defines the transform options contract shared by its consumers.
 * @interface TransformOptions
 */
export interface TransformOptions {
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
   * Horizontal scale multiplier applied to the entity transform.
   * @property {number | undefined} scaleX
   */
  scaleX?: number;
  /**
   * Vertical scale multiplier applied to the entity transform.
   * @property {number | undefined} scaleY
   */
  scaleY?: number;
  /**
   * Horizontal pivot used to anchor the transform.
   * @property {number | undefined} pivotX
   */
  pivotX?: number;
  /**
   * Vertical pivot used to anchor the transform.
   * @property {number | undefined} pivotY
   */
  pivotY?: number;
}

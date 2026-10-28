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
   * Scale x configuration or state owned by TransformOptions.
   * @property {number | undefined} scaleX
   */
  scaleX?: number;
  /**
   * Scale y configuration or state owned by TransformOptions.
   * @property {number | undefined} scaleY
   */
  scaleY?: number;
  /**
   * Pivot x configuration or state owned by TransformOptions.
   * @property {number | undefined} pivotX
   */
  pivotX?: number;
  /**
   * Pivot y configuration or state owned by TransformOptions.
   * @property {number | undefined} pivotY
   */
  pivotY?: number;
}

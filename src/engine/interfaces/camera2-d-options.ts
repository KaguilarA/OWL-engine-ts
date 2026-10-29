/**
 * Defines the camera2 doptions contract shared by its consumers.
 * @interface Camera2DOptions
 */
export interface Camera2DOptions {
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
   * Initial camera zoom factor.
   * @property {number | undefined} zoom
   */
  zoom?: number;
  /**
   * Width of the viewport used by camera coordinate transforms.
   * @property {number | undefined} viewportWidth
   */
  viewportWidth?: number;
  /**
   * Height of the viewport used by camera coordinate transforms.
   * @property {number | undefined} viewportHeight
   */
  viewportHeight?: number;
  /**
   * Smoothing coefficient used when following a camera target.
   * @property {number | undefined} smoothing
   */
  smoothing?: number;
}

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
   * Zoom configuration or state owned by Camera2DOptions.
   * @property {number | undefined} zoom
   */
  zoom?: number;
  /**
   * Viewport width configuration or state owned by Camera2DOptions.
   * @property {number | undefined} viewportWidth
   */
  viewportWidth?: number;
  /**
   * Viewport height configuration or state owned by Camera2DOptions.
   * @property {number | undefined} viewportHeight
   */
  viewportHeight?: number;
  /**
   * Smoothing configuration or state owned by Camera2DOptions.
   * @property {number | undefined} smoothing
   */
  smoothing?: number;
}

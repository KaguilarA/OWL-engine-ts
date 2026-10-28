/**
 * Defines the container options contract shared by its consumers.
 * @interface ContainerOptions
 */
export interface ContainerOptions {
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
   * Scale x configuration or state owned by ContainerOptions.
   * @property {number | undefined} scaleX
   */
  scaleX?: number;
  /**
   * Scale y configuration or state owned by ContainerOptions.
   * @property {number | undefined} scaleY
   */
  scaleY?: number;
  /**
   * Pivot x configuration or state owned by ContainerOptions.
   * @property {number | undefined} pivotX
   */
  pivotX?: number;
  /**
   * Pivot y configuration or state owned by ContainerOptions.
   * @property {number | undefined} pivotY
   */
  pivotY?: number;
  /**
   * Opacity applied when rendering the object.
   * @property {number | undefined} opacity
   */
  opacity?: number;
  /**
   * Clip children configuration or state owned by ContainerOptions.
   * @property {boolean | undefined} clipChildren
   */
  clipChildren?: boolean;
  /**
   * Scrollable configuration or state owned by ContainerOptions.
   * @property {boolean | undefined} scrollable
   */
  scrollable?: boolean;
  /**
   * Vertical scroll offset of the container contents.
   * @property {number | undefined} scrollY
   */
  scrollY?: number;
  /**
   * Wheel sensitivity configuration or state owned by ContainerOptions.
   * @property {number | undefined} wheelSensitivity
   */
  wheelSensitivity?: number;
}

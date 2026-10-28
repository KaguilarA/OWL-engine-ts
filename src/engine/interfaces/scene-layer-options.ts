/**
 * Defines the scene layer options contract shared by its consumers.
 * @interface SceneLayerOptions
 */
export interface SceneLayerOptions {
  /**
   * Name used to identify or look up this resource.
   * @property {string | undefined} name
   */
  name?: string;
  /**
   * Order configuration or state owned by SceneLayerOptions.
   * @property {number | undefined} order
   */
  order?: number;
  /**
   * Parallax x configuration or state owned by SceneLayerOptions.
   * @property {number | undefined} parallaxX
   */
  parallaxX?: number;
  /**
   * Parallax y configuration or state owned by SceneLayerOptions.
   * @property {number | undefined} parallaxY
   */
  parallaxY?: number;
  /**
   * Visible configuration or state owned by SceneLayerOptions.
   * @property {boolean | undefined} visible
   */
  visible?: boolean;
  /**
   * Update objects configuration or state owned by SceneLayerOptions.
   * @property {boolean | undefined} updateObjects
   */
  updateObjects?: boolean;
}

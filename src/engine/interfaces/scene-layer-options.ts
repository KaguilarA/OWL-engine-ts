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
   * Layer sorting priority within its world scene.
   * @property {number | undefined} order
   */
  order?: number;
  /**
   * Horizontal camera movement multiplier for this layer.
   * @property {number | undefined} parallaxX
   */
  parallaxX?: number;
  /**
   * Vertical camera movement multiplier for this layer.
   * @property {number | undefined} parallaxY
   */
  parallaxY?: number;
  /**
   * Whether this layer participates in rendering.
   * @property {boolean | undefined} visible
   */
  visible?: boolean;
  /**
   * Whether this layer advances the objects it contains.
   * @property {boolean | undefined} updateObjects
   */
  updateObjects?: boolean;
}

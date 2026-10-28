/**
 * Defines the atlas region contract shared by its consumers.
 * @interface AtlasRegion
 */
export interface AtlasRegion {
  /**
   * Name used to identify or look up this resource.
   * @property {string} name
   */
  name: string;
  /**
   * Index identifying the item within its collection.
   * @property {number} index
   */
  index: number;
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
  /**
   * Width of the represented area.
   * @property {number} width
   */
  width: number;
  /**
   * Height of the represented area.
   * @property {number} height
   */
  height: number;
  /**
   * Whether the region is stored rotated in the texture page.
   * @property {boolean | undefined} rotated
   */
  rotated?: boolean;
  /**
   * Horizontal offset of the trimmed region within its original image.
   * @property {number | undefined} offsetX
   */
  offsetX?: number;
  /**
   * Vertical offset of the trimmed region within its original image.
   * @property {number | undefined} offsetY
   */
  offsetY?: number;
  /**
   * Width of the untrimmed source region.
   * @property {number | undefined} originalWidth
   */
  originalWidth?: number;
  /**
   * Height of the untrimmed source region.
   * @property {number | undefined} originalHeight
   */
  originalHeight?: number;
}

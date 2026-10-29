import type { TransformOptions } from './';

/**
 * Defines the entity options contract shared by its consumers.
 * @interface EntityOptions
 */
export interface EntityOptions extends TransformOptions {
  /**
   * Name used to identify or look up this resource.
   * @property {string | undefined} name
   */
  name?: string;
  /**
   * Draw-order value used to sort this entity relative to its peers.
   * @property {number | undefined} zIndex
   */
  zIndex?: number;
}

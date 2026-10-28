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
   * Z index configuration or state owned by EntityOptions.
   * @property {number | undefined} zIndex
   */
  zIndex?: number;
}

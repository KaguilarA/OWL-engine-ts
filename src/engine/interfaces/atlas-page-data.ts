import type { ParsedAtlasRegion } from './';

/**
 * Defines the atlas page data contract shared by its consumers.
 * @interface AtlasPageData
 */
export interface AtlasPageData {
  /**
   * Name identifying the texture page.
   * @property {string} pageName
   */
  pageName: string;
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
   * Region definitions belonging to the texture page.
   * @property {ParsedAtlasRegion[]} regions
   */
  regions: ParsedAtlasRegion[];
}

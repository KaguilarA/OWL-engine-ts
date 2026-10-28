import type { AtlasAnimation, AtlasPageData, AtlasRegion } from '../interfaces';
import { AtlasAnimationCatalog } from './';

/**
 * Provides page metadata, image ownership, and named region lookups.
 * @class Atlas
 */
export class Atlas {
  /**
   * Filename identifying the texture page described by this atlas.
   * @property {string} pageName
   * @readonly
   * @public
   */
  public readonly pageName: string;
  /**
   * Declared texture-page width in source-image pixels.
   * @property {number} width
   * @readonly
   * @public
   */
  public readonly width: number;
  /**
   * Declared texture-page height in source-image pixels.
   * @property {number} height
   * @readonly
   * @public
   */
  public readonly height: number;
  /**
   * Texture-page image attached after loading; undefined until assigned.
   * @property {HTMLImageElement | undefined} image
   * @public
   */
  public image: HTMLImageElement | undefined;
  /**
   * Page-scoped catalog resolving region names and ordered animation frames.
   * @property {AtlasAnimationCatalog} catalog
   * @readonly
   * @private
   */
  private readonly catalog: AtlasAnimationCatalog;

  /**
   * Copies page metadata and builds the animation catalog from parsed regions.
   * Does not load or attach the page image.
   * @constructor
   * @param {AtlasPageData} page Parsed page metadata and its region definitions.
   * @returns {void}
   * @public
   */
  public constructor(page: AtlasPageData) {
    this.pageName = page.pageName;
    this.width = page.width;
    this.height = page.height;
    this.catalog = new AtlasAnimationCatalog(this.pageName, page.regions);
  }

  /**
   * Resolves a region or animation name through the page's animation catalog.
   * @param {string} name Registered region or animation name.
   * @returns {AtlasAnimation} Matching animation and its ordered frame regions.
   * @throws {Error} When the catalog cannot resolve the requested name.
   * @public
   */
  public getAnimation(name: string): AtlasAnimation {
    return this.catalog.getAnimation(name);
  }

  /**
   * Resolves a static region and rejects animations containing multiple frames.
   * @param {string} name Name resolving to exactly one frame in this page.
   * @returns {AtlasRegion} The sole region belonging to the resolved animation.
   * @throws {Error} When the name is missing or resolves to multiple frames.
   * @public
   */
  public getRegion(name: string): AtlasRegion {
    const animation = this.getAnimation(name);
    if (animation.frames.length !== 1) {
      throw new Error(`Atlas region "${name}" in "${this.pageName}" is animated.`);
    }
    return animation.frames[0];
  }

  /**
   * Attaches the texture-page image used by atlas-backed rendering.
   * Keeps the parsed dimensions and animation catalog unchanged.
   * @param {HTMLImageElement} image Loaded image containing this page's regions.
   * @returns {void}
   * @public
   */
  public setPageImage(image: HTMLImageElement): void {
    this.image = image;
  }
}

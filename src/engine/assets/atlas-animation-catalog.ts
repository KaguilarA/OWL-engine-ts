import type { AtlasAnimation, ParsedAtlasRegion } from '../interfaces';

/**
 * Groups parsed atlas regions into frame-ordered named animations.
 * @class AtlasAnimationCatalog
 */
export default class {
  /**
   * Animations configuration or state owned by atlas-animation-catalog.
   * @property {Map<string, AtlasAnimation>} animations
   * @readonly
   * @private
   */
  private readonly animations = new Map<string, AtlasAnimation>();

  /**
   * Initializes atlas-animation-catalog and its owned resources from the supplied arguments.
   * @constructor
   * @param {string} pageName Name identifying the texture page.
   * @param {ParsedAtlasRegion[]} regions Region definitions belonging to the texture page.
   * @returns {void}
   * @public
   */
  public constructor(pageName: string, regions: ParsedAtlasRegion[]) {
    regions.forEach((region) => {
      const frames = this.animations.get(region.name)?.frames ?? [];
      frames.push(region);
      frames.sort((first, second) => first.index - second.index);
      this.animations.set(region.name, {
        name: region.name,
        frames,
        frameRate: region.frameRate,
        loop: region.loop
      });
    });
    this.pageName = pageName;
  }

  /**
   * Name identifying the texture page.
   * @property {string} pageName
   * @readonly
   * @private
   */
  private readonly pageName: string;

  /**
   * Looks up an animation by name in the atlas catalog.
   * @param {string} name Name used to identify or look up this resource.
   * @returns {AtlasAnimation} Looks up an animation by name in the atlas catalog.
   * @public
   */
  public getAnimation(name: string): AtlasAnimation {
    const animation = this.animations.get(name);
    if (!animation) {
      throw new Error(`Atlas animation "${name}" is missing from "${this.pageName}".`);
    }
    return animation;
  }
}

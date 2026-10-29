import { MusketeersSlotAssets } from './';
import {
  Atlas,
  GameLoader,
  Icon
} from '../../engine';

/**
 * Defines the musketeers symbol definition contract shared by its consumers.
 * @interface MusketeersSymbolDefinition
 */
interface MusketeersSymbolDefinition {
  /**
   * Id configuration or state owned by MusketeersSymbolDefinition.
   * @property {string} id
   */
  id: string;
  /**
   * Normal configuration or state owned by MusketeersSymbolDefinition.
   * @property {string} normal
   */
  normal: string;
  /**
   * Blurred configuration or state owned by MusketeersSymbolDefinition.
   * @property {string} blurred
   */
  blurred: string;
  /**
   * Spine configuration or state owned by MusketeersSymbolDefinition.
   * @property {{ json: string; atlas: string; } | undefined} spine
   */
  spine?: {
  /**
   * Json configuration or state owned by MusketeersSymbolDefinition.
   * @property {string} json
   */
  json: string;
  /**
   * Atlas configuration or state owned by MusketeersSymbolDefinition.
   * @property {string} atlas
   */
  atlas: string };
}

/**
 * Defines the musketeers asset manifest contract shared by its consumers.
 * @interface MusketeersAssetManifest
 */
interface MusketeersAssetManifest {
  /**
   * Symbols configuration or state owned by MusketeersAssetManifest.
   * @property {MusketeersSymbolDefinition[]} symbols
   */
  symbols: MusketeersSymbolDefinition[];
  /**
   * Backgrounds configuration or state owned by MusketeersAssetManifest.
   * @property {{ portrait: { normal: string; freeSpins: string; }; landscape: { normal: string; freeSpins: string; }; }} backgrounds
   */
  backgrounds: {
    /**
     * Portrait configuration or state owned by MusketeersAssetManifest.
     * @property {{ normal: string; freeSpins: string; }} portrait
     */
    portrait: {
    /**
     * Normal configuration or state owned by MusketeersAssetManifest.
     * @property {string} normal
     */
    normal: string;
    /**
     * Free spins configuration or state owned by MusketeersAssetManifest.
     * @property {string} freeSpins
     */
    freeSpins: string };
    /**
     * Landscape configuration or state owned by MusketeersAssetManifest.
     * @property {{ normal: string; freeSpins: string; }} landscape
     */
    landscape: {
    /**
     * Normal configuration or state owned by MusketeersAssetManifest.
     * @property {string} normal
     */
    normal: string;
    /**
     * Free spins configuration or state owned by MusketeersAssetManifest.
     * @property {string} freeSpins
     */
    freeSpins: string };
  };
  /**
   * Reel frames configuration or state owned by MusketeersAssetManifest.
   * @property {{ normal: string; freeSpins: string; }} reelFrames
   */
  reelFrames: {
  /**
   * Normal configuration or state owned by MusketeersAssetManifest.
   * @property {string} normal
   */
  normal: string;
  /**
   * Free spins configuration or state owned by MusketeersAssetManifest.
   * @property {string} freeSpins
   */
  freeSpins: string };
  /**
   * Spin button configuration or state owned by MusketeersAssetManifest.
   * @property {{ image: string; atlas: string; }} spinButton
   */
  spinButton: {
  /**
   * Image source used to render the associated content.
   * @property {string} image
   */
  image: string;
  /**
   * Atlas configuration or state owned by MusketeersAssetManifest.
   * @property {string} atlas
   */
  atlas: string };
}

/**
 * Defines the musketeers backgrounds contract shared by its consumers.
 * @interface MusketeersBackgrounds
 */
interface MusketeersBackgrounds {
  /**
   * Portrait configuration or state owned by MusketeersBackgrounds.
   * @property {{ normal: HTMLImageElement; freeSpins: HTMLImageElement; }} portrait
   */
  portrait: {
  /**
   * Normal configuration or state owned by MusketeersBackgrounds.
   * @property {HTMLImageElement} normal
   */
  normal: HTMLImageElement;
  /**
   * Free spins configuration or state owned by MusketeersBackgrounds.
   * @property {HTMLImageElement} freeSpins
   */
  freeSpins: HTMLImageElement };
  /**
   * Landscape configuration or state owned by MusketeersBackgrounds.
   * @property {{ normal: HTMLImageElement; freeSpins: HTMLImageElement; }} landscape
   */
  landscape: {
  /**
   * Normal configuration or state owned by MusketeersBackgrounds.
   * @property {HTMLImageElement} normal
   */
  normal: HTMLImageElement;
  /**
   * Free spins configuration or state owned by MusketeersBackgrounds.
   * @property {HTMLImageElement} freeSpins
   */
  freeSpins: HTMLImageElement };
}

/**
 * Loads the slot's data-driven asset catalog through the shared engine loader.
 * @class MusketeersSlotAssets
 */
export default class {
  /**
   * Symbols configuration or state owned by MusketeersSlotAssets.
   * @property {ReadonlyMap<string, Icon>} symbols
   * @readonly
   * @public
   */
  public readonly symbols: ReadonlyMap<string, Icon>;
  /**
   * Backgrounds configuration or state owned by MusketeersSlotAssets.
   * @property {MusketeersBackgrounds} backgrounds
   * @readonly
   * @public
   */
  public readonly backgrounds: MusketeersBackgrounds;
  /**
   * Reel frames configuration or state owned by MusketeersSlotAssets.
   * @property {{ normal: HTMLImageElement; freeSpins: HTMLImageElement; }} reelFrames
   * @readonly
   * @public
   */
  public readonly reelFrames: {
  /**
   * Normal configuration or state owned by MusketeersSlotAssets.
   * @property {HTMLImageElement} normal
   */
  normal: HTMLImageElement;
  /**
   * Free spins configuration or state owned by MusketeersSlotAssets.
   * @property {HTMLImageElement} freeSpins
   */
  freeSpins: HTMLImageElement };
  /**
   * Spin button image configuration or state owned by MusketeersSlotAssets.
   * @property {HTMLImageElement} spinButtonImage
   * @readonly
   * @public
   */
  public readonly spinButtonImage: HTMLImageElement;
  /**
   * Spin button atlas configuration or state owned by MusketeersSlotAssets.
   * @property {Atlas} spinButtonAtlas
   * @readonly
   * @public
   */
  public readonly spinButtonAtlas: Atlas;

  /**
   * Initializes MusketeersSlotAssets and its owned resources from the supplied arguments.
   * @constructor
   * @param {Map<string, Icon>} symbols The symbols supplied to this operation.
   * @param {MusketeersBackgrounds} backgrounds The backgrounds supplied to this operation.
   * @param {{ normal: HTMLImageElement; freeSpins: HTMLImageElement; }} reelFrames The reel frames supplied to this operation.
   * @param {HTMLImageElement} spinButtonImage The spin button image supplied to this operation.
   * @param {Atlas} spinButtonAtlas The spin button atlas supplied to this operation.
   * @returns {void}
   * @private
   */
  private constructor(
    symbols: Map<string, Icon>,
    backgrounds: MusketeersBackgrounds,
    reelFrames: {
    /**
     * Normal configuration or state owned by MusketeersSlotAssets.
     * @property {HTMLImageElement} normal
     */
    normal: HTMLImageElement;
    /**
     * Free spins configuration or state owned by MusketeersSlotAssets.
     * @property {HTMLImageElement} freeSpins
     */
    freeSpins: HTMLImageElement },
    spinButtonImage: HTMLImageElement,
    spinButtonAtlas: Atlas
  ) {
    this.symbols = symbols;
    this.backgrounds = backgrounds;
    this.reelFrames = reelFrames;
    this.spinButtonImage = spinButtonImage;
    this.spinButtonAtlas = spinButtonAtlas;
  }

  /**
   * Loads musketeers slot assets for MusketeersSlotAssets.
   * @returns {Promise<MusketeersSlotAssets>} Loads musketeers slot assets for MusketeersSlotAssets.
   * @public
   */
  public static async load(): Promise<MusketeersSlotAssets> {
    const manifestUrl = `${import.meta.env.BASE_URL}slot-machine/musketeers/assets.json`;
    const manifest = await GameLoader.loadJson<MusketeersAssetManifest>(manifestUrl);
    const resolve = (path: string): string => `${import.meta.env.BASE_URL}${path}`;
    const image = (path: string): Promise<HTMLImageElement> => GameLoader.loadImageUrl(resolve(path));

    const [backgrounds, reelFrames, spinButtonImage, spinButtonAtlas, icons] = await Promise.all([
      Promise.all([
        image(manifest.backgrounds.portrait.normal),
        image(manifest.backgrounds.portrait.freeSpins),
        image(manifest.backgrounds.landscape.normal),
        image(manifest.backgrounds.landscape.freeSpins)
      ]),
      Promise.all([image(manifest.reelFrames.normal), image(manifest.reelFrames.freeSpins)]),
      image(manifest.spinButton.image),
      GameLoader.loadAtlasUrl(resolve(manifest.spinButton.atlas)),
      Promise.all(manifest.symbols.map(async (definition) => {
        const icon = await Icon.load(definition.id, {
          normal: resolve(definition.normal),
          blurred: resolve(definition.blurred),
          spine: definition.spine
            ? { json: resolve(definition.spine.json), atlas: resolve(definition.spine.atlas) }
            : undefined
        });
        return [definition.id, icon] as const;
      }))
    ]);

    return new this(
      new Map(icons),
      {
        portrait: { normal: backgrounds[0], freeSpins: backgrounds[1] },
        landscape: { normal: backgrounds[2], freeSpins: backgrounds[3] }
      },
      { normal: reelFrames[0], freeSpins: reelFrames[1] },
      spinButtonImage,
      spinButtonAtlas
    );
  }

  /**
   * Releases the resources and subscriptions owned by this object.
   * @returns {void}
   * @public
   */
  public dispose(): void {
    this.symbols.forEach((icon) => icon.dispose());
  }
}

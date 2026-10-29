import { GameContext } from '../core';

/**
 * Draws orientation-specific full-screen imagery and an optional color wash.
 * @class BackgroundRenderer
 */
export default (class {
  /**
   * The single background renderer shared by engine clients.
   * @property {BackgroundRenderer} instance
   * @public
   * @readonly
   */
  public static readonly instance = new this();

  /**
   * Initializes BackgroundRenderer and its owned resources from the supplied arguments.
   * @constructor
   * @returns {void}
   * @private
   */
  private constructor() {}

  /**
   * Renders BackgroundRenderer using its current geometry and presentation state.
   * @param {CanvasImageSource} portraitImage The portrait image supplied to this operation.
   * @param {CanvasImageSource} landscapeImage The landscape image supplied to this operation.
   * @param {string | undefined} [overlayColor] The overlay color supplied to this operation.
   * @returns {void}
   * @public
   */
  public draw(
    portraitImage: CanvasImageSource,
    landscapeImage: CanvasImageSource,
    overlayColor?: string
  ): void {
    const dimensions = GameContext.gameDimensionsModel;
    const width = dimensions.getWidth();
    const height = dimensions.getHeight();
    GameContext.drawImage(
      GameContext.isPortrait ? portraitImage : landscapeImage,
      0,
      0,
      width,
      height
    );
    if (overlayColor !== undefined) {
      GameContext.drawRect(0, 0, width, height, overlayColor);
    }
  }
}).instance;

import { GameContext } from '../core';

/**
 * Draws orientation-specific full-screen imagery and an optional color wash.
 * @class BackgroundRenderer
 */
class BackgroundRenderer {
  /**
   * The single background renderer shared by engine clients.
   * @property {BackgroundRenderer} instance
   * @public
   * @readonly
   */
  public static readonly instance = new BackgroundRenderer();

  private constructor() {}

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
}

/**
 * Shared stateless background renderer.
 * @type {BackgroundRenderer}
 */
export const GameBackground = BackgroundRenderer.instance;

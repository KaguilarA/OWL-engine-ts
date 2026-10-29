import { GameContext } from '../core';

/**
 * Draws an inline SVG icon on the game canvas.
 * @class CanvasIcon
 */
export default class {
  /**
   * Stores the image state.
   * @property {Image} image
   * @private
   * @readonly
   */
  private readonly image = new Image();

  /**
   * Creates a canvas-ready image from inline SVG markup.
   * @public
   * @return {void}
   * @constructor
   * @param {string} svg The svg supplied to this operation.
   * @param {string} [color] Color applied when rendering this content.
   * @param {boolean} [filled] The filled supplied to this operation.
   */
  constructor(svg: string, color = '#ffffff', filled = false) {
    this.image.addEventListener('error', () => {
      console.error('Failed to load a canvas icon.');
    });
    this.image.src = (
      `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
        svg
          .replaceAll('currentColor', color)
          .replace('fill="none"', `fill="${filled ? color : 'none'}"`)
      )}`
    );
  }

  /**
   * Draws the icon inside a square at the requested top-left position.
   * @public
   * @return {void}
   * @param {number} x Horizontal coordinate in the owning coordinate space.
   * @param {number} y Vertical coordinate in the owning coordinate space.
   * @param {number} size The size supplied to this operation.
   */
  public draw(x: number, y: number, size: number): void {
    if (!this.image.complete || this.image.naturalWidth === 0) return;

    GameContext.drawImage(this.image, x, y, size, size);
  }
}

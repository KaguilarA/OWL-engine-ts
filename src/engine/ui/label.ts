import { signalValue, type SignalValue } from 'reactive-values';
import { Dimensions, GameContext } from '../core';
import type { LabelOptions, LabelStyle } from '../interfaces';

/**
 * Draws a reactive text value with independently resizable dimensions.
 * @class Label
 */
export default class {
  /**
   * Dimensions configuration or state owned by Label.
   * @property {default} dimensions
   * @readonly
   * @public
   */
  public readonly dimensions: Dimensions;
  /**
   * Text to parse, display, or assign.
   * @property {SignalValue<string>} text
   * @readonly
   * @protected
   */
  protected readonly text: SignalValue<string>;
  /**
   * Style configuration or state owned by Label.
   * @property {SignalValue<LabelStyle>} style
   * @readonly
   * @protected
   */
  protected readonly style: SignalValue<LabelStyle>;
  /**
   * Resize on draw configuration or state owned by Label.
   * @property {boolean} resizeOnDraw
   * @readonly
   * @private
   */
  private readonly resizeOnDraw: boolean;

  /**
   * Initializes Label and its owned resources from the supplied arguments.
   * @constructor
   * @param {string} text Text to parse, display, or assign.
   * @param {LabelOptions} [options] Configuration controlling construction or behavior.
   * @returns {void}
   * @public
   */
  public constructor(text: string, options: LabelOptions = {}) {
    const style: LabelStyle = {
      fontSize: options.fontSize ?? 24,
      fontFamily: options.fontFamily ?? 'sans-serif',
      color: options.color ?? '#ffffff',
      align: options.align ?? 'left',
      baseline: options.baseline ?? 'middle'
    };
    this.text = signalValue(text);
    this.style = signalValue(style);
    this.resizeOnDraw = options.resizeToText ?? false;
    this.dimensions = new Dimensions(options.width ?? 0, options.height ?? style.fontSize * 1.25,
      options.x ?? 0, options.y ?? 0, options.pivotX ?? 0, options.pivotY ?? 0);
    if (this.resizeOnDraw) this.resizeToFit();
  }

  /**
   * Replaces the label’s reactive text value.
   * @param {string} text Text to parse, display, or assign.
   * @returns {void}
   * @public
   */
  public setText(text: string): void {
    if (this.text() === text) return;
    this.text.set(text);
    if (this.resizeOnDraw) this.resizeToFit();
  }
  /**
   * Returns the label’s current text value.
   * @returns {string} the label’s current text value.
   * @public
   */
  public getText(): string { return this.text(); }

  /**
   * Applies the supplied text styling options to the label.
   * @param {Partial<LabelStyle>} style The style supplied to this operation.
   * @returns {void}
   * @public
   */
  public setStyle(style: Partial<LabelStyle>): void {
    const current = this.style();
    const next = { ...current, ...style };
    if ((Object.keys(next) as Array<keyof LabelStyle>).every((key) => current[key] === next[key])) return;
    this.style.set(next);
    if (this.resizeOnDraw) this.resizeToFit();
  }

  /**
   * Resizes the label bounds to fit its measured text.
   * @returns {void}
   * @public
   */
  public resizeToFit(): void {
    const context = GameContext.context;
    const style = this.style();
    context.save();
    context.font = `${style.fontSize}px ${style.fontFamily}`;
    const metrics = context.measureText(this.text());
    context.restore();
    const width = metrics.width;
    const height = Math.max(style.fontSize, metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent);
    if (this.dimensions.getWidth() !== width) this.dimensions.setWidth(width);
    if (this.dimensions.getHeight() !== height) this.dimensions.setHeight(height);
  }

  /**
   * Renders Label using its current geometry and presentation state.
   * @returns {void}
   * @public
   */
  public draw(): void {
    const context = GameContext.context;
    const style = this.style();
    const dimensions = this.dimensions;
    const x = dimensions.getX();
    const y = dimensions.getY();
    const width = dimensions.getWidth();
    const height = dimensions.getHeight();
    context.save();
    context.translate(x, y);
    context.scale(dimensions.getScaleX(), dimensions.getScaleY());
    context.font = `${style.fontSize}px ${style.fontFamily}`;
    context.fillStyle = style.color;
    context.textAlign = style.align;
    context.textBaseline = style.baseline;
    const originX = -width * dimensions.getPivotX();
    const originY = -height * dimensions.getPivotY();
    const alignedX = originX + (style.align === 'center' ? width / 2 : style.align === 'right' ? width : 0);
    const baselineY = originY + (style.baseline === 'top' ? 0 : style.baseline === 'middle' ? height / 2 : style.baseline === 'bottom' ? height : 0);
    const maxWidth = width > 0 ? width : undefined;
    if (maxWidth) context.fillText(this.text(), alignedX, baselineY, maxWidth);
    else context.fillText(this.text(), alignedX, baselineY);
    context.restore();
  }
}

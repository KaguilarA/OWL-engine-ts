import { signalValue, type SignalValue } from 'reactive-values';
import { Dimensions, GameContext } from '../core';
import { SpineSprite, Sprite } from '../animations';
import type {
  TextureStates,
  TextureStateName,
  TextureVisual
} from '../interfaces';

/**
 * Selects, resizes, updates, and renders one of several visual representations.
 * @class Texture
 */
export default class {
  /**
   * Dimensions configuration or state owned by Texture.
   * @property {default} dimensions
   * @readonly
   * @public
   */
  public readonly dimensions: Dimensions;
  /**
   * States configuration or state owned by Texture.
   * @property {SignalValue<TextureStates>} states
   * @readonly
   * @private
   */
  private readonly states: SignalValue<TextureStates>;
  /**
   * Presentation or lifecycle state selected for this object.
   * @property {SignalValue<TextureStateName>} state
   * @readonly
   * @private
   */
  private readonly state: SignalValue<TextureStateName> = signalValue<TextureStateName>('idle');

  /**
   * Initializes Texture and its owned resources from the supplied arguments.
   * @constructor
   * @param {TextureStates} states The states supplied to this operation.
   * @param {number} width Width of the represented area.
   * @param {number} height Height of the represented area.
   * @param {number} [x] Horizontal coordinate in the owning coordinate space.
   * @param {number} [y] Vertical coordinate in the owning coordinate space.
   * @param {number} [pivotX] The pivot x supplied to this operation.
   * @param {number} [pivotY] The pivot y supplied to this operation.
   * @returns {void}
   * @public
   */
  public constructor(states: TextureStates, width: number, height: number, x = 0, y = 0, pivotX = 0.5, pivotY = 0.5) {
    this.states = signalValue(states);
    this.dimensions = new Dimensions(width, height, x, y, pivotX, pivotY);
  }

  /**
   * Selects the texture state used for subsequent drawing.
   * @param {TextureStateName} state Presentation or lifecycle state selected for this object.
   * @returns {void}
   * @public
   */
  public setState(state: TextureStateName): void {
    if (this.state() !== state) this.state.set(state);
  }
  /**
   * Returns state name from the current Texture state.
   * @returns {TextureStateName} state name from the current Texture state.
   * @public
   */
  public get stateName(): TextureStateName { return this.state(); }
  /**
   * Associates a visual with a named texture state.
   * @param {TextureStateName} state Presentation or lifecycle state selected for this object.
   * @param {TextureVisual} visual The visual supplied to this operation.
   * @returns {void}
   * @public
   */
  public setTextureState(state: TextureStateName, visual: TextureVisual): void {
    this.states.set({ ...this.states(), [state]: visual });
  }

  /**
   * Advances Texture simulation and dependent presentation state for one frame.
   * @param {number} deltaSeconds Elapsed simulation time in seconds.
   * @returns {void}
   * @public
   */
  public update(deltaSeconds: number): void {
    const visual = this.getCurrentVisual();
    if (visual instanceof Sprite || visual instanceof SpineSprite) visual.update(deltaSeconds);
  }

  /**
   * Renders Texture using its current geometry and presentation state.
   * @returns {void}
   * @public
   */
  public draw(): void {
    const visual = this.getCurrentVisual();
    if (!visual) return;
    const dimensions = this.dimensions;
    const x = dimensions.getX();
    const y = dimensions.getY();
    const width = dimensions.getWidth();
    const height = dimensions.getHeight();
    const pivotX = dimensions.getPivotX();
    const pivotY = dimensions.getPivotY();
    if (visual instanceof Sprite || visual instanceof SpineSprite) {
      visual.dimensions.setPosition(x, y);
      visual.dimensions.setWidth(width);
      visual.dimensions.setHeight(height);
      visual.dimensions.setScale(dimensions.getScaleX(), dimensions.getScaleY());
      visual.dimensions.setPivot(pivotX, pivotY);
      visual.draw();
      return;
    }
    const context = GameContext.context;
    context.save();
    context.translate(x, y);
    context.scale(dimensions.getScaleX(), dimensions.getScaleY());
    context.drawImage(visual, -width * pivotX, -height * pivotY, width, height);
    context.restore();
  }

  /**
   * Resolves the visual associated with the texture’s current state.
   * @returns {TextureVisual | undefined} Resolves the visual associated with the texture’s current state.
   * @private
   */
  private getCurrentVisual(): TextureVisual | undefined {
    const states = this.states();
    return states[this.state()] ?? states.idle ?? states.disabled ?? states.blocked ?? states.hover;
  }
}

import type { Renderable } from '../interfaces';
import { Component } from './';

/**
 * Renders an existing Sprite, Texture, or other Renderable on its Entity.
 * @class SpriteRendererComponent
 */
export default class extends Component {
  /**
   * Renderable configuration or state owned by SpriteRendererComponent.
   * @property {Renderable} renderable
   * @readonly
   * @public
   */
  public readonly renderable: Renderable;

  /**
   * Initializes SpriteRendererComponent and its owned resources from the supplied arguments.
   * @constructor
   * @param {Renderable} renderable The renderable supplied to this operation.
   * @returns {void}
   * @public
   */
  public constructor(renderable: Renderable) {
    super();
    this.renderable = renderable;
  }

  /**
   * Advances SpriteRendererComponent simulation and dependent presentation state for one frame.
   * @param {number} deltaSeconds Elapsed simulation time in seconds.
   * @returns {void}
   * @public
   */
  public override update(deltaSeconds: number): void {
    this.renderable.update?.(deltaSeconds);
  }

  /**
   * Renders SpriteRendererComponent using its current geometry and presentation state.
   * @returns {void}
   * @public
   */
  public override draw(): void {
    const entity = this.entity;
    const target = this.renderable.dimensions;
    if (entity && target) {
      const source = entity.dimensions;
      target.setPosition(source.getX(), source.getY());
      target.setSize(source.getWidth(), source.getHeight());
      target.setScale(source.getScaleX(), source.getScaleY());
      target.setPivot(source.getPivotX(), source.getPivotY());
    }
    this.renderable.draw();
  }
}

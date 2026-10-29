import type { TransformOptions } from '../interfaces';
import { Dimensions } from '../core';
import { Component } from './';

/**
 * Position, size, scale and pivot data shared by an Entity's components.
 * @class TransformComponent
 */
export default class extends Component {
  /**
   * Dimensions configuration or state owned by TransformComponent.
   * @property {default} dimensions
   * @readonly
   * @public
   */
  public readonly dimensions: Dimensions;

  /**
   * Initializes TransformComponent and its owned resources from the supplied arguments.
   * @constructor
   * @param {TransformOptions} [options] Configuration controlling construction or behavior.
   * @returns {void}
   * @public
   */
  public constructor(options: TransformOptions = {}) {
    super();
    this.dimensions = new Dimensions(
      options.width ?? 0,
      options.height ?? 0,
      options.x ?? 0,
      options.y ?? 0,
      options.pivotX ?? 0,
      options.pivotY ?? 0
    );
    this.dimensions.setScale(options.scaleX ?? 1, options.scaleY ?? options.scaleX ?? 1);
  }
}

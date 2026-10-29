import type { EntityOptions } from '../interfaces';
import type { Entity } from './';

/**
 * Reusable entity factory that can be registered and instantiated by name.
 * @class Prefab
 */
export default class<T extends Entity = Entity> {
  /**
   * Factory configuration or state owned by Prefab.
   * @property {(overrides?: EntityOptions | undefined) => T} factory
   * @readonly
   * @private
   */
  private readonly factory: (overrides?: EntityOptions) => T;

  /**
   * Initializes Prefab and its owned resources from the supplied arguments.
   * @constructor
   * @param {(overrides?: EntityOptions | undefined) => T} factory The factory supplied to this operation.
   * @returns {void}
   * @public
   */
  public constructor(factory: (overrides?: EntityOptions) => T) {
    this.factory = factory;
  }

  /**
   * Creates an instance of prefab for Prefab.
   * @param {EntityOptions | undefined} [overrides] The overrides supplied to this operation.
   * @returns {T} Creates an instance of prefab for Prefab.
   * @public
   */
  public instantiate(overrides?: EntityOptions): T {
    return this.factory(overrides);
  }
}

import type { ObjectPool } from './';
import type { Poolable } from '../interfaces';

/**
 * Global registry for game-wide pools following SOLID singleton design.
 * @class PoolRegistry
 */
class PoolRegistry {
  /**
   * The single registry for engine-wide object pools.
   * @property {PoolRegistry} instance
   * @public
   * @readonly
   */
  public static readonly instance = new PoolRegistry();

  /**
   * Stores registered pools by name.
   * @property {Map<string, ObjectPool<any>>} pools
   * @private
   * @readonly
   */
  private readonly pools = new Map<string, ObjectPool<any>>();

  /**
   * Creates the shared object pool registry.
   * @private
   * @return {void}
   * @constructor
   */
  private constructor() {}

  /**
   * Registers a named object pool.
   * @public
   * @return {void}
   * @param {string} name Name used to identify or look up this resource.
   * @param {ObjectPool<T>} pool The pool supplied to this operation.
   */
  public register<T extends Poolable>(name: string, pool: ObjectPool<T>): void {
    this.pools.set(name, pool);
  }

  /**
   * Retrieves a named object pool.
   * @public
   * @return {ObjectPool<T> | undefined}
   * @param {string} name Name used to identify or look up this resource.
   */
  public get<T extends Poolable>(name: string): ObjectPool<T> | undefined {
    return this.pools.get(name) as ObjectPool<T> | undefined;
  }

  /**
   * Checks if a pool exists.
   * @public
   * @return {boolean}
   * @param {string} name Name used to identify or look up this resource.
   */
  public has(name: string): boolean {
    return this.pools.has(name);
  }

  /**
   * Clears all registered pools.
   * @public
   * @return {void}
   */
  public clear(): void {
    for (const pool of this.pools.values()) {
      pool.clear();
    }
    this.pools.clear();
  }
}

export default PoolRegistry.instance;

import { signalValue, type SignalValue } from 'reactive-values';
import type { EntityOptions } from '../interfaces';
import type { Entity, Prefab } from './';

/**
 * Encapsulates prefab registry behavior and its owned state.
 * @class PrefabRegistry
 */
export default class {
  /**
   * Reactive prefabs state owned by PrefabRegistry.
   * @property {SignalValue<ReadonlyMap<string, Prefab<Entity>>>} prefabs
   * @readonly
   * @private
   */
  private readonly prefabs: SignalValue<ReadonlyMap<string, Prefab>> = signalValue<ReadonlyMap<string, Prefab>>(
    new Map<string, Prefab>()
  );

  /**
   * Registers prefab registry for PrefabRegistry.
   * @param {string} name Name used to identify or look up this resource.
   * @param {Prefab<Entity>} prefab The prefab supplied to this operation.
   * @returns {void}
   * @public
   */
  public register(name: string, prefab: Prefab): void {
    if (!name.trim()) throw new Error('Prefab name cannot be empty.');
    if (this.prefabs().has(name)) throw new Error(`Prefab "${name}" is already registered.`);
    this.prefabs.set(new Map(this.prefabs()).set(name, prefab));
  }

  /**
   * Unregisters prefab registry for PrefabRegistry.
   * @param {string} name Name used to identify or look up this resource.
   * @returns {boolean} Unregisters prefab registry for PrefabRegistry.
   * @public
   */
  public unregister(name: string): boolean {
    if (!this.prefabs().has(name)) return false;
    const updated = new Map(this.prefabs());
    updated.delete(name);
    this.prefabs.set(updated);
    return true;
  }

  /**
   * Creates an instance of prefab registry for PrefabRegistry.
   * @param {string} name Name used to identify or look up this resource.
   * @param {EntityOptions | undefined} [overrides] The overrides supplied to this operation.
   * @returns {T} Creates an instance of prefab registry for PrefabRegistry.
   * @public
   */
  public instantiate<T extends Entity = Entity>(name: string, overrides?: EntityOptions): T {
    const prefab = this.prefabs().get(name);
    if (!prefab) throw new Error(`Prefab "${name}" is not registered.`);
    return prefab.instantiate(overrides) as T;
  }

  /**
   * Checks for prefab registry for PrefabRegistry.
   * @param {string} name Name used to identify or look up this resource.
   * @returns {boolean} Checks for prefab registry for PrefabRegistry.
   * @public
   */
  public has(name: string): boolean {
    return this.prefabs().has(name);
  }
}

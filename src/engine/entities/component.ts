import type { Entity, Component } from './';
import { signalValue, type SignalValue } from 'reactive-values';

/**
 * Reusable behavior that can be attached to an Entity.
 * @class Component
 */
export default abstract class {
  /**
   * Whether this component or control accepts updates.
   * @property {SignalValue<boolean>} enabled
   * @readonly
   * @public
   */
  public readonly enabled: SignalValue<boolean> = signalValue(true);
  /**
   * Reactive attached entity state owned by Component.
   * @property {SignalValue<Entity | undefined>} attachedEntity
   * @readonly
   * @private
   */
  private readonly attachedEntity: SignalValue<Entity | undefined> = signalValue<Entity | undefined>(undefined);

  /**
   * Returns entity from the current Component state.
   * @returns {Entity | undefined} entity from the current Component state.
   * @public
   */
  public get entity(): Entity | undefined {
    return this.attachedEntity();
  }

  /**
   * Advances Component simulation and dependent presentation state for one frame.
   * @param {number} _deltaSeconds Elapsed simulation time in seconds.
   * @returns {void}
   * @public
   */
  public update(_deltaSeconds: number): void {}
  /**
   * Renders Component using its current geometry and presentation state.
   * @returns {void}
   * @public
   */
  public draw(): void {}

  /**
   * Attaches this component to one entity and runs its attachment hook.
   * @param {Entity} entity Entity owning or receiving the component.
   * @returns {void}
   * @public
   */
  public attachTo(entity: Entity): void {
    const current = this.attachedEntity();
    if (current && current !== entity) {
      throw new Error('A Component can only be attached to one Entity at a time.');
    }
    if (current === entity) return;
    this.attachedEntity.set(entity);
    this.onAttach();
  }

  /**
   * Runs the detachment hook before clearing this component’s owning entity.
   * @returns {void}
   * @public
   */
  public detach(): void {
    if (!this.attachedEntity()) return;
    this.onDetach();
    this.attachedEntity.set(undefined);
  }

  /**
   * Provides a subclass hook invoked after this component is attached.
   * @returns {void}
   * @protected
   */
  protected onAttach(): void {}
  /**
   * Provides a subclass hook invoked before this component is detached.
   * @returns {void}
   * @protected
   */
  protected onDetach(): void {}
}

/**
 * Defines the component constructor contract shared by its consumers.
 * @typedef {ComponentConstructor<T>} ComponentConstructor
 */
export type ComponentConstructor<T extends Component> = Function & {
/**
 * Prototype configuration or state owned by ComponentConstructor.
 * @property {T} prototype
 */
prototype: T };

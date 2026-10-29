import { Entity, Component, type ComponentConstructor, TransformComponent } from './';
import type { EntityOptions, Renderable } from '../interfaces';

import { Dimensions } from '../core';

import { signalValue, type SignalValue } from 'reactive-values';

/**
 * Component container with a built-in transform, update and render lifecycle.
 * @class Entity
 */
export default class implements Renderable {
  /**
   * Id configuration or state owned by Entity.
   * @property {number} id
   * @readonly
   * @public
   */
  public readonly id: number;
  /**
   * Name used to identify or look up this resource.
   * @property {string} name
   * @readonly
   * @public
   */
  public readonly name: string;
  /**
   * Transform configuration or state owned by Entity.
   * @property {TransformComponent} transform
   * @readonly
   * @public
   */
  public readonly transform: TransformComponent;
  /**
   * Z index configuration or state owned by Entity.
   * @property {SignalValue<number>} zIndex
   * @readonly
   * @public
   */
  public readonly zIndex: SignalValue<number>;
  /**
   * Whether this object participates in its owning system.
   * @property {SignalValue<boolean>} active
   * @readonly
   * @public
   */
  public readonly active: SignalValue<boolean> = signalValue(true);
  /**
   * Next id configuration or state owned by Entity.
   * @property {number} nextId
   * @private
   */
  private static nextId = 1;
  /**
   * Reactive components state owned by Entity.
   * @property {SignalValue<readonly Component[]>} components
   * @readonly
   * @private
   */
  private readonly components: SignalValue<readonly Component[]> = signalValue<readonly Component[]>([]);

  /**
   * Initializes Entity and its owned resources from the supplied arguments.
   * @constructor
   * @param {EntityOptions} [options] Configuration controlling construction or behavior.
   * @returns {void}
   * @public
   */
  public constructor(options: EntityOptions = {}) {
    this.id = Entity.nextId++;
    this.name = options.name ?? `Entity-${this.id}`;
    this.zIndex = signalValue(options.zIndex ?? 0);
    this.transform = new TransformComponent(options);
    this.addComponent(this.transform);
  }

  /**
   * Returns dimensions from the current Entity state.
   * @returns {Dimensions} dimensions from the current Entity state.
   * @public
   */
  public get dimensions(): Dimensions {
    return this.transform.dimensions;
  }

  /**
   * Attaches a component to this entity unless the same instance is already present.
   * @param {T} component Component attached to or removed from the entity.
   * @returns {T} Attaches a component to this entity unless the same instance is already present.
   * @public
   */
  public addComponent<T extends Component>(component: T): T {
    if (this.components().includes(component)) return component;
    component.attachTo(this);
    this.components.set([...this.components(), component]);
    return component;
  }

  /**
   * Detaches a matching component and reports whether it belonged to this entity.
   * @param {Component} component Component attached to or removed from the entity.
   * @returns {boolean} Detaches a matching component and reports whether it belonged to this entity.
   * @public
   */
  public removeComponent(component: Component): boolean {
    const components = this.components();
    const index = components.indexOf(component);
    if (index < 0) return false;
    this.components.set(components.filter((candidate) => candidate !== component));
    component.detach();
    return true;
  }

  /**
   * Finds the first component matching the requested constructor.
   * @param {ComponentConstructor<T>} type Component constructor used to select a matching component.
   * @returns {T | undefined} Finds the first component matching the requested constructor.
   * @public
   */
  public getComponent<T extends Component>(type: ComponentConstructor<T>): T | undefined {
    return this.components().find((component) => component instanceof type) as T | undefined;
  }

  /**
   * Returns the current component collection without exposing mutation methods.
   * @returns {readonly Component[]} the current component collection without exposing mutation methods.
   * @public
   */
  public getComponents(): readonly Component[] {
    return this.components();
  }

  /**
   * Advances Entity simulation and dependent presentation state for one frame.
   * @param {number} deltaSeconds Elapsed simulation time in seconds.
   * @returns {void}
   * @public
   */
  public update(deltaSeconds: number): void {
    if (!this.active()) return;
    for (const component of this.components()) {
      if (component.enabled()) component.update(deltaSeconds);
    }
  }

  /**
   * Renders Entity using its current geometry and presentation state.
   * @returns {void}
   * @public
   */
  public draw(): void {
    if (!this.active()) return;
    for (const component of this.components()) {
      if (component.enabled()) component.draw();
    }
  }

  /**
   * Releases this object’s owned state and subscriptions so it no longer participates in updates.
   * @returns {void}
   * @public
   */
  public destroy(): void {
    this.active.set(false);
    const components = this.components();
    this.components.set([]);
    for (const component of components) component.detach();
  }
}

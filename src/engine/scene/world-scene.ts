import { signalValue, type SignalValue } from 'reactive-values';
import { PhysicsWorld } from '../core';
import { Camera2D, SceneLayer } from './';

/**
 * Updates and draws a camera-driven 2D world composed of ordered layers.
 * @class WorldScene
 */
export default class {
  /**
   * Scene-scoped fixed-step simulation for circular physics bodies.
   * @property {PhysicsWorld} physics
   * @public
   * @readonly
   */
  public readonly physics: PhysicsWorld;

  /**
   * The 2D camera viewport controller.
   * @property {Camera2D} camera
   * @public
   * @readonly
   */
  public readonly camera: Camera2D;

  /**
   * Reactive ordered layer collection.
   * @property {SignalValue<readonly SceneLayer[]>} layers
   * @private
   * @readonly
   */
  private readonly layers: SignalValue<readonly SceneLayer[]> = signalValue<readonly SceneLayer[]>([]);

  /**
   * Monotonic layer insertion order mapping.
   * @property {Map<SceneLayer, number>} insertionOrder
   * @private
   * @readonly
   */
  private readonly insertionOrder = new Map<SceneLayer, number>();

  /**
   * Next monotonic layer insertion index.
   * @property {number} nextInsertionOrder
   * @private
   */
  private nextInsertionOrder = 0;

  /**
   * Creates a world scene with an optional camera.
   * @public
   * @return {void}
   * @constructor
   * @param {Camera2D} [camera] The camera supplied to this operation.
   * @param {PhysicsWorld} [physics] The physics supplied to this operation.
   */
  public constructor(camera = new Camera2D(), physics = new PhysicsWorld()) {
    this.camera = camera;
    this.physics = physics;
  }

  /**
   * Registers a layer to the scene.
   * @public
   * @return {void}
   * @param {SceneLayer} layer The layer supplied to this operation.
   */
  public addLayer(layer: SceneLayer): void {
    if (this.insertionOrder.has(layer)) return;
    this.insertionOrder.set(layer, this.nextInsertionOrder++);
    this.layers.set([...this.layers(), layer]);
  }

  /**
   * Removes a layer from the scene.
   * @public
   * @return {boolean}
   * @param {SceneLayer} layer The layer supplied to this operation.
   */
  public removeLayer(layer: SceneLayer): boolean {
    const layers = this.layers();
    const index = layers.indexOf(layer);
    if (index < 0) return false;
    this.layers.set(layers.filter((candidate) => candidate !== layer));
    this.insertionOrder.delete(layer);
    return true;
  }

  /**
   * Returns read-only array of registered layers.
   * @public
   * @return {readonly SceneLayer[]}
   */
  public getLayers(): readonly SceneLayer[] {
    return this.layers();
  }

  /**
   * Releases world references, layer callbacks, physics registrations, and camera following.
   * Shared render assets remain owned by the asset loader.
   * @returns {void}
   */
  public clear(): void {
    for (const layer of this.layers()) layer.clear();
    this.layers.set([]);
    this.insertionOrder.clear();
    this.nextInsertionOrder = 0;
    for (const body of this.physics.getBodies()) this.physics.removeBody(body);
    this.camera.stopFollowing();
  }

  /**
   * Updates camera and all layers for one frame.
   * @public
   * @return {void}
   * @param {number} deltaSeconds Elapsed simulation time in seconds.
   */
  public update(deltaSeconds: number): void {
    this.physics.update(deltaSeconds);
    this.camera.update(deltaSeconds);
    const layers = this.getOrderedLayers();
    for (const layer of layers) layer.update(deltaSeconds);
  }

  /**
   * Renders layers in sorted order through the camera.
   * @public
   * @return {void}
   */
  public draw(): void {
    const layers = this.getOrderedLayers();
    for (const layer of layers) layer.draw(this.camera);
  }

  /**
   * Sorts layers by order priority and insertion stability.
   * @private
   * @return {SceneLayer[]}
   */
  private getOrderedLayers(): SceneLayer[] {
    return this.layers().slice().sort((a, b) => a.order() - b.order()
      || (this.insertionOrder.get(a) ?? 0) - (this.insertionOrder.get(b) ?? 0));
  }
}

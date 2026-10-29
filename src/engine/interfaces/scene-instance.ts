import type { GameScene, SceneLoadContext } from './';

/**
 * Scene instance and its cancellation and resource scope, owned by the scene manager.
 * @interface SceneInstance
 */
export interface SceneInstance {
  /**
   * Registered scene identifier.
   * @property {string} id
   */
  readonly id: string;
  /**
   * Lifecycle hooks belonging to this particular activation.
   * @property {GameScene} scene
   */
  readonly scene: GameScene;
  /**
   * Preparation scope retained until disposal.
   * @property {SceneLoadContext} context
   */
  readonly context: SceneLoadContext;
  /**
   * Controller notifying scene tasks when teardown begins.
   * @property {AbortController} controller
   */
  readonly controller: AbortController;
}

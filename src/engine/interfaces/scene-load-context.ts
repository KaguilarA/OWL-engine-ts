import type { SceneResources } from '../scene';
import type { SaveData } from './';

/**
 * Preparation scope supplied to the factory, load hook, and entry hook of a scene.
 * @interface SceneLoadContext
 */
export interface SceneLoadContext {
  /**
   * Detached transition payload; session progress is retained separately by SceneManager.
   * @property {SaveData} data
   */
  readonly data: SaveData;
  /**
   * Cleanup scope for resources owned exclusively by this scene instance.
   * @property {SceneResources} resources
   */
  readonly resources: SceneResources;
  /**
   * Cancellation signal aborted before instance teardown.
   * @property {AbortSignal} signal
   */
  readonly signal: AbortSignal;
  /**
   * Reports monotonic loading progress between zero and one.
   * @param {number} fraction Completed fraction of scene preparation.
   * @returns {void}
   */
  reportProgress(fraction: number): void;
}

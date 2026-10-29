import type { SaveData } from './';

/**
 * Detached request retained so a failed transition can be retried.
 * @interface SceneRequest
 */
export interface SceneRequest {
  /**
   * Registered scene to instantiate.
   * @property {string} id
   */
  readonly id: string;
  /**
   * Payload supplied to the scene's preparation scope.
   * @property {SaveData} data
   */
  readonly data: SaveData;
}

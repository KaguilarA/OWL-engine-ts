import type { SceneLoadContext } from './';

/**
 * Lifecycle implemented by a playable scene or menu; its own loop must honor pause and disposal.
 * @interface GameScene
 */
export interface GameScene {
  /**
   * Loads scene-owned content before activation.
   * @param {SceneLoadContext} context Loading scope, transition data, and progress reporter.
   * @returns {void | Promise<void>} Completion of scene preparation.
   */
  load?(context: SceneLoadContext): void | Promise<void>;
  /**
   * Enters the prepared scene before gameplay resumes.
   * @param {SceneLoadContext} context Scope and data belonging to this scene instance.
   * @returns {void | Promise<void>} Completion of entry behavior.
   */
  enter?(context: SceneLoadContext): void | Promise<void>;
  /**
   * Suspends interaction and simulation without releasing persistent session progress.
   * @returns {void}
   */
  pause?(): void;
  /**
   * Restores interaction and simulation after preparation or pause.
   * @returns {void}
   */
  resume?(): void;
  /**
   * Performs exit behavior before owned resources are released.
   * @returns {void | Promise<void>} Completion of exit behavior.
   */
  exit?(): void | Promise<void>;
  /**
   * Stops loops and releases listeners and resources owned by this instance.
   * @returns {void | Promise<void>} Completion of cleanup.
   */
  dispose?(): void | Promise<void>;
}

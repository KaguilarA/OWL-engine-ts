import { signalValue } from 'reactive-values';

/**
 * Owns cleanup callbacks for one scene; shared asset caches must not be registered here.
 * @class SceneResources
 */
export default class {
  /**
   * Whether this scope has started disposal and rejects further ownership.
   * @property {SignalValue<boolean>} disposed
   */
  public readonly disposed = signalValue(false);
  /**
   * Internal cleanup stack, released in reverse acquisition order.
   * @property {Array<Function>} cleanups
   * @private
   */
  private readonly cleanups: Array<() => void | Promise<void>> = [];
  /**
   * Shared completion promise for idempotent concurrent disposal calls.
   * @property {Promise<void> | undefined} disposal
   * @private
   */
  private disposal: Promise<void> | undefined;

  /**
   * Registers release of a listener, entity, texture, or other scene-owned resource.
   * @param {Function} cleanup Callback invoked exactly once during disposal.
   * @returns {void}
   * @throws {Error} When this scope is already disposed.
   */
  public own(cleanup: () => void | Promise<void>): void {
    if (this.disposed()) throw new Error('Scene resource scope is already disposed.');
    this.cleanups.push(cleanup);
  }

  /**
   * Attempts every cleanup even when one fails, sharing completion across callers.
   * @returns {Promise<void>} Completion of all cleanup attempts.
   */
  public dispose(): Promise<void> {
    if (!this.disposal) {
      this.disposed.set(true);
      this.disposal = this.release();
    }
    return this.disposal;
  }

  /**
   * Drains the stack and aggregates failures without retaining released callbacks.
   * @returns {Promise<void>} Successful cleanup or an aggregate of release failures.
   * @private
   */
  private async release(): Promise<void> {
    const failures: unknown[] = [];
    for (const cleanup of this.cleanups.splice(0).reverse()) {
      try { await cleanup(); } catch (error) { failures.push(error); }
    }
    if (failures.length) throw new AggregateError(failures, 'Scene resource cleanup failed.');
  }
}

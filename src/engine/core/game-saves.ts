import type { SaveData, SavedGame, SaveResult, SaveStorage } from '../interfaces';

/**
 * Shared persistence service. Each game owns its snapshot format and validation.
 * @class GameSaveService
 */
class GameSaveService {
  /**
   * Single engine-wide persistence service.
   * @property {GameSaveService} instance
   * @readonly
   * @public
   */
  public static readonly instance = new GameSaveService();

  /**
   * function Object() { [native code] }
   * @constructor
   * @returns {void}
   * @private
   */
  private constructor() {}

  /**
   * Builds an unambiguous storage key for a game and save slot.
   * @param {string} game Stable identifier of the game owning the save.
   * @param {string} slot Save slot within the selected game.
   * @returns {string}
   * @private
   */
  private key(game: string, slot: string): string {
    return `owl:save:${encodeURIComponent(game)}:${encodeURIComponent(slot)}`;
  }

  /**
   * Storage is resolved lazily: browsers may block localStorage access.
   * @param {string} game Stable identifier of the game owning the save.
   * @param {T} data Plain JSON snapshot to persist.
   * @param {number} [version] Expected schema version of the saved data.
   * @param {string} [slot] Save slot within the selected game.
   * @param {SaveStorage | undefined} [storage] Optional storage adapter; browser storage is used by default.
   * @returns {SaveResult<SavedGame<T>>}
   * @public
   */
  public save<T extends SaveData>(
    game: string, data: T, version = 1, slot = 'default', storage?: SaveStorage
  ): SaveResult<SavedGame<T>> {
    let serialized: string;
    let snapshot: SavedGame<T>;
    try {
      if (!Number.isInteger(version) || version < 1 || !this.isJson(data)) {
        return { ok: false, reason: 'invalid' };
      }
      snapshot = { version, savedAt: new Date().toISOString(), data };
      serialized = JSON.stringify(snapshot);
    } catch {
      return { ok: false, reason: 'invalid' };
    }
    try {
      (storage ?? globalThis.localStorage).setItem(this.key(game, slot), serialized);
      // Return a detached copy, just like load().
      return { ok: true, value: JSON.parse(serialized) as SavedGame<T> };
    } catch {
      return { ok: false, reason: 'unavailable' };
    }
  }

  /**
   * Loads a versioned snapshot and validates it before returning its data.
   * @param {string} game Stable identifier of the game owning the save.
   * @param {(data: unknown) => data is T} validate Predicate validating the snapshot before it is returned.
   * @param {number} [version] Expected schema version of the saved data.
   * @param {string} [slot] Save slot within the selected game.
   * @param {SaveStorage | undefined} [storage] Optional storage adapter; browser storage is used by default.
   * @returns {SaveResult<SavedGame<T>>}
   * @public
   */
  public load<T extends SaveData>(
    game: string, validate: (data: unknown) => data is T,
    version = 1, slot = 'default', storage?: SaveStorage
  ): SaveResult<SavedGame<T>> {
    let serialized: string | null;
    try {
      serialized = (storage ?? globalThis.localStorage).getItem(this.key(game, slot));
    } catch {
      return { ok: false, reason: 'unavailable' };
    }
    if (serialized === null) return { ok: false, reason: 'missing' };
    try {
      const snapshot = JSON.parse(serialized);
      if (!snapshot || !Number.isInteger(snapshot.version) || snapshot.version < 1
        || typeof snapshot.savedAt !== 'string' || !Number.isFinite(Date.parse(snapshot.savedAt))
        || !this.isJson(snapshot.data)) return { ok: false, reason: 'invalid' };
      if (snapshot.version !== version) return { ok: false, reason: 'version' };
      if (!validate(snapshot.data)) return { ok: false, reason: 'invalid' };
      return { ok: true, value: snapshot };
    } catch {
      return { ok: false, reason: 'invalid' };
    }
  }

  /**
   * Removes only the requested game and save slot from storage.
   * @param {string} game Stable identifier of the game owning the save.
   * @param {string} [slot] Save slot within the selected game.
   * @param {SaveStorage | undefined} [storage] Optional storage adapter; browser storage is used by default.
   * @returns {SaveResult<void>}
   * @public
   */
  public remove(game: string, slot = 'default', storage?: SaveStorage): SaveResult<void> {
    try {
      (storage ?? globalThis.localStorage).removeItem(this.key(game, slot));
      return { ok: true, value: undefined };
    } catch {
      return { ok: false, reason: 'unavailable' };
    }
  }

  /**
   * Checks that data can be serialized without cycles or lossy non-JSON values.
   * @param {unknown} value Value to validate or apply.
   * @param {Set<object>} [ancestors]
   * @returns {boolean}
   * @private
   */
  private isJson(value: unknown, ancestors = new Set<object>()): boolean {
    if (value === null || typeof value === 'string' || typeof value === 'boolean') return true;
    if (typeof value === 'number') return Number.isFinite(value);
    if (typeof value !== 'object' || ancestors.has(value)) return false;
    if (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype
      && Object.getPrototypeOf(value) !== null) return false;
    ancestors.add(value);
    const valid = Array.isArray(value)
      ? Array.from(value).every((entry) => this.isJson(entry, ancestors))
      : Object.values(value).every((entry) => this.isJson(entry, ancestors));
    ancestors.delete(value);
    return valid;
  }
}

export default GameSaveService.instance;

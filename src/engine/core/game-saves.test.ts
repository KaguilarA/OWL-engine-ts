import { describe, expect, it } from 'vitest';
import { GameSaves } from './';
import type { SaveStorage } from '../interfaces';

const validate = (value: unknown): value is { level: number } =>
  typeof value === 'object' && value !== null
  && Number.isInteger((value as { level: number }).level)
  && (value as { level: number }).level > 0;

function memoryStorage(): SaveStorage {
  const entries = new Map<string, string>();
  return {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => { entries.set(key, value); },
    removeItem: (key) => { entries.delete(key); }
  };
}

describe('GameSaves', () => {
  it('persists detached snapshots, isolates games and slots, and removes only the requested save', () => {
    const storage = memoryStorage();
    const state = { level: 2 };
    expect(GameSaves.save('rpg', state, 1, 'one', storage).ok).toBe(true);
    state.level = 99;
    GameSaves.save('rpg', { level: 3 }, 1, 'two', storage);
    GameSaves.save('other', { level: 4 }, 1, 'one', storage);
    const result = GameSaves.load('rpg', validate, 1, 'one', storage);
    expect(result.ok && result.value.data).toEqual({ level: 2 });
    expect(result.ok && Number.isFinite(Date.parse(result.value.savedAt))).toBe(true);
    GameSaves.remove('rpg', 'one', storage);
    expect(GameSaves.load('rpg', validate, 1, 'one', storage)).toEqual({ ok: false, reason: 'missing' });
    expect(GameSaves.load('rpg', validate, 1, 'two', storage).ok).toBe(true);
    expect(GameSaves.load('other', validate, 1, 'one', storage).ok).toBe(true);
  });

  it('rejects incompatible versions and invalid game data without deleting the save', () => {
    const storage = memoryStorage();
    GameSaves.save('rpg', { level: 2 }, 2, 'default', storage);
    expect(GameSaves.load('rpg', validate, 1, 'default', storage)).toEqual({ ok: false, reason: 'version' });
    expect(GameSaves.load('rpg', validate, 2, 'default', storage).ok).toBe(true);
    GameSaves.save('rpg', { level: -1 }, 2, 'default', storage);
    expect(GameSaves.load('rpg', validate, 2, 'default', storage)).toEqual({ ok: false, reason: 'invalid' });
  });

  it('handles corrupt files and storage failures', () => {
    const broken: SaveStorage = {
      getItem: () => '{broken', setItem: () => { throw new Error('quota'); },
      removeItem: () => { throw new Error('blocked'); }
    };
    expect(GameSaves.load('rpg', validate, 1, 'default', broken)).toEqual({ ok: false, reason: 'invalid' });
    expect(GameSaves.save('rpg', { level: 2 }, 1, 'default', broken)).toEqual({ ok: false, reason: 'unavailable' });
    expect(GameSaves.remove('rpg', 'default', broken)).toEqual({ ok: false, reason: 'unavailable' });
    broken.getItem = () => { throw new Error('blocked'); };
    expect(GameSaves.load('rpg', validate, 1, 'default', broken)).toEqual({ ok: false, reason: 'unavailable' });
  });

  it('rejects lossy JSON and circular data without overwriting an existing save', () => {
    const storage = memoryStorage();
    GameSaves.save('rpg', { level: 2 }, 1, 'default', storage);
    const circular: { self?: any } = {};
    circular.self = circular;
    for (const data of [circular, { level: NaN }, { level: Infinity }]) {
      expect(GameSaves.save('rpg', data, 1, 'default', storage)).toEqual({ ok: false, reason: 'invalid' });
    }
    const result = GameSaves.load('rpg', validate, 1, 'default', storage);
    expect(result.ok && result.value.data.level).toBe(2);
  });
});

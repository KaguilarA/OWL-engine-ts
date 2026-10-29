import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GameInput, GameEvents } from './';
import type { InputGamepad, SaveStorage } from '../interfaces';

function key(type: 'keydown' | 'keyup', value: string): void {
  window.dispatchEvent(new KeyboardEvent(type, { key: value }));
}

function pad(axis = 0, pressed: number[] = []): InputGamepad {
  return {
    connected: true, mapping: 'standard', axes: [axis, 0],
    buttons: Array.from({ length: 16 }, (_, index) => ({
      value: pressed.includes(index) ? 1 : 0, pressed: pressed.includes(index)
    }))
  };
}

beforeEach(() => {
  GameEvents.initEvents();
  GameInput.clear();
  for (const context of ['gameplay', 'moonfall', 'menu', 'editor']) GameInput.resetBindings(context);
  window.dispatchEvent(new Event('focus'));
  GameInput.activateContext('gameplay');
});

afterEach(() => {
  GameInput.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('GameInput', () => {
  it('shares press, hold and release edges between consumers without repeating them', () => {
    key('keydown', ' ');
    GameInput.update([]);
    expect(GameInput.wasPressed('attack')).toBe(true);
    expect(GameInput.wasPressed('attack')).toBe(true);
    GameInput.update([]);
    expect(GameInput.isDown('attack')).toBe(true);
    expect(GameInput.wasPressed('attack')).toBe(false);
    key('keyup', ' ');
    GameInput.update([]);
    expect(GameInput.wasReleased('attack')).toBe(true);
    GameInput.update([]);
    expect(GameInput.wasReleased('attack')).toBe(false);
  });

  it('retains short keyboard and touch taps between frames and normalizes letter case', () => {
    key('keydown', 'D');
    key('keyup', 'D');
    GameInput.setPointerAction(1, 'jump', 1);
    GameInput.setPointerAction(1, 'jump', 0);
    GameInput.update([]);
    expect(GameInput.wasPressed('moveRight')).toBe(true);
    expect(GameInput.wasPressed('jump')).toBe(true);
    GameInput.update([]);
    expect(GameInput.wasReleased('moveRight')).toBe(true);
    expect(GameInput.wasReleased('jump')).toBe(true);
  });

  it('combines independent pointers and keyboard without releasing another source', () => {
    key('keydown', 'd');
    GameInput.setPointerAction(1, 'moveRight', 1);
    GameInput.setPointerAction(2, 'attack', 1);
    GameInput.update([]);
    expect(GameInput.axis('moveX')).toBe(1);
    expect(GameInput.isDown('attack')).toBe(true);
    GameInput.setPointerAction(1, 'moveRight', 0);
    GameInput.update([]);
    expect(GameInput.isDown('moveRight')).toBe(true);
    key('keyup', 'd');
    GameInput.update([]);
    expect(GameInput.isDown('moveRight')).toBe(false);
    expect(GameInput.isDown('attack')).toBe(true);
  });

  it('applies deadzones, preserves analog magnitude, and releases disconnected pads', () => {
    GameInput.update([pad(0.1)]);
    expect(GameInput.axis('moveX')).toBe(0);
    GameInput.update([pad(0.59, [0])]);
    expect(GameInput.axis('moveX')).toBeCloseTo(0.5);
    expect(GameInput.wasPressed('attack')).toBe(true);
    GameInput.update([{ ...pad(-1), connected: false }]);
    expect(GameInput.axis('moveX')).toBe(0);
    expect(GameInput.wasReleased('attack')).toBe(true);
    GameInput.update([pad(-1, [14])]);
    expect(GameInput.axis('moveX')).toBe(-1);
  });

  it('isolates menu and game profiles and blocks hardware held across transitions', () => {
    key('keydown', ' ');
    GameInput.update([]);
    GameInput.activateContext('menu');
    GameInput.update([]);
    expect(GameInput.isDown('confirm')).toBe(false);
    expect(GameInput.isDown('attack')).toBe(false);
    key('keyup', ' ');
    GameInput.update([]);
    key('keydown', ' ');
    GameInput.update([]);
    expect(GameInput.wasPressed('confirm')).toBe(true);
    GameInput.activateContext('moonfall');
    GameInput.update([]);
    expect(GameInput.isDown('jump')).toBe(false);
    key('keydown', 'z');
    GameInput.update([]);
    expect(GameInput.isDown('attack')).toBe(true);
  });

  it('rebinds physical controls without changing touch actions and persists per context', () => {
    const values = new Map<string, string>();
    const storage: SaveStorage = {
      getItem: (name) => values.get(name) ?? null,
      setItem: (name, value) => { values.set(name, value); },
      removeItem: (name) => { values.delete(name); }
    };
    GameInput.rebind('attack', { keys: ['q'], buttons: [3] });
    expect(GameInput.savePreferences(storage).ok).toBe(true);
    GameInput.resetBindings();
    expect(GameInput.loadPreferences(storage).ok).toBe(true);
    key('keydown', ' ');
    GameInput.update([]);
    expect(GameInput.isDown('attack')).toBe(false);
    key('keydown', 'q');
    GameInput.update([]);
    expect(GameInput.isDown('attack')).toBe(true);
    key('keyup', 'q');
    GameInput.setPointerAction(10, 'attack', 1);
    GameInput.update([]);
    expect(GameInput.isDown('attack')).toBe(true);
    expect(GameInput.getBindings('menu').confirm.keys).toContain(' ');
    const detached = GameInput.getBindings();
    detached.attack.keys!.push('z');
    expect(GameInput.getBindings().attack.keys).toEqual(['q']);
    expect(() => GameInput.rebind('attack', { axes: [{ index: -1, direction: 1 }] })).toThrow();
  });

  it('releases all sources on blur and requires held gamepad controls to return to neutral', () => {
    vi.stubGlobal('navigator', { getGamepads: () => [pad(1, [0])] });
    key('keydown', 'd');
    GameInput.setPointerAction(1, 'attack', 1);
    GameInput.update();
    window.dispatchEvent(new Event('blur'));
    GameInput.update();
    expect(GameInput.isDown('attack')).toBe(false);
    expect(GameEvents.isKeyPressed('d')).toBe(false);
    window.dispatchEvent(new Event('focus'));
    GameInput.update();
    expect(GameInput.isDown('attack')).toBe(false);
    GameInput.update([pad()]);
    GameInput.update([pad(1, [0])]);
    expect(GameInput.wasPressed('attack')).toBe(true);
  });

  it('rejects malformed persisted mappings without replacing active bindings', () => {
    const storage: SaveStorage = {
      getItem: () => JSON.stringify({ version: 1, savedAt: new Date().toISOString(),
        data: { gameplay: { attack: { keys: [3] } } } }),
      setItem: () => {}, removeItem: () => {}
    };
    expect(GameInput.loadPreferences(storage)).toEqual({ ok: false, reason: 'invalid' });
    expect(GameInput.getBindings().attack.keys).toEqual([' ']);
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { playAtlasClip, spriteDraw, spriteUpdate } = vi.hoisted(() => ({
  playAtlasClip: vi.fn(),
  spriteDraw: vi.fn(),
  spriteUpdate: vi.fn()
}));

vi.mock('../../engine', () => ({
  GameLoader: {
    getAtlas: vi.fn(() => ({ getAnimation: vi.fn((name: string) => ({ name })) })),
    getImage: vi.fn(() => ({}))
  },
  Sprite: class {
    public dimensions = { setPosition: vi.fn(), setSize: vi.fn() };
    public draw = spriteDraw;
    public update = spriteUpdate;
    public playAtlasClip = playAtlasClip;
  }
}));

import MoonWisp from './wisp';

/**
 * Verifies Moonfall's reusable phantom enemy behavior.
 * @returns {void}
 */
describe('MoonWisp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects invalid patrol ranges and health', () => {
    expect(() => new MoonWisp(5, 10, 20, 3)).toThrow(RangeError);
    expect(() => new MoonWisp(10, 5, 20, 0)).toThrow(RangeError);
  });

  it('patrols within its limits and reverses direction at an edge', () => {
    const wisp = new MoonWisp(9, 0, 10, 3);

    wisp.update(1);
    expect(wisp.x()).toBe(10);
    wisp.update(0.1);
    expect(wisp.x()).toBeCloseTo(4.6);
    expect(spriteUpdate).toHaveBeenCalledTimes(2);
  });

  it('applies damage, stops updating when defeated, and restores on reset', () => {
    const wisp = new MoonWisp(20, 10, 30, 4);

    expect(wisp.takeDamage(2)).toBe(false);
    expect(wisp.health()).toBe(2);
    expect(wisp.takeDamage(5)).toBe(true);
    expect(wisp.isAlive).toBe(false);
    wisp.update(1);
    expect(spriteUpdate).not.toHaveBeenCalled();

    wisp.reset();
    expect(wisp.x()).toBe(20);
    expect(wisp.health()).toBe(4);
    expect(wisp.isAlive).toBe(true);
  });

  it('rejects negative or non-finite damage', () => {
    const wisp = new MoonWisp(20, 10, 30, 4);

    expect(() => wisp.takeDamage(-1)).toThrow(RangeError);
    expect(() => wisp.takeDamage(Number.NaN)).toThrow(RangeError);
  });

  it('draws only while alive', () => {
    const wisp = new MoonWisp(20, 10, 30, 4);

    wisp.drawAt(100, 120, 48);
    expect(spriteDraw).toHaveBeenCalledOnce();
    expect(playAtlasClip).toHaveBeenCalledOnce();

    wisp.takeDamage(4);
    wisp.drawAt(100, 120, 48);
    expect(spriteDraw).toHaveBeenCalledOnce();
  });
});

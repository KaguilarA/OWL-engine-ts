import { describe, expect, it, vi } from 'vitest';

import { Player } from './player';

vi.mock('../../engine/core/context', () => ({
  default: {
    canvas: { parentElement: null, addEventListener: vi.fn(), removeEventListener: vi.fn() },
    context: {},
    gameDimensionsModel: {
      getHeight: () => 1080,
      getWidth: () => 1920
    }
  },
  GameContext: {
    canvas: { parentElement: null, addEventListener: vi.fn(), removeEventListener: vi.fn() },
    context: {},
    gameDimensionsModel: {
      getHeight: () => 1080,
      getWidth: () => 1920
    }
  }
}));

vi.mock('../../engine/input/events', () => ({
  default: {
    isKeyPressed: () => false
  }
}));

vi.mock('../../engine/assets/loader', () => ({
  default: {
    getImage: vi.fn(() => ({})),
    getAtlas: vi.fn(() => ({
      getAnimation: vi.fn((name: string) => ({
        name,
        frameRate: 1,
        loop: true,
        frames: [{ name, x: 0, y: 0, width: 1, height: 1 }]
      }))
    }))
  }
}));

describe('Player', () => {
  it('loses one life after exactly two projectile impacts', () => {
    const player = new Player();

    expect(player.takeDamage()).toBe(false);
    expect(player.takeDamage()).toBe(true);
    expect(player.takeDamage()).toBe(false);
    expect(player.takeDamage()).toBe(true);
  });

  it('positions the player above a reserved bottom interface area', () => {
    const player = new Player();

    player.setBottomMargin(200);
    player.update(0);

    expect(player.y).toBe(830);
  });
});

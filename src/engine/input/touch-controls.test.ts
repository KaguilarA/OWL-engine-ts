import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameContext } from '../core';
import { GameInput, TouchControls } from './';
import { CanvasIcon } from '../rendering';
import type { TouchControlCircle } from '../interfaces';

function pointer(type: string, id: number, circle: TouchControlCircle): void {
  const event = new Event(type);
  Object.assign(event, { pointerId: id, clientX: circle.x, clientY: circle.y });
  GameContext.canvas.dispatchEvent(event);
}

afterEach(() => { GameInput.clear(); vi.restoreAllMocks(); });

describe('TouchControls', () => {
  it.each([[390, 844], [844, 390], [768, 1024], [1366, 1024]])(
    'supports simultaneous movement, jump, fire and dash at %i × %i', (width, height) => {
      vi.spyOn(GameContext, 'isMobileDevice', 'get').mockReturnValue(true);
      GameContext.gameDimensionsModel.setSize(width, height);
      vi.spyOn(GameContext.canvas, 'getBoundingClientRect').mockReturnValue({
        left: 0, top: 0, width, height
      } as DOMRect);
      const controls = new TouchControls({ showVerticalControls: false, primaryAction: 'jump' });
      try {
        controls.draw();
        const { right, shoot } = controls.layout;
        const fire = { ...shoot, x: shoot.x - shoot.radius * 2.5 };
        const dash = { ...shoot, y: shoot.y - shoot.radius * 2.5 };
        GameInput.activateContext('moonfall');
        controls.setExtraActions([[fire, 'attack'], [dash, 'dash']]);
        const icon = new CanvasIcon('<svg/>');
        controls.drawExtra(fire, icon, '#ffffff', 0);
        controls.drawExtra(dash, icon, '#ffffff', 1);
        for (const circle of [right, shoot, fire, dash]) {
          expect(circle.x - circle.radius).toBeGreaterThanOrEqual(0);
          expect(circle.x + circle.radius).toBeLessThanOrEqual(width);
          expect(circle.y - circle.radius).toBeGreaterThanOrEqual(0);
          expect(circle.y + circle.radius).toBeLessThanOrEqual(height);
        }
        pointer('pointerdown', 1, right);
        pointer('pointerdown', 2, shoot);
        pointer('pointerdown', 3, fire);
        pointer('pointerdown', 4, dash);
        GameInput.update([]);
        for (const key of ['moveRight', 'jump', 'attack', 'dash']) expect(GameInput.isDown(key)).toBe(true);
        pointer('pointercancel', 3, fire);
        GameInput.update([]);
        expect(GameInput.isDown('attack')).toBe(false);
        expect(GameInput.isDown('dash')).toBe(true);
        controls.draw(false);
        GameInput.update([]);
        for (const key of ['moveRight', 'jump', 'attack', 'dash']) expect(GameInput.isDown(key)).toBe(false);
        controls.draw();
        pointer('pointerdown', 5, right);
        GameInput.update([]);
        expect(GameInput.isDown('moveRight')).toBe(true);
      } finally {
        controls.dispose();
        GameInput.update([]);
      }
      expect(GameInput.isDown('moveRight')).toBe(false);
    }
  );

  it('disables controls on desktop', () => {
    vi.spyOn(GameContext, 'isMobileDevice', 'get').mockReturnValue(false);
    const width = GameContext.gameDimensionsModel.getWidth();
    const height = GameContext.gameDimensionsModel.getHeight();
    vi.spyOn(GameContext.canvas, 'getBoundingClientRect').mockReturnValue({
      left: 0, top: 0, width, height
    } as DOMRect);
    const controls = new TouchControls();
    controls.draw();
    pointer('pointerdown', 1, controls.layout.left);
    GameInput.update([]);
    expect(GameInput.isDown('moveLeft')).toBe(false);
    controls.dispose();
    GameInput.update([]);
  });

  it('cancels an unsampled touch without firing and keeps a second pointer independent', () => {
    vi.spyOn(GameContext, 'isMobileDevice', 'get').mockReturnValue(true);
    GameInput.activateContext('gameplay');
    const controls = new TouchControls();
    try {
      controls.draw();
      pointer('pointerdown', 1, controls.layout.shoot);
      pointer('pointerdown', 2, controls.layout.right);
      pointer('pointercancel', 1, controls.layout.shoot);
      GameInput.update([]);
      expect(GameInput.isDown('attack')).toBe(false);
      expect(GameInput.isDown('moveRight')).toBe(true);
    } finally { controls.dispose(); }
  });

  it('does not turn a disposed control into a pending action', () => {
    vi.spyOn(GameContext, 'isMobileDevice', 'get').mockReturnValue(true);
    GameInput.activateContext('gameplay');
    const controls = new TouchControls();
    controls.draw();
    pointer('pointerdown', 1, controls.layout.shoot);
    controls.dispose();
    GameInput.update([]);
    expect(GameInput.isDown('attack')).toBe(false);
  });

  it('keeps a held action active while a finger drifts inside its button', () => {
    vi.spyOn(GameContext, 'isMobileDevice', 'get').mockReturnValue(true);
    GameInput.activateContext('gameplay');
    const controls = new TouchControls();
    try {
      controls.draw();
      const shoot = controls.layout.shoot;
      pointer('pointerdown', 1, shoot);
      GameInput.update([]);
      pointer('pointermove', 1, { ...shoot, x: shoot.x + 10 });
      GameInput.update([]);
      expect(GameInput.isDown('attack')).toBe(true);
      pointer('pointerup', 1, shoot);
      GameInput.update([]);
      expect(GameInput.wasReleased('attack')).toBe(true);
    } finally { controls.dispose(); }
  });

  it('reflows controls inside safe areas after rotation', () => {
    vi.spyOn(GameContext, 'isMobileDevice', 'get').mockReturnValue(true);
    vi.spyOn(GameContext, 'safeAreaInsets', 'get').mockReturnValue({ top: 0, right: 44, bottom: 34, left: 44 });
    const controls = new TouchControls();
    try {
      for (const [width, height] of [[390, 844], [844, 390]]) {
        GameContext.gameDimensionsModel.setSize(width, height);
        const layout = controls.layout;
        for (const circle of [layout.left, layout.right, layout.up, layout.down, layout.shoot]) {
          expect(circle.x - circle.radius).toBeGreaterThanOrEqual(44);
          expect(circle.x + circle.radius).toBeLessThanOrEqual(width - 44);
          expect(circle.y + circle.radius).toBeLessThanOrEqual(height - 34);
        }
      }
    } finally { controls.dispose(); }
  });
});

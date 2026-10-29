import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameSelector } from './';
import { GameEvents, GameInput, GameLoader, SceneManager, type Atlas } from '../engine';

afterEach(async () => {
  await SceneManager.unload();
  for (const id of SceneManager.getRegisteredIds()) SceneManager.unregister(id);
  GameInput.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Managed arcade navigation', () => {
  it('repeats menu/game/menu navigation with one animation frame and no retained pointer subscriptions', async () => {
    const frames = new Map<number, FrameRequestCallback>();
    let nextId = 0;
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      frames.set(++nextId, callback);
      return nextId;
    });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => { frames.delete(id); });
    vi.spyOn(GameLoader, 'loadAll').mockResolvedValue();
    const image = { width: 1920, height: 1080, naturalWidth: 1920, naturalHeight: 1080 } as HTMLImageElement;
    vi.spyOn(GameLoader, 'getImage').mockReturnValue(image);
    vi.spyOn(GameLoader, 'getAtlas').mockReturnValue({
      getAnimation: (name: string) => ({
        name, frameRate: 8, loop: true,
        frames: [{ name, index: 0, x: 0, y: 0, width: 32, height: 32 }]
      })
    } as unknown as Atlas);
    const subscribe = GameEvents.addPointerDownListener.bind(GameEvents);
    let subscriptions = 0;
    vi.spyOn(GameEvents, 'addPointerDownListener').mockImplementation(listener => {
      subscriptions++;
      const remove = subscribe(listener);
      return () => { subscriptions--; remove(); };
    });
    const advance = () => {
      const pending = [...frames.values()];
      frames.clear();
      for (const callback of pending) callback(performance.now() + 16);
    };
    SceneManager.register('menu', () => new GameSelector());
    const opened = await SceneManager.goTo('menu');
    expect(SceneManager.error()).toBeUndefined();
    expect(opened).toBe(true);
    const menuSubscriptions = subscriptions;
    expect(menuSubscriptions).toBeGreaterThan(0);
    for (let cycle = 0; cycle < 3; cycle++) {
      expect(frames.size).toBe(1);
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      advance();
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter' }));
      await vi.waitFor(() => expect(SceneManager.activeId).toBe('game:SPACE HUNTERS'));
      expect(frames.size).toBe(1);
      SceneManager.setPaused(true);
      expect(SceneManager.state()).toBe('paused');
      SceneManager.setPaused(false);
      GameInput.setPointerAction(55, 'back', 1);
      advance();
      GameInput.setPointerAction(55, 'back', 0);
      await vi.waitFor(() => expect(SceneManager.activeId).toBe('menu'));
      expect(subscriptions).toBe(menuSubscriptions);
      expect(frames.size).toBe(1);
    }
    await SceneManager.unload();
    expect(frames.size).toBe(0);
    expect(subscriptions).toBe(0);
  });
});

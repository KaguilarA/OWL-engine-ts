import { describe, expect, it, vi } from 'vitest';
import { PhysicsDebugRenderer } from './';
import { GameContext, PhysicsWorld, RigidBody2D } from '../core';
import { Camera2D } from '../scene';

describe('PhysicsDebugRenderer', () => {
  it('draws rotated geometry and query hits under the scene camera, then restores canvas state', () => {
    const world = new PhysicsWorld();
    world.addBody(new RigidBody2D({ shape: { kind: 'box', width: 10, height: 4 }, angle: Math.PI / 4 }));
    const context = GameContext.context;
    const save = vi.spyOn(context, 'save'), restore = vi.spyOn(context, 'restore'), line = vi.spyOn(context, 'lineTo');
    const camera = new Camera2D();
    PhysicsDebugRenderer.draw(world, camera);
    const start = { x: -20, y: 0 }, end = { x: 20, y: 0 };
    PhysicsDebugRenderer.drawRay(start, end, world.raycast(start, end), camera);
    PhysicsDebugRenderer.drawArea({ x: -5, y: -5, width: 10, height: 10 }, camera);
    expect(line).toHaveBeenCalled();
    expect(restore.mock.calls.length).toBe(save.mock.calls.length);
    vi.restoreAllMocks();
  });

  it('restores the canvas when a drawing operation throws', () => {
    const context = GameContext.context;
    const restore = vi.spyOn(context, 'restore');
    vi.spyOn(context, 'strokeRect').mockImplementationOnce(() => { throw new Error('canvas unavailable'); });
    expect(() => PhysicsDebugRenderer.drawArea({ x: 0, y: 0, width: 10, height: 10 })).toThrow('canvas unavailable');
    expect(restore).toHaveBeenCalled();
    vi.restoreAllMocks();
  });
});

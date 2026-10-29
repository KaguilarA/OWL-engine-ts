import { describe, expect, it } from 'vitest';
import { SceneResources, Tilemap, TilemapCollider, WorldScene } from './';
import { PhysicsWorld, RigidBody2D } from '../core';
import { CircleBody } from '../entities';

function map(): Tilemap {
  return new Tilemap({ image: { width: 32, height: 16 } as CanvasImageSource, columns: 2,
    tileWidth: 16, tileHeight: 16, mapWidth: 3, mapHeight: 1, drawTileWidth: 10, drawTileHeight: 10 });
}

describe('Reactive TilemapCollider', () => {
  it('matches render coordinates and updates colliders through reactive cell, position, and signed-scale changes', () => {
    const world = new PhysicsWorld(), tiles = map();
    tiles.setTiles([1, 0, 2]);
    const terrain = new TilemapCollider(tiles, world);
    expect(terrain.bodies()).toHaveLength(2);
    expect(terrain.bodies()[0].bounds()).toEqual(tiles.getCellBounds(0, 0));
    tiles.setTile(1, 0, 1);
    expect(world.getBodies()).toHaveLength(3);
    tiles.dimensions.setPosition(10, 20);
    tiles.dimensions.setScale(-2, 2);
    expect(terrain.bodies()[0].bounds()).toEqual({ x: -10, y: 20, width: 20, height: 20 });
    expect(terrain.bodies()[2].bounds()).toEqual(tiles.getCellBounds(2, 0));
    tiles.dimensions.setScale(0);
    expect(world.getBodies()).toHaveLength(0);
    tiles.dimensions.setScale(1);
    expect(world.getBodies()).toHaveLength(3);
    terrain.dispose();
    tiles.fill(2);
    tiles.dimensions.setPosition(100, 100);
    expect(world.getBodies()).toHaveLength(0);
    expect(terrain.bodies()).toHaveLength(0);
  });

  it('combines terrain, a trigger tile, and movement without game-specific collision code', async () => {
    const world = new PhysicsWorld({ gravityY: 100, fixedTimeStep: 0.1, maxSubSteps: 20, restitution: 0 });
    const scene = new WorldScene(undefined, world), scope = new SceneResources(), tiles = map();
    tiles.setTiles([1, 2, 1]);
    const terrain = new TilemapCollider(tiles, world, { isSensor: tile => tile === 2, isOneWay: (tile, x) => tile === 1 && x === 2 });
    scope.own(() => terrain.dispose());
    const actor = new CircleBody(5, -10, 1);
    world.addBody(actor);
    let triggerEntries = 0;
    scope.own(world.onContact(event => {
      if (event.sensor && event.phase === 'begin' && (event.first === actor || event.second === actor)) triggerEntries++;
    }));
    scene.update(1);
    expect(actor.y).toBeCloseTo(-1);
    expect(actor.velocityY).toBeCloseTo(0);
    actor.setPosition(15, -1);
    scene.update(0.3);
    expect(actor.y).toBeGreaterThan(-1);
    expect(triggerEntries).toBe(1);
    await scope.dispose();
    expect(world.getBodies()).toEqual([actor]);
    scene.clear();
    expect(world.contacts()).toHaveLength(0);
    expect(world.getBodies()).toHaveLength(0);
  });

  it('leaves unrelated world bodies registered and does not replace valid geometry after rule failure', () => {
    const world = new PhysicsWorld(), tiles = map();
    const independent = new RigidBody2D({ type: 'static', x: 200, shape: { kind: 'circle', radius: 1 } });
    world.addBody(independent); tiles.setTile(0, 0, 1);
    let broken = false;
    const terrain = new TilemapCollider(tiles, world, { isSolid: tile => { if (broken) throw new Error('bad rule'); return tile > 0; } });
    const original = terrain.bodies()[0]; broken = true;
    expect(() => terrain.refresh()).toThrow('bad rule');
    expect(world.getBodies()).toEqual([independent, original]);
    terrain.dispose();
    expect(world.getBodies()).toEqual([independent]);
  });

  it('coalesces tile changes requested by contact-end callbacks without leaking replacement colliders', () => {
    const world = new PhysicsWorld(), tiles = map();
    tiles.setTiles([1, 1, 0]);
    const terrain = new TilemapCollider(tiles, world);
    const actor = new CircleBody(5, 5, 1, { sensor: true });
    world.addBody(actor); world.update(1 / 60);
    const unsubscribe = world.onContact(event => {
      if (event.phase === 'end') tiles.setTile(1, 0, 0);
    });
    tiles.setTile(0, 0, 0);
    expect(terrain.bodies()).toHaveLength(0);
    expect(world.getBodies()).toEqual([actor]);
    unsubscribe(); terrain.dispose();
  });
});

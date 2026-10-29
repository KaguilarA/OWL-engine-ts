import { describe, expect, it, vi } from 'vitest';
import { PhysicsGeometry, PhysicsWorld, RigidBody2D } from './';
import { CircleBody } from '../entities';
import type { PhysicsContactEvent, RigidBodyOptions } from '../interfaces';

function box(x: number, y: number, width: number, height: number, options: Omit<RigidBodyOptions, 'x' | 'y' | 'shape'> = {}): RigidBody2D {
  return new RigidBody2D({ ...options, x, y, shape: { kind: 'box', width, height } });
}

describe('RigidBody2D geometry and reactive state', () => {
  it('derives bounds and vertices from position and angle without mutable geometry copies', () => {
    const body = box(0, 0, 4, 2);
    const changed = vi.fn();
    const unsubscribe = body.bounds.effect(changed);
    body.setPosition(10, 20);
    expect(body.bounds()).toEqual({ x: 8, y: 19, width: 4, height: 2 });
    body.angle.set(Math.PI / 2);
    expect(body.bounds().width).toBeCloseTo(2);
    expect(body.bounds().height).toBeCloseTo(4);
    expect(body.vertices()[0].x).toBeCloseTo(11);
    expect(changed).toHaveBeenCalled();
    unsubscribe();
  });

  it('copies convex geometry and rejects concavity, repeated vertices, and invalid material settings', () => {
    const vertices = [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 0, y: 4 }];
    const body = new RigidBody2D({ shape: { kind: 'polygon', vertices } });
    vertices[0].x = 100;
    expect(body.vertices()[0].x).toBe(0);
    expect(Object.isFrozen(body.shape.vertices)).toBe(true);
    expect(() => new RigidBody2D({ shape: { kind: 'polygon', vertices: [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 1 }] } })).toThrow();
    expect(() => new RigidBody2D({ shape: { kind: 'polygon', vertices: [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 4 }] } })).toThrow();
    expect(() => box(0, 0, 1, 1, { mass: 0 })).toThrow();
    expect(() => box(0, 0, 1, 1, { mass: Number.MIN_VALUE })).toThrow();
    expect(() => box(0, 0, 1, 1, { layer: -1 })).toThrow();
    expect(() => box(0, 0, 1, 1, { restitution: 2 })).toThrow();
    expect(() => box(0, 0, 1, 1, { oneWay: true })).toThrow();
  });

  it('handles polygon winding, circle corners, and complete shape containment', () => {
    const points = [{ x: -4, y: -4 }, { x: 4, y: -4 }, { x: 0, y: 4 }];
    const first = new RigidBody2D({ shape: { kind: 'polygon', vertices: points } });
    const reversed = new RigidBody2D({ shape: { kind: 'polygon', vertices: [...points].reverse() } });
    const circle = new CircleBody(0, 0, 1);
    expect(PhysicsGeometry.contact(first, circle)?.depth).toBeGreaterThan(0);
    expect(PhysicsGeometry.contact(reversed, circle)?.depth).toBeCloseTo(PhysicsGeometry.contact(first, circle)!.depth);
    expect(PhysicsGeometry.contains(first, { x: 3.9, y: 3.9 })).toBe(false);
    const contained = PhysicsGeometry.contact(box(0, 0, 2, 2), box(0, 0, 20, 20));
    expect(contained?.depth).toBe(11);
  });
});

describe('PhysicsWorld body types and response', () => {
  it('preserves legacy circle collisions and conserves equal-mass elastic velocity', () => {
    const world = new PhysicsWorld({ fixedTimeStep: 0.1, restitution: 1 });
    const first = new CircleBody(-5, 0, 5), second = new CircleBody(5, 0, 5);
    first.setVelocity(10, 0); second.setVelocity(-10, 0);
    world.addBody(first); world.addBody(second); world.addBody(first);
    world.update(0.1);
    expect(world.getBodies()).toHaveLength(2);
    expect(first.velocityX).toBeCloseTo(-10);
    expect(second.velocityX).toBeCloseTo(10);
  });

  it('applies gravity only to dynamic bodies and ignores kinematic acceleration', () => {
    const world = new PhysicsWorld({ gravityY: 100, fixedTimeStep: 0.1 });
    const dynamic = box(0, 0, 1, 1), fixed = box(100, 0, 1, 1, { type: 'static' }), kinematic = box(200, 0, 1, 1, { type: 'kinematic' });
    fixed.setVelocity(0, 50); kinematic.setVelocity(0, 5); kinematic.motion.accelerationY.set(1000);
    for (const body of [dynamic, fixed, kinematic]) world.addBody(body);
    world.update(0.1);
    expect(dynamic.y).toBeCloseTo(0.5);
    expect(dynamic.velocityY).toBeCloseTo(10);
    expect(fixed.y).toBe(0);
    expect(kinematic.y).toBeCloseTo(0.5);
    expect(kinematic.velocityY).toBe(5);
  });

  it('uses inverse mass for elastic momentum transfer', () => {
    const world = new PhysicsWorld({ fixedTimeStep: 1, restitution: 1 });
    const heavy = new CircleBody(-10, 0, 1, { mass: 2 }), light = new CircleBody(10, 0, 1);
    heavy.setVelocity(100, 0);
    world.addBody(heavy); world.addBody(light); world.update(1);
    expect(heavy.velocityX).toBeCloseTo(100 / 3);
    expect(light.velocityX).toBeCloseTo(400 / 3);
    expect(2 * heavy.velocityX + light.velocityX).toBeCloseTo(200);
  });

  it('pushes a dynamic circle with a moving kinematic wall without changing the wall trajectory', () => {
    const world = new PhysicsWorld({ fixedTimeStep: 1, restitution: 0 });
    const circle = new CircleBody(0, 0, 1), wall = box(5, 0, 1, 10, { type: 'kinematic' });
    wall.setVelocity(-10, 0);
    world.addBody(circle); world.addBody(wall); world.update(1);
    expect(wall.x).toBeCloseTo(-5);
    expect(wall.velocityX).toBe(-10);
    expect(circle.x).toBeCloseTo(-6.5);
    expect(circle.velocityX).toBeCloseTo(-10);
  });

  it('prevents simultaneous registration in multiple scene worlds and releases ownership on removal', () => {
    const first = new PhysicsWorld(), second = new PhysicsWorld(), body = box(0, 0, 1, 1);
    first.addBody(body);
    expect(() => second.addBody(body)).toThrow('only one');
    first.removeBody(body);
    expect(() => second.addBody(body)).not.toThrow();
    second.clear();
    expect(second.getBodies()).toHaveLength(0);
  });

  it('bounds fixed-step work, validates settings, and rejects invalid time', () => {
    const world = new PhysicsWorld({ fixedTimeStep: 0.1, maxSubSteps: 2 });
    const body = box(0, 0, 1, 1); body.setVelocity(10, 0); world.addBody(body);
    world.update(1);
    expect(body.x).toBeCloseTo(2);
    expect(() => world.update(-1)).toThrow();
    expect(() => new PhysicsWorld({ maxCollisionPasses: 0 })).toThrow();
  });
});

describe('Continuous collision detection', () => {
  it.each(['circle', 'box', 'polygon'] as const)('stops a fast %s at a thin wall without distance-dependent substeps', kind => {
    const world = new PhysicsWorld({ restitution: 0 });
    const shape = kind === 'circle' ? { kind, radius: 1 } : kind === 'box' ? { kind, width: 2, height: 2 }
      : { kind, vertices: [{ x: -1, y: -1 }, { x: 1, y: -1 }, { x: 0, y: 1 }] };
    const body = new RigidBody2D({ x: -100, shape });
    const wall = box(0, 0, 0.02, 20, { type: 'static' });
    body.setVelocity(1e6, 0); world.addBody(body); world.addBody(wall); world.update(1 / 60);
    expect(body.bounds().x + body.bounds().width).toBeLessThanOrEqual(wall.bounds().x + 1e-6);
    expect(body.velocityX).toBeCloseTo(0);
    expect(world.contacts()).toHaveLength(1);
  });

  it('handles fast circle-circle impacts and does not block a grazing miss near a box corner', () => {
    const world = new PhysicsWorld({ fixedTimeStep: 1, restitution: 0 });
    const first = new CircleBody(-100, 0, 1), fixed = new CircleBody(0, 0, 1, { type: 'static' });
    first.setVelocity(1000, 0); world.addBody(first); world.addBody(fixed); world.update(1);
    expect(first.x).toBeCloseTo(-2);
    const corner = box(0, 0, 2, 2, { type: 'static' });
    const miss = new CircleBody(-5, 2.1, 1);
    expect(PhysicsGeometry.sweep(miss, corner, { x: 10, y: 0 }, { x: 0, y: 0 })).toBeUndefined();
  });

  it('conservatively stops remaining travel when the impact budget is exhausted', () => {
    const world = new PhysicsWorld({ fixedTimeStep: 1, restitution: 1, maxCollisionPasses: 1 });
    const body = new CircleBody(0, 0, 1); body.setVelocity(1000, 0);
    world.addBody(body); world.addBody(box(5, 0, 1, 10, { type: 'static' })); world.addBody(box(-5, 0, 1, 10, { type: 'static' }));
    world.update(1);
    expect(body.x).toBeCloseTo(3.5);
    expect(body.velocityX).toBeCloseTo(-1000);
  });
});

describe('Contacts, sensors, masks, and broad phase', () => {
  it('emits begin, stay, and end without moving overlapping static sensor pairs', () => {
    const world = new PhysicsWorld(), events: string[] = [];
    const sensor = new CircleBody(0, 0, 5, { type: 'static', sensor: true }), target = new CircleBody(0, 0, 1, { type: 'static' });
    world.onContact(event => events.push(event.phase));
    world.addBody(sensor); world.addBody(target);
    world.update(1 / 60); world.update(1 / 60);
    expect(target.x).toBe(0);
    expect(world.contacts()).toHaveLength(1);
    target.setPosition(20, 0); world.update(1 / 60);
    expect(events).toEqual(['begin', 'stay', 'end']);
  });

  it('reports a sensor crossed entirely within one fixed step without stopping the moving body', () => {
    const world = new PhysicsWorld({ fixedTimeStep: 0.1 }), events: PhysicsContactEvent[] = [];
    const body = new CircleBody(-100, 0, 1), sensor = box(0, 0, 0.1, 10, { type: 'static', sensor: true });
    body.setVelocity(10000, 0); world.addBody(body); world.addBody(sensor); world.onContact(event => events.push(event));
    world.update(0.1);
    expect(body.x).toBeCloseTo(900);
    expect(events.map(event => event.phase)).toEqual(['begin', 'end']);
    expect(events.every(event => event.sensor)).toBe(true);
    expect(world.contacts()).toHaveLength(0);
  });

  it('does not report sensors behind an earlier blocking wall', () => {
    const world = new PhysicsWorld({ fixedTimeStep: 1, restitution: 0 }), events: PhysicsContactEvent[] = [];
    const body = new CircleBody(-10, 0, 1); body.setVelocity(100, 0);
    world.addBody(body); world.addBody(box(0, 0, 1, 10, { type: 'static' })); world.addBody(box(10, 0, 1, 10, { type: 'static', sensor: true }));
    world.onContact(event => events.push(event)); world.update(1);
    expect(events.some(event => event.sensor)).toBe(false);
  });

  it('defers listener removals until the batch ends and emits end exactly once', () => {
    const world = new PhysicsWorld(), phases: string[] = [];
    const first = new CircleBody(0, 0, 1, { sensor: true }), second = new CircleBody(0, 0, 1);
    world.addBody(first); world.addBody(second);
    world.onContact(event => { phases.push(event.phase); if (event.phase === 'begin') world.removeBody(second); });
    world.update(1 / 60); world.update(1 / 60);
    expect(phases).toEqual(['begin', 'end']);
    expect(world.contacts()).toHaveLength(0);
  });

  it('honors both collision masks and handles unsigned high-bit categories', () => {
    const world = new PhysicsWorld();
    const first = new CircleBody(0, 0, 2, { layer: 1, mask: 2 }), second = new CircleBody(0, 0, 2, { layer: 4 });
    world.addBody(first); world.addBody(second); world.update(1 / 60);
    expect(first.x).toBe(0); expect(second.x).toBe(0); expect(world.contacts()).toHaveLength(0);
    const highBit = new CircleBody(50, 0, 1, { layer: 0x80000000 }); world.addBody(highBit);
    expect(world.queryPoint({ x: 50, y: 0 }, { mask: 0x80000000 })).toEqual([highBit]);
  });

  it('rejects spatially separated pairs before narrow-phase tests', () => {
    const world = new PhysicsWorld();
    for (let i = 0; i < 100; i++) world.addBody(new CircleBody(i * 10, 0, 1));
    world.update(1 / 60);
    expect(world.candidateCount()).toBe(0);
  });

  it('clears all registrations and contacts even when an end listener throws', () => {
    const world = new PhysicsWorld();
    world.addBody(new CircleBody(0, 0, 2, { sensor: true }));
    world.addBody(new CircleBody(0, 0, 1));
    world.update(1 / 60);
    const unsubscribe = world.onContact(event => { if (event.phase === 'end') throw new Error('listener failed'); });
    expect(() => world.clear()).toThrow('Physics contact listener failed');
    expect(world.getBodies()).toHaveLength(0);
    expect(world.contacts()).toHaveLength(0);
    unsubscribe();
  });

  it('defers world mutations requested by reactive motion effects until integration commits', () => {
    const world = new PhysicsWorld({ fixedTimeStep: 0.1 });
    const actor = new CircleBody(0, 0, 1), spawned = new CircleBody(100, 0, 1);
    actor.setVelocity(10, 0); world.addBody(actor);
    const unsubscribe = actor.motion.x.effect(() => { world.addBody(spawned); world.removeBody(actor); });
    world.update(0.1);
    expect(world.getBodies()).toEqual([spawned]);
    expect(spawned.x).toBe(100);
    unsubscribe();
  });

  it('rejects nested updates from contact callbacks without losing committed contact state', () => {
    const world = new PhysicsWorld();
    world.addBody(new CircleBody(0, 0, 1, { sensor: true })); world.addBody(new CircleBody(0, 0, 1));
    const unsubscribe = world.onContact(() => { world.update(1 / 60); });
    expect(() => world.update(1 / 60)).toThrow('Physics contact listener failed');
    expect(world.contacts()).toHaveLength(1);
    unsubscribe(); world.clear();
  });
});

describe('Queries and one-way platforms', () => {
  it('queries actual interiors rather than only bounds and respects query filters', () => {
    const world = new PhysicsWorld();
    const circle = new CircleBody(0, 0, 5, { sensor: true });
    world.addBody(circle);
    expect(world.queryPoint({ x: 4.9, y: 4.9 })).toHaveLength(0);
    expect(world.queryArea({ x: 4.9, y: 4.9, width: 1, height: 1 })).toHaveLength(0);
    expect(world.queryArea({ x: -1, y: -1, width: 2, height: 2 })).toEqual([circle]);
    expect(world.queryPoint({ x: 0, y: 0 }, { includeSensors: false })).toHaveLength(0);
    expect(() => world.raycast({ x: NaN, y: 0 }, { x: 0, y: 0 })).toThrow();
    expect(() => world.queryArea({ x: 0, y: 0, width: -1, height: 2 })).toThrow();
  });

  it('sorts segment hits, returns outward normals, and supports inside and zero-length origins', () => {
    const world = new PhysicsWorld();
    const circle = new CircleBody(5, 0, 1), wall = box(10, 0, 2, 2, { type: 'static' });
    world.addBody(wall); world.addBody(circle);
    const hits = world.raycast({ x: 0, y: 0 }, { x: 20, y: 0 });
    expect(hits.map(hit => hit.body)).toEqual([circle, wall]);
    expect(hits[0].distance).toBeCloseTo(4); expect(hits[0].normalX).toBeCloseTo(-1);
    expect(hits[1].fraction).toBeCloseTo(0.45);
    expect(world.raycast({ x: 10, y: 0 }, { x: 10, y: 0 })[0].fraction).toBe(0);
    expect(world.raycast({ x: 20, y: 0 }, { x: 0, y: 0 })[0].normalX).toBeCloseTo(1);
  });

  it('lands from above, stays grounded under gravity, and passes upward through a one-way platform', () => {
    const world = new PhysicsWorld({ fixedTimeStep: 0.1, restitution: 0, gravityY: 10 });
    const platform = box(0, 5, 10, 1, { type: 'static', oneWay: true });
    const falling = new CircleBody(0, 0, 1); falling.setVelocity(0, 100);
    world.addBody(platform); world.addBody(falling); world.update(0.1); world.update(0.1);
    expect(falling.y).toBeCloseTo(3.5);
    expect(falling.velocityY).toBeCloseTo(0);
    world.removeBody(falling);
    const rising = new CircleBody(0, 8, 1); rising.setVelocity(0, -100); world.addBody(rising); world.update(0.1);
    expect(rising.y).toBeLessThan(0);
    expect(world.contacts()).toHaveLength(0);
  });
});


describe('PhysicsWorld fixed-step preparation', () => {
  it('prepares each consumed step before motion and releases the subscription idempotently', () => {
    const world = new PhysicsWorld({ fixedTimeStep: 0.1, gravityY: 10 });
    const body = new CircleBody(0, 0, 1);
    world.addBody(body);
    const prepare = vi.fn((seconds: number) => { expect(seconds).toBe(0.1); body.setVelocity(2, body.velocityY); });
    const unsubscribe = world.onBeforeStep(prepare);
    world.update(0.05);
    expect(prepare).not.toHaveBeenCalled();
    world.update(0.2);
    expect(prepare).toHaveBeenCalledTimes(2);
    expect(body.x).toBeCloseTo(0.4);
    expect(body.y).toBeCloseTo(0.2);
    unsubscribe(); unsubscribe();
    world.update(0.1);
    expect(prepare).toHaveBeenCalledTimes(2);
  });

  it('allows registration during preparation, rejects nested updates, and survives callback failures', () => {
    const world = new PhysicsWorld({ fixedTimeStep: 0.1 });
    const body = new CircleBody(0, 0, 1);
    body.setVelocity(10, 0);
    const remove = world.onBeforeStep(() => {
      world.addBody(body);
      expect(() => world.update(0.1)).toThrow('nested');
    });
    world.update(0.1);
    expect(body.x).toBeCloseTo(1);
    remove();
    const failure = world.onBeforeStep(() => { throw new Error('preparation'); });
    const other = vi.fn();
    const stopOther = world.onBeforeStep(other);
    expect(() => world.update(0.1)).toThrow(AggregateError);
    expect(other).toHaveBeenCalledOnce();
    expect(body.x).toBeCloseTo(1);
    failure(); stopOther();
    world.update(0.1);
    expect(body.x).toBeCloseTo(2);
  });
});

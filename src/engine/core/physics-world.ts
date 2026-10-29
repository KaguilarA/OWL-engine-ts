import { computedValue, signalValue } from 'reactive-values';
import { PhysicsBroadPhase, PhysicsContactSolver, PhysicsGeometry, RigidBody2D } from './';
import type { CollisionRect, PhysicsContact, PhysicsContactEvent, PhysicsPoint, PhysicsQueryFilter, PhysicsRayHit, PhysicsWorldOptions } from '../interfaces';

/**
 * Scene-owned fixed-step translational simulation with continuous collision detection and contact lifecycle events.
 * @class PhysicsWorld
 */
export default class {
  /**
   * World gravity applied only to dynamic bodies.
   * @property {number} gravityY
   */
  public readonly gravityY: number;
  /**
   * Fixed integration interval in seconds.
   * @property {number} fixedTimeStep
   */
  public readonly fixedTimeStep: number;
  /**
   * Maximum fixed steps processed by an update before excess accumulated time is dropped.
   * @property {number} maxSubSteps
   */
  public readonly maxSubSteps: number;
  /**
   * Default coefficient of restitution when colliders do not override it.
   * @property {number} restitution
   */
  public readonly restitution: number;
  /**
   * Continuous impact budget; exhausted steps conservatively discard remaining motion.
   * @property {number} maxCollisionPasses
   */
  public readonly maxCollisionPasses: number;
  /**
   * Broad-phase candidate evaluations during the latest fixed step.
   * @property {SignalValue<number>} candidateCount
   */
  public readonly candidateCount = signalValue(0);
  /**
   * Reactive registration order; callers receive snapshots rather than a mutable array.
   * @property {SignalValue<readonly RigidBody2D[]>} bodies
   * @private
   */
  private readonly bodies = signalValue<readonly RigidBody2D[]>([]);
  /**
   * Reactive contact map, the sole source of published contact state.
   * @property {SignalValue<ReadonlyMap<string, PhysicsContact>>} contactState
   * @private
   */
  private readonly contactState = signalValue<ReadonlyMap<string, PhysicsContact>>(new Map());
  /**
   * Contact list derived from the reactive map without duplicating its mutable state.
   * @property {ComputedValue<readonly PhysicsContact[]>} contacts
   */
  public readonly contacts = computedValue<readonly PhysicsContact[]>(() => Object.freeze([...this.contactState().values()]), [this.contactState]);
  /**
   * Simulation time not yet consumed by a fixed step.
   * @property {SignalValue<number>} accumulatedTime
   * @private
   */
  private readonly accumulatedTime = signalValue(0);
  /**
   * Internal registration identities used only as stable pair keys.
   * @property {Map<RigidBody2D, number>} identities
   * @private
   */
  private readonly identities = new Map<RigidBody2D, number>();
  /**
   * Next internal identity; not an observable simulation value.
   * @property {number} nextIdentity
   * @private
   */
  private nextIdentity = 1;
  /**
   * World-local contact subscriptions.
   * @property {Set<Function>} listeners
   * @private
   */
  private readonly listeners = new Set<(event: PhysicsContactEvent) => void>();
  /**
   * Internal dispatch guard protecting event batches from reentrant registration changes.
   * @property {boolean} dispatching
   * @private
   */
  private dispatching = false;
  /**
   * Reactive update guard rejecting nested simulation calls.
   * @property {SignalValue<boolean>} updating
   * @private
   */
  private readonly updating = signalValue(false);
  /**
   * Reactive integration stage; registrations requested by motion effects wait for its committed batch.
   * @property {SignalValue<boolean>} stepping
   * @private
   */
  private readonly stepping = signalValue(false);
  /**
   * Deferred listener-requested registration operations.
   * @property {Array<Function>} mutations
   * @private
   */
  private readonly mutations: Array<() => void> = [];

  /**
   * Creates an independent physics world with validated immutable solver configuration.
   * @param {PhysicsWorldOptions} [options] Gravity, stepping, restitution, and impact limits.
   * @returns {void}
   */
  public constructor(options: PhysicsWorldOptions = {}) {
    this.gravityY = options.gravityY ?? 0;
    this.fixedTimeStep = options.fixedTimeStep ?? 1 / 60;
    this.maxSubSteps = options.maxSubSteps ?? 5;
    this.restitution = options.restitution ?? 0.82;
    this.maxCollisionPasses = options.maxCollisionPasses ?? 16;
    if (!Number.isFinite(this.gravityY) || !Number.isFinite(this.fixedTimeStep) || this.fixedTimeStep <= 0
      || !Number.isInteger(this.maxSubSteps) || this.maxSubSteps <= 0 || !Number.isInteger(this.maxCollisionPasses) || this.maxCollisionPasses <= 0
      || !Number.isFinite(this.restitution) || this.restitution < 0 || this.restitution > 1) throw new RangeError('Invalid physics world configuration.');
  }

  /**
   * Registers a body once; listener-requested additions are deferred until the event batch ends.
   * @param {RigidBody2D} body Collider owned by this scene.
   * @returns {void}
   */
  public addBody(body: RigidBody2D): void {
    if (this.dispatching || this.stepping()) { this.mutations.push(() => this.addBody(body)); return; }
    if (this.bodies().includes(body)) return;
    body.attachWorld(this);
    this.identities.set(body, this.nextIdentity++);
    this.bodies.set([...this.bodies(), body]);
  }

  /**
   * Removes a registered collider and emits end for every retained contact involving it.
   * @param {RigidBody2D} body Collider to unregister.
   * @returns {boolean} Whether the collider was registered when removal was requested.
   */
  public removeBody(body: RigidBody2D): boolean {
    if (!this.bodies().includes(body)) return false;
    if (this.dispatching || this.stepping()) { this.mutations.push(() => this.removeBody(body)); return true; }
    this.bodies.set(this.bodies().filter(value => value !== body));
    body.detachWorld(this);
    const next = new Map(this.contactState()), ended: PhysicsContactEvent[] = [];
    for (const [key, contact] of next) if (contact.first === body || contact.second === body) {
      next.delete(key); ended.push({ ...contact, phase: 'end', sensor: contact.first.sensor || contact.second.sensor });
    }
    this.identities.delete(body);
    this.contactState.set(next);
    this.emit(ended);
    return true;
  }

  /**
   * Returns a detached registration snapshot, preserving legacy CircleBody registration support.
   * @returns {readonly RigidBody2D[]} Bodies in registration order.
   */
  public getBodies(): readonly RigidBody2D[] { return this.bodies().slice(); }

  /**
   * Subscribes to begin, stay, and end after each committed fixed step.
   * @param {Function} listener Callback receiving immutable contact event snapshots.
   * @returns {Function} Idempotent unsubscribe callback.
   */
  public onContact(listener: (event: PhysicsContactEvent) => void): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  /**
   * Advances bounded fixed steps and preserves only the fractional unconsumed remainder on overload.
   * @param {number} deltaSeconds Finite, nonnegative elapsed duration.
   * @returns {void}
   */
  public update(deltaSeconds: number): void {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0) throw new RangeError('Physics delta seconds must be finite and non-negative.');
    if (this.updating()) throw new Error('Physics updates cannot be nested.');
    this.updating.set(true);
    try {
      this.accumulatedTime.set(this.accumulatedTime() + deltaSeconds);
      let steps = 0;
      while (this.accumulatedTime() + 1e-12 >= this.fixedTimeStep && steps < this.maxSubSteps) {
        this.accumulatedTime.set(Math.max(0, this.accumulatedTime() - this.fixedTimeStep));
        this.stepping.set(true);
        try { this.step(this.fixedTimeStep); }
        finally { this.stepping.set(false); this.flushMutations(); }
        steps++;
      }
      if (steps === this.maxSubSteps && this.accumulatedTime() >= this.fixedTimeStep) this.accumulatedTime.set(this.accumulatedTime() % this.fixedTimeStep);
    } finally { this.updating.set(false); }
  }

  /**
   * Removes all bodies and retained contacts while keeping subscriptions available for world reuse.
   * @returns {void}
   */
  public clear(): void {
    if (this.dispatching || this.stepping()) { this.mutations.push(() => this.clear()); return; }
    const ended = [...this.contactState().values()].map(contact => ({ ...contact, phase: 'end' as const, sensor: contact.first.sensor || contact.second.sensor }));
    for (const body of this.bodies()) body.detachWorld(this);
    this.identities.clear();
    this.bodies.set([]);
    this.contactState.set(new Map());
    this.accumulatedTime.set(0);
    this.candidateCount.set(0);
    this.emit(ended);
  }

  /**
   * Selects actual collider interiors containing a world point.
   * @param {PhysicsPoint} point Finite world-space query position.
   * @param {PhysicsQueryFilter} [filter] Category, sensor, and application selection.
   * @returns {readonly RigidBody2D[]} Matching colliders in registration order.
   */
  public queryPoint(point: PhysicsPoint, filter: PhysicsQueryFilter = {}): readonly RigidBody2D[] {
    this.validatePoint(point);
    return this.select(filter).filter(body => PhysicsGeometry.contains(body, point));
  }

  /**
   * Tests true shape overlap against a positive world-space rectangle.
   * @param {CollisionRect} bounds Axis-aligned query area.
   * @param {PhysicsQueryFilter} [filter] Category, sensor, and application selection.
   * @returns {readonly RigidBody2D[]} Colliders touching or overlapping the query shape.
   */
  public queryArea(bounds: CollisionRect, filter: PhysicsQueryFilter = {}): readonly RigidBody2D[] {
    this.validatePoint(bounds);
    const probe = new RigidBody2D({ x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2, type: 'static', shape: { kind: 'box', width: bounds.width, height: bounds.height } });
    return this.select(filter).filter(body => !!PhysicsGeometry.contact(body, probe));
  }

  /**
   * Intersects a finite segment with every selected collider and sorts first hits by distance.
   * @param {PhysicsPoint} start Segment origin.
   * @param {PhysicsPoint} end Segment endpoint.
   * @param {PhysicsQueryFilter} [filter] Category, sensor, and application selection.
   * @returns {readonly PhysicsRayHit[]} Hit snapshots, nearest first; inside origins return fraction zero.
   */
  public raycast(start: PhysicsPoint, end: PhysicsPoint, filter: PhysicsQueryFilter = {}): readonly PhysicsRayHit[] {
    this.validatePoint(start); this.validatePoint(end);
    return this.select(filter).flatMap(body => { const hit = PhysicsGeometry.raycast(body, start, end); return hit ? [hit] : []; }).sort((a, b) => a.fraction - b.fraction);
  }

  /**
   * Validates and applies query-only filtering independently from contact masks.
   * @param {PhysicsQueryFilter} filter Query category and sensor policy.
   * @returns {readonly RigidBody2D[]} Selected registration snapshot.
   * @private
   */
  private select(filter: PhysicsQueryFilter): readonly RigidBody2D[] {
    const mask = filter.mask ?? 0xffffffff;
    if (!Number.isInteger(mask) || mask < 0 || mask > 0xffffffff) throw new RangeError('Query mask must be an unsigned bitset.');
    return this.bodies().filter(body => (body.layer & mask) !== 0 && (filter.includeSensors !== false || !body.sensor) && (!filter.predicate || filter.predicate(body)));
  }

  /**
   * Rejects non-finite query coordinates before geometric operations.
   * @param {PhysicsPoint} point Coordinates to validate.
   * @returns {void}
   * @private
   */
  private validatePoint(point: PhysicsPoint): void {
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) throw new RangeError('Query coordinates must be finite.');
  }

  /**
   * Generates broad-phase candidates and accumulates observable diagnostic counts.
   * @param {ReadonlyMap<RigidBody2D, PhysicsPoint>} [moves] Proposed continuous displacements.
   * @returns {Array<readonly [RigidBody2D, RigidBody2D]>} Mask-compatible candidates.
   * @private
   */
  private pairs(moves?: ReadonlyMap<RigidBody2D, PhysicsPoint>): Array<readonly [RigidBody2D, RigidBody2D]> {
    const pairs = PhysicsBroadPhase.pairs(this.bodies(), moves);
    this.candidateCount.set(this.candidateCount() + pairs.length);
    return pairs;
  }

  /**
   * Integrates forces once, advances to continuous impacts, then commits final contact state.
   * @param {number} seconds Fixed-step duration.
   * @returns {void}
   * @private
   */
  private step(seconds: number): void {
    this.candidateCount.set(0);
    const starts = new Map(this.bodies().map(body => [body, { x: body.x, y: body.y }]));
    const touched = new Map<string, PhysicsContact>();
    for (let pass = 0; pass < 4; pass++) for (const [first, second] of this.pairs()) {
      const contact = PhysicsGeometry.contact(first, second);
      if (contact && this.accepts(contact, starts)) {
        touched.set(this.key(contact), contact);
        PhysicsContactSolver.resolve(contact, this.restitution);
      }
    }
    let moves = new Map<RigidBody2D, PhysicsPoint>();
    for (const body of this.bodies()) {
      const x = body.x, y = body.y;
      body.update(seconds, this.gravityY);
      moves.set(body, { x: body.x - x, y: body.y - y });
      body.setPosition(x, y);
    }
    let remaining = seconds;
    for (let pass = 0; pass < this.maxCollisionPasses && remaining > 1e-12; pass++) {
      const sweeps = this.pairs(moves).flatMap(([first, second]) => {
        const hit = PhysicsGeometry.sweep(first, second, moves.get(first)!, moves.get(second)!);
        const contact = hit && { first, second, normalX: hit.normalX, normalY: hit.normalY, depth: 0 };
        return hit && contact && this.accepts(contact, starts) ? [{ contact, fraction: hit.fraction }] : [];
      });
      const blocking = sweeps.filter(({ contact }) => {
        const a = moves.get(contact.first)!, b = moves.get(contact.second)!;
        return !contact.first.sensor && !contact.second.sensor && (contact.first.inverseMass + contact.second.inverseMass) > 0
          && (a.x - b.x) * contact.normalX + (a.y - b.y) * contact.normalY > PhysicsGeometry.epsilon;
      });
      const fraction = blocking.reduce((minimum, hit) => Math.min(minimum, hit.fraction), 1);
      for (const body of this.bodies()) {
        const move = moves.get(body)!;
        body.setPosition(body.x + move.x * fraction, body.y + move.y * fraction);
      }
      for (const hit of sweeps) if (hit.fraction <= fraction + PhysicsGeometry.epsilon) touched.set(this.key(hit.contact), hit.contact);
      for (const hit of blocking) if (hit.fraction <= fraction + PhysicsGeometry.epsilon) PhysicsContactSolver.resolve(hit.contact, this.restitution);
      if (!blocking.length || fraction >= 1) break;
      remaining *= 1 - fraction;
      moves = new Map(this.bodies().map(body => [body, {
        x: body.bodyType === 'static' ? 0 : body.velocityX * remaining,
        y: body.bodyType === 'static' ? 0 : body.velocityY * remaining
      }]));
    }
    for (let pass = 0; pass < 4; pass++) for (const [first, second] of this.pairs()) {
      const contact = PhysicsGeometry.contact(first, second);
      if (contact && this.accepts(contact, starts)) PhysicsContactSolver.resolve(contact, this.restitution);
    }
    const current = new Map<string, PhysicsContact>();
    for (const [first, second] of this.pairs()) {
      const contact = PhysicsGeometry.contact(first, second);
      if (contact && this.accepts(contact, starts)) current.set(this.key(contact), Object.freeze(contact));
    }
    this.publish(current, touched);
  }

  /**
   * Applies upper-face-only platform policy using start-of-step geometry and relative velocity.
   * @param {PhysicsContact} contact Candidate manifold.
   * @param {ReadonlyMap<RigidBody2D, PhysicsPoint>} starts Body origins before the current step.
   * @returns {boolean} Whether the pair can produce a contact this step.
   * @private
   */
  private accepts(contact: PhysicsContact, starts: ReadonlyMap<RigidBody2D, PhysicsPoint>): boolean {
    if (contact.first.sensor || contact.second.sensor) return true;
    for (const platform of [contact.first, contact.second]) {
      if (!platform.oneWay) continue;
      const other = platform === contact.first ? contact.second : contact.first;
      const startOther = starts.get(other)!, startPlatform = starts.get(platform)!;
      const bounds = other.bounds(), top = platform.bounds().y + startPlatform.y - platform.y;
      const previousBottom = bounds.y + bounds.height + startOther.y - other.y;
      const normalY = platform === contact.second ? contact.normalY : -contact.normalY;
      const otherSpeed = other.bodyType === 'static' ? 0 : other.velocityY;
      const platformSpeed = platform.bodyType === 'static' ? 0 : platform.velocityY;
      if (normalY < 0.5 || previousBottom > top + 1e-6 || otherSpeed - platformSpeed < -1e-8) return false;
    }
    return true;
  }

  /**
   * Creates a stable, orientation-independent key from internal registration identities.
   * @param {PhysicsContact} contact Registered collider pair.
   * @returns {string} Pair identity local to this world.
   * @private
   */
  private key(contact: PhysicsContact): string {
    const first = this.identities.get(contact.first)!, second = this.identities.get(contact.second)!;
    return first < second ? `${first}:${second}` : `${second}:${first}`;
  }

  /**
   * Publishes final contacts and generates deterministic lifecycle events, including transient crossings.
   * @param {ReadonlyMap<string, PhysicsContact>} current Contacts retained at the end of the step.
   * @param {ReadonlyMap<string, PhysicsContact>} touched Contacts crossed or initially overlapping during the step.
   * @returns {void}
   * @private
   */
  private publish(current: ReadonlyMap<string, PhysicsContact>, touched: ReadonlyMap<string, PhysicsContact>): void {
    const previous = this.contactState(), events: PhysicsContactEvent[] = [];
    for (const [key, contact] of current) events.push({ ...contact, phase: previous.has(key) ? 'stay' : 'begin', sensor: contact.first.sensor || contact.second.sensor });
    for (const [key, contact] of previous) if (!current.has(key)) events.push({ ...contact, phase: 'end', sensor: contact.first.sensor || contact.second.sensor });
    for (const [key, contact] of touched) if (!current.has(key) && !previous.has(key)) {
      const sensor = contact.first.sensor || contact.second.sensor;
      events.push({ ...contact, phase: 'begin', sensor }, { ...contact, phase: 'end', sensor });
    }
    this.contactState.set(new Map(current));
    this.emit(events);
  }

  /**
   * Delivers a committed batch before applying listener-requested registration mutations.
   * @param {readonly PhysicsContactEvent[]} events Fixed-step lifecycle events.
   * @returns {void}
   * @throws {AggregateError} After all listeners and deferred operations run, if any failed.
   * @private
   */
  private emit(events: readonly PhysicsContactEvent[]): void {
    if (!events.length) return;
    const failures: unknown[] = [];
    this.dispatching = true;
    try {
      for (const event of events) for (const listener of [...this.listeners]) {
        try { listener(Object.freeze(event)); } catch (error) { failures.push(error); }
      }
    } finally {
      this.dispatching = false;
      if (!this.stepping()) { try { this.flushMutations(); } catch (error) { failures.push(error); } }
    }
    if (failures.length) throw new AggregateError(failures, 'Physics contact listener failed.');
  }

  /**
   * Applies registrations requested by reactive effects or contact listeners after integration commits.
   * @returns {void}
   * @throws {AggregateError} After all pending operations are attempted, if any failed.
   * @private
   */
  private flushMutations(): void {
    const failures: unknown[] = [];
    for (const mutation of this.mutations.splice(0)) {
      try { mutation(); } catch (error) { failures.push(error); }
    }
    if (failures.length) throw new AggregateError(failures, 'Deferred physics registration failed.');
  }
}

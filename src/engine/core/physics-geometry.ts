import type { RigidBody2D } from './';
import type { CollisionRect, PhysicsContact, PhysicsImpact, PhysicsPlane, PhysicsPoint, PhysicsRayHit, PhysicsShape } from '../interfaces';

/**
 * Stateless convex geometry service for overlap, segment intersection, and linear continuous collision detection.
 * @class PhysicsGeometry
 */
export default (class {
  /**
   * Sole reusable geometry implementation.
   * @property {PhysicsGeometry} instance
   */
  public static readonly instance = new this();
  /**
   * Small geometric tolerance used for touching contacts and parallel planes.
   * @property {number} epsilon
   */
  public readonly epsilon = 1e-8;

  /**
   * Restricts this stateless service to its shared instance.
   * @constructor
   * @returns {void}
   * @private
   */
  private constructor() {}

  /**
   * Validates geometry and copies vertices so caller mutations cannot invalidate the collider.
   * @param {PhysicsShape} shape Circle, box, or strictly convex polygon description.
   * @returns {PhysicsShape} Deeply frozen validated geometry.
   * @throws {RangeError} For degenerate, concave, unordered, or non-finite geometry.
   */
  public copyShape(shape: PhysicsShape): PhysicsShape {
    const positive = (value: number | undefined) => value !== undefined && Number.isFinite(value) && value > 0;
    if (shape.kind === 'circle' && positive(shape.radius)) return Object.freeze({ kind: 'circle', radius: shape.radius });
    if (shape.kind === 'box' && positive(shape.width) && positive(shape.height)) return Object.freeze({ kind: 'box', width: shape.width, height: shape.height });
    if (shape.kind !== 'polygon' || !shape.vertices || shape.vertices.length < 3) throw new RangeError('Invalid collider dimensions or polygon vertex count.');
    const vertices = shape.vertices.map(point => Object.freeze({ x: point.x, y: point.y }));
    if (vertices.some(point => !Number.isFinite(point.x) || !Number.isFinite(point.y))) throw new RangeError('Polygon coordinates must be finite.');
    let winding = 0;
    for (let i = 0; i < vertices.length; i++) {
      const a = vertices[i], b = vertices[(i + 1) % vertices.length];
      for (let j = 0; j < vertices.length; j++) {
        if (j === i || j === (i + 1) % vertices.length) continue;
        const point = vertices[j];
        const cross = (b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x);
        if (Math.abs(cross) <= this.epsilon || (winding && Math.sign(cross) !== winding)) throw new RangeError('Polygon must be strictly convex with ordered, distinct vertices.');
        winding = Math.sign(cross);
      }
    }
    return Object.freeze({ kind: 'polygon', vertices: Object.freeze(vertices) });
  }

  /**
   * Transforms polygon or box boundary vertices into world coordinates.
   * @param {RigidBody2D} body Collider whose current position and orientation are read.
   * @returns {readonly PhysicsPoint[]} Ordered world vertices, or an empty array for circles.
   */
  public vertices(body: RigidBody2D): readonly PhysicsPoint[] {
    if (!Number.isFinite(body.angle()) || (body.oneWay && body.angle() !== 0)) throw new RangeError('Invalid collider angle or rotated one-way platform.');
    if (body.shape.kind === 'circle') return [];
    const halfWidth = (body.shape.width ?? 0) / 2, halfHeight = (body.shape.height ?? 0) / 2;
    const local = body.shape.kind === 'box'
      ? [{ x: -halfWidth, y: -halfHeight }, { x: halfWidth, y: -halfHeight }, { x: halfWidth, y: halfHeight }, { x: -halfWidth, y: halfHeight }]
      : body.shape.vertices!;
    const cosine = Math.cos(body.angle()), sine = Math.sin(body.angle());
    return local.map(point => ({ x: body.x + point.x * cosine - point.y * sine, y: body.y + point.x * sine + point.y * cosine }));
  }

  /**
   * Computes the tight axis-aligned bounds of the collider's current geometry.
   * @param {RigidBody2D} body Collider to bound.
   * @returns {CollisionRect} World-space bounding rectangle.
   */
  public bounds(body: RigidBody2D): CollisionRect {
    if (![body.x, body.y, body.angle()].every(Number.isFinite)) throw new RangeError('Collider transforms must be finite.');
    if (body.shape.kind === 'circle') {
      const radius = body.shape.radius!;
      return { x: body.x - radius, y: body.y - radius, width: radius * 2, height: radius * 2 };
    }
    const vertices = body.vertices();
    const xs = vertices.map(point => point.x), ys = vertices.map(point => point.y);
    const x = Math.min(...xs), y = Math.min(...ys);
    return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
  }

  /**
   * Computes a minimum-translation manifold using separating axes, including containment.
   * @param {RigidBody2D} first First collider.
   * @param {RigidBody2D} second Second collider.
   * @returns {PhysicsContact | undefined} Touching or overlapping contact, absent when separated.
   */
  public contact(first: RigidBody2D, second: RigidBody2D): PhysicsContact | undefined {
    const a = first.vertices(), b = second.vertices();
    if (!a.length && !b.length) {
      const dx = second.x - first.x, dy = second.y - first.y, distance = Math.hypot(dx, dy);
      const depth = first.shape.radius! + second.shape.radius! - distance;
      return depth < -this.epsilon ? undefined : { first, second, normalX: distance ? dx / distance : 1, normalY: distance ? dy / distance : 0, depth: Math.max(0, depth) };
    }
    const axes = [...this.axes(a), ...this.axes(b)];
    if (!a.length || !b.length) {
      const circle = a.length ? second : first, polygon = a.length ? a : b;
      const nearest = polygon.reduce((best, point) => Math.hypot(point.x - circle.x, point.y - circle.y) < Math.hypot(best.x - circle.x, best.y - circle.y) ? point : best);
      const dx = nearest.x - circle.x, dy = nearest.y - circle.y, length = Math.hypot(dx, dy);
      if (length > this.epsilon) axes.push({ x: dx / length, y: dy / length });
    }
    let depth = Infinity, normalX = 0, normalY = 0;
    for (const axis of axes) {
      const [minA, maxA] = this.project(first, a, axis), [minB, maxB] = this.project(second, b, axis);
      const positive = maxA - minB, negative = maxB - minA;
      if (positive < -this.epsilon || negative < -this.epsilon) return undefined;
      const overlap = Math.min(positive, negative);
      if (overlap < depth) {
        depth = overlap;
        const sign = positive <= negative ? 1 : -1;
        normalX = axis.x * sign; normalY = axis.y * sign;
      }
    }
    return { first, second, normalX, normalY, depth: Math.max(0, depth) };
  }

  /**
   * Tests a point against the actual collider rather than just its bounding rectangle.
   * @param {RigidBody2D} body Collider to test.
   * @param {PhysicsPoint} point World-space query position.
   * @returns {boolean} Whether the point is inside or on the boundary.
   */
  public contains(body: RigidBody2D, point: PhysicsPoint): boolean {
    if (body.shape.kind === 'circle') return Math.hypot(point.x - body.x, point.y - body.y) <= body.shape.radius! + this.epsilon;
    return this.planes(body.vertices()).every(plane => (point.x - plane.x) * plane.normalX + (point.y - plane.y) * plane.normalY <= this.epsilon);
  }

  /**
   * Intersects a finite segment with a collider, returning fraction zero when starting inside.
   * @param {RigidBody2D} body Queried collider.
   * @param {PhysicsPoint} start Segment origin.
   * @param {PhysicsPoint} end Segment endpoint.
   * @returns {PhysicsRayHit | undefined} First hit with an outward surface normal.
   */
  public raycast(body: RigidBody2D, start: PhysicsPoint, end: PhysicsPoint): PhysicsRayHit | undefined {
    const dx = end.x - start.x, dy = end.y - start.y;
    const impact = body.shape.kind === 'circle'
      ? this.rayCircle(start, { x: dx, y: dy }, { x: body.x, y: body.y }, body.shape.radius!)
      : this.rayPolygon(start, { x: dx, y: dy }, body.vertices());
    return impact && { ...impact, body, x: start.x + dx * impact.fraction, y: start.y + dy * impact.fraction, distance: Math.hypot(dx, dy) * impact.fraction };
  }

  /**
   * Finds exact first contact for fixed-orientation colliders moving linearly relative to one another.
   * @param {RigidBody2D} first First collider at its starting position.
   * @param {RigidBody2D} second Second collider at its starting position.
   * @param {PhysicsPoint} firstMove First collider's proposed displacement.
   * @param {PhysicsPoint} secondMove Second collider's proposed displacement.
   * @returns {PhysicsImpact | undefined} First contact fraction and first-to-second normal.
   */
  public sweep(first: RigidBody2D, second: RigidBody2D, firstMove: PhysicsPoint, secondMove: PhysicsPoint): PhysicsImpact | undefined {
    const existing = this.contact(first, second);
    if (existing) return { fraction: 0, normalX: existing.normalX, normalY: existing.normalY };
    const move = { x: firstMove.x - secondMove.x, y: firstMove.y - secondMove.y };
    if (first.shape.kind === 'circle' && second.shape.kind === 'circle') {
      const hit = this.rayCircle({ x: first.x, y: first.y }, move, { x: second.x, y: second.y }, first.shape.radius! + second.shape.radius!);
      return hit && { fraction: hit.fraction, normalX: -hit.normalX, normalY: -hit.normalY };
    }
    if (first.shape.kind === 'circle') return this.sweepCircle(first, second, move);
    if (second.shape.kind === 'circle') {
      const hit = this.sweepCircle(second, first, { x: -move.x, y: -move.y });
      return hit && { fraction: hit.fraction, normalX: -hit.normalX, normalY: -hit.normalY };
    }
    const a = first.vertices(), b = second.vertices();
    let enter = 0, exit = 1, normalX = 0, normalY = 0;
    for (const axis of [...this.axes(a), ...this.axes(b)]) {
      const [minA, maxA] = this.project(first, a, axis), [minB, maxB] = this.project(second, b, axis);
      const speed = move.x * axis.x + move.y * axis.y;
      if (Math.abs(speed) < this.epsilon) {
        if (maxA < minB || maxB < minA) return undefined;
        continue;
      }
      const firstTime = (minB - maxA) / speed, lastTime = (maxB - minA) / speed;
      const entry = Math.min(firstTime, lastTime), leave = Math.max(firstTime, lastTime);
      if (entry > enter) { enter = entry; normalX = axis.x * Math.sign(speed); normalY = axis.y * Math.sign(speed); }
      exit = Math.min(exit, leave);
      if (enter > exit + this.epsilon) return undefined;
    }
    return enter >= 0 && enter <= 1 && exit >= 0 ? { fraction: enter, normalX, normalY } : undefined;
  }

  /**
   * Builds unit edge normals for separating-axis tests.
   * @param {readonly PhysicsPoint[]} vertices Ordered polygon boundary.
   * @returns {PhysicsPoint[]} Unit normals perpendicular to each edge.
   * @private
   */
  private axes(vertices: readonly PhysicsPoint[]): PhysicsPoint[] {
    return vertices.map((point, index) => {
      const next = vertices[(index + 1) % vertices.length], dx = next.x - point.x, dy = next.y - point.y;
      const length = Math.hypot(dx, dy);
      return { x: -dy / length, y: dx / length };
    });
  }

  /**
   * Projects a circle or polygon onto one unit axis.
   * @param {RigidBody2D} body Collider supplying circle position and radius.
   * @param {readonly PhysicsPoint[]} vertices World polygon vertices, empty for circles.
   * @param {PhysicsPoint} axis Unit projection axis.
   * @returns {[number, number]} Minimum and maximum projection values.
   * @private
   */
  private project(body: RigidBody2D, vertices: readonly PhysicsPoint[], axis: PhysicsPoint): [number, number] {
    if (!vertices.length) {
      const center = body.x * axis.x + body.y * axis.y, radius = body.shape.radius!;
      return [center - radius, center + radius];
    }
    const values = vertices.map(point => point.x * axis.x + point.y * axis.y);
    return [Math.min(...values), Math.max(...values)];
  }

  /**
   * Computes outward planes for either polygon winding without changing vertex order.
   * @param {readonly PhysicsPoint[]} vertices Ordered world polygon boundary.
   * @returns {PhysicsPlane[]} Edge origins and outward normals.
   * @private
   */
  private planes(vertices: readonly PhysicsPoint[]): PhysicsPlane[] {
    const area = vertices.reduce((sum, point, index) => { const next = vertices[(index + 1) % vertices.length]; return sum + point.x * next.y - next.x * point.y; }, 0);
    return vertices.map((point, index) => {
      const next = vertices[(index + 1) % vertices.length], dx = next.x - point.x, dy = next.y - point.y;
      const length = Math.hypot(dx, dy), sign = area > 0 ? 1 : -1;
      return { ...point, normalX: dy / length * sign, normalY: -dx / length * sign };
    });
  }

  /**
   * Solves segment versus circle using the quadratic entry root.
   * @param {PhysicsPoint} start Segment origin.
   * @param {PhysicsPoint} move Complete segment displacement.
   * @param {PhysicsPoint} center Circle center.
   * @param {number} radius Circle radius.
   * @returns {PhysicsImpact | undefined} Entry fraction and outward normal.
   * @private
   */
  private rayCircle(start: PhysicsPoint, move: PhysicsPoint, center: PhysicsPoint, radius: number): PhysicsImpact | undefined {
    const dx = start.x - center.x, dy = start.y - center.y, lengthSquared = move.x ** 2 + move.y ** 2;
    const outside = dx * dx + dy * dy - radius * radius;
    if (outside <= this.epsilon) {
      const length = Math.hypot(move.x, move.y);
      return { fraction: 0, normalX: length ? -move.x / length : 0, normalY: length ? -move.y / length : 0 };
    }
    if (!lengthSquared) return undefined;
    const projection = dx * move.x + dy * move.y, discriminant = projection ** 2 - lengthSquared * outside;
    if (discriminant < 0) return undefined;
    const fraction = (-projection - Math.sqrt(discriminant)) / lengthSquared;
    if (fraction < 0 || fraction > 1) return undefined;
    const x = dx + move.x * fraction, y = dy + move.y * fraction, length = Math.hypot(x, y);
    return { fraction, normalX: x / length, normalY: y / length };
  }

  /**
   * Clips a segment against a convex polygon's outward half-planes.
   * @param {PhysicsPoint} start Segment origin.
   * @param {PhysicsPoint} move Complete segment displacement.
   * @param {readonly PhysicsPoint[]} vertices Ordered polygon boundary.
   * @returns {PhysicsImpact | undefined} First entry and outward normal.
   * @private
   */
  private rayPolygon(start: PhysicsPoint, move: PhysicsPoint, vertices: readonly PhysicsPoint[]): PhysicsImpact | undefined {
    let enter = 0, exit = 1;
    const length = Math.hypot(move.x, move.y);
    let normalX = length ? -move.x / length : 0, normalY = length ? -move.y / length : 0;
    for (const plane of this.planes(vertices)) {
      const distance = (plane.x - start.x) * plane.normalX + (plane.y - start.y) * plane.normalY;
      const speed = move.x * plane.normalX + move.y * plane.normalY;
      if (Math.abs(speed) < this.epsilon) { if (distance < -this.epsilon) return undefined; continue; }
      const time = distance / speed;
      if (speed < 0 && time > enter) { enter = time; normalX = plane.normalX; normalY = plane.normalY; }
      if (speed > 0) exit = Math.min(exit, time);
      if (enter > exit + this.epsilon) return undefined;
    }
    return enter <= 1 && exit >= 0 ? { fraction: enter, normalX, normalY } : undefined;
  }

  /**
   * Sweeps a circle against polygon edge strips and rounded vertex caps exactly.
   * @param {RigidBody2D} circle Moving circle at its starting position.
   * @param {RigidBody2D} polygon Polygon held fixed in relative-motion coordinates.
   * @param {PhysicsPoint} move Relative circle displacement.
   * @returns {PhysicsImpact | undefined} Earliest contact with a circle-to-polygon normal.
   * @private
   */
  private sweepCircle(circle: RigidBody2D, polygon: RigidBody2D, move: PhysicsPoint): PhysicsImpact | undefined {
    const vertices = polygon.vertices(), radius = circle.shape.radius!, planes = this.planes(vertices);
    let result: PhysicsImpact | undefined;
    for (let index = 0; index < vertices.length; index++) {
      const plane = planes[index], next = vertices[(index + 1) % vertices.length];
      const speed = move.x * plane.normalX + move.y * plane.normalY;
      const distance = (circle.x - plane.x) * plane.normalX + (circle.y - plane.y) * plane.normalY;
      if (speed < -this.epsilon) {
        const fraction = (radius - distance) / speed;
        if (fraction >= 0 && fraction <= 1) {
          const x = circle.x + move.x * fraction - plane.normalX * radius;
          const y = circle.y + move.y * fraction - plane.normalY * radius;
          const edgeX = next.x - plane.x, edgeY = next.y - plane.y;
          const along = ((x - plane.x) * edgeX + (y - plane.y) * edgeY) / (edgeX ** 2 + edgeY ** 2);
          if (along >= 0 && along <= 1 && (!result || fraction < result.fraction)) result = { fraction, normalX: -plane.normalX, normalY: -plane.normalY };
        }
      }
      const vertex = this.rayCircle({ x: circle.x, y: circle.y }, move, plane, radius);
      if (vertex && (!result || vertex.fraction < result.fraction)) result = { fraction: vertex.fraction, normalX: -vertex.normalX, normalY: -vertex.normalY };
    }
    return result;
  }
}).instance;

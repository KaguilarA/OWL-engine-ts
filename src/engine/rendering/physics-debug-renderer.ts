import { GameContext, type PhysicsWorld } from '../core';
import type { Camera2D } from '../scene';
import type { CollisionRect, PhysicsPoint, PhysicsRayHit } from '../interfaces';

/**
 * Optional shared world-space visualization of collider outlines, contacts, and query results.
 * @class PhysicsDebugRenderer
 */
export default (class {
  /**
   * Stateless debug renderer shared by scene tools and games.
   * @property {PhysicsDebugRenderer} instance
   */
  public static readonly instance = new this();
  /**
   * Restricts the stateless renderer to one instance.
   * @constructor
   * @returns {void}
   * @private
   */
  private constructor() {}

  /**
   * Draws actual geometry and contact normals, restoring canvas state even on failure.
   * @param {PhysicsWorld} world Scene-local physics world to visualize.
   * @param {Camera2D} [camera] Optional camera applying the same transform as scene drawing.
   * @returns {void}
   */
  public draw(world: PhysicsWorld, camera?: Camera2D): void {
    this.withCamera(camera, () => {
      const context = GameContext.context;
      context.lineWidth = 1 / (camera?.zoom() ?? 1);
      for (const body of world.getBodies()) {
        context.strokeStyle = body.sensor ? '#ffc66d' : body.bodyType === 'static' ? '#aab6c8' : body.bodyType === 'kinematic' ? '#65b8ff' : '#72efb1';
        context.beginPath();
        if (body.shape.kind === 'circle') context.arc(body.x, body.y, body.shape.radius!, 0, Math.PI * 2);
        else {
          const vertices = body.vertices();
          context.moveTo(vertices[0].x, vertices[0].y);
          for (const point of vertices.slice(1)) context.lineTo(point.x, point.y);
          context.closePath();
        }
        context.stroke();
      }
      context.strokeStyle = '#ff6688';
      for (const contact of world.contacts()) {
        const x = (contact.first.x + contact.second.x) / 2, y = (contact.first.y + contact.second.y) / 2;
        context.beginPath(); context.moveTo(x, y);
        context.lineTo(x + contact.normalX * 20, y + contact.normalY * 20); context.stroke();
      }
    });
  }

  /**
   * Draws a queried segment and outward normals at its reported intersections.
   * @param {PhysicsPoint} start Query origin.
   * @param {PhysicsPoint} end Query endpoint.
   * @param {readonly PhysicsRayHit[]} hits Results returned by the world ray query.
   * @param {Camera2D} [camera] Optional matching scene camera.
   * @returns {void}
   */
  public drawRay(start: PhysicsPoint, end: PhysicsPoint, hits: readonly PhysicsRayHit[], camera?: Camera2D): void {
    this.withCamera(camera, () => {
      const context = GameContext.context;
      context.strokeStyle = '#ffdf70'; context.beginPath();
      context.moveTo(start.x, start.y); context.lineTo(end.x, end.y); context.stroke();
      for (const hit of hits) {
        context.beginPath(); context.arc(hit.x, hit.y, 3, 0, Math.PI * 2); context.stroke();
        context.beginPath(); context.moveTo(hit.x, hit.y);
        context.lineTo(hit.x + hit.normalX * 15, hit.y + hit.normalY * 15); context.stroke();
      }
    });
  }

  /**
   * Draws the world rectangle used by an area query.
   * @param {CollisionRect} area Queried rectangle.
   * @param {Camera2D} [camera] Optional matching scene camera.
   * @returns {void}
   */
  public drawArea(area: CollisionRect, camera?: Camera2D): void {
    this.withCamera(camera, () => {
      const context = GameContext.context;
      context.strokeStyle = '#b58cff';
      context.strokeRect(area.x, area.y, area.width, area.height);
    });
  }

  /**
   * Applies an optional camera and guarantees restoration of presentation state.
   * @param {Camera2D | undefined} camera Optional world camera.
   * @param {Function} draw World-space rendering callback.
   * @returns {void}
   * @private
   */
  private withCamera(camera: Camera2D | undefined, draw: () => void): void {
    GameContext.context.save();
    try { if (camera) camera.withTransform(draw); else draw(); }
    finally { GameContext.context.restore(); }
  }
}).instance;

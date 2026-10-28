import type { SpineSlotPose } from './';

/**
 * Defines the spine mesh pose contract shared by its consumers.
 * @interface SpineMeshPose
 */
export interface SpineMeshPose {
  /**
   * Save slot identifying the snapshot within a game.
   * @property {SpineSlotPose} slot
   */
  slot: SpineSlotPose;
  /**
   * Vertex coordinates used to construct or render the mesh.
   * @property {number[]} vertices
   */
  vertices: number[];
  /**
   * Texture coordinates corresponding to the mesh vertices.
   * @property {number[]} uvs
   */
  uvs: number[];
  /**
   * Indices grouping mesh vertices into triangles.
   * @property {number[]} triangles
   */
  triangles: number[];
  /**
   * Path configuration or state owned by SpineMeshPose.
   * @property {string} path
   */
  path: string;
  /**
   * Color applied when rendering this content.
   * @property {string} color
   */
  color: string;
}

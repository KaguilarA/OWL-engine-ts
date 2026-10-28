/**
 * Defines the spine bone transform contract shared by its consumers.
 * @interface SpineBoneTransform
 */
export interface SpineBoneTransform {
  /**
   * A configuration or state owned by SpineBoneTransform.
   * @property {number} a
   */
  a: number;
  /**
   * B configuration or state owned by SpineBoneTransform.
   * @property {number} b
   */
  b: number;
  /**
   * C configuration or state owned by SpineBoneTransform.
   * @property {number} c
   */
  c: number;
  /**
   * D configuration or state owned by SpineBoneTransform.
   * @property {number} d
   */
  d: number;
  /**
   * Horizontal coordinate in the owning coordinate space.
   * @property {number} x
   */
  x: number;
  /**
   * Vertical coordinate in the owning coordinate space.
   * @property {number} y
   */
  y: number;
  /**
   * Rotation configuration or state owned by SpineBoneTransform.
   * @property {number} rotation
   */
  rotation: number;
  /**
   * Scale x configuration or state owned by SpineBoneTransform.
   * @property {number} scaleX
   */
  scaleX: number;
  /**
   * Scale y configuration or state owned by SpineBoneTransform.
   * @property {number} scaleY
   */
  scaleY: number;
  /**
   * Shear x configuration or state owned by SpineBoneTransform.
   * @property {number | undefined} shearX
   */
  shearX?: number;
  /**
   * Shear y configuration or state owned by SpineBoneTransform.
   * @property {number | undefined} shearY
   */
  shearY?: number;
}

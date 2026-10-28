import type { TouchControlCircle } from './';

/**
 * Defines the touch controls layout contract shared by its consumers.
 * @interface TouchControlsLayout
 */
export interface TouchControlsLayout {
  /**
   * Left configuration or state owned by TouchControlsLayout.
   * @property {TouchControlCircle} left
   */
  left: TouchControlCircle;
  /**
   * Right configuration or state owned by TouchControlsLayout.
   * @property {TouchControlCircle} right
   */
  right: TouchControlCircle;
  /**
   * Up configuration or state owned by TouchControlsLayout.
   * @property {TouchControlCircle} up
   */
  up: TouchControlCircle;
  /**
   * Down configuration or state owned by TouchControlsLayout.
   * @property {TouchControlCircle} down
   */
  down: TouchControlCircle;
  /**
   * Shoot configuration or state owned by TouchControlsLayout.
   * @property {TouchControlCircle} shoot
   */
  shoot: TouchControlCircle;
  /**
   * Reserved bottom configuration or state owned by TouchControlsLayout.
   * @property {number} reservedBottom
   */
  reservedBottom: number;
}

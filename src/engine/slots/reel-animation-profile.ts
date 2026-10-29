import type { ReelOptions } from '../interfaces';

/**
 * Shared anticipation, acceleration, braking, and stop timing for slot reels.
 * @class ReelAnimationProfile
 */
export default class {
  /**
   * Constructs options for ReelAnimationProfile.
   * @param {number} rowCount The row count supplied to this operation.
   * @returns {ReelOptions} Constructs options for ReelAnimationProfile.
   * @public
   */
  public static createOptions(rowCount: number): ReelOptions {
    return {
      rowCount,
      anticipationDuration: 0.16,
      anticipationLiftCells: 0.5,
      bounceDuration: 0.34,
      accelerationShare: 0.14,
      brakingShare: 0.3
    };
  }

  /**
   * Returns spin plan for ReelAnimationProfile.
   * @param {number} reelIndex The reel index supplied to this operation.
   * @returns {{ travelCells: number; duration: number }} spin plan for ReelAnimationProfile.
   * @public
   */
  public static getSpinPlan(reelIndex: number): {
  /**
   * Travel cells configuration or state owned by ReelAnimationProfile.
   * @property {number} travelCells
   */
  travelCells: number;
  /**
   * Duration configuration or state owned by ReelAnimationProfile.
   * @property {number} duration
   */
  duration: number } {
    if (!Number.isInteger(reelIndex) || reelIndex < 0) {
      throw new RangeError('Reel index must be a non-negative integer.');
    }
    return {
      travelCells: 18 + reelIndex * 3,
      duration: 1.55 + reelIndex * 0.23
    };
  }
}

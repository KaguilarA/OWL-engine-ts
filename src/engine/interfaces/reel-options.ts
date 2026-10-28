/**
 * Defines the reel options contract shared by its consumers.
 * @interface ReelOptions
 */
export interface ReelOptions {
  /**
   * Row count configuration or state owned by ReelOptions.
   * @property {number} rowCount
   */
  rowCount: number;
  /**
   * Anticipation duration configuration or state owned by ReelOptions.
   * @property {number | undefined} anticipationDuration
   */
  anticipationDuration?: number;
  /**
   * Anticipation lift cells configuration or state owned by ReelOptions.
   * @property {number | undefined} anticipationLiftCells
   */
  anticipationLiftCells?: number;
  /**
   * Bounce duration configuration or state owned by ReelOptions.
   * @property {number | undefined} bounceDuration
   */
  bounceDuration?: number;
  /**
   * Acceleration share configuration or state owned by ReelOptions.
   * @property {number | undefined} accelerationShare
   */
  accelerationShare?: number;
  /**
   * Braking share configuration or state owned by ReelOptions.
   * @property {number | undefined} brakingShare
   */
  brakingShare?: number;
}

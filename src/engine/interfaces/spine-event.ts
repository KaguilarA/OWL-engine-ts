import type { SpineRecord } from './';

/**
 * Defines the spine event contract shared by its consumers.
 * @interface SpineEvent
 */
export interface SpineEvent {
  /**
   * Name used to identify or look up this resource.
   * @property {string} name
   */
  name: string;
  /**
   * Time configuration or state owned by SpineEvent.
   * @property {number} time
   */
  time: number;
  /**
   * Int value configuration or state owned by SpineEvent.
   * @property {number | undefined} intValue
   */
  intValue?: number;
  /**
   * Float value configuration or state owned by SpineEvent.
   * @property {number | undefined} floatValue
   */
  floatValue?: number;
  /**
   * String value configuration or state owned by SpineEvent.
   * @property {string | undefined} stringValue
   */
  stringValue?: string;
  /**
   * Volume configuration or state owned by SpineEvent.
   * @property {number | undefined} volume
   */
  volume?: number;
  /**
   * Balance configuration or state owned by SpineEvent.
   * @property {number | undefined} balance
   */
  balance?: number;
  /**
   * Snapshot payload persisted by the save service.
   * @property {SpineRecord | undefined} data
   */
  data?: SpineRecord;
}

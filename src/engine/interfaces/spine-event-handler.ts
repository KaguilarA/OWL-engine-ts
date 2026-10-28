import type { SpineEvent } from './';

/**
 * Defines the spine event handler contract shared by its consumers.
 * @typedef {SpineEventHandler} SpineEventHandler
 */
export type SpineEventHandler = (event: SpineEvent) => void;

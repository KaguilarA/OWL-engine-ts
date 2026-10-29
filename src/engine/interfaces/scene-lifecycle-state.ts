/**
 * Observable stages of scene preparation, execution, teardown, and failure.
 * @typedef {string} SceneLifecycleState
 */
type SceneLifecycleState = 'idle' | 'loading' | 'entering' | 'running' | 'paused' | 'exiting' | 'error';

export type { SceneLifecycleState as default };

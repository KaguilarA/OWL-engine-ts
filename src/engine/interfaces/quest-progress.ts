import type { QuestObjectiveProgress } from './quest-objective-progress';

/**
 * Runtime progress for a quest tracked by a quest log.
 * @interface QuestProgress
 */
export interface QuestProgress {
  /**
   * Stable identifier for the quest.
   * @property {string} questId
   */
  readonly questId: string;

  /**
   * Objective progress counters in definition order.
   * @property {readonly QuestObjectiveProgress[]} objectives
   */
  readonly objectives: readonly QuestObjectiveProgress[];

  /**
   * Whether the quest is active or complete.
   * @property {'active' | 'completed'} status
   */
  readonly status: 'active' | 'completed';
}

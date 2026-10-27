/**
 * Progress counters for one quest objective.
 * @interface QuestObjectiveProgress
 */
export interface QuestObjectiveProgress {
  /**
   * Current objective progress.
   * @property {number} current
   */
  readonly current: number;

  /**
   * Progress required to complete the objective.
   * @property {number} target
   */
  readonly target: number;
}

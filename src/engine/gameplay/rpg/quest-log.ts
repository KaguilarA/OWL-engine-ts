import { signalValue, type SignalValue } from 'reactive-values';
import type { QuestProgress } from '../../interfaces';

/**
 * Tracks objective progress for RPG, adventure, and mission-based games.
 * @class QuestLog
 */
export default class {
  /**
   * Active and completed quests in insertion order.
   * @property {SignalValue<readonly QuestProgress[]>} quests
   * @public
   * @readonly
   */
  public readonly quests: SignalValue<readonly QuestProgress[]> = signalValue<readonly QuestProgress[]>([]);

  /**
   * Starts tracking a quest with the required progress for each objective.
   * @param questId Stable quest identifier.
   * @param objectiveTargets Required progress values in objective order.
   * @public
   * @return {boolean} Whether a new quest was added.
   */
  public start(questId: string, objectiveTargets: readonly number[]): boolean {
    this.validateQuest(questId, objectiveTargets);
    if (this.quests().some((quest) => quest.questId === questId)) return false;
    const objectives = objectiveTargets.map((target) => ({ current: 0, target }));
    this.quests.set([...this.quests(), {
      questId,
      objectives,
      status: objectives.length === 0 ? 'completed' : 'active'
    }]);
    return true;
  }

  /**
   * Advances one objective without exceeding its target.
   * @param questId Stable quest identifier.
   * @param objectiveIndex Zero-based objective index.
   * @param amount Progress to add.
   * @public
   * @return {boolean} Whether the objective was advanced.
   */
  public advance(questId: string, objectiveIndex: number, amount = 1): boolean {
    if (!Number.isFinite(amount) || amount <= 0) throw new RangeError('Quest progress must be positive and finite.');
    const quest = this.quests().find((entry) => entry.questId === questId);
    if (!quest || quest.status === 'completed') return false;
    const objective = quest.objectives[objectiveIndex];
    if (!objective || objective.current >= objective.target) return false;
    const objectives = quest.objectives.map((entry, index) => index === objectiveIndex
      ? { ...entry, current: Math.min(entry.target, entry.current + amount) }
      : entry);
    const status = objectives.every((entry) => entry.current >= entry.target) ? 'completed' : 'active';
    this.quests.set(this.quests().map((entry) => entry === quest ? { ...entry, objectives, status } : entry));
    return true;
  }

  /**
   * Returns tracked progress for a quest identifier.
   * @param questId Stable quest identifier.
   * @public
   * @return {QuestProgress | undefined}
   */
  public get(questId: string): QuestProgress | undefined {
    return this.quests().find((quest) => quest.questId === questId);
  }

  /**
   * Stops tracking a quest and reports whether it was present.
   * @param questId Stable quest identifier.
   * @public
   * @return {boolean}
   */
  public abandon(questId: string): boolean {
    const current = this.quests();
    const next = current.filter((quest) => quest.questId !== questId);
    if (next.length === current.length) return false;
    this.quests.set(next);
    return true;
  }

  /**
   * Validates a quest identifier and its objective targets.
   * @param questId Stable quest identifier.
   * @param objectiveTargets Required objective progress values.
   * @private
   * @return {void}
   */
  private validateQuest(questId: string, objectiveTargets: readonly number[]): void {
    if (!questId.trim()) throw new RangeError('Quest identifier cannot be empty.');
    if (objectiveTargets.some((target) => !Number.isFinite(target) || target <= 0)) {
      throw new RangeError('Quest objective targets must be positive and finite.');
    }
  }
}

import { computedValue, signalValue, type ComputedValue, type SignalValue } from 'reactive-values';

/**
 * Reactive round-robin turn order for tactical, board, and role-playing games.
 * @class TurnQueue
 */
export default class<T> {
  /**
   * Ordered actors participating in turns.
   * @property {SignalValue<readonly T[]>} actors
   * @public
   * @readonly
   */
  public readonly actors: SignalValue<readonly T[]> = signalValue<readonly T[]>([]);

  /**
   * Index of the actor whose turn is active.
   * @property {SignalValue<number>} activeIndex
   * @public
   * @readonly
   */
  public readonly activeIndex: SignalValue<number> = signalValue(0);

  /**
   * Number of completed rounds.
   * @property {SignalValue<number>} completedRounds
   * @public
   * @readonly
   */
  public readonly completedRounds: SignalValue<number> = signalValue(0);

  /**
   * Whether the queue currently contains at least one actor.
   * @property {ComputedValue<boolean>} hasActors
   * @public
   * @readonly
   */
  public readonly hasActors: ComputedValue<boolean> = computedValue(
    () => this.actors().length > 0,
    [this.actors]
  );

  /**
   * Adds an actor to the end of the turn order once.
   * @param actor Actor to add.
   * @public
   * @return {boolean}
   */
  public add(actor: T): boolean {
    if (this.actors().includes(actor)) return false;
    this.actors.set([...this.actors(), actor]);
    return true;
  }

  /**
   * Removes an actor and preserves the active turn when possible.
   * @param actor Actor to remove.
   * @public
   * @return {boolean}
   */
  public remove(actor: T): boolean {
    const actors = this.actors();
    const index = actors.indexOf(actor);
    if (index < 0) return false;
    const next = actors.filter((candidate) => candidate !== actor);
    this.actors.set(next);
    if (next.length === 0) {
      this.activeIndex.set(0);
    } else if (index < this.activeIndex()) {
      this.activeIndex.set(this.activeIndex() - 1);
    } else if (this.activeIndex() >= next.length) {
      this.activeIndex.set(0);
    }
    return true;
  }

  /**
   * Returns the actor whose turn is active, if any.
   * @public
   * @return {T | undefined}
   */
  public getActive(): T | undefined {
    return this.actors()[this.activeIndex()];
  }

  /**
   * Advances to the next actor and reports whether a round completed.
   * @public
   * @return {boolean}
   */
  public advance(): boolean {
    const actors = this.actors();
    if (actors.length < 2) {
      if (actors.length === 1) this.completedRounds.set(this.completedRounds() + 1);
      return actors.length === 1;
    }
    const nextIndex = (this.activeIndex() + 1) % actors.length;
    const completedRound = nextIndex === 0;
    this.activeIndex.set(nextIndex);
    if (completedRound) this.completedRounds.set(this.completedRounds() + 1);
    return completedRound;
  }

  /**
   * Replaces the turn order and begins again at the first actor.
   * @param actors Ordered actors for the next sequence.
   * @public
   * @return {void}
   */
  public setOrder(actors: readonly T[]): void {
    this.actors.set([...new Set(actors)]);
    this.activeIndex.set(0);
    this.completedRounds.set(0);
  }
}

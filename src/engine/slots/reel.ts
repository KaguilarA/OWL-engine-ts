import { computedValue, signalValue, type SignalValue, type ComputedValue } from 'reactive-values';
import { MathUtils } from '../core';
import { Container } from '../scene';
import type { ReelOptions, VisibleReelSymbol } from '../interfaces/';

/**
 * Defines the reel phase contract shared by its consumers.
 * @typedef {ReelPhase} ReelPhase
 */
type ReelPhase = 'idle' | 'anticipation' | 'spinning' | 'bounce';

/**
 * Owns a single reel's outcome, strip, anticipation, spin, and settling motion.
 * @class Reel
 */
export default class extends Container {
  /**
   * Reactive target state owned by Reel.
   * @property {SignalValue<string[]>} target
   * @readonly
   * @private
   */
  private readonly target: SignalValue<string[]> = signalValue<string[]>([]);
  /**
   * Reactive anticipation tail state owned by Reel.
   * @property {SignalValue<string>} anticipationTail
   * @readonly
   * @private
   */
  private readonly anticipationTail: SignalValue<string> = signalValue('');
  /**
   * Reactive phase state owned by Reel.
   * @property {SignalValue<ReelPhase>} phase
   * @readonly
   * @private
   */
  private readonly phase: SignalValue<ReelPhase> = signalValue<ReelPhase>('idle');
  /**
   * Reactive phase elapsed state owned by Reel.
   * @property {SignalValue<number>} phaseElapsed
   * @readonly
   * @private
   */
  private readonly phaseElapsed: SignalValue<number> = signalValue(0);
  /**
   * Reactive spin duration state owned by Reel.
   * @property {SignalValue<number>} spinDuration
   * @readonly
   * @private
   */
  private readonly spinDuration: SignalValue<number> = signalValue(0);
  /**
   * Reactive spin strip state owned by Reel.
   * @property {SignalValue<string[]>} spinStrip
   * @readonly
   * @private
   */
  private readonly spinStrip: SignalValue<string[]> = signalValue<string[]>([]);
  /**
   * Reactive travel cells state owned by Reel.
   * @property {SignalValue<number>} travelCells
   * @readonly
   * @private
   */
  private readonly travelCells: SignalValue<number> = signalValue(0);
  /**
   * Reactive start distance state owned by Reel.
   * @property {SignalValue<number>} startDistance
   * @readonly
   * @private
   */
  private readonly startDistance: SignalValue<number> = signalValue(0);
  /**
   * Reactive target offset state owned by Reel.
   * @property {SignalValue<number>} targetOffset
   * @readonly
   * @private
   */
  private readonly targetOffset: SignalValue<number> = signalValue(0);
  /**
   * Reactive distance cells state owned by Reel.
   * @property {SignalValue<number>} distanceCells
   * @readonly
   * @private
   */
  private readonly distanceCells: SignalValue<number> = signalValue(0);
  /**
   * Reactive fast stop elapsed state owned by Reel.
   * @property {SignalValue<number>} fastStopElapsed
   * @readonly
   * @private
   */
  private readonly fastStopElapsed: SignalValue<number> = signalValue(0);
  /**
   * Reactive fast stop start distance state owned by Reel.
   * @property {SignalValue<number>} fastStopStartDistance
   * @readonly
   * @private
   */
  private readonly fastStopStartDistance: SignalValue<number> = signalValue(0);
  /**
   * Reactive fast stop requested state owned by Reel.
   * @property {SignalValue<boolean>} fastStopRequested
   * @readonly
   * @private
   */
  private readonly fastStopRequested: SignalValue<boolean> = signalValue(false);
  /**
   * Anticipation duration configuration or state owned by Reel.
   * @property {number} anticipationDuration
   * @readonly
   * @private
   */
  private readonly anticipationDuration: number;
  /**
   * Anticipation lift cells configuration or state owned by Reel.
   * @property {number} anticipationLiftCells
   * @readonly
   * @private
   */
  private readonly anticipationLiftCells: number;
  /**
   * Bounce duration configuration or state owned by Reel.
   * @property {number} bounceDuration
   * @readonly
   * @private
   */
  private readonly bounceDuration: number;
  /**
   * Acceleration share configuration or state owned by Reel.
   * @property {number} accelerationShare
   * @readonly
   * @private
   */
  private readonly accelerationShare: number;
  /**
   * Braking share configuration or state owned by Reel.
   * @property {number} brakingShare
   * @readonly
   * @private
   */
  private readonly brakingShare: number;
  /**
   * Symbols configuration or state owned by Reel.
   * @property {SignalValue<string[]>} symbols
   * @readonly
   * @public
   */
  public readonly symbols: SignalValue<string[]>;
  /**
   * Is active configuration or state owned by Reel.
   * @property {ComputedValue<boolean>} isActive
   * @readonly
   * @public
   */
  public readonly isActive: ComputedValue<boolean>;
  /**
   * Random symbol configuration or state owned by Reel.
   * @property {() => string} randomSymbol
   * @readonly
   * @private
   */
  private readonly randomSymbol: () => string;
  /**
   * Configuration controlling construction or behavior.
   * @property {ReelOptions} options
   * @readonly
   * @private
   */
  private readonly options: ReelOptions;

  /**
   * Initializes Reel and its owned resources from the supplied arguments.
   * @constructor
   * @param {string[]} symbols The symbols supplied to this operation.
   * @param {() => string} randomSymbol The random symbol supplied to this operation.
   * @param {ReelOptions} options Configuration controlling construction or behavior.
   * @returns {void}
   * @public
   */
  public constructor(
    symbols: string[],
    randomSymbol: () => string,
    options: ReelOptions
  ) {
    super({ clipChildren: true });
    this.symbols = signalValue(symbols);
    this.randomSymbol = randomSymbol;
    this.options = options;
    this.anticipationDuration = options.anticipationDuration ?? 0.16;
    this.anticipationLiftCells = options.anticipationLiftCells ?? 0.5;
    this.bounceDuration = options.bounceDuration ?? 0.34;
    this.accelerationShare = options.accelerationShare ?? 0.14;
    this.brakingShare = options.brakingShare ?? 0.3;
    this.isActive = computedValue(
      () => this.phase() !== 'idle',
      [this.phase]
    );
  }

  /**
   * Returns row count from the current Reel state.
   * @returns {number} row count from the current Reel state.
   * @public
   */
  public get rowCount(): number {
    return this.options.rowCount;
  }

  /**
   * Starts a new spin with a supplied result and movement duration.
   * @param {string[]} target
   * @param {number} travelCells
   * @param {number} duration
   * @returns {void}
   * @public
   */
  public startSpin(target: string[], travelCells: number, duration: number): void {
    this.target.set([...target]);
    this.spinDuration.set(duration);
    const prelude = Array.from({ length: this.rowCount }, this.randomSymbol);
    const middle = Array.from(
      { length: Math.max(0, travelCells - this.rowCount) },
      this.randomSymbol
    );
    this.anticipationTail.set(this.randomSymbol());
    this.spinStrip.set([
      ...prelude,
      ...this.target(),
      ...middle,
      ...this.symbols(),
      this.anticipationTail()
    ]);
    this.targetOffset.set(prelude.length);
    this.startDistance.set(this.targetOffset() + this.rowCount + middle.length);
    this.travelCells.set(this.startDistance()
      + this.anticipationLiftCells
      - this.targetOffset());
    this.distanceCells.set(this.startDistance());
    this.phase.set('anticipation');
    this.phaseElapsed.set(0);
  }

  /**
   * Advances the current phase and fixes the result when the reel settles.
   * @param {number} deltaSeconds Elapsed simulation time in seconds.
   * @returns {void}
   * @public
   */
  public update(deltaSeconds: number): void {
    super.update(deltaSeconds);
    if (!this.isActive()) return;
    this.phaseElapsed.set(this.phaseElapsed() + deltaSeconds);

    if (this.phase() === 'anticipation') {
      if (this.phaseElapsed() >= this.anticipationDuration) {
        this.distanceCells.set(this.startDistance() + this.anticipationLiftCells);
        this.phase.set('spinning');
        this.phaseElapsed.set(0);
      }
      return;
    }

    if (this.phase() === 'spinning') {
      if (this.fastStopRequested()) {
        const stopDuration = 0.34;
        const elapsed = this.fastStopElapsed() + deltaSeconds;
        this.fastStopElapsed.set(elapsed);
        const progress = Math.min(elapsed / stopDuration, 1);
        const easedProgress = 1 - ((1 - progress) ** 3);
        this.distanceCells.set(this.fastStopStartDistance()
          + (this.targetOffset() - this.fastStopStartDistance()) * easedProgress);
        if (progress >= 1) {
          this.phase.set('bounce');
          this.phaseElapsed.set(0);
          this.fastStopRequested.set(false);
        }
        return;
      }
      const duration = this.spinDuration();
      const progress = duration > 0 ? Math.min(this.phaseElapsed() / duration, 1) : 1;
      this.distanceCells.set(this.startDistance()
        + this.anticipationLiftCells
        - this.travelCells() * this.getSpinProgress(progress));
      if (progress >= 1) {
        const remainingFrameTime = Math.max(0, this.phaseElapsed() - this.spinDuration());
        this.phase.set('bounce');
        this.phaseElapsed.set(remainingFrameTime);
      }
      return;
    }

    if (this.phaseElapsed() >= this.bounceDuration) {
      this.phase.set('idle');
      this.symbols.set(this.target());
      this.distanceCells.set(this.targetOffset());
    }
  }

  /**
   * Brakes the current reel to its already selected result as soon as possible.
   * @returns {void}
   * @public
   */
  public requestFastStop(): void {
    if (!this.isActive() || this.phase() === 'bounce' || this.fastStopRequested()) return;
    if (this.phase() === 'anticipation') {
      this.phase.set('spinning');
      this.phaseElapsed.set(0);
      this.distanceCells.set(this.startDistance() + this.anticipationLiftCells);
    }
    this.fastStopStartDistance.set(this.distanceCells());
    this.fastStopElapsed.set(0);
    this.fastStopRequested.set(true);
  }

  /**
   * Returns all symbols currently crossing the clipped reel window.
   * @returns {VisibleReelSymbol[]}
   * @public
   */
  public getVisibleSymbols(): VisibleReelSymbol[] {
    const phase = this.phase();
    if (phase === 'spinning' || phase === 'bounce') {
      const bounceOffset = phase === 'bounce'
        ? this.getBounceOffset(this.phaseElapsed())
        : 0;
      const distance = this.distanceCells() - bounceOffset;
      const firstCell = Math.floor(distance);
      const progress = phase === 'bounce'
        ? 1
        : this.spinDuration() > 0
          ? Math.min(this.phaseElapsed() / this.spinDuration(), 1)
          : 1;
      const blurAmount = this.getBlurAmount(progress);
      const visible: VisibleReelSymbol[] = [];

      for (let index = firstCell - 1; index <= firstCell + this.rowCount; index++) {
        const symbol = this.spinStrip()[index];
        if (!symbol) continue;
        visible.push({
          symbol,
          row: index - this.targetOffset(),
          offsetCells: index - distance + 0.5,
          blurAmount
        });
      }
      return visible;
    }

    const anticipation = phase === 'anticipation'
      ? this.getAnticipationProgress(this.phaseElapsed() / this.anticipationDuration)
        * this.anticipationLiftCells
      : 0;
    const visible = this.symbols().map((symbol, row) => ({
      symbol,
      row,
      offsetCells: row + 0.5 - anticipation,
      blurAmount: 0
    }));

    if (phase === 'anticipation') {
      visible.push({
        symbol: this.anticipationTail(),
        row: this.rowCount,
        offsetCells: this.rowCount + 0.5 - anticipation,
        blurAmount: 0
      });
    }
    return visible;
  }

  /**
   * Cancels motion and installs a fresh visible column.
   * @param {string[]} symbols
   * @returns {void}
   * @public
   */
  public reset(symbols: string[]): void {
    this.symbols.set([...symbols]);
    this.target.set([]);
    this.phase.set('idle');
    this.phaseElapsed.set(0);
    this.startDistance.set(0);
    this.targetOffset.set(0);
    this.distanceCells.set(0);
    this.fastStopElapsed.set(0);
    this.fastStopRequested.set(false);
    this.spinStrip.set([]);
  }

  /**
   * Returns spin progress for Reel.
   * @param {number} progress The progress supplied to this operation.
   * @returns {number} spin progress for Reel.
   * @private
   */
  private getSpinProgress(progress: number): number {
    const brakingStart = 1 - this.brakingShare;
    const cruiseShare = brakingStart - this.accelerationShare;
    const totalDistance = this.accelerationShare * 0.5
      + cruiseShare
      + this.brakingShare * 0.5;

    if (progress < this.accelerationShare) {
      const ramp = progress / this.accelerationShare;
      const acceleratedDistance = this.accelerationShare
        * (ramp ** 3 - 0.5 * ramp ** 4);
      return acceleratedDistance / totalDistance;
    }
    if (progress < brakingStart) {
      return (this.accelerationShare * 0.5 + progress - this.accelerationShare)
        / totalDistance;
    }

    const brake = (progress - brakingStart) / this.brakingShare;
    const brakingDistance = this.brakingShare
      * (brake - brake ** 3 + 0.5 * brake ** 4);
    return (this.accelerationShare * 0.5 + cruiseShare + brakingDistance)
      / totalDistance;
  }

  /**
   * Returns anticipation progress for Reel.
   * @param {number} progress The progress supplied to this operation.
   * @returns {number} anticipation progress for Reel.
   * @private
   */
  private getAnticipationProgress(progress: number): number {
    return MathUtils.smoothStep(progress);
  }

  /**
   * Returns blur amount for Reel.
   * @param {number} progress The progress supplied to this operation.
   * @returns {number} blur amount for Reel.
   * @private
   */
  private getBlurAmount(progress: number): number {
    const transitionShare = 0.08;
    const fadeIn = this.getAnticipationProgress(progress / transitionShare);
    const fadeOutStart = 1 - this.brakingShare - transitionShare;
    const fadeOut = this.getAnticipationProgress(
      (progress - fadeOutStart) / transitionShare
    );
    return fadeIn * (1 - fadeOut);
  }

  /**
   * Returns bounce offset for Reel.
   * @param {number} elapsed The elapsed supplied to this operation.
   * @returns {number} bounce offset for Reel.
   * @private
   */
  private getBounceOffset(elapsed: number): number {
    const progress = this.bounceDuration > 0
      ? MathUtils.clamp(elapsed / this.bounceDuration, 0, 1)
      : 1;
    const envelope = 1 - MathUtils.smoothStep(progress);
    return 0.055
      * Math.exp(-9 * elapsed)
      * Math.sin(22 * elapsed)
      * envelope;
  }
}


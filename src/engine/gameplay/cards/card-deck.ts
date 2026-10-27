import { signalValue, type SignalValue } from 'reactive-values';

/**
 * Generic reactive draw and discard piles for card and deck-building games.
 * @class CardDeck
 */
export default class CardDeck<T> {
  /**
   * Cards available to draw.
   * @property {SignalValue<readonly T[]>} drawPile
   * @public
   * @readonly
   */
  public readonly drawPile: SignalValue<readonly T[]>;

  /**
   * Cards discarded during play.
   * @property {SignalValue<readonly T[]>} discardPile
   * @public
   * @readonly
   */
  public readonly discardPile: SignalValue<readonly T[]> = signalValue<readonly T[]>([]);

  /**
   * Source of randomness used for shuffling.
   * @property {() => number} random
   * @private
   * @readonly
   */
  private readonly random: () => number;

  /**
   * Creates a deck from the supplied cards and optional random source.
   * @param cards Initial cards in draw order.
   * @param random Random value source in the range from zero to one.
   * @public
   * @return {void}
   */
  public constructor(cards: readonly T[], random: () => number = Math.random) {
    this.drawPile = signalValue<readonly T[]>([...cards]);
    this.random = random;
  }

  /**
   * Shuffles the draw pile in place using Fisher-Yates.
   * @public
   * @return {void}
   */
  public shuffle(): void {
    const cards = this.drawPile().slice();
    for (let index = cards.length - 1; index > 0; index--) {
      const value = this.random();
      if (!Number.isFinite(value) || value < 0 || value >= 1) {
        throw new RangeError('Card deck random source must return values in the range [0, 1).');
      }
      const swapIndex = Math.floor(value * (index + 1));
      [cards[index], cards[swapIndex]] = [cards[swapIndex], cards[index]];
    }
    this.drawPile.set(cards);
  }

  /**
   * Draws the next card, returning `undefined` when the pile is empty.
   * @public
   * @return {T | undefined}
   */
  public draw(): T | undefined {
    const pile = this.drawPile();
    if (pile.length === 0) return undefined;
    const cards = pile.slice();
    const card = cards.shift()!;
    this.drawPile.set(cards);
    return card;
  }

  /**
   * Draws up to the requested number of cards.
   * @param count Maximum number of cards to draw.
   * @public
   * @return {T[]}
   */
  public drawMany(count: number): T[] {
    if (!Number.isInteger(count) || count < 0) throw new RangeError('Draw count must be a non-negative integer.');
    const current = this.drawPile();
    const drawn = current.slice(0, count);
    if (drawn.length > 0) this.drawPile.set(current.slice(drawn.length));
    return drawn;
  }

  /**
   * Adds cards to the discard pile.
   * @param cards Cards to discard.
   * @public
   * @return {void}
   */
  public discard(cards: readonly T[]): void {
    this.discardPile.set([...this.discardPile(), ...cards]);
  }

  /**
   * Moves discards into the draw pile and shuffles them.
   * @public
   * @return {boolean} Whether any cards were recycled.
   */
  public recycleDiscards(): boolean {
    if (this.discardPile().length === 0) return false;
    this.drawPile.set([...this.drawPile(), ...this.discardPile()]);
    this.discardPile.set([]);
    this.shuffle();
    return true;
  }

  /**
   * Replaces the deck contents and optionally shuffles the draw pile.
   * @param cards New deck contents.
   * @param shuffle Whether to shuffle the new draw pile.
   * @public
   * @return {void}
   */
  public reset(cards: readonly T[], shuffle = false): void {
    this.drawPile.set([...cards]);
    this.discardPile.set([]);
    if (shuffle) this.shuffle();
  }
}

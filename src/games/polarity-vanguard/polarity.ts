/**
 * Two projectile/player states that determine which shots can be absorbed.
 */
export type Polarity = 'light' | 'dark';

/**
 * Canvas colors associated with each polarity.
 */
export const POLARITY_COLORS: Record<Polarity, string> = {
  light: '#72dcff',
  dark: '#ff6584'
};

/**
 * Returns the other of the two available polarities.
 * @param {Polarity} polarity The polarity supplied to this operation.
 * @returns {Polarity} Applies the opposite polarity operation to polarity.
 */
export default function(polarity: Polarity): Polarity {
  return polarity === 'light' ? 'dark' : 'light';
}

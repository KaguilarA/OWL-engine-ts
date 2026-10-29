/**
 * Allocation-free math helpers operating strictly on primitive numbers.
 * @class MathUtils
 */
export default (class {
  /**
   * The single math utility instance shared by engine clients.
   * @property {MathUtils} instance
   * @public
   * @readonly
   */
  public static readonly instance = new this();

  /**
   * Degrees to radians conversion multiplier.
   * @property {number} DEG_TO_RAD
   * @public
   * @readonly
   */
  public readonly DEG_TO_RAD = Math.PI / 180;

  /**
   * Radians to degrees conversion multiplier.
   * @property {number} RAD_TO_DEG
   * @public
   * @readonly
   */
  public readonly RAD_TO_DEG = 180 / Math.PI;

  /**
   * Creates the shared math utility.
   * @private
   * @return {void}
   * @constructor
   */
  private constructor() {}

  /**
   * Clamps numeric value to range.
   * @public
   * @return {number}
   * @param {number} value Value to read, validate, format, or assign.
   * @param {number} minimum The minimum supplied to this operation.
   * @param {number} maximum The maximum supplied to this operation.
   */
  public clamp(value: number, minimum: number, maximum: number): number {
    if (maximum < minimum) return minimum;
    return value < minimum ? minimum : value > maximum ? maximum : value;
  }

  /**
   * Hermite smooth-step interpolation.
   * @public
   * @return {number}
   * @param {number} progress The progress supplied to this operation.
   */
  public smoothStep(progress: number): number {
    const amount = this.clamp(progress, 0, 1);
    return amount * amount * (3 - 2 * amount);
  }

  /**
   * Linear interpolation between start and end.
   * @public
   * @return {number}
   * @param {number} start The start supplied to this operation.
   * @param {number} end The end supplied to this operation.
   * @param {number} alpha The alpha supplied to this operation.
   */
  public lerp(start: number, end: number, alpha: number): number {
    return start + (end - start) * alpha;
  }

  /**
   * Shortest-arc angular interpolation in degrees.
   * @public
   * @return {number}
   * @param {number} fromDeg The from deg supplied to this operation.
   * @param {number} toDeg The to deg supplied to this operation.
   * @param {number} alpha The alpha supplied to this operation.
   */
  public lerpAngle(fromDeg: number, toDeg: number, alpha: number): number {
    let diff = (toDeg - fromDeg) % 360;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    return fromDeg + diff * alpha;
  }

  /**
   * Shortest-arc angular interpolation in radians.
   * @public
   * @return {number}
   * @param {number} fromRad The from rad supplied to this operation.
   * @param {number} toRad The to rad supplied to this operation.
   * @param {number} alpha The alpha supplied to this operation.
   */
  public lerpAngleRad(fromRad: number, toRad: number, alpha: number): number {
    const twoPi = Math.PI * 2;
    let diff = (toRad - fromRad) % twoPi;
    if (diff > Math.PI) diff -= twoPi;
    if (diff < -Math.PI) diff += twoPi;
    return fromRad + diff * alpha;
  }

  /**
   * Calculates the ratio of value between start and end.
   * @public
   * @return {number}
   * @param {number} start The start supplied to this operation.
   * @param {number} end The end supplied to this operation.
   * @param {number} value Value to read, validate, format, or assign.
   */
  public inverseLerp(start: number, end: number, value: number): number {
    if (start === end) return 0;
    return this.clamp((value - start) / (end - start), 0, 1);
  }

  /**
   * Converts degrees to radians.
   * @public
   * @return {number}
   * @param {number} degrees The degrees supplied to this operation.
   */
  public degToRad(degrees: number): number {
    return degrees * this.DEG_TO_RAD;
  }

  /**
   * Converts radians to degrees.
   * @public
   * @return {number}
   * @param {number} radians The radians supplied to this operation.
   */
  public radToDeg(radians: number): number {
    return radians * this.RAD_TO_DEG;
  }

  /**
   * Generates pseudo-random integer in range.
   * @public
   * @return {number}
   * @param {number} min The min supplied to this operation.
   * @param {number} max The max supplied to this operation.
   */
  public randomRange(min: number, max: number): number {
    const floorMin = Math.ceil(min);
    const floorMax = Math.floor(max);
    return Math.floor(Math.random() * (floorMax - floorMin + 1)) + floorMin;
  }

  /**
   * Generates pseudo-random float in range.
   * @public
   * @return {number}
   * @param {number} min The min supplied to this operation.
   * @param {number} max The max supplied to this operation.
   */
  public randomFloat(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }

  /**
   * Calculates squared Euclidean distance.
   * @public
   * @return {number}
   * @param {number} x1 The x1 supplied to this operation.
   * @param {number} y1 The y1 supplied to this operation.
   * @param {number} x2 The x2 supplied to this operation.
   * @param {number} y2 The y2 supplied to this operation.
   */
  public distanceSquared(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return dx * dx + dy * dy;
  }

  /**
   * Calculates Euclidean distance.
   * @public
   * @return {number}
   * @param {number} x1 The x1 supplied to this operation.
   * @param {number} y1 The y1 supplied to this operation.
   * @param {number} x2 The x2 supplied to this operation.
   * @param {number} y2 The y2 supplied to this operation.
   */
  public distance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.hypot(x2 - x1, y2 - y1);
  }

  /**
   * Calculates angle in radians between points.
   * @public
   * @return {number}
   * @param {number} x1 The x1 supplied to this operation.
   * @param {number} y1 The y1 supplied to this operation.
   * @param {number} x2 The x2 supplied to this operation.
   * @param {number} y2 The y2 supplied to this operation.
   */
  public angleBetween(x1: number, y1: number, x2: number, y2: number): number {
    return Math.atan2(y2 - y1, x2 - x1);
  }

  /**
   * Compares two numbers for equality within tolerance.
   * @public
   * @return {boolean}
   * @param {number} a The a supplied to this operation.
   * @param {number} b The b supplied to this operation.
   * @param {number} [epsilon] The epsilon supplied to this operation.
   */
  public approximately(a: number, b: number, epsilon = 0.00001): boolean {
    return Math.abs(a - b) <= epsilon;
  }
}).instance;

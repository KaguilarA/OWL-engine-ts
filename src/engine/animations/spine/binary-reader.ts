/**
 * Low-level binary stream reader for Spine .skel data.
 */
export default class {
  /**
   * Snapshot payload persisted by the save service.
   * @property {Uint8Array<ArrayBufferLike>} data
   * @readonly
   * @private
   */
  private readonly data: Uint8Array;
  /**
   * View configuration or state owned by BinaryReader.
   * @property {DataView<ArrayBufferLike>} view
   * @readonly
   * @private
   */
  private readonly view: DataView;
  /**
   * Offset configuration or state owned by BinaryReader.
   * @property {number} offset
   * @private
   */
  private offset = 0;
  /**
   * Strings configuration or state owned by BinaryReader.
   * @property {string[]} strings
   * @private
   */
  private strings: string[] = [];

  /**
   * Initializes BinaryReader and its owned resources from the supplied arguments.
   * @constructor
   * @param {ArrayBuffer | Uint8Array<ArrayBufferLike>} buffer The buffer supplied to this operation.
   * @returns {void}
   * @public
   */
  public constructor(buffer: ArrayBuffer | Uint8Array) {
    if (buffer instanceof Uint8Array) {
      this.data = buffer;
      this.view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    } else {
      this.data = new Uint8Array(buffer);
      this.view = new DataView(buffer);
    }
  }

  /**
   * Returns remaining from the current BinaryReader state.
   * @returns {number} remaining from the current BinaryReader state.
   * @public
   */
  public get remaining(): number {
    return this.data.length - this.offset;
  }

  /**
   * Decodes byte for BinaryReader.
   * @returns {number} Decodes byte for BinaryReader.
   * @public
   */
  public readByte(): number {
    return this.data[this.offset++];
  }

  /**
   * Decodes sbyte for BinaryReader.
   * @returns {number} Decodes sbyte for BinaryReader.
   * @public
   */
  public readSByte(): number {
    const val = this.data[this.offset++];
    return val > 127 ? val - 256 : val;
  }

  /**
   * Decodes boolean for BinaryReader.
   * @returns {boolean} Decodes boolean for BinaryReader.
   * @public
   */
  public readBoolean(): boolean {
    return this.readByte() !== 0;
  }

  /**
   * Decodes float for BinaryReader.
   * @returns {number} Decodes float for BinaryReader.
   * @public
   */
  public readFloat(): number {
    const val = this.view.getFloat32(this.offset, false);
    this.offset += 4;
    return val;
  }

  /**
   * Decodes int for BinaryReader.
   * @returns {number} Decodes int for BinaryReader.
   * @public
   */
  public readInt(): number {
    const val = this.view.getInt32(this.offset, false);
    this.offset += 4;
    return val;
  }

  /**
   * Decodes var int for BinaryReader.
   * @param {boolean} [optimizePositive] The optimize positive supplied to this operation.
   * @returns {number} Decodes var int for BinaryReader.
   * @public
   */
  public readVarInt(optimizePositive = true): number {
    let b = this.readByte();
    let result = b & 0x7f;
    if ((b & 0x80) !== 0) {
      b = this.readByte();
      result |= (b & 0x7f) << 7;
      if ((b & 0x80) !== 0) {
        b = this.readByte();
        result |= (b & 0x7f) << 14;
        if ((b & 0x80) !== 0) {
          b = this.readByte();
          result |= (b & 0x7f) << 21;
          if ((b & 0x80) !== 0) {
            b = this.readByte();
            result |= (b & 0x7f) << 28;
          }
        }
      }
    }
    return optimizePositive ? result : (result >>> 1) ^ -(result & 1);
  }

  /**
   * Decodes string for BinaryReader.
   * @returns {string | undefined} Decodes string for BinaryReader.
   * @public
   */
  public readString(): string | undefined {
    let length = this.readVarInt(true);
    if (length === 0) return undefined;
    length--; // 1 = empty string ""
    if (length === 0) return '';

    const bytes = this.data.subarray(this.offset, this.offset + length);
    this.offset += length;
    return new TextDecoder('utf-8').decode(bytes);
  }

  /**
   * Decodes string ref for BinaryReader.
   * @returns {string | undefined} Decodes string ref for BinaryReader.
   * @public
   */
  public readStringRef(): string | undefined {
    if (this.strings.length === 0) {
      return this.readString();
    }
    const index = this.readVarInt(true);
    return index === 0 ? undefined : this.strings[index - 1];
  }

  /**
   * Updates strings for BinaryReader.
   * @param {string[]} strings The strings supplied to this operation.
   * @returns {void}
   * @public
   */
  public setStrings(strings: string[]): void {
    this.strings = strings;
  }

  /**
   * Decodes color hex for BinaryReader.
   * @returns {string} Decodes color hex for BinaryReader.
   * @public
   */
  public readColorHex(): string {
    const r = this.readByte().toString(16).padStart(2, '0');
    const g = this.readByte().toString(16).padStart(2, '0');
    const b = this.readByte().toString(16).padStart(2, '0');
    const a = this.readByte().toString(16).padStart(2, '0');
    return `${r}${g}${b}${a}`.toUpperCase();
  }
}

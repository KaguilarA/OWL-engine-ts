import type { AtlasPageData, ParsedAtlasRegion } from '../interfaces';

/**
 * Parses and validates one text atlas page and its region records.
 * @class AtlasParser
 */
export default class {
  /**
   * Name identifying the texture page.
   * @property {string} pageName
   * @private
   */
  private pageName = '';
  /**
   * Page width configuration or state owned by atlas-parser.
   * @property {number} pageWidth
   * @private
   */
  private pageWidth = 0;
  /**
   * Page height configuration or state owned by atlas-parser.
   * @property {number} pageHeight
   * @private
   */
  private pageHeight = 0;

  /**
   * Applies the parse operation to atlas-parser.
   * @param {string} text Text to parse, display, or assign.
   * @returns {AtlasPageData} Applies the parse operation to atlas-parser.
   * @public
   */
  public parse(text: string): AtlasPageData {
    const sections = this.parseSections(text);
    const page = sections[0] ?? [];
    if (!page[0]) throw new Error('An atlas page is missing its name.');
    const pageValues = this.readProperties(page.slice(1));
    const [width, height] = this.readPair(pageValues.get('size'), 'page size');
    this.pageName = page[0];
    this.pageWidth = width;
    this.pageHeight = height;
    return {
      pageName: this.pageName,
      width,
      height,
      regions: sections.slice(1).map((section) => this.parseRegion(section))
    };
  }

  /**
   * Splits atlas text into a page section followed by named region sections.
   * @param {string} text Text to parse, display, or assign.
   * @returns {string[][]} Splits atlas text into a page section followed by named region sections.
   * @private
   */
  private parseSections(text: string): string[][] {
    const sections: string[][] = [];
    text.split(/\r?\n/).forEach((line) => {
      if (!line.trim()) return;
      const section = sections.at(-1);
      if (section && line.includes(':')) {
        section.push(line.trim());
        return;
      }
      if (!/^\s/.test(line)) {
        sections.push([line.trim()]);
        return;
      }
      if (!section) throw new Error('Atlas properties appeared before the page name.');
      section.push(line.trim());
    });
    return sections;
  }

  /**
   * Converts colon-separated atlas property lines into a key-value map.
   * @param {string[]} lines The lines supplied to this operation.
   * @returns {Map<string, string>} Converts colon-separated atlas property lines into a key-value map.
   * @private
   */
  private readProperties(lines: string[]): Map<string, string> {
    return new Map(lines.map((line) => {
      const separator = line.indexOf(':');
      if (separator < 0) throw new Error(`Invalid atlas property "${line}".`);
      return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
    }));
  }

  /**
   * Parses and validates exactly two finite numeric values from an atlas property.
   * @param {string | undefined} value Value to read, validate, format, or assign.
   * @param {string} propertyName The property name supplied to this operation.
   * @returns {[number, number]} Parses and validates exactly two finite numeric values from an atlas property.
   * @private
   */
  private readPair(value: string | undefined, propertyName: string): [number, number] {
    const pair = value?.split(',').map((part) => Number(part.trim()));
    if (!pair || pair.length !== 2 || pair.some((part) => !Number.isFinite(part))) {
      throw new Error(`Invalid ${propertyName} in atlas for "${this.pageName || 'page'}".`);
    }
    return [pair[0], pair[1]];
  }

  /**
   * Parses and validates exactly four finite numeric values from an atlas property.
   * @param {string | undefined} value Value to read, validate, format, or assign.
   * @param {string} propertyName The property name supplied to this operation.
   * @returns {[number, number, number, number]} Parses and validates exactly four finite numeric values from an atlas property.
   * @private
   */
  private readQuad(value: string | undefined, propertyName: string): [number, number, number, number] {
    const quad = value?.split(',').map((part) => Number(part.trim()));
    if (!quad || quad.length !== 4 || quad.some((part) => !Number.isFinite(part))) {
      throw new Error(`Invalid ${propertyName} in atlas region.`);
    }
    return [quad[0], quad[1], quad[2], quad[3]];
  }

  /**
   * Builds a parsed region from its name and atlas properties, including trim and rotation metadata.
   * @param {string[]} lines The lines supplied to this operation.
   * @returns {ParsedAtlasRegion} Builds a parsed region from its name and atlas properties, including trim and rotation metadata.
   * @private
   */
  private parseRegion(lines: string[]): ParsedAtlasRegion {
    const properties = this.readProperties(lines.slice(1));
    const bounds = properties.has('bounds')
      ? this.readQuad(properties.get('bounds'), 'bounds')
      : [
          ...this.readPair(properties.get('xy'), 'region position'),
          ...this.readPair(properties.get('size'), 'region size')
        ];
    const [x, y, width, height] = bounds;
    const rotated = properties.get('rotate') === 'true' || properties.get('rotate') === '90';
    const frameRate = Number(properties.get('fps') ?? 0);
    const indexValue = Number(properties.get('index') ?? 0);
    const originalSize = properties.has('orig')
      ? this.readPair(properties.get('orig'), 'region original size')
      : [width, height];
    const offset = properties.has('offset')
      ? this.readPair(properties.get('offset'), 'region offset')
      : [0, 0];
    const packedWidth = rotated ? height : width;
    const packedHeight = rotated ? width : height;
    if (
      bounds.some((part) => !Number.isFinite(part))
      || !Number.isFinite(frameRate) || x < 0 || y < 0 || width <= 0 || height <= 0
      || x + packedWidth > this.pageWidth || y + packedHeight > this.pageHeight
    ) throw new Error(`Invalid bounds or playback settings for atlas region "${lines[0]}".`);
    return {
      name: lines[0],
      index: Number.isInteger(indexValue) && indexValue >= 0 ? indexValue : 0,
      x,
      y,
      width,
      height,
      frameRate,
      loop: properties.get('loop') === 'true',
      rotated,
      originalWidth: originalSize[0],
      originalHeight: originalSize[1],
      offsetX: offset[0],
      offsetY: offset[1]
    };
  }
}

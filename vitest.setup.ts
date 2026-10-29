import { vi } from 'vitest';

/**
 * Provides the canvas and drawing methods required by engine singleton imports.
 * @returns {void}
 */
const drawingContext = {
  arc: vi.fn(),
  beginPath: vi.fn(),
  clearRect: vi.fn(),
  clip: vi.fn(),
  closePath: vi.fn(),
  drawImage: vi.fn(),
  fill: vi.fn(),
  fillRect: vi.fn(),
  fillText: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  restore: vi.fn(),
  rect: vi.fn(),
  rotate: vi.fn(),
  save: vi.fn(),
  scale: vi.fn(),
  setTransform: vi.fn(),
  stroke: vi.fn(),
  strokeRect: vi.fn(),
  translate: vi.fn()
};

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  configurable: true,
  value: vi.fn(() => drawingContext)
});

const canvas = document.createElement('canvas');
canvas.id = 'game-canvas';
document.body.append(canvas);

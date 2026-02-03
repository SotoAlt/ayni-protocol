/**
 * Symbols - Domain symbol overlays for glyphs
 *
 * Symbols provide context to glyph meanings. They overlay humanoid poses
 * to indicate the domain or specific action type.
 */

import { drawLine, drawCircle, drawRect, drawRectOutline } from './Primitives.js';

/**
 * Symbol registry - maps symbol names to drawing functions
 */
const symbols = {
  /**
   * Database - cylinder shape (data storage)
   */
  database: (glyph, x, y) => {
    drawCircle(glyph, x, y, 3);
    drawRect(glyph, x - 3, y, 7, 5);
    drawCircle(glyph, x, y + 4, 3);
  },

  /**
   * Checkmark - success/confirmation
   */
  checkmark: (glyph, x, y) => {
    drawLine(glyph, x - 2, y, x, y + 3);
    drawLine(glyph, x, y + 3, x + 4, y - 2);
  },

  /**
   * X mark - error/failure
   */
  x: (glyph, x, y) => {
    drawLine(glyph, x - 2, y - 2, x + 2, y + 2);
    drawLine(glyph, x - 2, y + 2, x + 2, y - 2);
  },

  /**
   * Diamond - action/execution marker
   */
  diamond: (glyph, x, y) => {
    glyph.set(x, y - 2, 1);
    glyph.set(x - 2, y, 1);
    glyph.set(x + 2, y, 1);
    glyph.set(x, y + 2, 1);
    drawLine(glyph, x, y - 2, x - 2, y);
    drawLine(glyph, x, y - 2, x + 2, y);
    drawLine(glyph, x - 2, y, x, y + 2);
    drawLine(glyph, x + 2, y, x, y + 2);
  },

  /**
   * Hourglass - waiting/pending state
   */
  hourglass: (glyph, x, y) => {
    // Top triangle
    drawLine(glyph, x - 3, y - 3, x + 3, y - 3);
    drawLine(glyph, x - 3, y - 3, x, y);
    drawLine(glyph, x + 3, y - 3, x, y);
    // Bottom triangle
    drawLine(glyph, x - 3, y + 3, x + 3, y + 3);
    drawLine(glyph, x - 3, y + 3, x, y);
    drawLine(glyph, x + 3, y + 3, x, y);
  },

  /**
   * Clock - time/scheduling
   */
  clock: (glyph, x, y) => {
    drawCircle(glyph, x, y, 3);
    // Clock hands
    drawLine(glyph, x, y, x, y - 2);
    drawLine(glyph, x, y, x + 2, y);
  },

  /**
   * Lightning bolt - fast/urgent
   */
  lightning: (glyph, x, y) => {
    drawLine(glyph, x, y - 4, x - 1, y);
    drawLine(glyph, x - 1, y, x + 1, y);
    drawLine(glyph, x + 1, y, x, y + 4);
  },

  /**
   * Lock - security/encrypted
   */
  lock: (glyph, x, y) => {
    // Shackle
    drawLine(glyph, x - 1, y - 3, x - 1, y - 1);
    drawLine(glyph, x + 1, y - 3, x + 1, y - 1);
    drawLine(glyph, x - 1, y - 3, x + 1, y - 3);
    // Body
    drawRect(glyph, x - 2, y - 1, 5, 4);
  },

  /**
   * Unlock - open/accessible
   */
  unlock: (glyph, x, y) => {
    // Open shackle
    drawLine(glyph, x - 1, y - 3, x - 1, y - 1);
    drawLine(glyph, x - 1, y - 3, x + 1, y - 3);
    // Body
    drawRect(glyph, x - 2, y - 1, 5, 4);
  },

  /**
   * Arrow up - upload/increase
   */
  arrowUp: (glyph, x, y) => {
    drawLine(glyph, x, y - 3, x - 2, y);
    drawLine(glyph, x, y - 3, x + 2, y);
    drawLine(glyph, x, y - 2, x, y + 3);
  },

  /**
   * Arrow down - download/decrease
   */
  arrowDown: (glyph, x, y) => {
    drawLine(glyph, x, y + 3, x - 2, y);
    drawLine(glyph, x, y + 3, x + 2, y);
    drawLine(glyph, x, y + 2, x, y - 3);
  },

  /**
   * Gear - settings/processing
   */
  gear: (glyph, x, y) => {
    drawCircle(glyph, x, y, 2);
    // Teeth
    glyph.set(x, y - 3, 1);
    glyph.set(x, y + 3, 1);
    glyph.set(x - 3, y, 1);
    glyph.set(x + 3, y, 1);
    glyph.set(x - 2, y - 2, 1);
    glyph.set(x + 2, y - 2, 1);
    glyph.set(x - 2, y + 2, 1);
    glyph.set(x + 2, y + 2, 1);
  },

  /**
   * Document - file/record
   */
  document: (glyph, x, y) => {
    drawRectOutline(glyph, x - 2, y - 3, 5, 7);
    // Corner fold
    drawLine(glyph, x + 2, y - 3, x, y - 1);
    drawLine(glyph, x, y - 1, x, y - 3);
    // Lines
    drawLine(glyph, x - 1, y, x + 1, y);
    drawLine(glyph, x - 1, y + 2, x + 1, y + 2);
  },

  /**
   * Cloud - cloud service/remote
   */
  cloud: (glyph, x, y) => {
    drawCircle(glyph, x - 2, y, 2);
    drawCircle(glyph, x + 2, y, 2);
    drawCircle(glyph, x, y - 1, 2);
  },

  /**
   * Network - connections/API
   */
  network: (glyph, x, y) => {
    // Center node
    drawCircle(glyph, x, y, 1);
    // Outer nodes
    glyph.set(x, y - 3, 1);
    glyph.set(x, y + 3, 1);
    glyph.set(x - 3, y, 1);
    glyph.set(x + 3, y, 1);
    // Connections
    drawLine(glyph, x, y, x, y - 3);
    drawLine(glyph, x, y, x, y + 3);
    drawLine(glyph, x, y, x - 3, y);
    drawLine(glyph, x, y, x + 3, y);
  },

  /**
   * Money/coin - payment
   */
  coin: (glyph, x, y) => {
    drawCircle(glyph, x, y, 3);
    // Dollar sign or lines
    drawLine(glyph, x, y - 2, x, y + 2);
    glyph.set(x - 1, y - 1, 1);
    glyph.set(x + 1, y + 1, 1);
  },

  /**
   * User - person/identity
   */
  user: (glyph, x, y) => {
    drawCircle(glyph, x, y - 2, 2);
    drawCircle(glyph, x, y + 3, 3);
  },

  /**
   * Search - magnifying glass
   */
  search: (glyph, x, y) => {
    drawCircle(glyph, x - 1, y - 1, 2);
    drawLine(glyph, x + 1, y + 1, x + 3, y + 3);
  },

  /**
   * Warning - exclamation triangle
   */
  warning: (glyph, x, y) => {
    // Triangle outline
    drawLine(glyph, x, y - 3, x - 3, y + 2);
    drawLine(glyph, x, y - 3, x + 3, y + 2);
    drawLine(glyph, x - 3, y + 2, x + 3, y + 2);
    // Exclamation
    drawLine(glyph, x, y - 1, x, y);
    glyph.set(x, y + 1, 1);
  },

  /**
   * Pause - two vertical bars
   */
  pause: (glyph, x, y) => {
    drawRect(glyph, x - 2, y - 2, 2, 5);
    drawRect(glyph, x + 1, y - 2, 2, 5);
  },

  /**
   * Play - triangle pointing right
   */
  play: (glyph, x, y) => {
    drawLine(glyph, x - 2, y - 3, x - 2, y + 3);
    drawLine(glyph, x - 2, y - 3, x + 3, y);
    drawLine(glyph, x - 2, y + 3, x + 3, y);
  },

  /**
   * Stop - square
   */
  stop: (glyph, x, y) => {
    drawRect(glyph, x - 2, y - 2, 5, 5);
  },

  /**
   * Retry - circular arrow
   */
  retry: (glyph, x, y) => {
    // Partial circle
    for (let i = 0; i < 270; i += 15) {
      const rad = (i * Math.PI) / 180;
      const px = Math.round(x + 3 * Math.cos(rad));
      const py = Math.round(y + 3 * Math.sin(rad));
      glyph.set(px, py, 1);
    }
    // Arrow head
    drawLine(glyph, x + 3, y, x + 2, y - 2);
    drawLine(glyph, x + 3, y, x + 5, y - 1);
  }
};

/**
 * Draw a symbol on a glyph
 * @param {VisualGlyph} glyph - Target glyph
 * @param {string} symbolName - Name of the symbol
 * @param {number} x - Center X position (default: 24)
 * @param {number} y - Center Y position (default: 8)
 * @returns {boolean} True if symbol was drawn
 */
export function drawSymbol(glyph, symbolName, x = 24, y = 8) {
  const drawFn = symbols[symbolName];
  if (drawFn) {
    drawFn(glyph, x, y);
    return true;
  }
  return false;
}

/**
 * Get list of available symbol names
 * @returns {string[]} Array of symbol names
 */
export function getSymbolNames() {
  return Object.keys(symbols);
}

/**
 * Check if a symbol exists
 * @param {string} name - Symbol name
 * @returns {boolean} True if symbol exists
 */
export function hasSymbol(name) {
  return name in symbols;
}

/**
 * Register a custom symbol
 * @param {string} name - Symbol name
 * @param {Function} drawFn - Drawing function (glyph, x, y) => void
 */
export function registerSymbol(name, drawFn) {
  symbols[name] = drawFn;
}

export default {
  drawSymbol,
  getSymbolNames,
  hasSymbol,
  registerSymbol
};

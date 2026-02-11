/**
 * GlyphStream - River Flow Visualization
 *
 * Renders glyphs like a river - newest messages flow in at the TOP
 * and push older messages down. Like a waterfall of visual stories.
 */

import {
  GLYPH_PATTERNS,
  GLYPH_MEANINGS,
  GLYPH_CATEGORIES,
  CATEGORY_COLORS,
  NANO_GLYPHS,
  SIZE
} from './glyphs.js';

/**
 * GlyphStream - river-style glyph rendering
 * Newest messages appear at top, older ones scroll down
 */
export class GlyphStream {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');

    // Display size - 16x16 patterns scaled up for chunky pixels
    this.displaySize = options.displaySize || 96;
    this.glyphSize = 16; // Internal pattern size (16x16 now!)

    this.messages = [];
    this.totalBytes = 0;

    // Calculate canvas width based on container
    this.container = this.canvas.parentElement;
    this.canvasWidth = this.container.clientWidth || 800;

    // How many glyphs fit per row
    this.glyphsPerRow = Math.floor(this.canvasWidth / this.displaySize);

    // Panel update callback
    this.onPanelUpdate = options.onPanelUpdate || (() => {});

    // Initialize canvas
    this.initCanvas();

    // Handle resize
    window.addEventListener('resize', () => this.handleResize());
  }

  /**
   * Initialize canvas
   */
  initCanvas() {
    this.canvas.width = this.canvasWidth;
    this.canvas.height = this.displaySize; // Start with one row
    this.canvas.style.width = this.canvasWidth + 'px';
    this.clearCanvas();
  }

  /**
   * Clear canvas to black
   */
  clearCanvas() {
    this.ctx.fillStyle = '#0a0e17';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Handle window resize
   */
  handleResize() {
    const newWidth = this.container.clientWidth;
    if (Math.abs(newWidth - this.canvasWidth) > 50) {
      this.canvasWidth = newWidth;
      this.glyphsPerRow = Math.floor(this.canvasWidth / this.displaySize);
      this.redrawAll();
    }
  }

  /**
   * Add a message - renders at TOP, pushes others down
   */
  addMessage(message) {
    // Add to beginning of array (newest first)
    this.messages.unshift(message);

    // Calculate size
    const glyphs = message.glyphs || [message.glyph];
    const glyphBytes = glyphs.length * 512;
    this.totalBytes += message.size || glyphBytes;

    // Redraw everything with new message at top
    this.redrawAll();

    // Update side panel
    this.onPanelUpdate(message, {
      totalMessages: this.messages.length,
      totalBytes: this.totalBytes,
      glyphs: glyphs
    });

    // Scroll to top to see newest
    if (this.container) {
      this.container.scrollTop = 0;
    }

    return this.messages.length - 1;
  }

  /**
   * Redraw all messages (newest at top)
   */
  redrawAll() {
    // Calculate total glyphs and required height
    let totalGlyphSlots = 0;
    this.messages.forEach(msg => {
      if (msg.glyphId && NANO_GLYPHS[msg.glyphId]) {
        totalGlyphSlots += 1;
      } else {
        const glyphs = msg.glyphs || [msg.glyph];
        totalGlyphSlots += glyphs.length;
      }
    });

    const rows = Math.ceil(totalGlyphSlots / this.glyphsPerRow) || 1;
    const neededHeight = rows * this.displaySize;

    // Resize canvas
    this.canvas.width = this.canvasWidth;
    this.canvas.height = neededHeight;
    this.clearCanvas();

    // Render all glyphs - newest messages first (at top)
    let currentX = 0;
    let currentY = 0;

    this.messages.forEach(msg => {
      const glyphs = msg.glyphs || [msg.glyph];
      const nanoId = msg.glyphId; // e.g. "Q01", "R02"

      // If we have a NANO glyph for this ID, render it as a single glyph
      if (nanoId && NANO_GLYPHS[nanoId]) {
        if (currentX + this.displaySize > this.canvasWidth) {
          currentX = 0;
          currentY += this.displaySize;
        }
        const domain = msg.category || 'symbol';
        this.renderNanoGlyph(currentX, currentY, nanoId, domain);
        currentX += this.displaySize;
      } else {
        // Fallback: old layered approach
        glyphs.forEach(glyphId => {
          if (currentX + this.displaySize > this.canvasWidth) {
            currentX = 0;
            currentY += this.displaySize;
          }
          const category = this.getCategoryFromGlyph(glyphId);
          this.renderGlyph(currentX, currentY, glyphId, category);
          currentX += this.displaySize;
        });
      }
    });
  }

  /**
   * Determine category from glyph ID
   */
  getCategoryFromGlyph(glyphId) {
    for (const [category, glyphs] of Object.entries(GLYPH_CATEGORIES)) {
      if (glyphs.includes(glyphId)) {
        return category;
      }
    }
    return 'symbol';
  }

  /**
   * Render a single glyph at the specified position
   * Scales from internal 64x64 to display size
   */
  renderGlyph(x, y, glyphId, category) {
    const pattern = GLYPH_PATTERNS[glyphId];

    if (!pattern) {
      this.renderPlaceholder(x, y, glyphId, category);
      return;
    }

    const color = CATEGORY_COLORS[category] || CATEGORY_COLORS.symbol;
    const scale = this.displaySize / this.glyphSize;

    // Draw each pixel scaled up
    this.ctx.fillStyle = color;

    for (let py = 0; py < this.glyphSize; py++) {
      for (let px = 0; px < this.glyphSize; px++) {
        if (pattern[py] && pattern[py][px]) {
          const drawX = x + Math.floor(px * scale);
          const drawY = y + Math.floor(py * scale);
          const drawW = Math.ceil(scale);
          const drawH = Math.ceil(scale);
          this.ctx.fillRect(drawX, drawY, drawW, drawH);
        }
      }
    }

    // Subtle grid line between glyphs
    this.ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    this.ctx.strokeRect(x, y, this.displaySize, this.displaySize);
  }

  /**
   * Render a NANO glyph (redesigned 16x16 tocapu-style)
   */
  renderNanoGlyph(x, y, glyphId, domain) {
    const grid = NANO_GLYPHS[glyphId];
    if (!grid) return;

    const color = CATEGORY_COLORS[domain] || CATEGORY_COLORS.symbol || '#00d9ff';
    const scale = this.displaySize / this.glyphSize;

    this.ctx.fillStyle = color;
    for (let py = 0; py < this.glyphSize; py++) {
      for (let px = 0; px < this.glyphSize; px++) {
        if (grid[py] && grid[py][px]) {
          this.ctx.fillRect(
            x + Math.floor(px * scale),
            y + Math.floor(py * scale),
            Math.ceil(scale),
            Math.ceil(scale)
          );
        }
      }
    }

    this.ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    this.ctx.strokeRect(x, y, this.displaySize, this.displaySize);
  }

  /**
   * Render placeholder for unknown glyph
   */
  renderPlaceholder(x, y, glyphId, category) {
    const color = CATEGORY_COLORS[category] || '#666';

    this.ctx.fillStyle = color;
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2;

    // Border
    this.ctx.strokeRect(x + 4, y + 4, this.displaySize - 8, this.displaySize - 8);

    // Question mark
    this.ctx.font = `${this.displaySize * 0.5}px monospace`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('?', x + this.displaySize / 2, y + this.displaySize / 2);
  }

  /**
   * Clear all messages
   */
  clear() {
    this.messages = [];
    this.totalBytes = 0;
    this.initCanvas();
  }

  /**
   * Get current stats
   */
  getStats() {
    const glyphCount = this.messages.reduce((sum, msg) => {
      const glyphs = msg.glyphs || [msg.glyph];
      return sum + glyphs.length;
    }, 0);

    const rows = Math.ceil(glyphCount / this.glyphsPerRow) || 1;

    return {
      messages: this.messages.length,
      glyphs: glyphCount,
      bytes: this.totalBytes,
      rows: rows,
      canvasWidth: this.canvasWidth,
      displaySize: this.displaySize
    };
  }

  /**
   * Get glyph meanings (static)
   */
  static getMeanings() {
    return GLYPH_MEANINGS;
  }

  /**
   * Get category colors (static)
   */
  static getColors() {
    return CATEGORY_COLORS;
  }

  /**
   * Get all available glyphs by category
   */
  static getGlyphsByCategory() {
    return GLYPH_CATEGORIES;
  }
}

// Also export as TextileRiver for backward compatibility
export { GlyphStream as TextileRiver };
export default GlyphStream;

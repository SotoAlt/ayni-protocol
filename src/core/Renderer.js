/**
 * Renderer - Output rendering for glyphs
 *
 * Provides PNG, SVG, and Canvas rendering capabilities.
 */

import fs from 'fs';

// Try to import canvas, but gracefully handle if not installed
let createCanvas;
try {
  const canvas = await import('canvas');
  createCanvas = canvas.createCanvas;
} catch (e) {
  // Canvas not available - PNG rendering will throw helpful errors
  createCanvas = null;
}

/**
 * Check if canvas is available
 */
function requireCanvas() {
  if (!createCanvas) {
    throw new Error('PNG rendering requires the "canvas" package. Install with: npm install canvas');
  }
}

/**
 * Render glyph to PNG buffer
 * @param {VisualGlyph} glyph - Glyph to render
 * @param {Object} options - Render options
 * @param {number} options.scale - Scale factor (default: 1)
 * @param {string} options.foreground - Foreground color (default: '#000000')
 * @param {string} options.background - Background color (default: '#FFFFFF')
 * @returns {Buffer} PNG buffer
 */
export function toPNG(glyph, options = {}) {
  requireCanvas();
  const scale = options.scale || 1;
  const fg = options.foreground || '#000000';
  const bg = options.background || '#FFFFFF';

  const size = 32 * scale;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Fill background
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  // Draw pixels
  ctx.fillStyle = fg;
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      if (glyph.get(x, y)) {
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }
  }

  return canvas.toBuffer('image/png');
}

/**
 * Save glyph as PNG file
 * @param {VisualGlyph} glyph - Glyph to save
 * @param {string} filename - Output filename
 * @param {Object} options - Render options
 */
export function savePNG(glyph, filename, options = {}) {
  const buffer = toPNG(glyph, options);
  fs.writeFileSync(filename, buffer);
  return filename;
}

/**
 * Render glyph to SVG string
 * @param {VisualGlyph} glyph - Glyph to render
 * @param {Object} options - Render options
 * @param {number} options.scale - Scale factor (default: 1)
 * @param {string} options.foreground - Foreground color (default: '#000000')
 * @param {string} options.background - Background color (default: '#FFFFFF')
 * @returns {string} SVG string
 */
export function toSVG(glyph, options = {}) {
  const scale = options.scale || 1;
  const fg = options.foreground || '#000000';
  const bg = options.background || '#FFFFFF';
  const size = 32 * scale;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32">`;
  svg += `<rect width="32" height="32" fill="${bg}"/>`;

  // Collect filled pixels
  const pixels = [];
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      if (glyph.get(x, y)) {
        pixels.push({ x, y });
      }
    }
  }

  // Render as path for efficiency
  if (pixels.length > 0) {
    svg += `<g fill="${fg}">`;
    for (const { x, y } of pixels) {
      svg += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
    }
    svg += '</g>';
  }

  svg += '</svg>';
  return svg;
}

/**
 * Save glyph as SVG file
 * @param {VisualGlyph} glyph - Glyph to save
 * @param {string} filename - Output filename
 * @param {Object} options - Render options
 */
export function saveSVG(glyph, filename, options = {}) {
  const svg = toSVG(glyph, options);
  fs.writeFileSync(filename, svg);
  return filename;
}

/**
 * Render glyph to data URL (for embedding in HTML)
 * @param {VisualGlyph} glyph - Glyph to render
 * @param {Object} options - Render options
 * @returns {string} Data URL
 */
export function toDataURL(glyph, options = {}) {
  const buffer = toPNG(glyph, options);
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

/**
 * Render multiple glyphs in a grid
 * @param {VisualGlyph[]} glyphs - Array of glyphs
 * @param {Object} options - Render options
 * @param {number} options.cols - Number of columns
 * @param {number} options.scale - Scale factor
 * @param {number} options.gap - Gap between glyphs
 * @returns {Buffer} PNG buffer
 */
export function renderGrid(glyphs, options = {}) {
  requireCanvas();
  const cols = options.cols || Math.ceil(Math.sqrt(glyphs.length));
  const rows = Math.ceil(glyphs.length / cols);
  const scale = options.scale || 1;
  const gap = options.gap || 2;
  const cellSize = 32 * scale + gap;

  const canvas = createCanvas(cols * cellSize, rows * cellSize);
  const ctx = canvas.getContext('2d');

  // Fill background
  ctx.fillStyle = options.background || '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw each glyph
  glyphs.forEach((glyph, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = col * cellSize;
    const y = row * cellSize;

    ctx.fillStyle = options.foreground || '#000000';
    for (let py = 0; py < 32; py++) {
      for (let px = 0; px < 32; px++) {
        if (glyph.get(px, py)) {
          ctx.fillRect(x + px * scale, y + py * scale, scale, scale);
        }
      }
    }
  });

  return canvas.toBuffer('image/png');
}

/**
 * Render glyph with label
 * @param {VisualGlyph} glyph - Glyph to render
 * @param {Object} options - Render options
 * @param {boolean} options.showId - Show glyph ID
 * @param {boolean} options.showMeaning - Show meaning
 * @param {number} options.scale - Scale factor
 * @returns {Buffer} PNG buffer
 */
export function renderWithLabel(glyph, options = {}) {
  requireCanvas();
  const scale = options.scale || 2;
  const showId = options.showId !== false;
  const showMeaning = options.showMeaning !== false;
  const labelHeight = (showId || showMeaning) ? 20 : 0;

  const width = 32 * scale;
  const height = 32 * scale + labelHeight;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Fill background
  ctx.fillStyle = options.background || '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // Draw glyph
  ctx.fillStyle = options.foreground || '#000000';
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      if (glyph.get(x, y)) {
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }
  }

  // Draw label
  if (labelHeight > 0) {
    ctx.fillStyle = '#333333';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    let label = '';
    if (showId) label += glyph.id;
    if (showId && showMeaning) label += ': ';
    if (showMeaning) label += glyph.meaning;
    ctx.fillText(label, width / 2, height - 5, width - 4);
  }

  return canvas.toBuffer('image/png');
}

export default {
  toPNG,
  savePNG,
  toSVG,
  saveSVG,
  toDataURL,
  renderGrid,
  renderWithLabel
};

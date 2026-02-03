/**
 * TocapuMotifs - Andean-inspired geometric patterns for glyphs
 *
 * Design principles from tocapu (Andean textile patterns):
 * 1. Grid-Based Mathematical Precision - Every pixel intentional
 * 2. Yanantin: Complementary Duality - Black/white are complementary forces
 * 3. Frame-Within-Field Composition - Structured boundaries
 * 4. Geometric Abstraction - No curves, stepped designs only
 *
 * These motifs encode action categories through geometric patterns
 * instead of humanoid figures, following 4000+ years of Andean visual grammar.
 */

import { drawLine, drawRect, drawRectOutline } from './Primitives.js';

/**
 * Draw a stepped spiral (xicalcoliuhqui motif)
 * Used for: Query glyphs - represents seeking, questioning, water/wave
 *
 * @param {VisualGlyph} glyph - Target glyph
 * @param {string} direction - 'inward' (query) or 'outward' (expand)
 * @param {number} centerX - Center X (default: 16)
 * @param {number} centerY - Center Y (default: 16)
 */
export function drawSteppedSpiral(glyph, direction = 'inward', centerX = 16, centerY = 16) {
  const stepSize = 2;
  const maxRadius = 10;

  if (direction === 'inward') {
    // Spiral inward - questioning, seeking
    let x = centerX - maxRadius;
    let y = centerY - maxRadius;
    let size = maxRadius * 2;

    while (size > stepSize) {
      // Top edge
      drawLine(glyph, x, y, x + size, y);
      // Right edge
      drawLine(glyph, x + size, y, x + size, y + size);
      // Bottom edge
      drawLine(glyph, x + size, y + size, x + stepSize, y + size);
      // Left edge (partial)
      drawLine(glyph, x + stepSize, y + size, x + stepSize, y + stepSize);

      x += stepSize;
      y += stepSize;
      size -= stepSize * 2;
    }
  } else {
    // Spiral outward - expanding, broadcasting
    let x = centerX;
    let y = centerY;
    let size = stepSize;

    while (size <= maxRadius * 2) {
      // Draw expanding square spiral
      drawLine(glyph, x, y, x + size, y);
      drawLine(glyph, x + size, y, x + size, y + size);
      drawLine(glyph, x + size, y + size, x - stepSize, y + size);
      drawLine(glyph, x - stepSize, y + size, x - stepSize, y - stepSize);

      x -= stepSize;
      y -= stepSize;
      size += stepSize * 2;
    }
  }
}

/**
 * Draw a checkerboard pattern (Inca administrative symbol)
 * Used for: Response glyphs - represents completeness, organization
 *
 * @param {VisualGlyph} glyph - Target glyph
 * @param {number} divisions - Number of divisions per axis (2, 4, 8)
 * @param {number} startX - Start X (default: 4)
 * @param {number} startY - Start Y (default: 4)
 * @param {number} size - Total size (default: 24)
 */
export function drawCheckerboard(glyph, divisions = 4, startX = 4, startY = 4, size = 24) {
  const cellSize = Math.floor(size / divisions);

  for (let row = 0; row < divisions; row++) {
    for (let col = 0; col < divisions; col++) {
      // Alternating pattern
      if ((row + col) % 2 === 0) {
        const x = startX + col * cellSize;
        const y = startY + row * cellSize;
        drawRect(glyph, x, y, cellSize, cellSize);
      }
    }
  }
}

/**
 * Draw a broken symmetry pattern (intentional asymmetry)
 * Used for: Error glyphs - represents disruption, anomaly
 *
 * @param {VisualGlyph} glyph - Target glyph
 * @param {string} breakPoint - 'top-left', 'top-right', 'bottom-left', 'bottom-right'
 * @param {number} centerX - Center X (default: 16)
 * @param {number} centerY - Center Y (default: 16)
 */
export function drawBrokenSymmetry(glyph, breakPoint = 'top-right', centerX = 16, centerY = 16) {
  const halfSize = 10;

  // Draw four quadrants as nested L-shapes, but break one
  const quadrants = [
    { dx: -1, dy: -1, name: 'top-left' },
    { dx: 1, dy: -1, name: 'top-right' },
    { dx: -1, dy: 1, name: 'bottom-left' },
    { dx: 1, dy: 1, name: 'bottom-right' }
  ];

  for (const quad of quadrants) {
    const isBreak = quad.name === breakPoint;

    if (isBreak) {
      // Draw jagged/broken pattern
      for (let i = 2; i <= halfSize; i += 3) {
        const x = centerX + quad.dx * i;
        const y = centerY + quad.dy * i;
        glyph.set(x, y, 1);
        glyph.set(x + quad.dx, y, 1);
        glyph.set(x, y + quad.dy, 1);
      }
    } else {
      // Draw normal stepped L-shape
      for (let i = 2; i <= halfSize; i += 2) {
        // Horizontal segment
        const startX = centerX;
        const endX = centerX + quad.dx * i;
        drawLine(glyph, startX, centerY + quad.dy * i, endX, centerY + quad.dy * i);

        // Vertical segment
        const startY = centerY;
        const endY = centerY + quad.dy * i;
        drawLine(glyph, centerX + quad.dx * i, startY, centerX + quad.dx * i, endY);
      }
    }
  }
}

/**
 * Draw a diamond/rhombus pattern
 * Used for: Action glyphs - represents motion, transformation
 *
 * @param {VisualGlyph} glyph - Target glyph
 * @param {number} rotation - 0 = upright, 1 = tilted right, 2 = tilted left
 * @param {number} centerX - Center X (default: 16)
 * @param {number} centerY - Center Y (default: 16)
 * @param {number} size - Diamond size (default: 10)
 */
export function drawDiamond(glyph, rotation = 0, centerX = 16, centerY = 16, size = 10) {
  const offset = rotation === 1 ? 2 : rotation === 2 ? -2 : 0;

  // Draw concentric diamond shapes for filled effect
  for (let i = 0; i <= size; i++) {
    // Top point to right point
    drawLine(glyph, centerX + offset, centerY - size + i, centerX + i, centerY);
    // Right point to bottom point
    drawLine(glyph, centerX + size - i, centerY, centerX + offset, centerY + size - i);
    // Bottom point to left point
    drawLine(glyph, centerX + offset, centerY + size - i, centerX - i, centerY);
    // Left point to top point
    drawLine(glyph, centerX - size + i, centerY, centerX + offset, centerY - size + i);
  }

  // Add internal stepped pattern for visual interest
  for (let i = 2; i < size - 2; i += 2) {
    // Create stepped internal lines
    drawLine(glyph, centerX - i + offset, centerY - i, centerX + i + offset, centerY - i);
    drawLine(glyph, centerX - i + offset, centerY + i, centerX + i + offset, centerY + i);
  }
}

/**
 * Draw a Chakana (Andean cross) pattern
 * Used for: Payment glyphs - represents reciprocity, balance
 * The four directions represent: love, wisdom, work, sharing
 *
 * @param {VisualGlyph} glyph - Target glyph
 * @param {number} centerX - Center X (default: 16)
 * @param {number} centerY - Center Y (default: 16)
 * @param {number} size - Overall size (default: 12)
 */
export function drawChakana(glyph, centerX = 16, centerY = 16, size = 12) {
  const step = Math.floor(size / 3);

  // Center square
  drawRect(glyph, centerX - step, centerY - step, step * 2, step * 2);

  // Four arms with stepped corners (characteristic chakana shape)
  // Top arm
  drawRect(glyph, centerX - step, centerY - size, step * 2, step);
  // Bottom arm
  drawRect(glyph, centerX - step, centerY + step, step * 2, step);
  // Left arm
  drawRect(glyph, centerX - size, centerY - step, step, step * 2);
  // Right arm
  drawRect(glyph, centerX + step, centerY - step, step, step * 2);

  // Stepped corners (the signature chakana notches)
  // Top-left step
  glyph.set(centerX - step - 1, centerY - step - 1, 1);
  glyph.set(centerX - step, centerY - step - 1, 1);
  glyph.set(centerX - step - 1, centerY - step, 1);

  // Top-right step
  glyph.set(centerX + step, centerY - step - 1, 1);
  glyph.set(centerX + step + 1, centerY - step - 1, 1);
  glyph.set(centerX + step + 1, centerY - step, 1);

  // Bottom-left step
  glyph.set(centerX - step - 1, centerY + step, 1);
  glyph.set(centerX - step - 1, centerY + step + 1, 1);
  glyph.set(centerX - step, centerY + step + 1, 1);

  // Bottom-right step
  glyph.set(centerX + step + 1, centerY + step, 1);
  glyph.set(centerX + step + 1, centerY + step + 1, 1);
  glyph.set(centerX + step, centerY + step + 1, 1);
}

/**
 * Draw a tiered/stepped pyramid
 * Used for: State glyphs - represents hierarchy, levels, progress
 *
 * @param {VisualGlyph} glyph - Target glyph
 * @param {number} levels - Number of levels (2-5)
 * @param {string} direction - 'up' (ascending) or 'down' (descending)
 * @param {number} centerX - Center X (default: 16)
 * @param {number} bottomY - Bottom Y (default: 26)
 */
export function drawSteppedPyramid(glyph, levels = 4, direction = 'up', centerX = 16, bottomY = 26) {
  const baseWidth = 20;
  const levelHeight = 3;
  const widthStep = Math.floor(baseWidth / levels / 2);

  for (let level = 0; level < levels; level++) {
    const width = baseWidth - level * widthStep * 2;
    const y = direction === 'up'
      ? bottomY - level * levelHeight
      : bottomY - (levels - 1 - level) * levelHeight;

    drawRect(glyph, centerX - Math.floor(width / 2), y, width, levelHeight);
  }
}

/**
 * Draw a wave/water pattern (mayu - river)
 * Used for: Data flow glyphs - represents flowing, streaming
 *
 * @param {VisualGlyph} glyph - Target glyph
 * @param {number} waves - Number of wave cycles (2-4)
 * @param {number} startY - Start Y position (default: 16)
 */
export function drawWavePattern(glyph, waves = 3, startY = 16) {
  const amplitude = 3;
  const waveWidth = Math.floor(24 / waves);

  for (let w = 0; w < waves; w++) {
    const startX = 4 + w * waveWidth;

    // Rising stepped line
    for (let i = 0; i < waveWidth / 2; i++) {
      const y = startY - Math.floor(i * amplitude / (waveWidth / 2));
      glyph.set(startX + i, y, 1);
      glyph.set(startX + i, y + 1, 1);
    }

    // Falling stepped line
    for (let i = 0; i < waveWidth / 2; i++) {
      const y = startY - amplitude + Math.floor(i * amplitude / (waveWidth / 2));
      glyph.set(startX + waveWidth / 2 + i, y, 1);
      glyph.set(startX + waveWidth / 2 + i, y + 1, 1);
    }
  }
}

/**
 * Draw a concentric squares pattern
 * Used for: Security/encryption glyphs - represents layers, protection
 *
 * @param {VisualGlyph} glyph - Target glyph
 * @param {number} layers - Number of concentric layers (2-5)
 * @param {number} centerX - Center X (default: 16)
 * @param {number} centerY - Center Y (default: 16)
 */
export function drawConcentricSquares(glyph, layers = 3, centerX = 16, centerY = 16) {
  const maxSize = 10;
  const step = Math.floor(maxSize / layers);

  for (let i = 0; i < layers; i++) {
    const size = maxSize - i * step;
    drawRectOutline(glyph, centerX - size, centerY - size, size * 2, size * 2);
  }
}

/**
 * Draw a crosshatch/woven pattern
 * Used for: Network/connection glyphs - represents weaving, interconnection
 *
 * @param {VisualGlyph} glyph - Target glyph
 * @param {number} spacing - Line spacing (2-4)
 * @param {number} startX - Start X (default: 4)
 * @param {number} startY - Start Y (default: 4)
 * @param {number} size - Pattern size (default: 24)
 */
export function drawCrosshatch(glyph, spacing = 3, startX = 4, startY = 4, size = 24) {
  // Diagonal lines one direction
  for (let i = 0; i < size; i += spacing) {
    drawLine(glyph, startX + i, startY, startX, startY + i);
    drawLine(glyph, startX + size, startY + i, startX + size - i, startY + size);
  }

  // Diagonal lines other direction
  for (let i = 0; i < size; i += spacing) {
    drawLine(glyph, startX + size - i, startY, startX + size, startY + i);
    drawLine(glyph, startX, startY + i, startX + i, startY + size);
  }
}

/**
 * Motif registry - maps motif names to drawing functions
 */
const motifs = {
  // Query motifs
  steppedSpiral: (glyph, cx, cy) => drawSteppedSpiral(glyph, 'inward', cx, cy),
  spiralOutward: (glyph, cx, cy) => drawSteppedSpiral(glyph, 'outward', cx, cy),

  // Response motifs
  checkerboard: (glyph, cx, cy) => drawCheckerboard(glyph, 4, cx - 12, cy - 12, 24),
  checkerboard2: (glyph, cx, cy) => drawCheckerboard(glyph, 2, cx - 12, cy - 12, 24),

  // Error motifs
  brokenTopRight: (glyph, cx, cy) => drawBrokenSymmetry(glyph, 'top-right', cx, cy),
  brokenTopLeft: (glyph, cx, cy) => drawBrokenSymmetry(glyph, 'top-left', cx, cy),
  brokenBottomRight: (glyph, cx, cy) => drawBrokenSymmetry(glyph, 'bottom-right', cx, cy),
  brokenBottomLeft: (glyph, cx, cy) => drawBrokenSymmetry(glyph, 'bottom-left', cx, cy),

  // Action motifs
  diamond: (glyph, cx, cy) => drawDiamond(glyph, 0, cx, cy),
  diamondRight: (glyph, cx, cy) => drawDiamond(glyph, 1, cx, cy),
  diamondLeft: (glyph, cx, cy) => drawDiamond(glyph, 2, cx, cy),

  // Payment motifs
  chakana: (glyph, cx, cy) => drawChakana(glyph, cx, cy),

  // State motifs
  pyramidUp: (glyph, cx, cy) => drawSteppedPyramid(glyph, 4, 'up', cx, cy + 10),
  pyramidDown: (glyph, cx, cy) => drawSteppedPyramid(glyph, 4, 'down', cx, cy + 10),

  // Data/flow motifs
  wave: (glyph, cx, cy) => drawWavePattern(glyph, 3, cy),

  // Security motifs
  concentric: (glyph, cx, cy) => drawConcentricSquares(glyph, 3, cx, cy),

  // Network motifs
  crosshatch: (glyph, cx, cy) => drawCrosshatch(glyph, 3, cx - 12, cy - 12, 24)
};

/**
 * Draw a tocapu motif on a glyph
 * @param {VisualGlyph} glyph - Target glyph
 * @param {string} motifName - Name of the motif
 * @param {number} centerX - Center X position (default: 16)
 * @param {number} centerY - Center Y position (default: 16)
 * @returns {boolean} True if motif was drawn
 */
export function drawTocapuMotif(glyph, motifName, centerX = 16, centerY = 16) {
  const drawFn = motifs[motifName];
  if (drawFn) {
    drawFn(glyph, centerX, centerY);
    return true;
  }
  return false;
}

/**
 * Get list of available motif names
 * @returns {string[]} Array of motif names
 */
export function getMotifNames() {
  return Object.keys(motifs);
}

/**
 * Check if a motif exists
 * @param {string} name - Motif name
 * @returns {boolean} True if motif exists
 */
export function hasMotif(name) {
  return name in motifs;
}

/**
 * Register a custom motif
 * @param {string} name - Motif name
 * @param {Function} drawFn - Drawing function (glyph, centerX, centerY) => void
 */
export function registerMotif(name, drawFn) {
  motifs[name] = drawFn;
}

/**
 * Motif-to-category mapping
 */
export const MOTIF_CATEGORIES = {
  steppedSpiral: 'query',
  spiralOutward: 'query',
  checkerboard: 'response',
  checkerboard2: 'response',
  brokenTopRight: 'error',
  brokenTopLeft: 'error',
  brokenBottomRight: 'error',
  brokenBottomLeft: 'error',
  diamond: 'action',
  diamondRight: 'action',
  diamondLeft: 'action',
  chakana: 'payment',
  pyramidUp: 'state',
  pyramidDown: 'state',
  wave: 'data',
  concentric: 'security',
  crosshatch: 'network'
};

export default {
  drawTocapuMotif,
  getMotifNames,
  hasMotif,
  registerMotif,
  MOTIF_CATEGORIES,
  // Direct function exports for custom compositions
  drawSteppedSpiral,
  drawCheckerboard,
  drawBrokenSymmetry,
  drawDiamond,
  drawChakana,
  drawSteppedPyramid,
  drawWavePattern,
  drawConcentricSquares,
  drawCrosshatch
};

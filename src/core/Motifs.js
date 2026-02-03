/**
 * Motifs - Unified visual element system for glyphs
 *
 * This module provides a dual-style approach:
 * 1. GEOMETRIC/ABSTRACT: Tocapu-inspired patterns (default)
 * 2. REPRESENTATIONAL: Improved humanoid figures
 *
 * Both styles follow tocapu design principles:
 * - Grid-based mathematical precision
 * - Yanantin (complementary duality)
 * - Frame-within-field composition
 *
 * The style can be switched globally or per-glyph.
 */

import { drawLine, drawCircle } from './Primitives.js';
import {
  drawSteppedSpiral,
  drawCheckerboard,
  drawBrokenSymmetry,
  drawDiamond,
  drawChakana,
  drawSteppedPyramid,
  drawWavePattern,
  drawConcentricSquares
} from './TocapuMotifs.js';

// Global style setting
let currentStyle = 'geometric';

/**
 * Set the global motif style
 * @param {'geometric'|'representational'|'hybrid'} style - Style to use
 */
export function setMotifStyle(style) {
  if (['geometric', 'representational', 'hybrid'].includes(style)) {
    currentStyle = style;
  }
}

/**
 * Get the current motif style
 * @returns {string} Current style
 */
export function getMotifStyle() {
  return currentStyle;
}

// ============================================================
// REPRESENTATIONAL STYLE (Improved Humanoid Figures)
// ============================================================

const representationalMotifs = {
  /**
   * Arms raised - Query/asking pose
   * Improved: Better proportions, cleaner lines
   */
  arms_up: (glyph, centerX = 16, centerY = 16) => {
    // Head (slightly larger for visibility)
    drawCircle(glyph, centerX, centerY - 8, 3);
    // Neck
    drawLine(glyph, centerX, centerY - 5, centerX, centerY - 4);
    // Body (wider torso)
    drawLine(glyph, centerX, centerY - 4, centerX, centerY + 3);
    drawLine(glyph, centerX - 1, centerY - 3, centerX - 1, centerY + 2);
    drawLine(glyph, centerX + 1, centerY - 3, centerX + 1, centerY + 2);
    // Arms raised (victory/question pose)
    drawLine(glyph, centerX - 1, centerY - 3, centerX - 5, centerY - 8);
    drawLine(glyph, centerX + 1, centerY - 3, centerX + 5, centerY - 8);
    // Hands
    glyph.set(centerX - 5, centerY - 9, 1);
    glyph.set(centerX + 5, centerY - 9, 1);
    // Legs (stable stance)
    drawLine(glyph, centerX, centerY + 3, centerX - 3, centerY + 10);
    drawLine(glyph, centerX, centerY + 3, centerX + 3, centerY + 10);
    // Feet
    drawLine(glyph, centerX - 3, centerY + 10, centerX - 4, centerY + 10);
    drawLine(glyph, centerX + 3, centerY + 10, centerX + 4, centerY + 10);
  },

  /**
   * Arms down/forward - Response/offering pose
   * Improved: Clearer offering gesture
   */
  arms_down: (glyph, centerX = 16, centerY = 16) => {
    // Head
    drawCircle(glyph, centerX, centerY - 8, 3);
    // Neck
    drawLine(glyph, centerX, centerY - 5, centerX, centerY - 4);
    // Body
    drawLine(glyph, centerX, centerY - 4, centerX, centerY + 3);
    drawLine(glyph, centerX - 1, centerY - 3, centerX - 1, centerY + 2);
    drawLine(glyph, centerX + 1, centerY - 3, centerX + 1, centerY + 2);
    // Arms offering forward
    drawLine(glyph, centerX - 1, centerY - 2, centerX - 5, centerY);
    drawLine(glyph, centerX + 1, centerY - 2, centerX + 5, centerY);
    drawLine(glyph, centerX - 5, centerY, centerX - 5, centerY + 2);
    drawLine(glyph, centerX + 5, centerY, centerX + 5, centerY + 2);
    // Platform/offering (what they're holding)
    drawLine(glyph, centerX - 5, centerY + 2, centerX + 5, centerY + 2);
    // Legs
    drawLine(glyph, centerX, centerY + 3, centerX - 2, centerY + 10);
    drawLine(glyph, centerX, centerY + 3, centerX + 2, centerY + 10);
  },

  /**
   * Distressed - Error/problem pose
   * Improved: More expressive distress
   */
  distressed: (glyph, centerX = 16, centerY = 16) => {
    // Head (tilted)
    drawCircle(glyph, centerX + 1, centerY - 8, 3);
    // Body (hunched)
    drawLine(glyph, centerX + 1, centerY - 5, centerX, centerY + 3);
    drawLine(glyph, centerX, centerY - 4, centerX - 1, centerY + 2);
    // Arms to head (distress gesture)
    drawLine(glyph, centerX - 1, centerY - 3, centerX - 2, centerY - 7);
    drawLine(glyph, centerX + 1, centerY - 3, centerX + 4, centerY - 7);
    // Elbows bent sharply
    glyph.set(centerX - 3, centerY - 5, 1);
    glyph.set(centerX + 5, centerY - 5, 1);
    // Legs bent (cowering)
    drawLine(glyph, centerX, centerY + 3, centerX - 3, centerY + 8);
    drawLine(glyph, centerX, centerY + 3, centerX + 2, centerY + 8);
    drawLine(glyph, centerX - 3, centerY + 8, centerX - 4, centerY + 10);
    drawLine(glyph, centerX + 2, centerY + 8, centerX + 3, centerY + 10);
  },

  /**
   * Running/action - Execution pose
   * Improved: More dynamic motion
   */
  action: (glyph, centerX = 16, centerY = 16) => {
    // Head (leaning forward)
    drawCircle(glyph, centerX + 3, centerY - 8, 3);
    // Body (angled for motion)
    drawLine(glyph, centerX + 3, centerY - 5, centerX, centerY + 2);
    drawLine(glyph, centerX + 2, centerY - 4, centerX - 1, centerY + 1);
    // Arms pumping
    drawLine(glyph, centerX + 1, centerY - 3, centerX - 4, centerY - 5);
    drawLine(glyph, centerX + 1, centerY - 3, centerX + 6, centerY - 1);
    // Legs running
    drawLine(glyph, centerX, centerY + 2, centerX - 4, centerY + 6);
    drawLine(glyph, centerX - 4, centerY + 6, centerX - 6, centerY + 10);
    drawLine(glyph, centerX, centerY + 2, centerX + 4, centerY + 7);
    drawLine(glyph, centerX + 4, centerY + 7, centerX + 5, centerY + 10);
    // Motion lines
    drawLine(glyph, centerX - 6, centerY - 6, centerX - 8, centerY - 6);
    drawLine(glyph, centerX - 5, centerY - 3, centerX - 7, centerY - 3);
  },

  /**
   * Standing still - Idle/waiting pose
   */
  standing: (glyph, centerX = 16, centerY = 16) => {
    // Head
    drawCircle(glyph, centerX, centerY - 8, 3);
    // Body
    drawLine(glyph, centerX, centerY - 5, centerX, centerY + 3);
    drawLine(glyph, centerX - 1, centerY - 4, centerX - 1, centerY + 2);
    drawLine(glyph, centerX + 1, centerY - 4, centerX + 1, centerY + 2);
    // Arms at sides
    drawLine(glyph, centerX - 1, centerY - 3, centerX - 4, centerY);
    drawLine(glyph, centerX + 1, centerY - 3, centerX + 4, centerY);
    drawLine(glyph, centerX - 4, centerY, centerX - 4, centerY + 2);
    drawLine(glyph, centerX + 4, centerY, centerX + 4, centerY + 2);
    // Legs together
    drawLine(glyph, centerX, centerY + 3, centerX - 1, centerY + 10);
    drawLine(glyph, centerX, centerY + 3, centerX + 1, centerY + 10);
  },

  /**
   * Thinking - Processing pose
   */
  thinking: (glyph, centerX = 16, centerY = 16) => {
    // Head (tilted)
    drawCircle(glyph, centerX + 1, centerY - 8, 3);
    // Body
    drawLine(glyph, centerX, centerY - 5, centerX, centerY + 3);
    // One arm to chin
    drawLine(glyph, centerX - 1, centerY - 3, centerX - 1, centerY - 6);
    drawLine(glyph, centerX - 1, centerY - 6, centerX + 1, centerY - 6);
    // Other arm crossed
    drawLine(glyph, centerX + 1, centerY - 3, centerX + 3, centerY - 1);
    drawLine(glyph, centerX + 3, centerY - 1, centerX - 2, centerY - 1);
    // Legs
    drawLine(glyph, centerX, centerY + 3, centerX - 2, centerY + 10);
    drawLine(glyph, centerX, centerY + 3, centerX + 2, centerY + 10);
    // Thought indicator
    glyph.set(centerX + 4, centerY - 10, 1);
    glyph.set(centerX + 5, centerY - 11, 1);
    glyph.set(centerX + 6, centerY - 12, 1);
  },

  /**
   * Celebrating - Success pose
   */
  celebrating: (glyph, centerX = 16, centerY = 16) => {
    // Head
    drawCircle(glyph, centerX, centerY - 8, 3);
    // Body
    drawLine(glyph, centerX, centerY - 5, centerX, centerY + 3);
    // Arms up and out (V shape)
    drawLine(glyph, centerX, centerY - 3, centerX - 6, centerY - 9);
    drawLine(glyph, centerX, centerY - 3, centerX + 6, centerY - 9);
    // Legs apart (power stance)
    drawLine(glyph, centerX, centerY + 3, centerX - 4, centerY + 10);
    drawLine(glyph, centerX, centerY + 3, centerX + 4, centerY + 10);
    // Sparkles/celebration
    glyph.set(centerX - 7, centerY - 10, 1);
    glyph.set(centerX + 7, centerY - 10, 1);
    glyph.set(centerX - 8, centerY - 8, 1);
    glyph.set(centerX + 8, centerY - 8, 1);
  },

  /**
   * Pointing - Direction pose
   */
  pointing: (glyph, centerX = 16, centerY = 16) => {
    // Head
    drawCircle(glyph, centerX, centerY - 8, 3);
    // Body
    drawLine(glyph, centerX, centerY - 5, centerX, centerY + 3);
    // Pointing arm (extended)
    drawLine(glyph, centerX, centerY - 3, centerX + 8, centerY - 5);
    // Arrow at end of pointing
    drawLine(glyph, centerX + 8, centerY - 5, centerX + 6, centerY - 7);
    drawLine(glyph, centerX + 8, centerY - 5, centerX + 6, centerY - 3);
    // Other arm at side
    drawLine(glyph, centerX, centerY - 3, centerX - 3, centerY);
    // Legs
    drawLine(glyph, centerX, centerY + 3, centerX - 2, centerY + 10);
    drawLine(glyph, centerX, centerY + 3, centerX + 2, centerY + 10);
  },

  /**
   * Blocking - Stop pose
   */
  blocking: (glyph, centerX = 16, centerY = 16) => {
    // Head
    drawCircle(glyph, centerX, centerY - 8, 3);
    // Body
    drawLine(glyph, centerX, centerY - 5, centerX, centerY + 3);
    // Arms crossed in X
    drawLine(glyph, centerX - 5, centerY - 4, centerX + 5, centerY + 1);
    drawLine(glyph, centerX + 5, centerY - 4, centerX - 5, centerY + 1);
    // Legs wide (blocking stance)
    drawLine(glyph, centerX, centerY + 3, centerX - 5, centerY + 10);
    drawLine(glyph, centerX, centerY + 3, centerX + 5, centerY + 10);
  },

  /**
   * Receiving - Input pose
   */
  receiving: (glyph, centerX = 16, centerY = 16) => {
    // Head
    drawCircle(glyph, centerX, centerY - 8, 3);
    // Body
    drawLine(glyph, centerX, centerY - 5, centerX, centerY + 3);
    // Arms cupped
    drawLine(glyph, centerX, centerY - 3, centerX - 5, centerY - 2);
    drawLine(glyph, centerX, centerY - 3, centerX + 5, centerY - 2);
    drawLine(glyph, centerX - 5, centerY - 2, centerX - 6, centerY + 1);
    drawLine(glyph, centerX + 5, centerY - 2, centerX + 6, centerY + 1);
    // Cup bottom
    drawLine(glyph, centerX - 6, centerY + 1, centerX + 6, centerY + 1);
    // Something being received
    glyph.set(centerX, centerY - 1, 1);
    glyph.set(centerX - 1, centerY, 1);
    glyph.set(centerX + 1, centerY, 1);
    // Legs
    drawLine(glyph, centerX, centerY + 3, centerX - 2, centerY + 10);
    drawLine(glyph, centerX, centerY + 3, centerX + 2, centerY + 10);
  }
};

// ============================================================
// GEOMETRIC STYLE (Tocapu-Inspired)
// ============================================================

const geometricMotifs = {
  // Query motifs
  arms_up: (glyph, cx, cy) => drawSteppedSpiral(glyph, 'inward', cx, cy),

  // Response motifs
  arms_down: (glyph, cx, cy) => drawCheckerboard(glyph, 4, cx - 12, cy - 12, 24),

  // Error motifs
  distressed: (glyph, cx, cy) => drawBrokenSymmetry(glyph, 'top-right', cx, cy),

  // Action motifs
  action: (glyph, cx, cy) => drawDiamond(glyph, 0, cx, cy),

  // State motifs
  standing: (glyph, cx, cy) => drawSteppedPyramid(glyph, 3, 'up', cx, cy + 6),
  thinking: (glyph, cx, cy) => drawConcentricSquares(glyph, 3, cx, cy),
  celebrating: (glyph, cx, cy) => drawChakana(glyph, cx, cy),

  // Extended poses mapped to geometric patterns
  pointing: (glyph, cx, cy) => drawDiamond(glyph, 1, cx, cy),
  blocking: (glyph, cx, cy) => drawBrokenSymmetry(glyph, 'bottom-left', cx, cy),
  receiving: (glyph, cx, cy) => drawSteppedPyramid(glyph, 4, 'down', cx, cy + 6)
};

// ============================================================
// UNIFIED API
// ============================================================

/**
 * Draw a motif on a glyph
 * @param {VisualGlyph} glyph - Target glyph
 * @param {string} motifName - Name of the motif
 * @param {number} centerX - Center X position (default: 16)
 * @param {number} centerY - Center Y position (default: 16)
 * @param {Object} options - Options including style override
 * @returns {boolean} True if motif was drawn
 */
export function drawMotif(glyph, motifName, centerX = 16, centerY = 16, options = {}) {
  const style = options.style || currentStyle;
  const motifSet = style === 'representational' ? representationalMotifs : geometricMotifs;

  const drawFn = motifSet[motifName];
  if (drawFn) {
    drawFn(glyph, centerX, centerY);
    return true;
  }

  // Fallback to representational if geometric doesn't have it
  if (style === 'geometric' && representationalMotifs[motifName]) {
    representationalMotifs[motifName](glyph, centerX, centerY);
    return true;
  }

  return false;
}

/**
 * Get list of available motif names for current style
 * @returns {string[]} Array of motif names
 */
export function getMotifNames() {
  const geom = Object.keys(geometricMotifs);
  const repr = Object.keys(representationalMotifs);
  return [...new Set([...geom, ...repr])];
}

/**
 * Check if a motif exists
 * @param {string} name - Motif name
 * @returns {boolean} True if motif exists
 */
export function hasMotif(name) {
  return name in geometricMotifs || name in representationalMotifs;
}

/**
 * Register a custom motif
 * @param {string} name - Motif name
 * @param {Function} drawFn - Drawing function (glyph, centerX, centerY) => void
 * @param {string} style - 'geometric' or 'representational'
 */
export function registerMotif(name, drawFn, style = 'geometric') {
  if (style === 'representational') {
    representationalMotifs[name] = drawFn;
  } else {
    geometricMotifs[name] = drawFn;
  }
}

/**
 * Motif-to-category mapping
 */
export const MOTIF_CATEGORIES = {
  arms_up: 'query',
  arms_down: 'response',
  distressed: 'error',
  action: 'action',
  standing: 'state',
  thinking: 'state',
  celebrating: 'response',
  pointing: 'action',
  blocking: 'error',
  receiving: 'response'
};

// ============================================================
// BACKWARD COMPATIBILITY - Pose API
// ============================================================

/**
 * Draw a humanoid pose on a glyph (backward compatible)
 * @param {VisualGlyph} glyph - Target glyph
 * @param {string} poseName - Name of the pose
 * @param {number} centerX - Center X position (default: 16)
 * @param {number} centerY - Center Y position (default: 16)
 * @returns {boolean} True if pose was drawn
 * @deprecated Use drawMotif instead
 */
export function drawPose(glyph, poseName, centerX = 16, centerY = 16) {
  return drawMotif(glyph, poseName, centerX, centerY);
}

/**
 * Get list of available pose names (backward compatible)
 * @returns {string[]} Array of pose names
 * @deprecated Use getMotifNames instead
 */
export function getPoseNames() {
  return getMotifNames();
}

/**
 * Check if a pose exists (backward compatible)
 * @param {string} name - Pose name
 * @returns {boolean} True if pose exists
 * @deprecated Use hasMotif instead
 */
export function hasPose(name) {
  return hasMotif(name);
}

/**
 * Register a custom pose (backward compatible)
 * @param {string} name - Pose name
 * @param {Function} drawFn - Drawing function (glyph, centerX, centerY) => void
 * @deprecated Use registerMotif instead
 */
export function registerPose(name, drawFn) {
  registerMotif(name, drawFn, 'representational');
}

// Legacy alias
export const POSE_CATEGORIES = MOTIF_CATEGORIES;

export default {
  // Primary API
  drawMotif,
  getMotifNames,
  hasMotif,
  registerMotif,
  MOTIF_CATEGORIES,
  setMotifStyle,
  getMotifStyle,

  // Backward compatibility
  drawPose,
  getPoseNames,
  hasPose,
  registerPose,
  POSE_CATEGORIES
};

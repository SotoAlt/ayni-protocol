/**
 * Poses - Humanoid figure poses for glyphs
 *
 * The humanoid figure is the core visual element of Ayni glyphs.
 * Different poses encode the fundamental action type (query, response, error, action).
 */

import { drawLine, drawCircle } from './Primitives.js';

/**
 * Pose registry - maps pose names to drawing functions
 */
const poses = {
  /**
   * Arms raised - Query/asking pose
   * Conveys: requesting, questioning, seeking
   */
  arms_up: (glyph, centerX = 16, centerY = 16) => {
    // Head
    drawCircle(glyph, centerX, centerY - 8, 2);
    // Body
    drawLine(glyph, centerX, centerY - 6, centerX, centerY + 4);
    // Arms up (raised)
    drawLine(glyph, centerX, centerY - 4, centerX - 4, centerY - 8);
    drawLine(glyph, centerX, centerY - 4, centerX + 4, centerY - 8);
    // Legs
    drawLine(glyph, centerX, centerY + 4, centerX - 3, centerY + 10);
    drawLine(glyph, centerX, centerY + 4, centerX + 3, centerY + 10);
  },

  /**
   * Arms down/forward - Response/offering pose
   * Conveys: giving, providing, responding
   */
  arms_down: (glyph, centerX = 16, centerY = 16) => {
    // Head
    drawCircle(glyph, centerX, centerY - 8, 2);
    // Body
    drawLine(glyph, centerX, centerY - 6, centerX, centerY + 4);
    // Arms down/forward (offering)
    drawLine(glyph, centerX, centerY - 2, centerX - 4, centerY + 2);
    drawLine(glyph, centerX, centerY - 2, centerX + 4, centerY + 2);
    // Legs
    drawLine(glyph, centerX, centerY + 4, centerX - 3, centerY + 10);
    drawLine(glyph, centerX, centerY + 4, centerX + 3, centerY + 10);
  },

  /**
   * Distressed - Error/problem pose
   * Conveys: failure, error, concern
   */
  distressed: (glyph, centerX = 16, centerY = 16) => {
    // Head
    drawCircle(glyph, centerX, centerY - 8, 2);
    // Body
    drawLine(glyph, centerX, centerY - 6, centerX, centerY + 4);
    // Arms to head (distressed gesture)
    drawLine(glyph, centerX, centerY - 4, centerX - 3, centerY - 9);
    drawLine(glyph, centerX, centerY - 4, centerX + 3, centerY - 9);
    // Legs
    drawLine(glyph, centerX, centerY + 4, centerX - 3, centerY + 10);
    drawLine(glyph, centerX, centerY + 4, centerX + 3, centerY + 10);
  },

  /**
   * Running/action - Execution pose
   * Conveys: doing, executing, processing
   */
  action: (glyph, centerX = 16, centerY = 16) => {
    // Head (offset for motion)
    drawCircle(glyph, centerX + 2, centerY - 8, 2);
    // Body (angled)
    drawLine(glyph, centerX + 2, centerY - 6, centerX, centerY + 4);
    // Arms in motion
    drawLine(glyph, centerX, centerY - 2, centerX - 4, centerY);
    drawLine(glyph, centerX, centerY - 2, centerX + 4, centerY - 6);
    // Legs running
    drawLine(glyph, centerX, centerY + 4, centerX - 2, centerY + 10);
    drawLine(glyph, centerX, centerY + 4, centerX + 4, centerY + 8);
  },

  /**
   * Standing still - Idle/waiting pose
   * Conveys: waiting, idle, ready
   */
  standing: (glyph, centerX = 16, centerY = 16) => {
    // Head
    drawCircle(glyph, centerX, centerY - 8, 2);
    // Body
    drawLine(glyph, centerX, centerY - 6, centerX, centerY + 4);
    // Arms at sides
    drawLine(glyph, centerX, centerY - 4, centerX - 3, centerY);
    drawLine(glyph, centerX, centerY - 4, centerX + 3, centerY);
    // Legs together
    drawLine(glyph, centerX, centerY + 4, centerX - 2, centerY + 10);
    drawLine(glyph, centerX, centerY + 4, centerX + 2, centerY + 10);
  },

  /**
   * Thinking - Processing/contemplating pose
   * Conveys: processing, considering, analyzing
   */
  thinking: (glyph, centerX = 16, centerY = 16) => {
    // Head (tilted)
    drawCircle(glyph, centerX + 1, centerY - 8, 2);
    // Body
    drawLine(glyph, centerX, centerY - 6, centerX, centerY + 4);
    // One arm to chin, other at side
    drawLine(glyph, centerX, centerY - 4, centerX + 2, centerY - 7);
    drawLine(glyph, centerX, centerY - 4, centerX - 3, centerY);
    // Legs
    drawLine(glyph, centerX, centerY + 4, centerX - 2, centerY + 10);
    drawLine(glyph, centerX, centerY + 4, centerX + 2, centerY + 10);
  },

  /**
   * Celebrating - Success/completion pose
   * Conveys: success, celebration, achievement
   */
  celebrating: (glyph, centerX = 16, centerY = 16) => {
    // Head
    drawCircle(glyph, centerX, centerY - 8, 2);
    // Body
    drawLine(glyph, centerX, centerY - 6, centerX, centerY + 4);
    // Arms up and out (victory pose)
    drawLine(glyph, centerX, centerY - 4, centerX - 5, centerY - 7);
    drawLine(glyph, centerX, centerY - 4, centerX + 5, centerY - 7);
    // Legs apart
    drawLine(glyph, centerX, centerY + 4, centerX - 4, centerY + 10);
    drawLine(glyph, centerX, centerY + 4, centerX + 4, centerY + 10);
  },

  /**
   * Pointing - Direction/reference pose
   * Conveys: indicating, directing, referencing
   */
  pointing: (glyph, centerX = 16, centerY = 16) => {
    // Head
    drawCircle(glyph, centerX, centerY - 8, 2);
    // Body
    drawLine(glyph, centerX, centerY - 6, centerX, centerY + 4);
    // One arm pointing right, other at side
    drawLine(glyph, centerX, centerY - 4, centerX + 6, centerY - 4);
    drawLine(glyph, centerX, centerY - 4, centerX - 3, centerY);
    // Legs
    drawLine(glyph, centerX, centerY + 4, centerX - 2, centerY + 10);
    drawLine(glyph, centerX, centerY + 4, centerX + 2, centerY + 10);
  },

  /**
   * Blocking - Stop/denial pose
   * Conveys: stopping, blocking, refusing
   */
  blocking: (glyph, centerX = 16, centerY = 16) => {
    // Head
    drawCircle(glyph, centerX, centerY - 8, 2);
    // Body
    drawLine(glyph, centerX, centerY - 6, centerX, centerY + 4);
    // Arms crossed in front
    drawLine(glyph, centerX - 4, centerY - 4, centerX + 4, centerY);
    drawLine(glyph, centerX + 4, centerY - 4, centerX - 4, centerY);
    // Legs wide (stance)
    drawLine(glyph, centerX, centerY + 4, centerX - 4, centerY + 10);
    drawLine(glyph, centerX, centerY + 4, centerX + 4, centerY + 10);
  },

  /**
   * Receiving - Accepting/input pose
   * Conveys: receiving, accepting, input
   */
  receiving: (glyph, centerX = 16, centerY = 16) => {
    // Head
    drawCircle(glyph, centerX, centerY - 8, 2);
    // Body
    drawLine(glyph, centerX, centerY - 6, centerX, centerY + 4);
    // Arms cupped forward
    drawLine(glyph, centerX, centerY - 4, centerX - 4, centerY - 2);
    drawLine(glyph, centerX, centerY - 4, centerX + 4, centerY - 2);
    drawLine(glyph, centerX - 4, centerY - 2, centerX - 4, centerY + 2);
    drawLine(glyph, centerX + 4, centerY - 2, centerX + 4, centerY + 2);
    // Legs
    drawLine(glyph, centerX, centerY + 4, centerX - 2, centerY + 10);
    drawLine(glyph, centerX, centerY + 4, centerX + 2, centerY + 10);
  }
};

/**
 * Draw a humanoid pose on a glyph
 * @param {VisualGlyph} glyph - Target glyph
 * @param {string} poseName - Name of the pose
 * @param {number} centerX - Center X position (default: 16)
 * @param {number} centerY - Center Y position (default: 16)
 * @returns {boolean} True if pose was drawn
 */
export function drawPose(glyph, poseName, centerX = 16, centerY = 16) {
  const drawFn = poses[poseName];
  if (drawFn) {
    drawFn(glyph, centerX, centerY);
    return true;
  }
  return false;
}

/**
 * Get list of available pose names
 * @returns {string[]} Array of pose names
 */
export function getPoseNames() {
  return Object.keys(poses);
}

/**
 * Check if a pose exists
 * @param {string} name - Pose name
 * @returns {boolean} True if pose exists
 */
export function hasPose(name) {
  return name in poses;
}

/**
 * Register a custom pose
 * @param {string} name - Pose name
 * @param {Function} drawFn - Drawing function (glyph, centerX, centerY) => void
 */
export function registerPose(name, drawFn) {
  poses[name] = drawFn;
}

/**
 * Pose-to-category mapping
 */
export const POSE_CATEGORIES = {
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

export default {
  drawPose,
  getPoseNames,
  hasPose,
  registerPose,
  POSE_CATEGORIES
};

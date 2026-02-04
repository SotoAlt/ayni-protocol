/**
 * Symbols - Domain symbol overlays for glyphs
 *
 * Symbols provide context to glyph meanings. They overlay motifs
 * to indicate the domain or specific action type.
 *
 * Design Principles (Tocapu-aligned):
 * - 8x8 symbol size for visibility at 32x32
 * - Stepped/geometric designs (no curves where possible)
 * - High contrast, clear silhouettes
 * - Position symbols in corners: (24,8), (6,8), (24,24), (6,24)
 */

import { drawLine, drawRect, drawRectOutline } from './Primitives.js';

/**
 * Symbol registry - maps symbol names to drawing functions
 * All symbols are designed for 8x8 pixel area
 */
const symbols = {
  /**
   * Database - stepped cylinder shape
   * Uses stacked rectangles for geometric look
   */
  database: (glyph, x, y) => {
    // Top ellipse approximation (stepped)
    drawLine(glyph, x - 2, y - 3, x + 2, y - 3);
    drawLine(glyph, x - 3, y - 2, x + 3, y - 2);
    // Body
    drawRect(glyph, x - 3, y - 1, 7, 5);
    // Bottom ellipse approximation (stepped)
    drawLine(glyph, x - 3, y + 4, x + 3, y + 4);
    drawLine(glyph, x - 2, y + 5, x + 2, y + 5);
    // Internal divider lines (data rows)
    drawLine(glyph, x - 2, y, x + 2, y);
    drawLine(glyph, x - 2, y + 2, x + 2, y + 2);
  },

  /**
   * Checkmark - stepped angular check
   * Clear success indicator
   */
  checkmark: (glyph, x, y) => {
    // Short leg
    drawLine(glyph, x - 3, y, x - 1, y + 2);
    drawLine(glyph, x - 2, y, x, y + 2);
    // Long leg
    drawLine(glyph, x - 1, y + 2, x + 4, y - 3);
    drawLine(glyph, x, y + 2, x + 4, y - 2);
    // Thicken for visibility
    drawLine(glyph, x, y + 1, x + 3, y - 2);
  },

  /**
   * X mark - stepped cross
   * Clear error/failure indicator
   */
  x: (glyph, x, y) => {
    // First diagonal (top-left to bottom-right)
    drawLine(glyph, x - 3, y - 3, x + 3, y + 3);
    drawLine(glyph, x - 2, y - 3, x + 3, y + 2);
    drawLine(glyph, x - 3, y - 2, x + 2, y + 3);
    // Second diagonal (top-right to bottom-left)
    drawLine(glyph, x + 3, y - 3, x - 3, y + 3);
    drawLine(glyph, x + 2, y - 3, x - 3, y + 2);
    drawLine(glyph, x + 3, y - 2, x - 2, y + 3);
  },

  /**
   * Diamond - stepped rhombus
   * Action/execution marker
   */
  diamond: (glyph, x, y) => {
    // Outer diamond
    drawLine(glyph, x, y - 4, x - 4, y);
    drawLine(glyph, x, y - 4, x + 4, y);
    drawLine(glyph, x - 4, y, x, y + 4);
    drawLine(glyph, x + 4, y, x, y + 4);
    // Inner fill for visibility
    drawLine(glyph, x, y - 3, x - 3, y);
    drawLine(glyph, x, y - 3, x + 3, y);
    drawLine(glyph, x - 3, y, x, y + 3);
    drawLine(glyph, x + 3, y, x, y + 3);
    // Center
    drawLine(glyph, x - 2, y, x + 2, y);
    drawLine(glyph, x - 1, y - 1, x + 1, y - 1);
    drawLine(glyph, x - 1, y + 1, x + 1, y + 1);
  },

  /**
   * Hourglass - stepped double triangle
   * Waiting/pending state
   */
  hourglass: (glyph, x, y) => {
    // Top triangle
    drawLine(glyph, x - 3, y - 4, x + 3, y - 4);
    drawLine(glyph, x - 3, y - 4, x, y);
    drawLine(glyph, x + 3, y - 4, x, y);
    // Fill top
    drawLine(glyph, x - 2, y - 3, x + 2, y - 3);
    drawLine(glyph, x - 1, y - 2, x + 1, y - 2);
    // Bottom triangle
    drawLine(glyph, x - 3, y + 4, x + 3, y + 4);
    drawLine(glyph, x - 3, y + 4, x, y);
    drawLine(glyph, x + 3, y + 4, x, y);
    // Fill bottom
    drawLine(glyph, x - 2, y + 3, x + 2, y + 3);
    drawLine(glyph, x - 1, y + 2, x + 1, y + 2);
  },

  /**
   * Clock - stepped square with hands
   * Time/scheduling indicator
   */
  clock: (glyph, x, y) => {
    // Square face (instead of circle)
    drawRectOutline(glyph, x - 3, y - 3, 7, 7);
    // Hour markers (corners)
    glyph.set(x, y - 2, 1);
    glyph.set(x, y + 2, 1);
    glyph.set(x - 2, y, 1);
    glyph.set(x + 2, y, 1);
    // Clock hands
    drawLine(glyph, x, y, x, y - 2);  // Hour hand
    drawLine(glyph, x, y, x + 2, y);   // Minute hand
  },

  /**
   * Lightning bolt - stepped zigzag
   * Fast/urgent indicator
   */
  lightning: (glyph, x, y) => {
    // Top section
    drawLine(glyph, x + 1, y - 4, x - 1, y - 1);
    drawLine(glyph, x + 2, y - 4, x, y - 1);
    // Middle jog
    drawLine(glyph, x - 1, y - 1, x + 2, y - 1);
    drawLine(glyph, x + 2, y - 1, x - 1, y + 2);
    drawLine(glyph, x + 1, y - 1, x - 2, y + 2);
    // Bottom section
    drawLine(glyph, x - 1, y + 2, x - 2, y + 4);
    drawLine(glyph, x - 2, y + 2, x - 3, y + 4);
  },

  /**
   * Lock - stepped padlock
   * Security/encrypted indicator
   */
  lock: (glyph, x, y) => {
    // Shackle (square arch)
    drawLine(glyph, x - 2, y - 4, x - 2, y - 1);
    drawLine(glyph, x + 2, y - 4, x + 2, y - 1);
    drawLine(glyph, x - 2, y - 4, x + 2, y - 4);
    // Body (solid square)
    drawRect(glyph, x - 3, y - 1, 7, 5);
    // Keyhole (stepped)
    glyph.set(x, y, 0);
    glyph.set(x, y + 1, 0);
    glyph.set(x - 1, y + 1, 0);
    glyph.set(x + 1, y + 1, 0);
  },

  /**
   * Unlock - open padlock
   * Open/accessible indicator
   */
  unlock: (glyph, x, y) => {
    // Open shackle
    drawLine(glyph, x - 2, y - 4, x - 2, y - 1);
    drawLine(glyph, x - 2, y - 4, x + 1, y - 4);
    drawLine(glyph, x + 2, y - 2, x + 2, y - 1);
    // Body
    drawRect(glyph, x - 3, y - 1, 7, 5);
    // Keyhole
    glyph.set(x, y, 0);
    glyph.set(x, y + 1, 0);
  },

  /**
   * Arrow up - stepped upload arrow
   */
  arrowUp: (glyph, x, y) => {
    // Arrowhead
    drawLine(glyph, x, y - 4, x - 3, y - 1);
    drawLine(glyph, x, y - 4, x + 3, y - 1);
    drawLine(glyph, x, y - 3, x - 2, y - 1);
    drawLine(glyph, x, y - 3, x + 2, y - 1);
    // Shaft
    drawRect(glyph, x - 1, y - 1, 3, 5);
  },

  /**
   * Arrow down - stepped download arrow
   */
  arrowDown: (glyph, x, y) => {
    // Shaft
    drawRect(glyph, x - 1, y - 4, 3, 5);
    // Arrowhead
    drawLine(glyph, x, y + 4, x - 3, y + 1);
    drawLine(glyph, x, y + 4, x + 3, y + 1);
    drawLine(glyph, x, y + 3, x - 2, y + 1);
    drawLine(glyph, x, y + 3, x + 2, y + 1);
  },

  /**
   * Gear - stepped cog shape
   * Settings/processing indicator
   */
  gear: (glyph, x, y) => {
    // Center square
    drawRect(glyph, x - 1, y - 1, 3, 3);
    // Teeth (stepped, not circular)
    // Top
    drawRect(glyph, x - 1, y - 3, 3, 2);
    // Bottom
    drawRect(glyph, x - 1, y + 2, 3, 2);
    // Left
    drawRect(glyph, x - 3, y - 1, 2, 3);
    // Right
    drawRect(glyph, x + 2, y - 1, 2, 3);
    // Center hole
    glyph.set(x, y, 0);
  },

  /**
   * Document - stepped page with corner fold
   */
  document: (glyph, x, y) => {
    // Page outline
    drawRectOutline(glyph, x - 3, y - 4, 6, 8);
    // Corner fold
    drawLine(glyph, x + 2, y - 4, x + 2, y - 2);
    drawLine(glyph, x + 2, y - 2, x, y - 2);
    drawLine(glyph, x, y - 2, x, y - 4);
    // Fill corner
    glyph.set(x + 1, y - 3, 1);
    // Text lines
    drawLine(glyph, x - 2, y - 1, x + 1, y - 1);
    drawLine(glyph, x - 2, y + 1, x + 1, y + 1);
    drawLine(glyph, x - 2, y + 3, x, y + 3);
  },

  /**
   * Cloud - stepped cloud shape
   * Remote/cloud service indicator
   */
  cloud: (glyph, x, y) => {
    // Cloud body (stacked rectangles for fluffy look)
    drawRect(glyph, x - 3, y, 7, 3);
    drawRect(glyph, x - 2, y - 1, 5, 4);
    // Top bumps
    drawRect(glyph, x - 2, y - 2, 3, 2);
    drawRect(glyph, x + 1, y - 1, 2, 2);
  },

  /**
   * Network - stepped node network
   * API/connection indicator
   */
  network: (glyph, x, y) => {
    // Center node (square)
    drawRect(glyph, x - 1, y - 1, 3, 3);
    // Outer nodes
    glyph.set(x, y - 4, 1);
    glyph.set(x, y + 4, 1);
    glyph.set(x - 4, y, 1);
    glyph.set(x + 4, y, 1);
    // Connection lines (stepped)
    drawLine(glyph, x, y - 1, x, y - 4);
    drawLine(glyph, x, y + 1, x, y + 4);
    drawLine(glyph, x - 1, y, x - 4, y);
    drawLine(glyph, x + 1, y, x + 4, y);
  },

  /**
   * Coin - stepped circle with value
   * Payment/currency indicator
   */
  coin: (glyph, x, y) => {
    // Square coin (geometric)
    drawRectOutline(glyph, x - 3, y - 3, 7, 7);
    drawRectOutline(glyph, x - 2, y - 2, 5, 5);
    // Value marker (stepped S or $)
    drawLine(glyph, x, y - 2, x, y + 2);
    glyph.set(x - 1, y - 1, 1);
    glyph.set(x + 1, y + 1, 1);
    glyph.set(x + 1, y - 1, 1);
    glyph.set(x - 1, y + 1, 1);
  },

  /**
   * User - stepped person icon
   */
  user: (glyph, x, y) => {
    // Head (square)
    drawRect(glyph, x - 2, y - 4, 4, 4);
    // Body (wider square)
    drawRect(glyph, x - 3, y + 1, 7, 4);
    // Neck
    drawLine(glyph, x - 1, y, x + 1, y);
  },

  /**
   * Search - stepped magnifying glass
   */
  search: (glyph, x, y) => {
    // Lens (square)
    drawRectOutline(glyph, x - 3, y - 3, 5, 5);
    // Handle (diagonal)
    drawLine(glyph, x + 1, y + 1, x + 4, y + 4);
    drawLine(glyph, x + 2, y + 1, x + 4, y + 3);
    drawLine(glyph, x + 1, y + 2, x + 3, y + 4);
  },

  /**
   * Warning - stepped exclamation triangle
   */
  warning: (glyph, x, y) => {
    // Triangle outline
    drawLine(glyph, x, y - 4, x - 4, y + 3);
    drawLine(glyph, x, y - 4, x + 4, y + 3);
    drawLine(glyph, x - 4, y + 3, x + 4, y + 3);
    // Fill
    drawLine(glyph, x, y - 3, x - 3, y + 2);
    drawLine(glyph, x, y - 3, x + 3, y + 2);
    // Exclamation mark
    drawLine(glyph, x, y - 2, x, y);
    glyph.set(x, y + 2, 1);
  },

  /**
   * Pause - two stepped bars
   */
  pause: (glyph, x, y) => {
    drawRect(glyph, x - 3, y - 3, 2, 7);
    drawRect(glyph, x + 1, y - 3, 2, 7);
  },

  /**
   * Play - stepped triangle
   */
  play: (glyph, x, y) => {
    // Filled triangle pointing right
    for (let i = 0; i <= 6; i++) {
      const startX = x - 3;
      const endX = x - 3 + Math.floor(i / 1.5);
      const row = y - 3 + i;
      drawLine(glyph, startX, row, Math.min(endX, x + 3), row);
    }
    // Right edge
    drawLine(glyph, x - 3, y - 3, x + 3, y);
    drawLine(glyph, x - 3, y + 3, x + 3, y);
  },

  /**
   * Stop - solid square
   */
  stop: (glyph, x, y) => {
    drawRect(glyph, x - 3, y - 3, 7, 7);
  },

  /**
   * Retry - stepped circular arrow
   */
  retry: (glyph, x, y) => {
    // Square approximation of circular arrow
    // Top edge
    drawLine(glyph, x - 2, y - 3, x + 3, y - 3);
    // Right edge
    drawLine(glyph, x + 3, y - 3, x + 3, y + 2);
    // Bottom edge
    drawLine(glyph, x + 3, y + 2, x - 1, y + 2);
    // Left edge (partial)
    drawLine(glyph, x - 3, y - 3, x - 3, y);
    // Arrow head
    drawLine(glyph, x + 3, y - 3, x + 1, y - 5);
    drawLine(glyph, x + 3, y - 3, x + 5, y - 1);
  },

  /**
   * Chakana (Andean Cross) - mini version
   * Reciprocity/balance indicator
   */
  chakana: (glyph, x, y) => {
    // Center
    drawRect(glyph, x - 1, y - 1, 3, 3);
    // Arms
    drawRect(glyph, x - 1, y - 3, 3, 2);  // Top
    drawRect(glyph, x - 1, y + 2, 3, 2);  // Bottom
    drawRect(glyph, x - 3, y - 1, 2, 3);  // Left
    drawRect(glyph, x + 2, y - 1, 2, 3);  // Right
  },

  /**
   * Filter - stepped funnel
   */
  filter: (glyph, x, y) => {
    // Top wide part
    drawLine(glyph, x - 4, y - 3, x + 4, y - 3);
    drawLine(glyph, x - 3, y - 2, x + 3, y - 2);
    drawLine(glyph, x - 2, y - 1, x + 2, y - 1);
    drawLine(glyph, x - 1, y, x + 1, y);
    // Narrow spout
    drawRect(glyph, x, y + 1, 1, 3);
  },

  /**
   * Trash - stepped bin
   */
  trash: (glyph, x, y) => {
    // Lid
    drawLine(glyph, x - 3, y - 3, x + 3, y - 3);
    drawLine(glyph, x - 1, y - 4, x + 1, y - 4);
    // Body (tapered)
    drawRectOutline(glyph, x - 3, y - 2, 7, 6);
    // Lines on body
    drawLine(glyph, x - 1, y - 1, x - 1, y + 2);
    drawLine(glyph, x + 1, y - 1, x + 1, y + 2);
  },

  // ═══════════════════════════════════════════════════════════════
  // CRYPTO/DeFi SYMBOLS - New domain-specific glyphs
  // ═══════════════════════════════════════════════════════════════

  /**
   * Arrows Exchange - bidirectional swap arrows
   * Used for token swaps and exchanges
   */
  arrowsExchange: (glyph, x, y) => {
    // Top arrow (pointing right)
    drawLine(glyph, x - 4, y - 2, x + 2, y - 2);
    drawLine(glyph, x + 2, y - 2, x, y - 4);
    drawLine(glyph, x + 2, y - 2, x, y);
    // Bottom arrow (pointing left)
    drawLine(glyph, x + 4, y + 2, x - 2, y + 2);
    drawLine(glyph, x - 2, y + 2, x, y + 4);
    drawLine(glyph, x - 2, y + 2, x, y);
    // Thicken arrows
    drawLine(glyph, x - 4, y - 1, x + 1, y - 1);
    drawLine(glyph, x + 4, y + 1, x - 1, y + 1);
  },

  /**
   * Chain Link - blockchain bridge symbol
   * Used for cross-chain operations
   */
  chainLink: (glyph, x, y) => {
    // Left link (oval)
    drawRectOutline(glyph, x - 4, y - 2, 4, 5);
    // Right link (oval)
    drawRectOutline(glyph, x, y - 2, 4, 5);
    // Connection point (overlapping)
    drawLine(glyph, x - 1, y - 1, x - 1, y + 1);
    drawLine(glyph, x, y - 1, x, y + 1);
    // Inner details
    glyph.set(x - 3, y, 0);
    glyph.set(x + 2, y, 0);
  },

  /**
   * Ballot - voting symbol
   * Used for governance voting
   */
  ballot: (glyph, x, y) => {
    // Ballot box
    drawRectOutline(glyph, x - 3, y - 1, 7, 5);
    // Slot at top
    drawLine(glyph, x - 1, y - 2, x + 1, y - 2);
    // Paper going in
    drawRect(glyph, x - 1, y - 4, 3, 3);
    // Checkmark on paper
    glyph.set(x - 1, y - 3, 0);
    glyph.set(x, y - 2, 0);
    glyph.set(x + 1, y - 4, 0);
  },

  /**
   * Price Tag - limit order symbol
   * Used for trading orders
   */
  priceTag: (glyph, x, y) => {
    // Tag body (diamond-ish)
    drawLine(glyph, x - 3, y - 2, x + 2, y - 2);
    drawLine(glyph, x + 2, y - 2, x + 4, y);
    drawLine(glyph, x + 4, y, x + 2, y + 2);
    drawLine(glyph, x + 2, y + 2, x - 3, y + 2);
    drawLine(glyph, x - 3, y + 2, x - 3, y - 2);
    // Fill
    drawRect(glyph, x - 2, y - 1, 4, 3);
    // Hole
    glyph.set(x - 2, y, 0);
    // String
    drawLine(glyph, x - 3, y, x - 5, y - 2);
  },

  /**
   * Shield - protection/stop-loss symbol
   * Used for protective orders
   */
  shield: (glyph, x, y) => {
    // Shield outline
    drawLine(glyph, x - 3, y - 4, x + 3, y - 4);  // Top
    drawLine(glyph, x - 3, y - 4, x - 3, y);      // Left top
    drawLine(glyph, x + 3, y - 4, x + 3, y);      // Right top
    drawLine(glyph, x - 3, y, x, y + 4);          // Left bottom
    drawLine(glyph, x + 3, y, x, y + 4);          // Right bottom
    // Fill top
    drawRect(glyph, x - 2, y - 3, 5, 3);
    // Inner fill
    drawLine(glyph, x - 2, y, x, y + 2);
    drawLine(glyph, x + 2, y, x, y + 2);
    drawLine(glyph, x - 1, y + 1, x + 1, y + 1);
  },

  // ═══════════════════════════════════════════════════════════════
  // AGENT WORKFLOW SYMBOLS - Task & communication glyphs
  // ═══════════════════════════════════════════════════════════════

  /**
   * Task - checkbox/task symbol
   * Used for task assignment
   */
  task: (glyph, x, y) => {
    // Checkbox
    drawRectOutline(glyph, x - 3, y - 3, 7, 7);
    // Checkmark inside
    drawLine(glyph, x - 2, y, x, y + 2);
    drawLine(glyph, x, y + 2, x + 3, y - 2);
  },

  /**
   * Heartbeat - pulse/alive indicator
   * Used for agent health monitoring
   */
  heartbeat: (glyph, x, y) => {
    // Baseline
    drawLine(glyph, x - 4, y, x - 2, y);
    drawLine(glyph, x + 2, y, x + 4, y);
    // Pulse spike
    drawLine(glyph, x - 2, y, x - 1, y - 3);
    drawLine(glyph, x - 1, y - 3, x, y + 2);
    drawLine(glyph, x, y + 2, x + 1, y - 2);
    drawLine(glyph, x + 1, y - 2, x + 2, y);
  },

  /**
   * Broadcast - announcement/notify symbol
   * Used for multi-agent notifications
   */
  broadcast: (glyph, x, y) => {
    // Speaker/source
    drawRect(glyph, x - 4, y - 1, 3, 3);
    // Sound waves (concentric arcs as stepped lines)
    drawLine(glyph, x, y - 2, x, y + 2);
    drawLine(glyph, x + 1, y - 3, x + 1, y + 3);
    drawLine(glyph, x + 2, y - 2, x + 2, y + 2);
    drawLine(glyph, x + 3, y - 4, x + 3, y + 4);
    drawLine(glyph, x + 4, y - 3, x + 4, y + 3);
  },

  /**
   * Checkpoint - save state symbol
   * Used for workflow checkpoints
   */
  checkpoint: (glyph, x, y) => {
    // Flag pole
    drawLine(glyph, x - 2, y - 4, x - 2, y + 4);
    // Flag (triangle)
    drawLine(glyph, x - 2, y - 4, x + 3, y - 2);
    drawLine(glyph, x + 3, y - 2, x - 2, y);
    // Fill flag
    drawLine(glyph, x - 1, y - 3, x + 1, y - 2);
    drawLine(glyph, x - 1, y - 2, x + 1, y - 2);
    drawLine(glyph, x - 1, y - 1, x, y - 1);
    // Base
    drawRect(glyph, x - 3, y + 3, 5, 2);
  },

  /**
   * Log - document/log entry symbol
   * Used for logging and audit trails
   */
  log: (glyph, x, y) => {
    // Stacked papers effect
    drawRectOutline(glyph, x - 2, y - 4, 5, 8);
    drawLine(glyph, x - 3, y - 3, x - 3, y + 4);
    drawLine(glyph, x - 3, y + 4, x - 2, y + 4);
    // Text lines
    drawLine(glyph, x - 1, y - 2, x + 1, y - 2);
    drawLine(glyph, x - 1, y, x + 1, y);
    drawLine(glyph, x - 1, y + 2, x, y + 2);
  },

  /**
   * Alert - exclamation/urgent symbol
   * Used for critical notifications
   */
  alert: (glyph, x, y) => {
    // Diamond shape (more compact than warning triangle)
    drawLine(glyph, x, y - 4, x - 4, y);
    drawLine(glyph, x, y - 4, x + 4, y);
    drawLine(glyph, x - 4, y, x, y + 4);
    drawLine(glyph, x + 4, y, x, y + 4);
    // Fill
    drawLine(glyph, x - 3, y, x, y - 3);
    drawLine(glyph, x + 3, y, x, y - 3);
    drawLine(glyph, x - 3, y, x, y + 3);
    drawLine(glyph, x + 3, y, x, y + 3);
    // Exclamation
    drawLine(glyph, x, y - 2, x, y);
    glyph.set(x, y + 2, 1);
  },

  /**
   * Queue - waiting queue symbol
   * Used for task queuing
   */
  queue: (glyph, x, y) => {
    // Three stacked items
    drawRect(glyph, x - 3, y - 4, 7, 2);
    drawRect(glyph, x - 3, y - 1, 7, 2);
    drawRect(glyph, x - 3, y + 2, 7, 2);
    // Arrow showing direction
    glyph.set(x + 4, y - 3, 1);
    glyph.set(x + 4, y, 1);
    glyph.set(x + 4, y + 3, 1);
  },

  /**
   * Delegate - hand-off symbol
   * Used for task delegation
   */
  delegate: (glyph, x, y) => {
    // Two figures simplified
    // Figure 1 (left)
    glyph.set(x - 3, y - 3, 1);
    drawLine(glyph, x - 3, y - 2, x - 3, y);
    // Figure 2 (right)
    glyph.set(x + 3, y - 3, 1);
    drawLine(glyph, x + 3, y - 2, x + 3, y);
    // Arrow between them
    drawLine(glyph, x - 1, y - 1, x + 1, y - 1);
    drawLine(glyph, x + 1, y - 1, x, y - 2);
    drawLine(glyph, x + 1, y - 1, x, y);
    // Task box being passed
    drawRectOutline(glyph, x - 1, y + 1, 3, 3);
  },

  /**
   * Sync - synchronization symbol
   * Used for state synchronization
   */
  sync: (glyph, x, y) => {
    // Two curved arrows (as stepped lines)
    // Top arrow (clockwise)
    drawLine(glyph, x - 3, y - 2, x + 1, y - 2);
    drawLine(glyph, x + 1, y - 2, x + 3, y);
    drawLine(glyph, x + 1, y - 2, x + 1, y - 4);
    drawLine(glyph, x + 1, y - 2, x + 3, y - 2);
    // Bottom arrow (counter-clockwise)
    drawLine(glyph, x + 3, y + 2, x - 1, y + 2);
    drawLine(glyph, x - 1, y + 2, x - 3, y);
    drawLine(glyph, x - 1, y + 2, x - 1, y + 4);
    drawLine(glyph, x - 1, y + 2, x - 3, y + 2);
  }
};

/**
 * Draw a symbol on a glyph
 * @param {VisualGlyph} glyph - Target glyph
 * @param {string} symbolName - Name of the symbol
 * @param {number} x - Center X position (default: 24 - top right corner)
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

/**
 * Standard symbol positions for consistent placement
 */
export const SYMBOL_POSITIONS = {
  topRight: { x: 24, y: 8 },
  topLeft: { x: 6, y: 8 },
  bottomRight: { x: 24, y: 24 },
  bottomLeft: { x: 6, y: 24 },
  center: { x: 16, y: 16 }
};

export default {
  drawSymbol,
  getSymbolNames,
  hasSymbol,
  registerSymbol,
  SYMBOL_POSITIONS
};

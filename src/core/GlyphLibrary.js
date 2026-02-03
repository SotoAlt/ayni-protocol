/**
 * GlyphLibrary - Registry of available glyphs
 *
 * Manages the glyph vocabulary, enabling lookup, search, and generation
 * of glyphs from specifications.
 */

import { VisualGlyph } from './VisualGlyph.js';
import { drawPose, POSE_CATEGORIES } from './Poses.js';
import { drawSymbol } from './Symbols.js';
import { drawBorder } from './Primitives.js';

/**
 * Foundation glyph specifications (Phase 1)
 */
const FOUNDATION_GLYPHS = {
  Q01: {
    id: 'Q01',
    meaning: 'Query Database',
    category: 'query',
    pose: 'arms_up',
    symbol: 'database',
    symbolPosition: { x: 24, y: 8 },
    tags: ['query', 'database', 'data', 'request']
  },
  R01: {
    id: 'R01',
    meaning: 'Response Success',
    category: 'response',
    pose: 'arms_down',
    symbol: 'checkmark',
    symbolPosition: { x: 24, y: 8 },
    tags: ['response', 'success', 'ok', 'confirm']
  },
  E01: {
    id: 'E01',
    meaning: 'Error',
    category: 'error',
    pose: 'distressed',
    symbol: 'x',
    symbolPosition: { x: 24, y: 8 },
    tags: ['error', 'failure', 'exception', 'problem']
  },
  A01: {
    id: 'A01',
    meaning: 'Execute Action',
    category: 'action',
    pose: 'action',
    symbol: 'diamond',
    symbolPosition: { x: 24, y: 8 },
    tags: ['action', 'execute', 'run', 'do']
  }
};

/**
 * Extended glyph specifications (Phase 2 expansion)
 *
 * Design principles for visual distinction:
 * 1. Each category uses distinct poses
 * 2. Symbol positions vary (top-right, bottom-right, top-left)
 * 3. Symbols within same pose must differ significantly
 * 4. Target: >100 bits Hamming distance between all pairs
 */
const EXTENDED_GLYPHS = {
  // Query variants - all use arms_up pose, vary symbols and positions
  Q02: {
    id: 'Q02',
    meaning: 'Query API',
    category: 'query',
    pose: 'arms_up',
    symbol: 'network',
    symbolPosition: { x: 24, y: 20 },  // Different position
    tags: ['query', 'api', 'network', 'request']
  },
  Q03: {
    id: 'Q03',
    meaning: 'Search',
    category: 'query',
    pose: 'arms_up',
    symbol: 'search',
    symbolPosition: { x: 6, y: 8 },    // Left side
    tags: ['search', 'find', 'lookup']
  },
  Q04: {
    id: 'Q04',
    meaning: 'Query with Filter',
    category: 'query',
    pose: 'arms_up',
    symbol: 'document',
    symbolPosition: { x: 6, y: 20 },   // Bottom left
    tags: ['query', 'filter', 'where', 'condition']
  },

  // Response variants - arms_down + receiving poses, vary symbols and positions
  R02: {
    id: 'R02',
    meaning: 'Response with Data',
    category: 'response',
    pose: 'receiving',               // Different pose
    symbol: 'document',
    symbolPosition: { x: 24, y: 8 },
    tags: ['response', 'data', 'result', 'payload']
  },
  R03: {
    id: 'R03',
    meaning: 'Empty Result',
    category: 'response',
    pose: 'arms_down',
    symbol: 'x',
    symbolPosition: { x: 6, y: 8 },   // Left side
    tags: ['response', 'empty', 'null', 'none']
  },
  R04: {
    id: 'R04',
    meaning: 'Cached Response',
    category: 'response',
    pose: 'standing',                // Different pose
    symbol: 'clock',
    symbolPosition: { x: 24, y: 8 },
    tags: ['response', 'cache', 'cached', 'stored']
  },

  // Error variants - use distressed + blocking, vary heavily
  E02: {
    id: 'E02',
    meaning: 'Payment Required',
    category: 'error',
    pose: 'blocking',
    symbol: 'coin',
    symbolPosition: { x: 24, y: 20 },  // Bottom right
    tags: ['error', 'payment', '402', 'cost']
  },
  E03: {
    id: 'E03',
    meaning: 'Permission Denied',
    category: 'error',
    pose: 'distressed',              // Different from E02
    symbol: 'lock',
    symbolPosition: { x: 24, y: 8 },
    tags: ['error', 'permission', 'denied', 'auth', 'forbidden']
  },
  E04: {
    id: 'E04',
    meaning: 'Not Found',
    category: 'error',
    pose: 'blocking',                // Use blocking for 404
    symbol: 'search',
    symbolPosition: { x: 6, y: 8 },   // Left side
    tags: ['error', '404', 'not found', 'missing']
  },
  E05: {
    id: 'E05',
    meaning: 'Timeout',
    category: 'error',
    pose: 'distressed',
    symbol: 'hourglass',             // More distinct than clock
    symbolPosition: { x: 6, y: 8 },   // Left side
    tags: ['error', 'timeout', 'slow', 'expired']
  },
  E06: {
    id: 'E06',
    meaning: 'Rate Limited',
    category: 'error',
    pose: 'distressed',
    symbol: 'warning',
    symbolPosition: { x: 24, y: 20 },  // Bottom right
    tags: ['error', 'rate limit', '429', 'throttle']
  },

  // Action variants - use different poses for each action
  A02: {
    id: 'A02',
    meaning: 'Update',
    category: 'action',
    pose: 'pointing',                // Pointing for update
    symbol: 'arrowUp',
    symbolPosition: { x: 24, y: 8 },
    tags: ['action', 'update', 'modify', 'change']
  },
  A03: {
    id: 'A03',
    meaning: 'Delete',
    category: 'action',
    pose: 'blocking',                // Blocking for delete
    symbol: 'x',
    symbolPosition: { x: 6, y: 8 },   // Left side
    tags: ['action', 'delete', 'remove', 'destroy']
  },
  A04: {
    id: 'A04',
    meaning: 'Create',
    category: 'action',
    pose: 'celebrating',             // Celebrating for create
    symbol: 'document',
    symbolPosition: { x: 24, y: 8 },
    tags: ['action', 'create', 'new', 'add']
  },
  A05: {
    id: 'A05',
    meaning: 'Retry',
    category: 'action',
    pose: 'action',
    symbol: 'retry',
    symbolPosition: { x: 6, y: 8 },   // Left side for distinction
    tags: ['action', 'retry', 'again', 'repeat']
  },

  // State glyphs - unique poses per state
  S01: {
    id: 'S01',
    meaning: 'Idle',
    category: 'state',
    pose: 'standing',
    symbol: null,                    // No symbol - just pose
    tags: ['state', 'idle', 'ready', 'waiting']
  },
  S02: {
    id: 'S02',
    meaning: 'Processing',
    category: 'state',
    pose: 'thinking',
    symbol: 'gear',
    symbolPosition: { x: 6, y: 8 },   // Left side
    tags: ['state', 'processing', 'working', 'busy']
  },
  S03: {
    id: 'S03',
    meaning: 'Waiting',
    category: 'state',
    pose: 'receiving',               // Different pose
    symbol: 'hourglass',
    symbolPosition: { x: 24, y: 20 },  // Bottom right
    tags: ['state', 'waiting', 'pending', 'blocked']
  },
  S04: {
    id: 'S04',
    meaning: 'Complete',
    category: 'state',
    pose: 'celebrating',
    symbol: 'checkmark',
    symbolPosition: { x: 6, y: 20 },   // Bottom left
    tags: ['state', 'complete', 'done', 'finished']
  },

  // Payment glyphs - unique poses + symbol positions
  P01: {
    id: 'P01',
    meaning: 'Payment Sent',
    category: 'payment',
    pose: 'pointing',                // Pointing for sending
    symbol: 'coin',
    symbolPosition: { x: 24, y: 8 },
    tags: ['payment', 'sent', 'paid', 'transfer']
  },
  P02: {
    id: 'P02',
    meaning: 'Payment Confirmed',
    category: 'payment',
    pose: 'celebrating',
    symbol: 'checkmark',             // Checkmark, not coin
    symbolPosition: { x: 24, y: 8 },
    tags: ['payment', 'confirmed', 'verified', 'success']
  },
  P03: {
    id: 'P03',
    meaning: 'Refund',
    category: 'payment',
    pose: 'receiving',               // Receiving for refund
    symbol: 'arrowDown',
    symbolPosition: { x: 6, y: 8 },   // Left side
    tags: ['payment', 'refund', 'return', 'reversed']
  }
};

/**
 * GlyphLibrary class
 */
export class GlyphLibrary {
  constructor() {
    this.specs = { ...FOUNDATION_GLYPHS };
    this.cache = new Map();
  }

  /**
   * Load extended glyph library
   */
  loadExtended() {
    this.specs = { ...this.specs, ...EXTENDED_GLYPHS };
    return this;
  }

  /**
   * Add custom glyph specifications
   * @param {Object} specs - Map of id -> spec
   */
  addSpecs(specs) {
    this.specs = { ...this.specs, ...specs };
    // Clear cache for modified glyphs
    Object.keys(specs).forEach(id => this.cache.delete(id));
    return this;
  }

  /**
   * Get a glyph specification
   * @param {string} id - Glyph ID
   * @returns {Object|null} Glyph specification
   */
  getSpec(id) {
    return this.specs[id] || null;
  }

  /**
   * Generate a glyph from its specification
   * @param {string} id - Glyph ID
   * @returns {VisualGlyph|null} Generated glyph
   */
  get(id) {
    // Check cache first
    if (this.cache.has(id)) {
      return this.cache.get(id).clone();
    }

    const spec = this.specs[id];
    if (!spec) return null;

    const glyph = this.generateFromSpec(spec);
    this.cache.set(id, glyph);
    return glyph.clone();
  }

  /**
   * Generate glyph from specification
   * @param {Object} spec - Glyph specification
   * @returns {VisualGlyph} Generated glyph
   */
  generateFromSpec(spec) {
    const glyph = new VisualGlyph({
      id: spec.id,
      meaning: spec.meaning,
      category: spec.category
    });

    // Draw border
    drawBorder(glyph);

    // Draw humanoid pose
    if (spec.pose) {
      drawPose(glyph, spec.pose);
    }

    // Draw symbol overlay
    if (spec.symbol) {
      const pos = spec.symbolPosition || { x: 24, y: 8 };
      drawSymbol(glyph, spec.symbol, pos.x, pos.y);
    }

    return glyph;
  }

  /**
   * Check if a glyph exists
   * @param {string} id - Glyph ID
   * @returns {boolean} True if exists
   */
  has(id) {
    return id in this.specs;
  }

  /**
   * Get all glyph IDs
   * @returns {string[]} Array of IDs
   */
  list() {
    return Object.keys(this.specs);
  }

  /**
   * Get glyphs by category
   * @param {string} category - Category name
   * @returns {string[]} Array of glyph IDs
   */
  byCategory(category) {
    return Object.entries(this.specs)
      .filter(([_, spec]) => spec.category === category)
      .map(([id]) => id);
  }

  /**
   * Search glyphs by tag
   * @param {string} tag - Tag to search
   * @returns {string[]} Array of matching glyph IDs
   */
  searchByTag(tag) {
    const lowerTag = tag.toLowerCase();
    return Object.entries(this.specs)
      .filter(([_, spec]) => spec.tags?.some(t => t.toLowerCase().includes(lowerTag)))
      .map(([id]) => id);
  }

  /**
   * Search glyphs by meaning
   * @param {string} query - Search query
   * @returns {string[]} Array of matching glyph IDs
   */
  searchByMeaning(query) {
    const lowerQuery = query.toLowerCase();
    return Object.entries(this.specs)
      .filter(([_, spec]) => spec.meaning.toLowerCase().includes(lowerQuery))
      .map(([id]) => id);
  }

  /**
   * Find best matching glyph for a text description
   * @param {string} text - Natural language description
   * @returns {Object|null} Best match { id, score, spec }
   */
  findBestMatch(text) {
    const words = text.toLowerCase().split(/\s+/);
    let bestMatch = null;
    let bestScore = 0;

    for (const [id, spec] of Object.entries(this.specs)) {
      let score = 0;

      // Check meaning
      const meaning = spec.meaning.toLowerCase();
      for (const word of words) {
        if (meaning.includes(word)) score += 2;
      }

      // Check tags
      if (spec.tags) {
        for (const tag of spec.tags) {
          for (const word of words) {
            if (tag.includes(word)) score += 1;
          }
        }
      }

      // Check category
      if (words.includes(spec.category)) score += 1;

      if (score > bestScore) {
        bestScore = score;
        bestMatch = { id, score, spec };
      }
    }

    return bestMatch && bestMatch.score > 0 ? bestMatch : null;
  }

  /**
   * Get library statistics
   * @returns {Object} Stats object
   */
  stats() {
    const categories = {};
    for (const spec of Object.values(this.specs)) {
      categories[spec.category] = (categories[spec.category] || 0) + 1;
    }
    return {
      total: Object.keys(this.specs).length,
      categories,
      cached: this.cache.size
    };
  }

  /**
   * Clear the glyph cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Export library as JSON
   * @returns {Object} JSON representation
   */
  toJSON() {
    return {
      version: '2.0',
      count: Object.keys(this.specs).length,
      glyphs: this.specs
    };
  }

  /**
   * Import library from JSON
   * @param {Object} json - JSON data
   */
  fromJSON(json) {
    if (json.glyphs) {
      this.specs = { ...this.specs, ...json.glyphs };
      this.clearCache();
    }
    return this;
  }
}

/**
 * Default singleton instance
 */
let defaultLibrary = null;

/**
 * Get the default library instance
 * @returns {GlyphLibrary} Default library
 */
export function getDefaultLibrary() {
  if (!defaultLibrary) {
    defaultLibrary = new GlyphLibrary().loadExtended();
  }
  return defaultLibrary;
}

export default GlyphLibrary;

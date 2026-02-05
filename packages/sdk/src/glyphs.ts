/**
 * Glyph definitions and encoding/decoding utilities
 */

export type GlyphId = 'Q01' | 'R01' | 'E01' | 'A01';

export interface Glyph {
  id: GlyphId;
  meaning: string;
  pose: string;
  symbol: string;
  patterns: string[];
}

/**
 * Foundation glyph library
 */
export const GLYPH_LIBRARY: Record<GlyphId, Glyph> = {
  Q01: {
    id: 'Q01',
    meaning: 'Query Database',
    pose: 'arms_up',
    symbol: 'database',
    patterns: ['query', 'search', 'find', 'get', 'fetch', 'lookup', 'database', 'db', 'request'],
  },
  R01: {
    id: 'R01',
    meaning: 'Response Success',
    pose: 'arms_down',
    symbol: 'checkmark',
    patterns: ['success', 'ok', 'done', 'complete', 'finished', 'response', 'result', 'found', 'yes'],
  },
  E01: {
    id: 'E01',
    meaning: 'Error',
    pose: 'distressed',
    symbol: 'x',
    patterns: ['error', 'fail', 'failed', 'exception', 'problem', 'issue', 'bug', 'crash', 'no'],
  },
  A01: {
    id: 'A01',
    meaning: 'Execute Action',
    pose: 'action',
    symbol: 'diamond',
    patterns: ['execute', 'run', 'action', 'do', 'perform', 'start', 'begin', 'process', 'task'],
  },
};

/**
 * Encode natural language intent to glyph ID
 *
 * @param text - Natural language intent
 * @returns Matching glyph ID or null if no match
 *
 * @example
 * encodeIntent("query the database for users")  // Returns "Q01"
 * encodeIntent("task completed successfully")   // Returns "R01"
 */
export function encodeIntent(text: string): GlyphId | null {
  const lowerText = text.toLowerCase();

  for (const glyph of Object.values(GLYPH_LIBRARY)) {
    for (const pattern of glyph.patterns) {
      if (lowerText.includes(pattern)) {
        return glyph.id;
      }
    }
  }

  return null;
}

/**
 * Decode glyph ID to full glyph information
 *
 * @param id - Glyph ID (e.g., "Q01")
 * @returns Glyph object or null if not found
 *
 * @example
 * decodeGlyph("Q01")  // Returns { id: "Q01", meaning: "Query Database", ... }
 */
export function decodeGlyph(id: string): Glyph | null {
  const normalizedId = id.toUpperCase().trim() as GlyphId;
  return GLYPH_LIBRARY[normalizedId] || null;
}

/**
 * Get all available glyph IDs
 */
export function getGlyphIds(): GlyphId[] {
  return Object.keys(GLYPH_LIBRARY) as GlyphId[];
}

/**
 * Check if a string is a valid glyph ID
 */
export function isValidGlyphId(id: string): id is GlyphId {
  return id.toUpperCase().trim() in GLYPH_LIBRARY;
}

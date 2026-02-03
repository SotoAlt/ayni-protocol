/**
 * Ayni Protocol
 *
 * Visual glyph protocol for AI agent communication.
 *
 * @example
 * import { Ayni, Agent } from 'ayni-protocol';
 *
 * // Simple encoding
 * const ayni = new Ayni();
 * const msg = ayni.encode({ glyph: 'Q01', data: { query: 'users' } });
 *
 * // Agent communication
 * const [alice, bob] = Agent.createPair();
 * const query = alice.query('database', { table: 'users' }, bob);
 * const response = bob.respond('success', { count: 42 }, alice);
 */

// Re-export core components
export {
  VisualGlyph,
  GlyphLibrary,
  getDefaultLibrary,
  Primitives,
  Poses,
  Symbols,
  Renderer,
  drawLine,
  drawCircle,
  drawRect,
  drawBorder,
  drawPose,
  drawSymbol,
  toPNG,
  savePNG,
  toSVG,
  saveSVG,
  toDataURL,
  renderGrid,
  renderWithLabel
} from './core/index.js';

// Re-export protocol components
export {
  Encoder,
  Decoder,
  Agent
} from './protocol/index.js';

// Import for Ayni class
import { Encoder } from './protocol/Encoder.js';
import { Decoder } from './protocol/Decoder.js';
import { GlyphLibrary, getDefaultLibrary } from './core/GlyphLibrary.js';

/**
 * Main Ayni class - convenience wrapper
 */
export class Ayni {
  /**
   * @param {Object} options - Options
   * @param {boolean} options.extended - Load extended glyph library
   * @param {Buffer} options.encryptionKey - Encryption key for secure mode
   */
  constructor(options = {}) {
    this.library = new GlyphLibrary();
    if (options.extended !== false) {
      this.library.loadExtended();
    }

    this.encoder = new Encoder({
      library: this.library,
      encryptionKey: options.encryptionKey
    });

    this.decoder = new Decoder({
      library: this.library,
      decryptionKey: options.encryptionKey
    });
  }

  /**
   * Encode a message
   * @param {Object} input - Message input
   * @returns {Object} Encoded message
   */
  encode(input) {
    return this.encoder.encode(input);
  }

  /**
   * Decode a message
   * @param {Object} message - Encoded message
   * @returns {Object} Decoded message
   */
  decode(message) {
    return this.decoder.decode(message);
  }

  /**
   * Encode from natural language
   * @param {string} text - Natural language text
   * @returns {Object} Encoded message
   */
  fromText(text) {
    return this.encoder.fromText(text);
  }

  /**
   * Convert message to human-readable text
   * @param {Object} decoded - Decoded message
   * @returns {string} Human-readable text
   */
  toText(decoded) {
    return this.decoder.toHumanReadable(decoded);
  }

  /**
   * Get a glyph by ID
   * @param {string} id - Glyph ID
   * @returns {VisualGlyph} Glyph instance
   */
  getGlyph(id) {
    return this.library.get(id);
  }

  /**
   * List all available glyphs
   * @returns {string[]} Array of glyph IDs
   */
  listGlyphs() {
    return this.library.list();
  }

  /**
   * Get glyphs by category
   * @param {string} category - Category name
   * @returns {string[]} Array of glyph IDs
   */
  glyphsByCategory(category) {
    return this.library.byCategory(category);
  }

  /**
   * Find best matching glyph for text
   * @param {string} text - Text to match
   * @returns {Object|null} Match result
   */
  findGlyph(text) {
    return this.library.findBestMatch(text);
  }

  /**
   * Get library statistics
   * @returns {Object} Stats
   */
  stats() {
    return this.library.stats();
  }
}

// Default export
export default Ayni;

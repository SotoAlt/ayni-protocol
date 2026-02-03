/**
 * Encoder - Encodes messages using the Ayni glyph protocol
 *
 * Transforms semantic content into glyph-based messages for efficient
 * agent-to-agent communication.
 */

import { GlyphLibrary, getDefaultLibrary } from '../core/GlyphLibrary.js';
import crypto from 'crypto';

/**
 * Message structure
 * @typedef {Object} AyniMessage
 * @property {string} glyph - Glyph ID (public)
 * @property {Object} data - Message payload (can be encrypted)
 * @property {number} timestamp - Unix timestamp
 * @property {Object} [encryption] - Encryption metadata
 * @property {Object} [payment] - Payment information (x402)
 * @property {string} [signature] - Message signature
 */

/**
 * Encoder class
 */
export class Encoder {
  /**
   * @param {Object} options - Encoder options
   * @param {GlyphLibrary} options.library - Glyph library to use
   * @param {boolean} options.encrypt - Enable encryption by default
   * @param {Buffer} options.encryptionKey - Default encryption key
   */
  constructor(options = {}) {
    this.library = options.library || getDefaultLibrary();
    this.defaultEncrypt = options.encrypt || false;
    this.encryptionKey = options.encryptionKey || null;
  }

  /**
   * Encode a message
   * @param {Object} input - Message input
   * @param {string} input.glyph - Glyph ID or auto-detect from text
   * @param {string} [input.text] - Natural language to convert
   * @param {Object} [input.data] - Data payload
   * @param {Object} [input.payment] - Payment info
   * @param {boolean} [input.encrypt] - Encrypt the data
   * @returns {AyniMessage} Encoded message
   */
  encode(input) {
    // Determine glyph ID
    let glyphId = input.glyph;
    if (!glyphId && input.text) {
      const match = this.library.findBestMatch(input.text);
      glyphId = match ? match.id : 'A01'; // Default to action
    }

    // Validate glyph exists
    if (!this.library.has(glyphId)) {
      throw new Error(`Unknown glyph: ${glyphId}`);
    }

    // Build message
    const message = {
      glyph: glyphId,
      data: input.data || {},
      timestamp: Math.floor(Date.now() / 1000)
    };

    // Handle encryption
    const shouldEncrypt = input.encrypt ?? this.defaultEncrypt;
    if (shouldEncrypt && Object.keys(message.data).length > 0) {
      const key = input.encryptionKey || this.encryptionKey;
      if (!key) {
        throw new Error('Encryption requested but no key provided');
      }
      message.data = this._encryptData(message.data, key);
      message.encryption = {
        algorithm: 'aes-256-gcm',
        encrypted: true
      };
    }

    // Add payment info if provided
    if (input.payment) {
      message.payment = {
        amount: input.payment.amount,
        currency: input.payment.currency || 'ETH',
        recipient: input.payment.recipient,
        txHash: input.payment.txHash || null
      };
    }

    return message;
  }

  /**
   * Encode from natural language
   * @param {string} text - Natural language text
   * @param {Object} [context] - Additional context
   * @returns {AyniMessage} Encoded message
   */
  fromText(text, context = {}) {
    const match = this.library.findBestMatch(text);

    return this.encode({
      glyph: match ? match.id : null,
      text: text,
      data: {
        originalText: text,
        ...context
      }
    });
  }

  /**
   * Encode a query message
   * @param {string} target - Query target (e.g., 'database', 'api')
   * @param {Object} params - Query parameters
   * @returns {AyniMessage} Encoded query
   */
  query(target, params = {}) {
    // Find appropriate query glyph
    const glyphMap = {
      database: 'Q01',
      api: 'Q02',
      search: 'Q03',
      filter: 'Q04'
    };
    const glyphId = glyphMap[target] || 'Q01';

    return this.encode({
      glyph: glyphId,
      data: {
        target,
        params
      }
    });
  }

  /**
   * Encode a response message
   * @param {string} status - Response status ('success', 'empty', 'cached')
   * @param {Object} data - Response data
   * @returns {AyniMessage} Encoded response
   */
  response(status, data = {}) {
    const glyphMap = {
      success: 'R01',
      data: 'R02',
      empty: 'R03',
      cached: 'R04'
    };
    const glyphId = glyphMap[status] || 'R01';

    return this.encode({
      glyph: glyphId,
      data: {
        status,
        ...data
      }
    });
  }

  /**
   * Encode an error message
   * @param {string} type - Error type
   * @param {string} message - Error message
   * @param {Object} [details] - Additional details
   * @returns {AyniMessage} Encoded error
   */
  error(type, message, details = {}) {
    const glyphMap = {
      general: 'E01',
      payment: 'E02',
      permission: 'E03',
      notFound: 'E04',
      timeout: 'E05',
      rateLimit: 'E06'
    };
    const glyphId = glyphMap[type] || 'E01';

    return this.encode({
      glyph: glyphId,
      data: {
        errorType: type,
        message,
        ...details
      }
    });
  }

  /**
   * Encode an action message
   * @param {string} action - Action type
   * @param {Object} params - Action parameters
   * @returns {AyniMessage} Encoded action
   */
  action(action, params = {}) {
    const glyphMap = {
      execute: 'A01',
      update: 'A02',
      delete: 'A03',
      create: 'A04',
      retry: 'A05'
    };
    const glyphId = glyphMap[action] || 'A01';

    return this.encode({
      glyph: glyphId,
      data: {
        action,
        ...params
      }
    });
  }

  /**
   * Encode a state message
   * @param {string} state - State type
   * @param {Object} data - State data
   * @returns {AyniMessage} Encoded state
   */
  state(state, data = {}) {
    const glyphMap = {
      idle: 'S01',
      processing: 'S02',
      waiting: 'S03',
      complete: 'S04'
    };
    const glyphId = glyphMap[state] || 'S01';

    return this.encode({
      glyph: glyphId,
      data: {
        state,
        ...data
      }
    });
  }

  /**
   * Serialize message to binary
   * @param {AyniMessage} message - Message to serialize
   * @returns {Buffer} Binary representation
   */
  toBinary(message) {
    const json = JSON.stringify(message);
    return Buffer.from(json, 'utf8');
  }

  /**
   * Serialize message to compact format
   * @param {AyniMessage} message - Message to serialize
   * @returns {string} Compact string (glyph + base64 data)
   */
  toCompact(message) {
    const data = Buffer.from(JSON.stringify(message.data)).toString('base64');
    return `${message.glyph}:${data}`;
  }

  /**
   * Encrypt data payload
   * @private
   */
  _encryptData(data, key) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    const json = JSON.stringify(data);
    let encrypted = cipher.update(json, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    return {
      iv: iv.toString('base64'),
      ciphertext: encrypted,
      authTag: authTag.toString('base64')
    };
  }
}

export default Encoder;

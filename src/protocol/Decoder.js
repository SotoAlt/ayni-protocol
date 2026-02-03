/**
 * Decoder - Decodes Ayni protocol messages
 *
 * Transforms glyph-based messages back into semantic content.
 */

import { GlyphLibrary, getDefaultLibrary } from '../core/GlyphLibrary.js';
import crypto from 'crypto';

/**
 * Decoded message structure
 * @typedef {Object} DecodedMessage
 * @property {string} glyph - Glyph ID
 * @property {string} meaning - Human-readable meaning
 * @property {string} category - Glyph category
 * @property {Object} data - Decoded data payload
 * @property {number} timestamp - Message timestamp
 * @property {boolean} encrypted - Whether data was encrypted
 * @property {Object} [payment] - Payment info if present
 */

/**
 * Decoder class
 */
export class Decoder {
  /**
   * @param {Object} options - Decoder options
   * @param {GlyphLibrary} options.library - Glyph library to use
   * @param {Buffer} options.decryptionKey - Default decryption key
   */
  constructor(options = {}) {
    this.library = options.library || getDefaultLibrary();
    this.decryptionKey = options.decryptionKey || null;
  }

  /**
   * Decode a message
   * @param {Object|string} input - Encoded message or compact string
   * @param {Object} [options] - Decode options
   * @param {Buffer} [options.decryptionKey] - Key for encrypted data
   * @returns {DecodedMessage} Decoded message
   */
  decode(input, options = {}) {
    // Handle compact format
    let message = input;
    if (typeof input === 'string') {
      message = this.fromCompact(input);
    }

    // Get glyph specification
    const spec = this.library.getSpec(message.glyph);
    if (!spec) {
      throw new Error(`Unknown glyph: ${message.glyph}`);
    }

    // Decrypt data if needed
    let data = message.data;
    let wasEncrypted = false;

    if (message.encryption?.encrypted) {
      const key = options.decryptionKey || this.decryptionKey;
      if (!key) {
        // Return with encrypted data marker
        data = { encrypted: true, reason: 'No decryption key provided' };
      } else {
        data = this._decryptData(message.data, key);
        wasEncrypted = true;
      }
    }

    return {
      glyph: message.glyph,
      meaning: spec.meaning,
      category: spec.category,
      data,
      timestamp: message.timestamp,
      encrypted: wasEncrypted,
      payment: message.payment || null,
      tags: spec.tags || []
    };
  }

  /**
   * Decode from compact format
   * @param {string} compact - Compact string (glyph:base64data)
   * @returns {Object} Message object
   */
  fromCompact(compact) {
    const [glyph, dataStr] = compact.split(':');
    if (!glyph) {
      throw new Error('Invalid compact format');
    }

    let data = {};
    if (dataStr) {
      try {
        data = JSON.parse(Buffer.from(dataStr, 'base64').toString('utf8'));
      } catch (e) {
        data = { raw: dataStr };
      }
    }

    return {
      glyph,
      data,
      timestamp: Math.floor(Date.now() / 1000)
    };
  }

  /**
   * Decode from binary
   * @param {Buffer} buffer - Binary message
   * @returns {DecodedMessage} Decoded message
   */
  fromBinary(buffer) {
    const json = buffer.toString('utf8');
    const message = JSON.parse(json);
    return this.decode(message);
  }

  /**
   * Check if message is a specific type
   * @param {Object} message - Message to check
   * @param {string} category - Category to check for
   * @returns {boolean} True if matches
   */
  isCategory(message, category) {
    const spec = this.library.getSpec(message.glyph);
    return spec?.category === category;
  }

  /**
   * Check if message is a query
   * @param {Object} message - Message to check
   * @returns {boolean} True if query
   */
  isQuery(message) {
    return this.isCategory(message, 'query');
  }

  /**
   * Check if message is a response
   * @param {Object} message - Message to check
   * @returns {boolean} True if response
   */
  isResponse(message) {
    return this.isCategory(message, 'response');
  }

  /**
   * Check if message is an error
   * @param {Object} message - Message to check
   * @returns {boolean} True if error
   */
  isError(message) {
    return this.isCategory(message, 'error');
  }

  /**
   * Check if message is an action
   * @param {Object} message - Message to check
   * @returns {boolean} True if action
   */
  isAction(message) {
    return this.isCategory(message, 'action');
  }

  /**
   * Check if message is a state
   * @param {Object} message - Message to check
   * @returns {boolean} True if state
   */
  isState(message) {
    return this.isCategory(message, 'state');
  }

  /**
   * Check if message requires payment
   * @param {Object} message - Message to check
   * @returns {boolean} True if payment required
   */
  requiresPayment(message) {
    return message.glyph === 'E02' || message.payment?.required;
  }

  /**
   * Get visual representation of glyph
   * @param {Object|string} message - Message or glyph ID
   * @returns {Object} Visual info
   */
  getVisual(message) {
    const glyphId = typeof message === 'string' ? message : message.glyph;
    const glyph = this.library.get(glyphId);

    if (!glyph) {
      return null;
    }

    return {
      id: glyph.id,
      ascii: glyph.toASCII(),
      binary: glyph.toBinary(),
      base64: glyph.toBase64()
    };
  }

  /**
   * Convert message to human-readable text
   * @param {DecodedMessage} decoded - Decoded message
   * @returns {string} Human-readable text
   */
  toHumanReadable(decoded) {
    let text = `[${decoded.glyph}] ${decoded.meaning}`;

    if (decoded.encrypted) {
      text += ' (decrypted)';
    }

    if (decoded.data && Object.keys(decoded.data).length > 0) {
      if (decoded.data.originalText) {
        text += `: "${decoded.data.originalText}"`;
      } else if (decoded.data.message) {
        text += `: ${decoded.data.message}`;
      }
    }

    if (decoded.payment) {
      text += ` [Payment: ${decoded.payment.amount} ${decoded.payment.currency}]`;
    }

    return text;
  }

  /**
   * Validate message structure
   * @param {Object} message - Message to validate
   * @returns {Object} Validation result { valid, errors }
   */
  validate(message) {
    const errors = [];

    if (!message.glyph) {
      errors.push('Missing glyph ID');
    } else if (!this.library.has(message.glyph)) {
      errors.push(`Unknown glyph: ${message.glyph}`);
    }

    if (message.timestamp && typeof message.timestamp !== 'number') {
      errors.push('Invalid timestamp');
    }

    if (message.encryption?.encrypted && !message.data?.ciphertext) {
      errors.push('Encrypted flag set but no ciphertext found');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Decrypt data payload
   * @private
   */
  _decryptData(encryptedData, key) {
    const iv = Buffer.from(encryptedData.iv, 'base64');
    const authTag = Buffer.from(encryptedData.authTag, 'base64');
    const ciphertext = encryptedData.ciphertext;

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  }
}

export default Decoder;

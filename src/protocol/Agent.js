/**
 * Agent - High-level agent interface for Ayni protocol
 *
 * Provides a simple API for agents to communicate using glyphs.
 */

import { Encoder } from './Encoder.js';
import { Decoder } from './Decoder.js';
import { GlyphLibrary, getDefaultLibrary } from '../core/GlyphLibrary.js';
import crypto from 'crypto';

/**
 * Agent class - represents a single agent in the protocol
 */
export class Agent {
  /**
   * @param {Object} options - Agent options
   * @param {string} options.name - Agent name/identifier
   * @param {string} options.address - Blockchain address (optional)
   * @param {GlyphLibrary} options.library - Glyph library
   * @param {Buffer} options.encryptionKey - Shared encryption key
   */
  constructor(options = {}) {
    this.name = options.name || `Agent_${crypto.randomBytes(4).toString('hex')}`;
    this.address = options.address || null;
    this.library = options.library || getDefaultLibrary();
    this.encryptionKey = options.encryptionKey || null;

    this.encoder = new Encoder({
      library: this.library,
      encryptionKey: this.encryptionKey
    });

    this.decoder = new Decoder({
      library: this.library,
      decryptionKey: this.encryptionKey
    });

    // Statistics
    this.stats = {
      messagesSent: 0,
      messagesReceived: 0,
      bytesSent: 0,
      bytesReceived: 0,
      glyphUsage: {}
    };

    // Message handlers
    this.handlers = new Map();
  }

  /**
   * Send a message
   * @param {Object} options - Message options
   * @param {string} options.glyph - Glyph ID
   * @param {Object} options.data - Data payload
   * @param {Agent|string} options.to - Recipient agent or address
   * @param {boolean} options.encrypt - Encrypt the message
   * @returns {Object} Encoded message with metadata
   */
  send(options) {
    const message = this.encoder.encode({
      glyph: options.glyph,
      data: options.data,
      encrypt: options.encrypt ?? (this.encryptionKey !== null)
    });

    // Add sender info
    const envelope = {
      from: this.address || this.name,
      to: options.to instanceof Agent ? options.to.address || options.to.name : options.to,
      message
    };

    // Update stats
    this.stats.messagesSent++;
    const bytes = JSON.stringify(envelope).length;
    this.stats.bytesSent += bytes;
    this._trackGlyph(options.glyph);

    return envelope;
  }

  /**
   * Receive and decode a message
   * @param {Object} envelope - Message envelope
   * @returns {Object} Decoded message
   */
  receive(envelope) {
    const decoded = this.decoder.decode(envelope.message);

    // Update stats
    this.stats.messagesReceived++;
    const bytes = JSON.stringify(envelope).length;
    this.stats.bytesReceived += bytes;
    this._trackGlyph(envelope.message.glyph);

    // Call handler if registered
    const handler = this.handlers.get(envelope.message.glyph) ||
                    this.handlers.get(decoded.category) ||
                    this.handlers.get('*');

    if (handler) {
      return handler(decoded, envelope);
    }

    return decoded;
  }

  /**
   * Send a query
   * @param {string} target - Query target
   * @param {Object} params - Query parameters
   * @param {Agent|string} to - Recipient
   * @returns {Object} Message envelope
   */
  query(target, params, to) {
    const message = this.encoder.query(target, params);
    return this.send({
      glyph: message.glyph,
      data: message.data,
      to
    });
  }

  /**
   * Send a response
   * @param {string} status - Response status
   * @param {Object} data - Response data
   * @param {Agent|string} to - Recipient
   * @returns {Object} Message envelope
   */
  respond(status, data, to) {
    const message = this.encoder.response(status, data);
    return this.send({
      glyph: message.glyph,
      data: message.data,
      to
    });
  }

  /**
   * Send an error
   * @param {string} type - Error type
   * @param {string} errorMessage - Error message
   * @param {Agent|string} to - Recipient
   * @returns {Object} Message envelope
   */
  error(type, errorMessage, to) {
    const message = this.encoder.error(type, errorMessage);
    return this.send({
      glyph: message.glyph,
      data: message.data,
      to
    });
  }

  /**
   * Send an action request
   * @param {string} action - Action type
   * @param {Object} params - Action parameters
   * @param {Agent|string} to - Recipient
   * @returns {Object} Message envelope
   */
  action(action, params, to) {
    const message = this.encoder.action(action, params);
    return this.send({
      glyph: message.glyph,
      data: message.data,
      to
    });
  }

  /**
   * Send a state update
   * @param {string} state - State type
   * @param {Object} data - State data
   * @param {Agent|string} to - Recipient
   * @returns {Object} Message envelope
   */
  state(state, data, to) {
    const message = this.encoder.state(state, data);
    return this.send({
      glyph: message.glyph,
      data: message.data,
      to
    });
  }

  /**
   * Register a message handler
   * @param {string} glyphOrCategory - Glyph ID, category, or '*' for all
   * @param {Function} handler - Handler function (decoded, envelope) => result
   */
  on(glyphOrCategory, handler) {
    this.handlers.set(glyphOrCategory, handler);
    return this;
  }

  /**
   * Remove a message handler
   * @param {string} glyphOrCategory - Glyph ID or category
   */
  off(glyphOrCategory) {
    this.handlers.delete(glyphOrCategory);
    return this;
  }

  /**
   * Get agent statistics
   * @returns {Object} Stats object
   */
  getStats() {
    return {
      ...this.stats,
      totalMessages: this.stats.messagesSent + this.stats.messagesReceived,
      totalBytes: this.stats.bytesSent + this.stats.bytesReceived
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      messagesSent: 0,
      messagesReceived: 0,
      bytesSent: 0,
      bytesReceived: 0,
      glyphUsage: {}
    };
  }

  /**
   * Track glyph usage
   * @private
   */
  _trackGlyph(glyphId) {
    this.stats.glyphUsage[glyphId] = (this.stats.glyphUsage[glyphId] || 0) + 1;
  }

  /**
   * Generate a shared encryption key
   * @returns {Buffer} 32-byte encryption key
   */
  static generateKey() {
    return crypto.randomBytes(32);
  }

  /**
   * Create a pair of agents with shared encryption
   * @param {string} name1 - First agent name
   * @param {string} name2 - Second agent name
   * @returns {[Agent, Agent]} Pair of agents
   */
  static createPair(name1 = 'Alice', name2 = 'Bob') {
    const sharedKey = Agent.generateKey();
    const agent1 = new Agent({ name: name1, encryptionKey: sharedKey });
    const agent2 = new Agent({ name: name2, encryptionKey: sharedKey });
    return [agent1, agent2];
  }
}

export default Agent;

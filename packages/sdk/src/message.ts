import { keccak256, toBytes, encodeAbiParameters, parseAbiParameters } from 'viem';
import { type GlyphId, encodeIntent, isValidGlyphId } from './glyphs.js';

/**
 * Message encoding options
 */
export interface MessageOptions {
  glyph?: GlyphId;
  text?: string;
  data?: Record<string, unknown>;
  recipient?: `0x${string}`;
  timestamp?: number;
}

/**
 * Encoded message structure
 */
export interface EncodedMessage {
  glyph: GlyphId;
  data: Record<string, unknown>;
  recipient: `0x${string}` | null;
  timestamp: number;
  hash: `0x${string}`;
}

/**
 * AyniMessage - Handles message encoding and hashing
 */
export class AyniMessage {
  public readonly glyph: GlyphId;
  public readonly data: Record<string, unknown>;
  public readonly recipient: `0x${string}` | null;
  public readonly timestamp: number;
  private _hash: `0x${string}` | null = null;

  constructor(options: MessageOptions) {
    // Determine glyph from explicit ID or text intent
    if (options.glyph && isValidGlyphId(options.glyph)) {
      this.glyph = options.glyph;
    } else if (options.text) {
      const encoded = encodeIntent(options.text);
      if (!encoded) {
        throw new Error(`Could not encode text to glyph: "${options.text}"`);
      }
      this.glyph = encoded;
    } else {
      throw new Error('Must provide either glyph or text');
    }

    this.data = options.data || {};
    this.recipient = options.recipient || null;
    this.timestamp = options.timestamp || Date.now();
  }

  /**
   * Get the keccak256 hash of the message
   */
  get hash(): `0x${string}` {
    if (!this._hash) {
      this._hash = this.computeHash();
    }
    return this._hash;
  }

  /**
   * Compute keccak256 hash of the message
   */
  private computeHash(): `0x${string}` {
    const messageBytes = toBytes(
      JSON.stringify({
        glyph: this.glyph,
        data: this.data,
        recipient: this.recipient,
        timestamp: this.timestamp,
      })
    );
    return keccak256(messageBytes);
  }

  /**
   * Encode the message for transmission
   */
  encode(): EncodedMessage {
    return {
      glyph: this.glyph,
      data: this.data,
      recipient: this.recipient,
      timestamp: this.timestamp,
      hash: this.hash,
    };
  }

  /**
   * Encode for on-chain storage
   */
  encodeForChain(): { hash: `0x${string}`; glyphId: string; recipient: `0x${string}` } {
    return {
      hash: this.hash,
      glyphId: this.glyph,
      recipient: this.recipient || '0x0000000000000000000000000000000000000000',
    };
  }

  /**
   * Create message from query intent
   */
  static query(data: Record<string, unknown>, recipient?: `0x${string}`): AyniMessage {
    return new AyniMessage({
      glyph: 'Q01',
      data,
      recipient,
    });
  }

  /**
   * Create message from response
   */
  static response(data: Record<string, unknown>, recipient?: `0x${string}`): AyniMessage {
    return new AyniMessage({
      glyph: 'R01',
      data,
      recipient,
    });
  }

  /**
   * Create error message
   */
  static error(message: string, recipient?: `0x${string}`): AyniMessage {
    return new AyniMessage({
      glyph: 'E01',
      data: { error: message },
      recipient,
    });
  }

  /**
   * Create action message
   */
  static action(action: string, params: Record<string, unknown>, recipient?: `0x${string}`): AyniMessage {
    return new AyniMessage({
      glyph: 'A01',
      data: { action, params },
      recipient,
    });
  }

  /**
   * Create from natural language text
   */
  static fromText(text: string, data?: Record<string, unknown>, recipient?: `0x${string}`): AyniMessage {
    return new AyniMessage({
      text,
      data,
      recipient,
    });
  }

  /**
   * Decode an encoded message
   */
  static decode(encoded: EncodedMessage): AyniMessage {
    return new AyniMessage({
      glyph: encoded.glyph,
      data: encoded.data,
      recipient: encoded.recipient || undefined,
      timestamp: encoded.timestamp,
    });
  }
}

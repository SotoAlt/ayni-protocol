/**
 * VisualGlyph - Core class for 32x32 1-bit glyph manipulation
 *
 * A glyph is a 32x32 binary grid (1024 bits = 128 bytes) that represents
 * a visual token for AI agent communication.
 */

export class VisualGlyph {
  /**
   * @param {Object} spec - Glyph specification
   * @param {string} spec.id - Unique identifier (e.g., 'Q01', 'R01')
   * @param {string} spec.meaning - Human-readable meaning
   * @param {string} spec.category - Category: 'query', 'response', 'error', 'action', 'state'
   */
  constructor(spec = {}) {
    this.id = spec.id || 'UNKNOWN';
    this.meaning = spec.meaning || '';
    this.category = spec.category || 'unknown';
    this.grid = this._createEmptyGrid();
  }

  /**
   * Create an empty 32x32 grid
   * @private
   */
  _createEmptyGrid() {
    return Array(32).fill(null).map(() => Array(32).fill(0));
  }

  /**
   * Set a pixel value
   * @param {number} x - X coordinate (0-31)
   * @param {number} y - Y coordinate (0-31)
   * @param {number} value - 0 (white) or 1 (black)
   */
  set(x, y, value) {
    if (x >= 0 && x < 32 && y >= 0 && y < 32) {
      this.grid[y][x] = value ? 1 : 0;
    }
  }

  /**
   * Get a pixel value
   * @param {number} x - X coordinate (0-31)
   * @param {number} y - Y coordinate (0-31)
   * @returns {number} 0 or 1
   */
  get(x, y) {
    return this.grid[y]?.[x] || 0;
  }

  /**
   * Clear the grid (set all pixels to 0)
   */
  clear() {
    this.grid = this._createEmptyGrid();
  }

  /**
   * Clone this glyph
   * @returns {VisualGlyph} A new glyph with the same data
   */
  clone() {
    const cloned = new VisualGlyph({
      id: this.id,
      meaning: this.meaning,
      category: this.category
    });
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        cloned.set(x, y, this.get(x, y));
      }
    }
    return cloned;
  }

  /**
   * Encode glyph as binary string (1024 characters of '0' or '1')
   * @returns {string} Binary string representation
   */
  toBinary() {
    let binary = '';
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        binary += this.get(x, y) ? '1' : '0';
      }
    }
    return binary;
  }

  /**
   * Encode glyph as Buffer (128 bytes)
   * @returns {Buffer} Binary buffer
   */
  toBuffer() {
    const buffer = Buffer.alloc(128);
    let byteIndex = 0;
    let bitIndex = 0;
    let currentByte = 0;

    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        if (this.get(x, y)) {
          currentByte |= (1 << (7 - bitIndex));
        }
        bitIndex++;
        if (bitIndex === 8) {
          buffer[byteIndex++] = currentByte;
          currentByte = 0;
          bitIndex = 0;
        }
      }
    }
    return buffer;
  }

  /**
   * Encode glyph as Base64 string
   * @returns {string} Base64 encoded string
   */
  toBase64() {
    return this.toBuffer().toString('base64');
  }

  /**
   * Encode glyph as hex string
   * @returns {string} Hexadecimal string (256 characters)
   */
  toHex() {
    return this.toBuffer().toString('hex');
  }

  /**
   * Render as ASCII art
   * @param {Object} options - Rendering options
   * @param {string} options.filled - Character for filled pixels (default: '█')
   * @param {string} options.empty - Character for empty pixels (default: '░')
   * @returns {string} ASCII representation
   */
  toASCII(options = {}) {
    const filled = options.filled || '█';
    const empty = options.empty || '░';
    let output = '\n';
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        output += this.get(x, y) ? filled : empty;
      }
      output += '\n';
    }
    return output;
  }

  /**
   * Create glyph from binary string
   * @param {string} binary - Binary string (1024 characters)
   * @param {Object} spec - Glyph specification
   * @returns {VisualGlyph} New glyph instance
   */
  static fromBinary(binary, spec = {}) {
    const glyph = new VisualGlyph(spec);
    let idx = 0;
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        glyph.set(x, y, binary[idx++] === '1' ? 1 : 0);
      }
    }
    return glyph;
  }

  /**
   * Create glyph from Buffer
   * @param {Buffer} buffer - Binary buffer (128 bytes)
   * @param {Object} spec - Glyph specification
   * @returns {VisualGlyph} New glyph instance
   */
  static fromBuffer(buffer, spec = {}) {
    const glyph = new VisualGlyph(spec);
    let byteIndex = 0;
    let bitIndex = 0;

    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        const bit = (buffer[byteIndex] >> (7 - bitIndex)) & 1;
        glyph.set(x, y, bit);
        bitIndex++;
        if (bitIndex === 8) {
          byteIndex++;
          bitIndex = 0;
        }
      }
    }
    return glyph;
  }

  /**
   * Create glyph from Base64 string
   * @param {string} base64 - Base64 encoded string
   * @param {Object} spec - Glyph specification
   * @returns {VisualGlyph} New glyph instance
   */
  static fromBase64(base64, spec = {}) {
    return VisualGlyph.fromBuffer(Buffer.from(base64, 'base64'), spec);
  }

  /**
   * Create glyph from hex string
   * @param {string} hex - Hexadecimal string
   * @param {Object} spec - Glyph specification
   * @returns {VisualGlyph} New glyph instance
   */
  static fromHex(hex, spec = {}) {
    return VisualGlyph.fromBuffer(Buffer.from(hex, 'hex'), spec);
  }

  /**
   * XOR encrypt/decrypt the glyph with a key pattern
   * @param {VisualGlyph|number[][]} keyPattern - Key glyph or 2D array
   * @returns {VisualGlyph} Encrypted/decrypted glyph
   */
  encrypt(keyPattern) {
    const encrypted = new VisualGlyph({
      id: `ENC_${this.id}`,
      meaning: '[Encrypted]',
      category: 'encrypted'
    });

    const getKeyBit = (x, y) => {
      if (keyPattern instanceof VisualGlyph) {
        return keyPattern.get(x, y);
      }
      return keyPattern[y]?.[x] || 0;
    };

    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        encrypted.set(x, y, this.get(x, y) ^ getKeyBit(x, y));
      }
    }

    return encrypted;
  }

  /**
   * Calculate Hamming distance to another glyph
   * (Number of differing bits - used for visual distance validation)
   * @param {VisualGlyph} other - Another glyph
   * @returns {number} Hamming distance (0-1024)
   */
  hammingDistance(other) {
    let distance = 0;
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        if (this.get(x, y) !== other.get(x, y)) {
          distance++;
        }
      }
    }
    return distance;
  }

  /**
   * Get glyph metadata object
   * @returns {Object} Metadata
   */
  toJSON() {
    return {
      id: this.id,
      meaning: this.meaning,
      category: this.category,
      binary: this.toBinary(),
      base64: this.toBase64()
    };
  }
}

export default VisualGlyph;

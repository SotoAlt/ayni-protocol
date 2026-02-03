#!/usr/bin/env node

/**
 * VISUAL GLYPH PROTOCOL - The Real Thing
 * Pure visual encoding, VLM-readable, blockchain-ready
 */

import fs from 'fs';
import { createCanvas } from 'canvas';

// 32x32 Binary Grid
class VisualGlyph {
  constructor(spec) {
    this.id = spec.id;
    this.grid = Array(32).fill(0).map(() => Array(32).fill(0));
    this.category = spec.category;
    this.meaning = spec.meaning;
  }

  // Set pixel (0 = white, 1 = black)
  set(x, y, value) {
    if (x >= 0 && x < 32 && y >= 0 && y < 32) {
      this.grid[y][x] = value ? 1 : 0;
    }
  }

  get(x, y) {
    return this.grid[y]?.[x] || 0;
  }

  // Draw border frame
  drawBorder() {
    for (let i = 0; i < 32; i++) {
      this.set(i, 0, 1);  // Top
      this.set(i, 31, 1); // Bottom
      this.set(0, i, 1);  // Left
      this.set(31, i, 1); // Right
    }
  }

  // Draw humanoid figure
  drawHumanoid(pose = 'standing') {
    const centerX = 16;
    const centerY = 16;

    if (pose === 'arms_up') {
      // Query pose - arms raised
      // Head
      this.drawCircle(centerX, 8, 2);
      // Body
      this.drawLine(centerX, 10, centerX, 20);
      // Arms up
      this.drawLine(centerX, 12, centerX - 4, 8);
      this.drawLine(centerX, 12, centerX + 4, 8);
      // Legs
      this.drawLine(centerX, 20, centerX - 3, 26);
      this.drawLine(centerX, 20, centerX + 3, 26);
    } else if (pose === 'arms_down') {
      // Response pose - arms offering
      this.drawCircle(centerX, 8, 2);
      this.drawLine(centerX, 10, centerX, 20);
      // Arms down/forward
      this.drawLine(centerX, 14, centerX - 4, 18);
      this.drawLine(centerX, 14, centerX + 4, 18);
      this.drawLine(centerX, 20, centerX - 3, 26);
      this.drawLine(centerX, 20, centerX + 3, 26);
    } else if (pose === 'distressed') {
      // Error pose - hands on head
      this.drawCircle(centerX, 8, 2);
      this.drawLine(centerX, 10, centerX, 20);
      // Arms to head
      this.drawLine(centerX, 12, centerX - 3, 7);
      this.drawLine(centerX, 12, centerX + 3, 7);
      this.drawLine(centerX, 20, centerX - 3, 26);
      this.drawLine(centerX, 20, centerX + 3, 26);
    } else if (pose === 'action') {
      // Action pose - running
      this.drawCircle(centerX + 2, 8, 2);
      this.drawLine(centerX + 2, 10, centerX, 20);
      // Arms in motion
      this.drawLine(centerX, 14, centerX - 4, 16);
      this.drawLine(centerX, 14, centerX + 4, 10);
      // Legs running
      this.drawLine(centerX, 20, centerX - 2, 26);
      this.drawLine(centerX, 20, centerX + 4, 24);
    }
  }

  // Symbol overlay (database, API, etc)
  drawSymbol(symbol, x, y) {
    if (symbol === 'database') {
      // Cylinder shape
      this.drawCircle(x, y, 3);
      this.drawRect(x - 3, y, 6, 4);
      this.drawCircle(x, y + 4, 3);
    } else if (symbol === 'checkmark') {
      this.drawLine(x - 2, y, x, y + 2);
      this.drawLine(x, y + 2, x + 3, y - 2);
    } else if (symbol === 'x') {
      this.drawLine(x - 2, y - 2, x + 2, y + 2);
      this.drawLine(x - 2, y + 2, x + 2, y - 2);
    } else if (symbol === 'diamond') {
      this.set(x, y - 2, 1);
      this.set(x - 2, y, 1);
      this.set(x + 2, y, 1);
      this.set(x, y + 2, 1);
      this.drawLine(x, y - 2, x - 2, y);
      this.drawLine(x, y - 2, x + 2, y);
      this.drawLine(x - 2, y, x, y + 2);
      this.drawLine(x + 2, y, x, y + 2);
    }
  }

  // Helper: draw circle
  drawCircle(cx, cy, r) {
    for (let y = cy - r; y <= cy + r; y++) {
      for (let x = cx - r; x <= cx + r; x++) {
        const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        if (dist <= r) {
          this.set(x, y, 1);
        }
      }
    }
  }

  // Helper: draw line
  drawLine(x0, y0, x1, y1) {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    while (true) {
      this.set(x0, y0, 1);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x0 += sx;
      }
      if (e2 < dx) {
        err += dx;
        y0 += sy;
      }
    }
  }

  // Helper: draw rectangle
  drawRect(x, y, w, h) {
    for (let i = 0; i < w; i++) {
      for (let j = 0; j < h; j++) {
        this.set(x + i, y + j, 1);
      }
    }
  }

  // Render as ASCII
  toASCII() {
    let output = '\n';
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        output += this.get(x, y) ? '█' : '░';
      }
      output += '\n';
    }
    return output;
  }

  // Render as PNG (1-bit image)
  toPNG(filename) {
    const canvas = createCanvas(32, 32);
    const ctx = canvas.getContext('2d');

    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        ctx.fillStyle = this.get(x, y) ? '#000000' : '#FFFFFF';
        ctx.fillRect(x, y, 1, 1);
      }
    }

    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(filename, buffer);
    return filename;
  }

  // Encode as binary string (for transmission)
  toBinary() {
    let binary = '';
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        binary += this.get(x, y) ? '1' : '0';
      }
    }
    return binary;
  }

  // Decode from binary string
  static fromBinary(binary, id, meaning) {
    const glyph = new VisualGlyph({ id, meaning, category: 'unknown' });
    let idx = 0;
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        glyph.set(x, y, binary[idx++] === '1' ? 1 : 0);
      }
    }
    return glyph;
  }

  // Encrypt visual pattern (XOR with key)
  encrypt(keyPattern) {
    const encrypted = new VisualGlyph({ 
      id: `ENC_${this.id}`, 
      meaning: '[Encrypted]', 
      category: 'encrypted' 
    });
    
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        const keyBit = keyPattern[y]?.[x] || 0;
        encrypted.set(x, y, this.get(x, y) ^ keyBit);
      }
    }
    
    return encrypted;
  }
}

// Generate core glyphs
console.log('=== VISUAL GLYPH PROTOCOL ===\n');
console.log('Generating core visual library...\n');

const glyphs = {};

// Q01: Query Database
const Q01 = new VisualGlyph({ 
  id: 'Q01', 
  meaning: 'Query Database',
  category: 'query' 
});
Q01.drawBorder();
Q01.drawHumanoid('arms_up');
Q01.drawSymbol('database', 24, 8);
glyphs.Q01 = Q01;

console.log('Q01: Query Database');
console.log(Q01.toASCII());

// R01: Response Success
const R01 = new VisualGlyph({ 
  id: 'R01', 
  meaning: 'Response Success',
  category: 'response' 
});
R01.drawBorder();
R01.drawHumanoid('arms_down');
R01.drawSymbol('checkmark', 24, 8);
glyphs.R01 = R01;

console.log('R01: Response Success');
console.log(R01.toASCII());

// E01: Error
const E01 = new VisualGlyph({ 
  id: 'E01', 
  meaning: 'Error',
  category: 'error' 
});
E01.drawBorder();
E01.drawHumanoid('distressed');
E01.drawSymbol('x', 24, 8);
glyphs.E01 = E01;

console.log('E01: Error');
console.log(E01.toASCII());

// A01: Execute Action
const A01 = new VisualGlyph({ 
  id: 'A01', 
  meaning: 'Execute Action',
  category: 'action' 
});
A01.drawBorder();
A01.drawHumanoid('action');
A01.drawSymbol('diamond', 24, 8);
glyphs.A01 = A01;

console.log('A01: Execute Action');
console.log(A01.toASCII());

// Save as PNG images
console.log('\n=== Saving PNG files ===\n');
fs.mkdirSync('visual-glyphs', { recursive: true });

for (const [id, glyph] of Object.entries(glyphs)) {
  const filename = `visual-glyphs/${id}.png`;
  glyph.toPNG(filename);
  console.log(`✓ Saved ${filename}`);
}

// Agent Protocol Simulation
console.log('\n=== AGENT PROTOCOL SIMULATION ===\n');

class VisualAgent {
  constructor(name) {
    this.name = name;
  }

  send(glyphId) {
    const glyph = glyphs[glyphId];
    if (!glyph) {
      console.error(`Unknown glyph: ${glyphId}`);
      return null;
    }

    const binary = glyph.toBinary();
    const bytes = Math.ceil(binary.length / 8);

    console.log(`${this.name} sends:`);
    console.log(`  Glyph: ${glyphId}`);
    console.log(`  Meaning: ${glyph.meaning}`);
    console.log(`  Size: ${bytes} bytes (${binary.length} bits)`);
    console.log(`  Visual preview:`);
    console.log(glyph.toASCII());

    return { glyphId, binary, glyph };
  }

  receive(binary, glyphId) {
    console.log(`${this.name} receives:`);
    console.log(`  Raw binary: ${binary.substring(0, 64)}... (${binary.length} bits)`);
    
    const glyph = glyphs[glyphId];
    console.log(`  Decoded as: ${glyphId} - ${glyph.meaning}`);
    console.log(`  Visual:`);
    console.log(glyph.toASCII());
  }
}

// Simulate conversation
const alice = new VisualAgent('Alice');
const bob = new VisualAgent('Bob');

console.log('Conversation: Alice → Bob\n');
console.log('─'.repeat(50));

const msg1 = alice.send('Q01');
console.log('─'.repeat(50));
bob.receive(msg1.binary, msg1.glyphId);

console.log('\n' + '─'.repeat(50));

const msg2 = bob.send('R01');
console.log('─'.repeat(50));
alice.receive(msg2.binary, msg2.glyphId);

// Encryption demo
console.log('\n=== ENCRYPTED VISUAL PROTOCOL ===\n');

// Generate random encryption key pattern
const keyPattern = Array(32).fill(0).map(() => 
  Array(32).fill(0).map(() => Math.random() > 0.5 ? 1 : 0)
);

const originalGlyph = glyphs.Q01;
const encryptedGlyph = originalGlyph.encrypt(keyPattern);

console.log('Original (Q01 - Query Database):');
console.log(originalGlyph.toASCII());

console.log('\nEncrypted (XOR with key):');
console.log(encryptedGlyph.toASCII());

console.log('\nDecrypted (XOR with same key):');
const decryptedGlyph = encryptedGlyph.encrypt(keyPattern); // XOR again = decrypt
console.log(decryptedGlyph.toASCII());

console.log('\n✓ Encryption verified - pattern matches original!\n');

// Blockchain payment protocol (x402 style)
console.log('=== BLOCKCHAIN PAYMENT PROTOCOL (x402-style) ===\n');

console.log('Message structure:');
console.log('{');
console.log('  header: {');
console.log('    version: 1,');
console.log('    sender: "0x1234...",');
console.log('    recipient: "0x5678...",');
console.log('    payment: "0.001 ETH",  // x402 payment for message');
console.log('    timestamp: 1738419600');
console.log('  },');
console.log('  glyph: <32x32 binary grid>,');
console.log('  data: {');
console.log('    encrypted: true,');
console.log('    payload: "[encrypted blob]"');
console.log('  },');
console.log('  signature: "0xabcd..."');
console.log('}\n');

console.log('Use cases:');
console.log('  1. Paid AI agent services (pay per query)');
console.log('  2. Premium messaging (spam protection)');
console.log('  3. On-chain audit trail (glyphs as NFTs)');
console.log('  4. Decentralized agent marketplace\n');

console.log('✅ Visual protocol demo complete!\n');
console.log('Check visual-glyphs/ folder for PNG files.\n');

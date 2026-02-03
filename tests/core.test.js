#!/usr/bin/env node

/**
 * Core Module Tests
 *
 * Tests for VisualGlyph, Primitives, Poses, Symbols, and GlyphLibrary
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import { VisualGlyph } from '../src/core/VisualGlyph.js';
import { GlyphLibrary, getDefaultLibrary } from '../src/core/GlyphLibrary.js';
import {
  drawLine,
  drawCircle,
  drawRect,
  drawBorder
} from '../src/core/Primitives.js';
import { drawPose, getPoseNames } from '../src/core/Poses.js';
import { drawSymbol, getSymbolNames } from '../src/core/Symbols.js';

describe('VisualGlyph', () => {
  it('should create an empty 32x32 grid', () => {
    const glyph = new VisualGlyph({ id: 'TEST', meaning: 'Test' });
    assert.strictEqual(glyph.grid.length, 32);
    assert.strictEqual(glyph.grid[0].length, 32);

    // All pixels should be 0
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        assert.strictEqual(glyph.get(x, y), 0);
      }
    }
  });

  it('should set and get pixels correctly', () => {
    const glyph = new VisualGlyph({ id: 'TEST' });
    glyph.set(10, 15, 1);
    assert.strictEqual(glyph.get(10, 15), 1);
    assert.strictEqual(glyph.get(10, 14), 0);
  });

  it('should handle out-of-bounds coordinates gracefully', () => {
    const glyph = new VisualGlyph({ id: 'TEST' });
    glyph.set(-1, 0, 1);  // Should not throw
    glyph.set(100, 0, 1); // Should not throw
    assert.strictEqual(glyph.get(-1, 0), 0);
    assert.strictEqual(glyph.get(100, 0), 0);
  });

  it('should convert to binary string (1024 chars)', () => {
    const glyph = new VisualGlyph({ id: 'TEST' });
    glyph.set(0, 0, 1);
    const binary = glyph.toBinary();
    assert.strictEqual(binary.length, 1024);
    assert.strictEqual(binary[0], '1');
    assert.strictEqual(binary[1], '0');
  });

  it('should convert to Buffer (128 bytes)', () => {
    const glyph = new VisualGlyph({ id: 'TEST' });
    const buffer = glyph.toBuffer();
    assert.strictEqual(buffer.length, 128);
  });

  it('should round-trip through binary encoding', () => {
    const original = new VisualGlyph({ id: 'TEST', meaning: 'Test' });
    original.set(5, 5, 1);
    original.set(10, 10, 1);
    original.set(20, 20, 1);

    const binary = original.toBinary();
    const restored = VisualGlyph.fromBinary(binary, { id: 'RESTORED' });

    assert.strictEqual(restored.get(5, 5), 1);
    assert.strictEqual(restored.get(10, 10), 1);
    assert.strictEqual(restored.get(20, 20), 1);
    assert.strictEqual(restored.get(0, 0), 0);
  });

  it('should round-trip through Buffer encoding', () => {
    const original = new VisualGlyph({ id: 'TEST' });
    original.set(0, 0, 1);
    original.set(31, 31, 1);

    const buffer = original.toBuffer();
    const restored = VisualGlyph.fromBuffer(buffer);

    assert.strictEqual(restored.get(0, 0), 1);
    assert.strictEqual(restored.get(31, 31), 1);
    assert.strictEqual(restored.get(15, 15), 0);
  });

  it('should round-trip through Base64 encoding', () => {
    const original = new VisualGlyph({ id: 'TEST' });
    original.set(16, 16, 1);

    const base64 = original.toBase64();
    const restored = VisualGlyph.fromBase64(base64);

    assert.strictEqual(restored.get(16, 16), 1);
  });

  it('should clone correctly', () => {
    const original = new VisualGlyph({ id: 'ORIG', meaning: 'Original' });
    original.set(5, 5, 1);

    const cloned = original.clone();
    assert.strictEqual(cloned.id, 'ORIG');
    assert.strictEqual(cloned.get(5, 5), 1);

    // Modifications should be independent
    cloned.set(10, 10, 1);
    assert.strictEqual(original.get(10, 10), 0);
  });

  it('should calculate Hamming distance', () => {
    const g1 = new VisualGlyph({ id: 'G1' });
    const g2 = new VisualGlyph({ id: 'G2' });

    // Initially identical
    assert.strictEqual(g1.hammingDistance(g2), 0);

    // Add one differing pixel
    g1.set(5, 5, 1);
    assert.strictEqual(g1.hammingDistance(g2), 1);

    // Add more
    g1.set(10, 10, 1);
    g1.set(15, 15, 1);
    assert.strictEqual(g1.hammingDistance(g2), 3);
  });

  it('should XOR encrypt and decrypt', () => {
    const original = new VisualGlyph({ id: 'SECRET' });
    original.set(5, 5, 1);
    original.set(10, 10, 1);

    // Create key pattern
    const key = Array(32).fill(null).map(() =>
      Array(32).fill(null).map(() => Math.random() > 0.5 ? 1 : 0)
    );

    const encrypted = original.encrypt(key);
    const decrypted = encrypted.encrypt(key);

    // Should match original
    assert.strictEqual(decrypted.get(5, 5), 1);
    assert.strictEqual(decrypted.get(10, 10), 1);
    assert.strictEqual(decrypted.get(0, 0), 0);
  });

  it('should render to ASCII', () => {
    const glyph = new VisualGlyph({ id: 'TEST' });
    glyph.set(0, 0, 1);

    const ascii = glyph.toASCII();
    assert.ok(ascii.includes('\n'));
    assert.ok(ascii.length > 32);
  });

  it('should serialize to JSON', () => {
    const glyph = new VisualGlyph({ id: 'TEST', meaning: 'Test', category: 'query' });
    const json = glyph.toJSON();

    assert.strictEqual(json.id, 'TEST');
    assert.strictEqual(json.meaning, 'Test');
    assert.strictEqual(json.category, 'query');
    assert.ok(json.binary);
    assert.ok(json.base64);
  });
});

describe('Primitives', () => {
  it('should draw a horizontal line', () => {
    const glyph = new VisualGlyph({ id: 'TEST' });
    drawLine(glyph, 0, 5, 10, 5);

    for (let x = 0; x <= 10; x++) {
      assert.strictEqual(glyph.get(x, 5), 1, `Pixel at (${x}, 5) should be 1`);
    }
  });

  it('should draw a vertical line', () => {
    const glyph = new VisualGlyph({ id: 'TEST' });
    drawLine(glyph, 5, 0, 5, 10);

    for (let y = 0; y <= 10; y++) {
      assert.strictEqual(glyph.get(5, y), 1, `Pixel at (5, ${y}) should be 1`);
    }
  });

  it('should draw a diagonal line', () => {
    const glyph = new VisualGlyph({ id: 'TEST' });
    drawLine(glyph, 0, 0, 10, 10);

    assert.strictEqual(glyph.get(0, 0), 1);
    assert.strictEqual(glyph.get(5, 5), 1);
    assert.strictEqual(glyph.get(10, 10), 1);
  });

  it('should draw a filled circle', () => {
    const glyph = new VisualGlyph({ id: 'TEST' });
    drawCircle(glyph, 16, 16, 3);

    // Center should be filled
    assert.strictEqual(glyph.get(16, 16), 1);
    // Edge should be filled
    assert.strictEqual(glyph.get(16, 13), 1);
    // Outside should be empty
    assert.strictEqual(glyph.get(16, 10), 0);
  });

  it('should draw a filled rectangle', () => {
    const glyph = new VisualGlyph({ id: 'TEST' });
    drawRect(glyph, 5, 5, 10, 5);

    // Inside should be filled
    assert.strictEqual(glyph.get(10, 7), 1);
    // Outside should be empty
    assert.strictEqual(glyph.get(4, 5), 0);
    assert.strictEqual(glyph.get(16, 5), 0);
  });

  it('should draw a border', () => {
    const glyph = new VisualGlyph({ id: 'TEST' });
    drawBorder(glyph);

    // Corners should be filled
    assert.strictEqual(glyph.get(0, 0), 1);
    assert.strictEqual(glyph.get(31, 0), 1);
    assert.strictEqual(glyph.get(0, 31), 1);
    assert.strictEqual(glyph.get(31, 31), 1);

    // Center should be empty
    assert.strictEqual(glyph.get(16, 16), 0);
  });
});

describe('Poses', () => {
  it('should have at least 5 poses', () => {
    const poses = getPoseNames();
    assert.ok(poses.length >= 5);
  });

  it('should include foundation poses', () => {
    const poses = getPoseNames();
    assert.ok(poses.includes('arms_up'));
    assert.ok(poses.includes('arms_down'));
    assert.ok(poses.includes('distressed'));
    assert.ok(poses.includes('action'));
  });

  it('should draw poses without error', () => {
    const poses = getPoseNames();
    for (const pose of poses) {
      const glyph = new VisualGlyph({ id: 'TEST' });
      const result = drawPose(glyph, pose);
      assert.strictEqual(result, true, `Pose ${pose} should draw successfully`);

      // Should have some pixels set
      const binary = glyph.toBinary();
      const setPixels = binary.split('').filter(b => b === '1').length;
      assert.ok(setPixels > 0, `Pose ${pose} should set some pixels`);
    }
  });
});

describe('Symbols', () => {
  it('should have at least 10 symbols', () => {
    const symbols = getSymbolNames();
    assert.ok(symbols.length >= 10);
  });

  it('should include foundation symbols', () => {
    const symbols = getSymbolNames();
    assert.ok(symbols.includes('database'));
    assert.ok(symbols.includes('checkmark'));
    assert.ok(symbols.includes('x'));
    assert.ok(symbols.includes('diamond'));
  });

  it('should draw symbols without error', () => {
    const symbols = getSymbolNames();
    for (const symbol of symbols) {
      const glyph = new VisualGlyph({ id: 'TEST' });
      const result = drawSymbol(glyph, symbol, 16, 16);
      assert.strictEqual(result, true, `Symbol ${symbol} should draw successfully`);
    }
  });
});

describe('GlyphLibrary', () => {
  it('should have foundation glyphs', () => {
    const library = new GlyphLibrary();
    assert.ok(library.has('Q01'));
    assert.ok(library.has('R01'));
    assert.ok(library.has('E01'));
    assert.ok(library.has('A01'));
  });

  it('should have extended glyphs after loading', () => {
    const library = new GlyphLibrary().loadExtended();
    assert.ok(library.has('Q02'));
    assert.ok(library.has('E02'));
    assert.ok(library.has('S01'));
  });

  it('should generate glyphs from specs', () => {
    const library = getDefaultLibrary();
    const glyph = library.get('Q01');

    assert.ok(glyph instanceof VisualGlyph);
    assert.strictEqual(glyph.id, 'Q01');

    // Should have some content
    const binary = glyph.toBinary();
    const setPixels = binary.split('').filter(b => b === '1').length;
    assert.ok(setPixels > 50, 'Generated glyph should have visible content');
  });

  it('should cache generated glyphs', () => {
    const library = new GlyphLibrary();
    const g1 = library.get('Q01');
    const g2 = library.get('Q01');

    // Should be different instances (cloned)
    assert.notStrictEqual(g1, g2);
    // But identical content
    assert.strictEqual(g1.toBinary(), g2.toBinary());
  });

  it('should list glyphs by category', () => {
    const library = getDefaultLibrary();

    const queries = library.byCategory('query');
    assert.ok(queries.includes('Q01'));

    const errors = library.byCategory('error');
    assert.ok(errors.includes('E01'));
  });

  it('should search by tag', () => {
    const library = getDefaultLibrary();

    const results = library.searchByTag('database');
    assert.ok(results.includes('Q01'));
  });

  it('should find best match for text', () => {
    const library = getDefaultLibrary();

    const match = library.findBestMatch('query database');
    assert.ok(match);
    assert.strictEqual(match.id, 'Q01');
    assert.ok(match.score > 0);
  });

  it('should export to JSON', () => {
    const library = new GlyphLibrary();
    const json = library.toJSON();

    assert.strictEqual(json.version, '2.0');
    assert.ok(json.count >= 4);
    assert.ok(json.glyphs.Q01);
  });

  it('should import from JSON', () => {
    const library = new GlyphLibrary();
    library.fromJSON({
      glyphs: {
        CUSTOM: {
          id: 'CUSTOM',
          meaning: 'Custom Glyph',
          category: 'test',
          pose: 'arms_up',
          symbol: 'checkmark'
        }
      }
    });

    assert.ok(library.has('CUSTOM'));
  });

  it('should provide statistics', () => {
    const library = getDefaultLibrary();
    const stats = library.stats();

    assert.ok(stats.total > 0);
    assert.ok(stats.categories.query > 0);
    assert.ok(typeof stats.cached === 'number');
  });
});

// Run tests
console.log('Running Core Module Tests...\n');

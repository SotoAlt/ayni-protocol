#!/usr/bin/env node

/**
 * Visual System Tests
 *
 * Tests for TocapuMotifs, Motifs dual-style system, and visual distinctness
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import { VisualGlyph } from '../src/core/VisualGlyph.js';
import { GlyphLibrary, getDefaultLibrary } from '../src/core/GlyphLibrary.js';
import {
  drawMotif,
  getMotifNames,
  hasMotif,
  setMotifStyle,
  getMotifStyle,
  MOTIF_CATEGORIES
} from '../src/core/Motifs.js';
import {
  drawTocapuMotif,
  getMotifNames as getTocapuMotifNames,
  drawSteppedSpiral,
  drawCheckerboard,
  drawBrokenSymmetry,
  drawDiamond,
  drawChakana
} from '../src/core/TocapuMotifs.js';
import { drawSymbol, getSymbolNames, SYMBOL_POSITIONS } from '../src/core/Symbols.js';

describe('TocapuMotifs', () => {
  it('should have geometric motifs', () => {
    const motifs = getTocapuMotifNames();
    assert.ok(motifs.length >= 10, 'Should have at least 10 motifs');
    assert.ok(motifs.includes('steppedSpiral'));
    assert.ok(motifs.includes('checkerboard'));
    assert.ok(motifs.includes('diamond'));
    assert.ok(motifs.includes('chakana'));
  });

  it('should draw stepped spiral', () => {
    const glyph = new VisualGlyph({ id: 'TEST' });
    drawSteppedSpiral(glyph, 'inward', 16, 16);

    const binary = glyph.toBinary();
    const setPixels = binary.split('').filter(b => b === '1').length;
    assert.ok(setPixels > 50, 'Spiral should have significant pixel content');
  });

  it('should draw checkerboard', () => {
    const glyph = new VisualGlyph({ id: 'TEST' });
    drawCheckerboard(glyph, 4, 4, 4, 24);

    const binary = glyph.toBinary();
    const setPixels = binary.split('').filter(b => b === '1').length;
    // Checkerboard should have roughly half the cells filled
    assert.ok(setPixels > 100 && setPixels < 400, 'Checkerboard should have ~half pixels set');
  });

  it('should draw broken symmetry', () => {
    const glyph = new VisualGlyph({ id: 'TEST' });
    drawBrokenSymmetry(glyph, 'top-right', 16, 16);

    const binary = glyph.toBinary();
    const setPixels = binary.split('').filter(b => b === '1').length;
    assert.ok(setPixels > 50, 'Broken symmetry should have visible content');
  });

  it('should draw diamond', () => {
    const glyph = new VisualGlyph({ id: 'TEST' });
    drawDiamond(glyph, 0, 16, 16, 10);

    const binary = glyph.toBinary();
    const setPixels = binary.split('').filter(b => b === '1').length;
    assert.ok(setPixels > 100, 'Diamond should have significant content');
  });

  it('should draw chakana', () => {
    const glyph = new VisualGlyph({ id: 'TEST' });
    drawChakana(glyph, 16, 16, 12);

    const binary = glyph.toBinary();
    const setPixels = binary.split('').filter(b => b === '1').length;
    assert.ok(setPixels > 80, 'Chakana should have significant content');
  });

  it('should draw all tocapu motifs without error', () => {
    const motifs = getTocapuMotifNames();
    for (const motif of motifs) {
      const glyph = new VisualGlyph({ id: 'TEST' });
      const result = drawTocapuMotif(glyph, motif, 16, 16);
      assert.strictEqual(result, true, `Motif ${motif} should draw successfully`);
    }
  });
});

describe('Motifs (Dual Style)', () => {
  it('should support style switching', () => {
    setMotifStyle('geometric');
    assert.strictEqual(getMotifStyle(), 'geometric');

    setMotifStyle('representational');
    assert.strictEqual(getMotifStyle(), 'representational');

    // Reset to default
    setMotifStyle('geometric');
  });

  it('should draw different patterns for different styles', () => {
    const glyph1 = new VisualGlyph({ id: 'TEST1' });
    const glyph2 = new VisualGlyph({ id: 'TEST2' });

    drawMotif(glyph1, 'arms_up', 16, 16, { style: 'geometric' });
    drawMotif(glyph2, 'arms_up', 16, 16, { style: 'representational' });

    const binary1 = glyph1.toBinary();
    const binary2 = glyph2.toBinary();

    // They should be different
    assert.notStrictEqual(binary1, binary2, 'Different styles should produce different patterns');
  });

  it('should have all foundation poses in both styles', () => {
    const foundationPoses = ['arms_up', 'arms_down', 'distressed', 'action', 'standing'];

    for (const pose of foundationPoses) {
      assert.ok(hasMotif(pose), `Foundation pose ${pose} should exist`);

      // Test both styles
      const glyphGeo = new VisualGlyph({ id: 'TEST' });
      const result1 = drawMotif(glyphGeo, pose, 16, 16, { style: 'geometric' });
      assert.strictEqual(result1, true, `Pose ${pose} should work in geometric style`);

      const glyphRep = new VisualGlyph({ id: 'TEST' });
      const result2 = drawMotif(glyphRep, pose, 16, 16, { style: 'representational' });
      assert.strictEqual(result2, true, `Pose ${pose} should work in representational style`);
    }
  });

  it('should maintain backward compatibility with drawPose', async () => {
    // Import the backward-compatible function
    const { drawPose, getPoseNames } = await import('../src/core/Motifs.js');

    const glyph = new VisualGlyph({ id: 'TEST' });
    const result = drawPose(glyph, 'arms_up');
    assert.strictEqual(result, true, 'drawPose should still work');

    const poses = getPoseNames();
    assert.ok(poses.length >= 5, 'getPoseNames should return poses');
  });

  it('should have correct category mappings', () => {
    assert.strictEqual(MOTIF_CATEGORIES.arms_up, 'query');
    assert.strictEqual(MOTIF_CATEGORIES.arms_down, 'response');
    assert.strictEqual(MOTIF_CATEGORIES.distressed, 'error');
    assert.strictEqual(MOTIF_CATEGORIES.action, 'action');
    assert.strictEqual(MOTIF_CATEGORIES.standing, 'state');
  });
});

describe('Symbols (8x8 Geometric)', () => {
  it('should have expanded symbol set', () => {
    const symbols = getSymbolNames();
    assert.ok(symbols.length >= 20, 'Should have at least 20 symbols');
    assert.ok(symbols.includes('chakana'), 'Should include chakana symbol');
    assert.ok(symbols.includes('filter'), 'Should include filter symbol');
    assert.ok(symbols.includes('trash'), 'Should include trash symbol');
  });

  it('should have standard symbol positions', () => {
    assert.ok(SYMBOL_POSITIONS.topRight);
    assert.ok(SYMBOL_POSITIONS.topLeft);
    assert.ok(SYMBOL_POSITIONS.bottomRight);
    assert.ok(SYMBOL_POSITIONS.bottomLeft);
    assert.ok(SYMBOL_POSITIONS.center);

    assert.deepStrictEqual(SYMBOL_POSITIONS.topRight, { x: 24, y: 8 });
    assert.deepStrictEqual(SYMBOL_POSITIONS.center, { x: 16, y: 16 });
  });

  it('should draw all symbols without error', () => {
    const symbols = getSymbolNames();
    for (const symbol of symbols) {
      const glyph = new VisualGlyph({ id: 'TEST' });
      const result = drawSymbol(glyph, symbol, 16, 16);
      assert.strictEqual(result, true, `Symbol ${symbol} should draw successfully`);

      // Check it actually drew something
      const binary = glyph.toBinary();
      const setPixels = binary.split('').filter(b => b === '1').length;
      assert.ok(setPixels > 0, `Symbol ${symbol} should set pixels`);
    }
  });
});

describe('GlyphLibrary with Styles', () => {
  it('should support style setting', () => {
    const library = new GlyphLibrary();
    library.setStyle('geometric');
    assert.strictEqual(library.getStyle(), 'geometric');

    library.setStyle('representational');
    assert.strictEqual(library.getStyle(), 'representational');
  });

  it('should generate different glyphs for different styles', () => {
    const library = new GlyphLibrary().loadExtended();

    const glyph1 = library.get('Q01', { style: 'geometric' });
    const glyph2 = library.get('Q01', { style: 'representational' });

    const binary1 = glyph1.toBinary();
    const binary2 = glyph2.toBinary();

    assert.notStrictEqual(binary1, binary2, 'Different styles should produce different glyphs');
  });

  it('should calculate Hamming distance matrix', () => {
    const library = new GlyphLibrary().loadExtended();
    const result = library.hammingDistanceMatrix({
      ids: ['Q01', 'R01', 'E01', 'A01'],
      minDistance: 50
    });

    assert.ok(result.matrix, 'Should have matrix');
    assert.ok(result.pairs, 'Should have pairs');
    assert.ok(result.stats, 'Should have stats');
    assert.ok(result.validation, 'Should have validation');

    // Check stats
    assert.ok(result.stats.min > 0, 'Min distance should be > 0');
    assert.ok(result.stats.max > result.stats.min, 'Max should be > min');
    assert.strictEqual(result.stats.count, 6, 'Should have 6 pairs for 4 glyphs');

    // Check matrix structure
    assert.strictEqual(result.matrix.Q01.Q01, 0, 'Self-distance should be 0');
    assert.ok(result.matrix.Q01.R01 > 0, 'Different glyphs should have distance > 0');
  });
});

describe('Visual Distinctness', () => {
  it('should have minimum Hamming distance between foundation glyphs', () => {
    const library = new GlyphLibrary();
    const result = library.hammingDistanceMatrix({
      ids: ['Q01', 'R01', 'E01', 'A01'],
      minDistance: 80
    });

    // Foundation glyphs should be visually distinct
    assert.ok(
      result.stats.min >= 50,
      `Minimum distance ${result.stats.min} should be at least 50 bits`
    );

    if (!result.validation.passed) {
      console.log('Violations:', result.validation.violations);
    }
  });

  it('should have reasonable distance across extended glyphs', () => {
    const library = new GlyphLibrary().loadExtended();
    const result = library.hammingDistanceMatrix({ minDistance: 30 });

    // At least the minimum should be reasonable
    assert.ok(
      result.stats.min >= 10,
      `Minimum distance ${result.stats.min} should be at least 10 bits`
    );

    console.log(`Hamming distance stats: min=${result.stats.min}, max=${result.stats.max}, avg=${result.stats.avg.toFixed(1)}`);
  });

  it('should identify closest glyph pairs', () => {
    const library = new GlyphLibrary().loadExtended();
    const result = library.hammingDistanceMatrix();

    // Get the 5 closest pairs
    const closest = result.pairs.slice(0, 5);
    console.log('5 closest glyph pairs:');
    for (const pair of closest) {
      console.log(`  ${pair.id1} <-> ${pair.id2}: ${pair.distance} bits`);
    }

    // This is informational - helps identify glyphs that may need redesign
    assert.ok(closest.length > 0, 'Should have pairs');
  });
});

// Run tests
console.log('Running Visual System Tests...\n');

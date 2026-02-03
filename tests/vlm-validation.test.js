#!/usr/bin/env node

/**
 * VLM Validation Test Suite
 *
 * Tests for validating that Vision Language Models can reliably
 * interpret 32x32 1-bit glyphs. This is a CRITICAL dependency
 * for the entire Ayni protocol.
 *
 * Test Methodology:
 * 1. Generate test images at various resolutions (32x32, 64x64, 128x128)
 * 2. Export as different formats (PNG, data URL, base64)
 * 3. Measure Hamming distance between similar glyphs
 * 4. Create test prompts for VLM evaluation
 *
 * Manual Testing Required:
 * The actual VLM tests must be run manually by submitting
 * the generated images to GPT-4V, Claude Vision, Gemini, etc.
 */

import { Ayni, GlyphLibrary, savePNG, toDataURL, renderGrid } from '../src/index.js';
import fs from 'fs';

const OUTPUT_DIR = 'output/vlm-tests';

console.log('═══════════════════════════════════════════════════════════');
console.log('         VLM Validation Test Suite');
console.log('═══════════════════════════════════════════════════════════\n');

// Create output directory
fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.mkdirSync(`${OUTPUT_DIR}/32x32`, { recursive: true });
fs.mkdirSync(`${OUTPUT_DIR}/64x64`, { recursive: true });
fs.mkdirSync(`${OUTPUT_DIR}/128x128`, { recursive: true });
fs.mkdirSync(`${OUTPUT_DIR}/256x256`, { recursive: true });

const ayni = new Ayni();

// ============================================================================
// Test 1: Multi-Resolution Export
// ============================================================================

console.log('┌─────────────────────────────────────────────────────────┐');
console.log('│ Test 1: Multi-Resolution Export                        │');
console.log('└─────────────────────────────────────────────────────────┘\n');

const foundationGlyphs = ['Q01', 'R01', 'E01', 'A01'];
const scales = [1, 2, 4, 8]; // 32, 64, 128, 256 pixels

console.log('Generating glyphs at multiple resolutions...\n');

for (const id of foundationGlyphs) {
  const glyph = ayni.getGlyph(id);

  for (const scale of scales) {
    const size = 32 * scale;
    const dir = `${OUTPUT_DIR}/${size}x${size}`;
    savePNG(glyph, `${dir}/${id}.png`, { scale });
  }

  console.log(`  ${id}: exported at 32x32, 64x64, 128x128, 256x256`);
}

console.log('\n');

// ============================================================================
// Test 2: Hamming Distance Analysis
// ============================================================================

console.log('┌─────────────────────────────────────────────────────────┐');
console.log('│ Test 2: Hamming Distance Analysis                      │');
console.log('└─────────────────────────────────────────────────────────┘\n');

console.log('Hamming distance between glyphs (bits different out of 1024):\n');

const allIds = ayni.listGlyphs();
const distances = [];

// Calculate pairwise distances
for (let i = 0; i < allIds.length; i++) {
  for (let j = i + 1; j < allIds.length; j++) {
    const g1 = ayni.getGlyph(allIds[i]);
    const g2 = ayni.getGlyph(allIds[j]);
    const distance = g1.hammingDistance(g2);
    distances.push({ id1: allIds[i], id2: allIds[j], distance });
  }
}

// Sort by distance
distances.sort((a, b) => a.distance - b.distance);

// Show most similar pairs (potential confusion risk)
console.log('Most Similar Pairs (potential VLM confusion risk):');
console.log('─'.repeat(50));
for (let i = 0; i < Math.min(10, distances.length); i++) {
  const d = distances[i];
  const risk = d.distance < 100 ? '⚠️  HIGH RISK' : d.distance < 200 ? '⚡ Moderate' : '✓ OK';
  console.log(`  ${d.id1} ↔ ${d.id2}: ${d.distance} bits (${risk})`);
}

console.log('\nMost Different Pairs:');
console.log('─'.repeat(50));
for (let i = 0; i < Math.min(5, distances.length); i++) {
  const d = distances[distances.length - 1 - i];
  console.log(`  ${d.id1} ↔ ${d.id2}: ${d.distance} bits`);
}

// Statistics
const avgDistance = distances.reduce((sum, d) => sum + d.distance, 0) / distances.length;
const minDistance = distances[0].distance;
const maxDistance = distances[distances.length - 1].distance;

console.log('\nStatistics:');
console.log(`  Minimum distance: ${minDistance} bits`);
console.log(`  Maximum distance: ${maxDistance} bits`);
console.log(`  Average distance: ${avgDistance.toFixed(1)} bits`);
console.log(`  Safety threshold: 100 bits (recommended minimum)\n`);

// ============================================================================
// Test 3: VLM Test Prompts
// ============================================================================

console.log('┌─────────────────────────────────────────────────────────┐');
console.log('│ Test 3: VLM Test Prompts                               │');
console.log('└─────────────────────────────────────────────────────────┘\n');

const testPrompts = {
  identification: `
Look at this 32x32 pixel black and white image. It shows a simple visual glyph
used in the Ayni Protocol for AI agent communication.

The glyph contains:
1. A humanoid stick figure in a specific pose
2. A symbol overlay (database, checkmark, X, diamond, etc.)
3. A border frame

Based on the pose and symbol, identify which glyph this is:
- Q01 (Query): arms raised + database symbol
- R01 (Response): arms offering + checkmark
- E01 (Error): distressed pose + X symbol
- A01 (Action): running pose + diamond

What is your answer? Explain your reasoning.
  `.trim(),

  comparison: `
You are shown two 32x32 pixel glyphs from the Ayni Protocol.

1. Describe the pose of the humanoid figure in each glyph
2. Identify the symbol overlay in each glyph
3. Determine if these are the same glyph or different glyphs
4. Rate your confidence (low/medium/high)
  `.trim(),

  batch: `
I'm showing you 4 glyphs from the Ayni Protocol in a 2x2 grid.
These are the foundation glyphs: Q01, R01, E01, A01.

For each position (top-left, top-right, bottom-left, bottom-right):
1. Identify the glyph ID
2. Describe the pose
3. Describe the symbol
4. State the meaning

This tests whether you can reliably distinguish between different glyph types.
  `.trim()
};

// Save prompts to file
const promptsFile = `${OUTPUT_DIR}/vlm-test-prompts.md`;
let promptContent = '# VLM Test Prompts\n\n';
promptContent += 'Use these prompts to manually test VLM glyph recognition.\n\n';

for (const [name, prompt] of Object.entries(testPrompts)) {
  promptContent += `## ${name.charAt(0).toUpperCase() + name.slice(1)} Test\n\n`;
  promptContent += '```\n' + prompt + '\n```\n\n';
}

fs.writeFileSync(promptsFile, promptContent);
console.log(`Saved test prompts to ${promptsFile}\n`);

// ============================================================================
// Test 4: Generate Test Grid
// ============================================================================

console.log('┌─────────────────────────────────────────────────────────┐');
console.log('│ Test 4: Generate Test Grid                             │');
console.log('└─────────────────────────────────────────────────────────┘\n');

// Create grid of foundation glyphs
const foundationGrid = foundationGlyphs.map(id => ayni.getGlyph(id));
const gridBuffer = renderGrid(foundationGrid, { cols: 2, scale: 4, gap: 8 });
fs.writeFileSync(`${OUTPUT_DIR}/foundation-grid.png`, gridBuffer);
console.log(`Saved foundation glyph grid to ${OUTPUT_DIR}/foundation-grid.png`);

// Create grid of all glyphs
const allGlyphs = allIds.map(id => ayni.getGlyph(id));
const allGridBuffer = renderGrid(allGlyphs, { cols: 6, scale: 2, gap: 4 });
fs.writeFileSync(`${OUTPUT_DIR}/all-glyphs-grid.png`, allGridBuffer);
console.log(`Saved all glyphs grid to ${OUTPUT_DIR}/all-glyphs-grid.png\n`);

// ============================================================================
// Test 5: Data URL Export for Web Testing
// ============================================================================

console.log('┌─────────────────────────────────────────────────────────┐');
console.log('│ Test 5: Data URL Export                                │');
console.log('└─────────────────────────────────────────────────────────┘\n');

const dataUrls = {};
for (const id of foundationGlyphs) {
  const glyph = ayni.getGlyph(id);
  dataUrls[id] = toDataURL(glyph, { scale: 4 });
}

// Create HTML test page
const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>Ayni Protocol - VLM Test Page</title>
  <style>
    body { font-family: system-ui; max-width: 800px; margin: 0 auto; padding: 20px; }
    .glyph { display: inline-block; margin: 10px; text-align: center; }
    .glyph img { border: 1px solid #ccc; }
    .glyph p { margin: 5px 0; font-size: 14px; }
    h1 { border-bottom: 2px solid #333; padding-bottom: 10px; }
    .instructions { background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px; }
  </style>
</head>
<body>
  <h1>Ayni Protocol - VLM Validation Test</h1>

  <div class="instructions">
    <h3>Instructions:</h3>
    <ol>
      <li>Take a screenshot or save the images below</li>
      <li>Submit to GPT-4V, Claude Vision, or Gemini</li>
      <li>Use the prompts from vlm-test-prompts.md</li>
      <li>Record accuracy and confidence</li>
    </ol>
  </div>

  <h2>Foundation Glyphs (128x128)</h2>
  <div>
    ${foundationGlyphs.map(id => `
    <div class="glyph">
      <img src="${dataUrls[id]}" alt="${id}">
      <p><strong>${id}</strong></p>
      <p>${ayni.library.getSpec(id).meaning}</p>
    </div>
    `).join('')}
  </div>

  <h2>Test: Can you identify this glyph?</h2>
  <div class="glyph">
    <img src="${dataUrls.Q01}" alt="Unknown">
    <p>What glyph is this?</p>
  </div>

  <h2>ASCII Reference</h2>
  <pre>${foundationGlyphs.map(id =>
    `${id}: ${ayni.library.getSpec(id).meaning}\n${ayni.getGlyph(id).toASCII()}`
  ).join('\n')}</pre>
</body>
</html>`;

fs.writeFileSync(`${OUTPUT_DIR}/vlm-test.html`, htmlContent);
console.log(`Saved HTML test page to ${OUTPUT_DIR}/vlm-test.html\n`);

// ============================================================================
// Test 6: Resolution Comparison
// ============================================================================

console.log('┌─────────────────────────────────────────────────────────┐');
console.log('│ Test 6: Resolution Comparison                          │');
console.log('└─────────────────────────────────────────────────────────┘\n');

console.log('Image sizes for each resolution:');
console.log('─'.repeat(40));

for (const id of foundationGlyphs) {
  console.log(`\n${id}:`);
  for (const scale of scales) {
    const size = 32 * scale;
    const filepath = `${OUTPUT_DIR}/${size}x${size}/${id}.png`;
    const stats = fs.statSync(filepath);
    console.log(`  ${size}x${size}: ${stats.size} bytes`);
  }
}

console.log('\n');

// ============================================================================
// Test Results Template
// ============================================================================

console.log('┌─────────────────────────────────────────────────────────┐');
console.log('│ Manual Test Results Template                           │');
console.log('└─────────────────────────────────────────────────────────┘\n');

const resultsTemplate = `# VLM Test Results

## Test Configuration
- Date: ${new Date().toISOString().split('T')[0]}
- Resolution tested: [ ] 32x32 [ ] 64x64 [ ] 128x128 [ ] 256x256

## Model: GPT-4V (gpt-4-vision-preview)
### Identification Test
| Glyph | Correct? | Confidence | Notes |
|-------|----------|------------|-------|
| Q01   | [ ]      |            |       |
| R01   | [ ]      |            |       |
| E01   | [ ]      |            |       |
| A01   | [ ]      |            |       |

### Accuracy: ___/4 (__%)

## Model: Claude Vision
### Identification Test
| Glyph | Correct? | Confidence | Notes |
|-------|----------|------------|-------|
| Q01   | [ ]      |            |       |
| R01   | [ ]      |            |       |
| E01   | [ ]      |            |       |
| A01   | [ ]      |            |       |

### Accuracy: ___/4 (__%)

## Model: Gemini 2.5 Pro
### Identification Test
| Glyph | Correct? | Confidence | Notes |
|-------|----------|------------|-------|
| Q01   | [ ]      |            |       |
| R01   | [ ]      |            |       |
| E01   | [ ]      |            |       |
| A01   | [ ]      |            |       |

### Accuracy: ___/4 (__%)

## Summary
- Best performing model:
- Best performing resolution:
- Recommendation:
- Issues found:
`;

fs.writeFileSync(`${OUTPUT_DIR}/test-results-template.md`, resultsTemplate);
console.log(`Saved results template to ${OUTPUT_DIR}/test-results-template.md\n`);

// ============================================================================
// Summary
// ============================================================================

console.log('═══════════════════════════════════════════════════════════');
console.log('                 VLM Tests Generated');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('Generated files:');
console.log(`  ${OUTPUT_DIR}/`);
console.log('    ├── 32x32/         # Native resolution');
console.log('    ├── 64x64/         # 2x scale');
console.log('    ├── 128x128/       # 4x scale');
console.log('    ├── 256x256/       # 8x scale');
console.log('    ├── foundation-grid.png');
console.log('    ├── all-glyphs-grid.png');
console.log('    ├── vlm-test.html');
console.log('    ├── vlm-test-prompts.md');
console.log('    └── test-results-template.md\n');

console.log('Next Steps:');
console.log('  1. Open vlm-test.html in browser');
console.log('  2. Test with GPT-4V, Claude Vision, Gemini');
console.log('  3. Use prompts from vlm-test-prompts.md');
console.log('  4. Record results in test-results-template.md');
console.log('  5. Determine optimal resolution for VLM reliability\n');

console.log('Critical Threshold: 95% accuracy required for production use.\n');

// Return exit code based on Hamming distance check
if (minDistance < 100) {
  console.log('⚠️  WARNING: Some glyphs have low Hamming distance (<100 bits)');
  console.log('            VLM confusion is possible. Consider redesigning.\n');
  process.exit(1);
} else {
  console.log('✓ All glyphs have adequate visual distance (>100 bits)\n');
  process.exit(0);
}

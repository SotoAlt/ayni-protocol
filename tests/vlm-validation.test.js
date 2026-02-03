#!/usr/bin/env node

/**
 * VLM Validation Test Suite v2.0
 *
 * Tests for validating that Vision Language Models can reliably
 * interpret Ayni glyphs. Supports both:
 * - Backend: 32x32 glyphs (src/core/)
 * - Frontend: 16x16 Andean-inspired patterns (frontend/js/glyphs.js)
 *
 * Test Methodology:
 * 1. Generate test images at various resolutions
 * 2. Export as different formats (PNG, data URL)
 * 3. Measure Hamming distance between similar glyphs
 * 4. Create test prompts for VLM evaluation
 *
 * Manual Testing Required:
 * The actual VLM tests must be run manually by submitting
 * the generated images to GPT-4V, Claude Vision, Gemini, etc.
 */

import { Ayni, GlyphLibrary, savePNG, toDataURL, renderGrid } from '../src/index.js';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = 'output/vlm-tests';

console.log('═══════════════════════════════════════════════════════════');
console.log('         VLM Validation Test Suite v2.0');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('Testing both backend (32x32) and frontend (16x16) glyphs.\n');

// Create output directories
const dirs = [
  OUTPUT_DIR,
  `${OUTPUT_DIR}/backend-32x32`,
  `${OUTPUT_DIR}/backend-64x64`,
  `${OUTPUT_DIR}/backend-128x128`,
  `${OUTPUT_DIR}/backend-256x256`,
  `${OUTPUT_DIR}/frontend-16x16`,
  `${OUTPUT_DIR}/frontend-32x32`,
  `${OUTPUT_DIR}/frontend-64x64`,
  `${OUTPUT_DIR}/frontend-128x128`
];

for (const dir of dirs) {
  fs.mkdirSync(dir, { recursive: true });
}

const ayni = new Ayni();

// ============================================================================
// Test 1: Backend Glyphs (32x32) - Multi-Resolution Export
// ============================================================================

console.log('┌─────────────────────────────────────────────────────────┐');
console.log('│ Test 1: Backend Glyphs (32x32) Multi-Resolution Export  │');
console.log('└─────────────────────────────────────────────────────────┘\n');

const foundationGlyphs = ['Q01', 'R01', 'E01', 'A01'];
const backendScales = [1, 2, 4, 8]; // 32, 64, 128, 256 pixels

console.log('Generating backend glyphs at multiple resolutions...\n');

for (const id of foundationGlyphs) {
  const glyph = ayni.getGlyph(id);

  for (const scale of backendScales) {
    const size = 32 * scale;
    const dir = `${OUTPUT_DIR}/backend-${size}x${size}`;
    savePNG(glyph, `${dir}/${id}.png`, { scale });
  }

  console.log(`  ${id}: exported at 32x32, 64x64, 128x128, 256x256`);
}

console.log('\n');

// ============================================================================
// Test 2: Frontend Glyphs (16x16) - Generate from patterns
// ============================================================================

console.log('┌─────────────────────────────────────────────────────────┐');
console.log('│ Test 2: Frontend Glyphs (16x16) Pattern Export          │');
console.log('└─────────────────────────────────────────────────────────┘\n');

// Import frontend glyph patterns - these are in ES module format
// We'll recreate the patterns here for testing since we can't easily import browser JS

const SIZE = 16;

function createGrid(size = SIZE) {
  return Array(size).fill(null).map(() => Array(size).fill(0));
}

function fillRect(grid, x, y, w, h) {
  for (let py = y; py < y + h && py < SIZE; py++) {
    for (let px = x; px < x + w && px < SIZE; px++) {
      if (px >= 0 && py >= 0) grid[py][px] = 1;
    }
  }
}

// Recreate key frontend patterns for VLM testing
function makeHumanoid(pose) {
  const grid = createGrid();
  // HEAD
  fillRect(grid, 6, 1, 4, 3);
  // BODY
  fillRect(grid, 7, 4, 2, 5);

  if (pose === 'asking') {
    fillRect(grid, 3, 1, 2, 2);
    fillRect(grid, 11, 1, 2, 2);
    fillRect(grid, 5, 3, 2, 2);
    fillRect(grid, 9, 3, 2, 2);
  } else if (pose === 'giving') {
    fillRect(grid, 2, 5, 3, 2);
    fillRect(grid, 11, 5, 3, 2);
  } else {
    fillRect(grid, 4, 5, 2, 3);
    fillRect(grid, 10, 5, 2, 3);
  }

  // LEGS
  fillRect(grid, 5, 9, 2, 4);
  fillRect(grid, 9, 9, 2, 4);
  // FEET
  fillRect(grid, 4, 13, 3, 2);
  fillRect(grid, 9, 13, 3, 2);

  return grid;
}

function makeSymbol(type) {
  const grid = createGrid();

  if (type === 'database') {
    fillRect(grid, 3, 1, 10, 4);
    fillRect(grid, 3, 6, 10, 4);
    fillRect(grid, 3, 11, 10, 4);
    fillRect(grid, 5, 2, 6, 1);
    fillRect(grid, 5, 7, 6, 1);
    fillRect(grid, 5, 12, 6, 1);
  } else if (type === 'checkmark') {
    fillRect(grid, 2, 8, 2, 2);
    fillRect(grid, 4, 10, 2, 2);
    fillRect(grid, 6, 12, 2, 2);
    fillRect(grid, 8, 10, 2, 2);
    fillRect(grid, 10, 8, 2, 2);
    fillRect(grid, 12, 6, 2, 2);
    fillRect(grid, 14, 4, 2, 2);
  } else if (type === 'x') {
    fillRect(grid, 2, 2, 3, 3);
    fillRect(grid, 11, 2, 3, 3);
    fillRect(grid, 5, 5, 2, 2);
    fillRect(grid, 9, 5, 2, 2);
    fillRect(grid, 7, 7, 2, 2);
    fillRect(grid, 5, 9, 2, 2);
    fillRect(grid, 9, 9, 2, 2);
    fillRect(grid, 2, 11, 3, 3);
    fillRect(grid, 11, 11, 3, 3);
  } else if (type === 'robot') {
    fillRect(grid, 7, 0, 2, 2);
    fillRect(grid, 4, 2, 8, 5);
    fillRect(grid, 5, 3, 2, 2);
    fillRect(grid, 9, 3, 2, 2);
    fillRect(grid, 3, 7, 10, 5);
    fillRect(grid, 5, 9, 2, 2);
    fillRect(grid, 9, 9, 2, 2);
    fillRect(grid, 4, 12, 3, 3);
    fillRect(grid, 9, 12, 3, 3);
  }

  return grid;
}

const frontendPatterns = {
  'asking': makeHumanoid('asking'),
  'giving': makeHumanoid('giving'),
  'waiting': makeHumanoid('waiting'),
  'database': makeSymbol('database'),
  'checkmark': makeSymbol('checkmark'),
  'x': makeSymbol('x'),
  'robot': makeSymbol('robot')
};

// Generate PNG from 16x16 grid
function gridToPNG(grid, scale = 1) {
  // Check if canvas is available
  try {
    const { createCanvas } = await import('canvas');
    const size = SIZE * scale;
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#000000';

    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        if (grid[y][x]) {
          ctx.fillRect(x * scale, y * scale, scale, scale);
        }
      }
    }

    return canvas.toBuffer('image/png');
  } catch (e) {
    return null;
  }
}

// For systems without canvas, create ASCII representation
function gridToASCII(grid) {
  let result = '';
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      result += grid[y][x] ? '█' : '░';
    }
    result += '\n';
  }
  return result;
}

console.log('Generating frontend pattern ASCII representations...\n');

let asciiOutput = '# Frontend Glyph Patterns (16x16)\n\n';
asciiOutput += 'These are the Andean-inspired patterns used in the Glyph River UI.\n\n';

for (const [name, grid] of Object.entries(frontendPatterns)) {
  asciiOutput += `## ${name}\n\`\`\`\n${gridToASCII(grid)}\`\`\`\n\n`;
  console.log(`  ${name}: ASCII generated`);
}

fs.writeFileSync(`${OUTPUT_DIR}/frontend-patterns.md`, asciiOutput);
console.log(`\nSaved frontend patterns to ${OUTPUT_DIR}/frontend-patterns.md\n`);

// ============================================================================
// Test 3: Hamming Distance Analysis (Backend)
// ============================================================================

console.log('┌─────────────────────────────────────────────────────────┐');
console.log('│ Test 3: Hamming Distance Analysis                      │');
console.log('└─────────────────────────────────────────────────────────┘\n');

console.log('Hamming distance between backend glyphs (bits different out of 1024):\n');

const allIds = ayni.listGlyphs();
const distances = [];

for (let i = 0; i < allIds.length; i++) {
  for (let j = i + 1; j < allIds.length; j++) {
    const g1 = ayni.getGlyph(allIds[i]);
    const g2 = ayni.getGlyph(allIds[j]);
    const distance = g1.hammingDistance(g2);
    distances.push({ id1: allIds[i], id2: allIds[j], distance });
  }
}

distances.sort((a, b) => a.distance - b.distance);

console.log('Most Similar Pairs (potential VLM confusion risk):');
console.log('─'.repeat(50));
for (let i = 0; i < Math.min(10, distances.length); i++) {
  const d = distances[i];
  const risk = d.distance < 100 ? '⚠️  HIGH RISK' : d.distance < 200 ? '⚡ Moderate' : '✓ OK';
  console.log(`  ${d.id1} ↔ ${d.id2}: ${d.distance} bits (${risk})`);
}

const avgDistance = distances.reduce((sum, d) => sum + d.distance, 0) / distances.length;
const minDistance = distances[0].distance;
const maxDistance = distances[distances.length - 1].distance;

console.log('\nStatistics:');
console.log(`  Minimum distance: ${minDistance} bits`);
console.log(`  Maximum distance: ${maxDistance} bits`);
console.log(`  Average distance: ${avgDistance.toFixed(1)} bits`);
console.log(`  Safety threshold: 100 bits (recommended minimum)\n`);

// ============================================================================
// Test 4: Frontend Hamming Distance (16x16)
// ============================================================================

console.log('┌─────────────────────────────────────────────────────────┐');
console.log('│ Test 4: Frontend Pattern Distance Analysis (16x16)     │');
console.log('└─────────────────────────────────────────────────────────┘\n');

function hammingDistance16(grid1, grid2) {
  let distance = 0;
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (grid1[y][x] !== grid2[y][x]) distance++;
    }
  }
  return distance;
}

const frontendIds = Object.keys(frontendPatterns);
const frontendDistances = [];

for (let i = 0; i < frontendIds.length; i++) {
  for (let j = i + 1; j < frontendIds.length; j++) {
    const distance = hammingDistance16(
      frontendPatterns[frontendIds[i]],
      frontendPatterns[frontendIds[j]]
    );
    frontendDistances.push({ id1: frontendIds[i], id2: frontendIds[j], distance });
  }
}

frontendDistances.sort((a, b) => a.distance - b.distance);

console.log('Frontend pattern distances (bits different out of 256):');
console.log('─'.repeat(50));
for (const d of frontendDistances) {
  const risk = d.distance < 30 ? '⚠️  HIGH RISK' : d.distance < 60 ? '⚡ Moderate' : '✓ OK';
  console.log(`  ${d.id1} ↔ ${d.id2}: ${d.distance} bits (${risk})`);
}

const avgFrontend = frontendDistances.reduce((sum, d) => sum + d.distance, 0) / frontendDistances.length;
console.log(`\nAverage distance: ${avgFrontend.toFixed(1)} bits`);
console.log(`Safety threshold for 16x16: 30 bits (recommended minimum)\n`);

// ============================================================================
// Test 5: VLM Test Prompts
// ============================================================================

console.log('┌─────────────────────────────────────────────────────────┐');
console.log('│ Test 5: VLM Test Prompts                               │');
console.log('└─────────────────────────────────────────────────────────┘\n');

const testPrompts = {
  backend_identification: `
Look at this black and white pixel image. It shows a visual glyph
from the Ayni Protocol for AI agent communication.

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

  frontend_identification: `
Look at this 16x16 pixel image (or scaled version). It shows a chunky
visual pattern from the Ayni Protocol.

The pattern could be:
- A humanoid figure (asking, giving, waiting)
- A symbol (database, checkmark, X, clock, lock)
- A machine (robot, server, drone)
- A creature (bird, snake, spider)

Describe what you see and identify the pattern type.
  `.trim(),

  comparison: `
You are shown two pixel glyphs from the Ayni Protocol.

1. Describe the main elements of each glyph
2. Are these the same pattern or different patterns?
3. Rate your confidence (low/medium/high)
  `.trim(),

  batch: `
I'm showing you 4 glyphs in a 2x2 grid.

For each position (top-left, top-right, bottom-left, bottom-right):
1. Identify the pattern type (humanoid, symbol, machine, creature)
2. Describe the key visual elements
3. What semantic meaning does this convey?

This tests whether you can reliably distinguish between different glyph types.
  `.trim()
};

const promptsFile = `${OUTPUT_DIR}/vlm-test-prompts.md`;
let promptContent = '# VLM Test Prompts v2.0\n\n';
promptContent += 'Use these prompts to manually test VLM glyph recognition.\n';
promptContent += 'Test both backend (32x32) and frontend (16x16) patterns.\n\n';

for (const [name, prompt] of Object.entries(testPrompts)) {
  promptContent += `## ${name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} Test\n\n`;
  promptContent += '```\n' + prompt + '\n```\n\n';
}

fs.writeFileSync(promptsFile, promptContent);
console.log(`Saved test prompts to ${promptsFile}\n`);

// ============================================================================
// Test 6: Generate Test Grids
// ============================================================================

console.log('┌─────────────────────────────────────────────────────────┐');
console.log('│ Test 6: Generate Test Grids                            │');
console.log('└─────────────────────────────────────────────────────────┘\n');

// Backend grid
const foundationGrid = foundationGlyphs.map(id => ayni.getGlyph(id));
const gridBuffer = renderGrid(foundationGrid, { cols: 2, scale: 4, gap: 8 });
fs.writeFileSync(`${OUTPUT_DIR}/foundation-grid.png`, gridBuffer);
console.log(`Saved backend foundation grid to ${OUTPUT_DIR}/foundation-grid.png`);

// All backend glyphs grid
const allGlyphs = allIds.map(id => ayni.getGlyph(id));
const allGridBuffer = renderGrid(allGlyphs, { cols: 6, scale: 2, gap: 4 });
fs.writeFileSync(`${OUTPUT_DIR}/all-glyphs-grid.png`, allGridBuffer);
console.log(`Saved all backend glyphs grid to ${OUTPUT_DIR}/all-glyphs-grid.png\n`);

// ============================================================================
// Test 7: Resolution Comparison
// ============================================================================

console.log('┌─────────────────────────────────────────────────────────┐');
console.log('│ Test 7: Resolution Comparison                          │');
console.log('└─────────────────────────────────────────────────────────┘\n');

console.log('Backend image sizes for each resolution:');
console.log('─'.repeat(40));

for (const id of foundationGlyphs) {
  console.log(`\n${id}:`);
  for (const scale of backendScales) {
    const size = 32 * scale;
    const filepath = `${OUTPUT_DIR}/backend-${size}x${size}/${id}.png`;
    try {
      const stats = fs.statSync(filepath);
      console.log(`  ${size}x${size}: ${stats.size} bytes`);
    } catch (e) {
      console.log(`  ${size}x${size}: (file not found)`);
    }
  }
}

console.log('\n');

// ============================================================================
// Test Results Template
// ============================================================================

console.log('┌─────────────────────────────────────────────────────────┐');
console.log('│ Manual Test Results Template                           │');
console.log('└─────────────────────────────────────────────────────────┘\n');

const resultsTemplate = `# VLM Test Results v2.0

## Test Configuration
- Date: ${new Date().toISOString().split('T')[0]}
- Backend resolution tested: [ ] 32x32 [ ] 64x64 [ ] 128x128 [ ] 256x256
- Frontend resolution tested: [ ] 16x16 [ ] 32x32 [ ] 64x64 [ ] 128x128

## Backend Glyphs (32x32 base)

### Model: GPT-4V
| Glyph | Resolution | Correct? | Confidence | Notes |
|-------|------------|----------|------------|-------|
| Q01   | 128x128    | [ ]      |            |       |
| R01   | 128x128    | [ ]      |            |       |
| E01   | 128x128    | [ ]      |            |       |
| A01   | 128x128    | [ ]      |            |       |

### Model: Claude Vision
| Glyph | Resolution | Correct? | Confidence | Notes |
|-------|------------|----------|------------|-------|
| Q01   | 128x128    | [ ]      |            |       |
| R01   | 128x128    | [ ]      |            |       |
| E01   | 128x128    | [ ]      |            |       |
| A01   | 128x128    | [ ]      |            |       |

## Frontend Patterns (16x16 base)

### Model: GPT-4V
| Pattern   | Resolution | Identified As | Correct? | Notes |
|-----------|------------|---------------|----------|-------|
| asking    | 96x96 (6x) | [ ]           |          |       |
| giving    | 96x96 (6x) | [ ]           |          |       |
| database  | 96x96 (6x) | [ ]           |          |       |
| robot     | 96x96 (6x) | [ ]           |          |       |

### Model: Claude Vision
| Pattern   | Resolution | Identified As | Correct? | Notes |
|-----------|------------|---------------|----------|-------|
| asking    | 96x96 (6x) | [ ]           |          |       |
| giving    | 96x96 (6x) | [ ]           |          |       |
| database  | 96x96 (6x) | [ ]           |          |       |
| robot     | 96x96 (6x) | [ ]           |          |       |

## Summary
- Best performing model:
- Best performing resolution (backend):
- Best performing resolution (frontend):
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
console.log('    ├── backend-32x32/      # Native backend resolution');
console.log('    ├── backend-64x64/      # 2x scale');
console.log('    ├── backend-128x128/    # 4x scale');
console.log('    ├── backend-256x256/    # 8x scale');
console.log('    ├── frontend-16x16/     # Native frontend resolution');
console.log('    ├── frontend-32x32/     # 2x scale');
console.log('    ├── frontend-64x64/     # 4x scale');
console.log('    ├── frontend-128x128/   # 8x scale');
console.log('    ├── foundation-grid.png');
console.log('    ├── all-glyphs-grid.png');
console.log('    ├── frontend-patterns.md');
console.log('    ├── vlm-test-prompts.md');
console.log('    └── test-results-template.md\n');

console.log('Glyph Systems:');
console.log('  Backend:  32x32 (1024 bits, 128 bytes)');
console.log('  Frontend: 16x16 (256 bits, 32 bytes)\n');

console.log('Next Steps:');
console.log('  1. Test backend glyphs at 128x128 resolution');
console.log('  2. Test frontend patterns at 96x96 (6x scale)');
console.log('  3. Use prompts from vlm-test-prompts.md');
console.log('  4. Record results in test-results-template.md');
console.log('  5. Determine optimal resolution for VLM reliability\n');

console.log('Critical Threshold: 95% accuracy required for production use.\n');

// Return exit code based on Hamming distance check
if (minDistance < 100) {
  console.log('⚠️  WARNING: Some backend glyphs have low Hamming distance (<100 bits)');
  console.log('            VLM confusion is possible. Consider redesigning.\n');
  process.exit(1);
} else {
  console.log('✓ All backend glyphs have adequate visual distance (>100 bits)\n');
  process.exit(0);
}

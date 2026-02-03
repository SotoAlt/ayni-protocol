#!/usr/bin/env node

/**
 * Ayni Protocol Demo
 *
 * Demonstrates the refactored modular architecture with:
 * - Core glyph generation
 * - Encoder/Decoder protocol
 * - Agent communication
 * - Encryption support
 */

import { Ayni, Agent, GlyphLibrary, savePNG, renderGrid } from '../src/index.js';
import fs from 'fs';

console.log('═══════════════════════════════════════════════════════════');
console.log('            AYNI PROTOCOL v0.2.0 - Demo');
console.log('     Visual Glyphs for AI Agent Communication');
console.log('═══════════════════════════════════════════════════════════\n');

// ============================================================================
// Part 1: Basic Encoding/Decoding
// ============================================================================

console.log('┌─────────────────────────────────────────────────────────┐');
console.log('│ Part 1: Basic Encoding/Decoding                        │');
console.log('└─────────────────────────────────────────────────────────┘\n');

const ayni = new Ayni();

// Show available glyphs
console.log('Available Glyph Categories:');
const stats = ayni.stats();
for (const [category, count] of Object.entries(stats.categories)) {
  console.log(`  ${category}: ${count} glyphs`);
}
console.log(`  Total: ${stats.total} glyphs\n`);

// Encode a simple message
const queryMsg = ayni.encode({
  glyph: 'Q01',
  data: { table: 'users', filter: { active: true } }
});

console.log('Encoded Query Message:');
console.log(JSON.stringify(queryMsg, null, 2));

// Decode it back
const decoded = ayni.decode(queryMsg);
console.log('\nDecoded:');
console.log(`  Glyph: ${decoded.glyph}`);
console.log(`  Meaning: ${decoded.meaning}`);
console.log(`  Category: ${decoded.category}`);
console.log(`  Data: ${JSON.stringify(decoded.data)}`);
console.log(`  Human: ${ayni.toText(decoded)}\n`);

// ============================================================================
// Part 2: Natural Language to Glyph
// ============================================================================

console.log('┌─────────────────────────────────────────────────────────┐');
console.log('│ Part 2: Natural Language to Glyph                      │');
console.log('└─────────────────────────────────────────────────────────┘\n');

const textExamples = [
  'Query the database for active users',
  'Search for documents matching keyword',
  'The operation completed successfully',
  'Error: permission denied',
  'Request timed out after 30 seconds',
  'Processing your request...',
  'Payment required to continue'
];

console.log('Text → Glyph Mapping:\n');
for (const text of textExamples) {
  const match = ayni.findGlyph(text);
  if (match) {
    console.log(`  "${text.substring(0, 40)}..."`);
    console.log(`    → ${match.id}: ${match.spec.meaning} (score: ${match.score})\n`);
  }
}

// ============================================================================
// Part 3: Agent Communication
// ============================================================================

console.log('┌─────────────────────────────────────────────────────────┐');
console.log('│ Part 3: Agent Communication                            │');
console.log('└─────────────────────────────────────────────────────────┘\n');

// Create agents with shared encryption
const [alice, bob] = Agent.createPair('Alice', 'Bob');

console.log('Agents Created:');
console.log(`  ${alice.name} (encrypted: ${alice.encryptionKey !== null})`);
console.log(`  ${bob.name} (encrypted: ${bob.encryptionKey !== null})\n`);

// Simulate a conversation
console.log('Conversation:\n');

// Alice queries Bob
const q1 = alice.query('database', { table: 'users', limit: 10 }, bob);
console.log(`  ${alice.name} → ${bob.name}: Q01 (Query Database)`);
console.log(`    Data: ${JSON.stringify(q1.message.data).substring(0, 60)}...`);

// Bob receives and responds
const received1 = bob.receive(q1);
console.log(`  ${bob.name} received: ${received1.meaning}`);

const r1 = bob.respond('data', { users: ['user1', 'user2'], count: 2 }, alice);
console.log(`  ${bob.name} → ${alice.name}: R02 (Response with Data)`);

// Alice receives response
const received2 = alice.receive(r1);
console.log(`  ${alice.name} received: ${received2.meaning}\n`);

// Show stats
console.log('Communication Stats:');
console.log(`  ${alice.name}: sent=${alice.stats.messagesSent}, received=${alice.stats.messagesReceived}, bytes=${alice.stats.bytesSent + alice.stats.bytesReceived}`);
console.log(`  ${bob.name}: sent=${bob.stats.messagesSent}, received=${bob.stats.messagesReceived}, bytes=${bob.stats.bytesSent + bob.stats.bytesReceived}\n`);

// ============================================================================
// Part 4: Visual Rendering
// ============================================================================

console.log('┌─────────────────────────────────────────────────────────┐');
console.log('│ Part 4: Visual Rendering                               │');
console.log('└─────────────────────────────────────────────────────────┘\n');

// Display ASCII art for foundation glyphs
const foundationGlyphs = ['Q01', 'R01', 'E01', 'A01'];

console.log('Foundation Glyphs (ASCII):\n');
for (const id of foundationGlyphs) {
  const glyph = ayni.getGlyph(id);
  const spec = ayni.library.getSpec(id);
  console.log(`${id}: ${spec.meaning}`);
  console.log(glyph.toASCII());
}

// Save PNG files
const outputDir = 'output/protocol-demo';
fs.mkdirSync(outputDir, { recursive: true });

console.log(`Saving PNG files to ${outputDir}/...`);

for (const id of ayni.listGlyphs()) {
  const glyph = ayni.getGlyph(id);
  savePNG(glyph, `${outputDir}/${id}.png`, { scale: 4 });
}

console.log(`  Saved ${ayni.listGlyphs().length} glyph images\n`);

// Create a grid of all glyphs
const allGlyphs = ayni.listGlyphs().map(id => ayni.getGlyph(id));
const gridBuffer = renderGrid(allGlyphs, { cols: 6, scale: 2, gap: 4 });
fs.writeFileSync(`${outputDir}/all-glyphs-grid.png`, gridBuffer);
console.log(`  Saved glyph grid to ${outputDir}/all-glyphs-grid.png\n`);

// ============================================================================
// Part 5: Token Efficiency
// ============================================================================

console.log('┌─────────────────────────────────────────────────────────┐');
console.log('│ Part 5: Token Efficiency                               │');
console.log('└─────────────────────────────────────────────────────────┘\n');

// Compare glyph vs text
const comparisons = [
  { glyph: 'Q01', text: 'Query the database for information' },
  { glyph: 'R01', text: 'Operation completed successfully' },
  { glyph: 'E03', text: 'Error: Permission denied - access forbidden' },
  { glyph: 'S02', text: 'Currently processing your request, please wait' },
  { glyph: 'P01', text: 'Payment of 0.001 ETH has been sent to recipient' }
];

console.log('Glyph vs Text Comparison:\n');
console.log('  Glyph  | Text Length | Glyph Size | Savings');
console.log('  ────────────────────────────────────────────');

for (const { glyph, text } of comparisons) {
  const textBytes = Buffer.from(text).length;
  const glyphBytes = 3 + 128; // ID (3 bytes) + binary (128 bytes)
  const savings = ((textBytes - glyphBytes) / textBytes * 100).toFixed(0);
  const savingsStr = savings > 0 ? `${savings}%` : 'N/A';
  console.log(`  ${glyph.padEnd(5)} | ${String(textBytes).padStart(5)} bytes | ${String(glyphBytes).padStart(5)} bytes | ${savingsStr.padStart(4)}`);
}

console.log('\n  Note: Glyph encoding is most efficient for repeated messages');
console.log('        and multi-agent coordination patterns.\n');

// ============================================================================
// Part 6: Extended Library
// ============================================================================

console.log('┌─────────────────────────────────────────────────────────┐');
console.log('│ Part 6: Extended Glyph Library                         │');
console.log('└─────────────────────────────────────────────────────────┘\n');

console.log('All Available Glyphs:\n');

const categories = ['query', 'response', 'error', 'action', 'state', 'payment'];
for (const category of categories) {
  const glyphIds = ayni.glyphsByCategory(category);
  if (glyphIds.length > 0) {
    console.log(`  ${category.toUpperCase()}:`);
    for (const id of glyphIds) {
      const spec = ayni.library.getSpec(id);
      console.log(`    ${id}: ${spec.meaning}`);
    }
    console.log('');
  }
}

// ============================================================================
// Summary
// ============================================================================

console.log('═══════════════════════════════════════════════════════════');
console.log('                    Demo Complete!');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('Key Features Demonstrated:');
console.log('  - Modular architecture (core, protocol, rendering)');
console.log('  - 24 glyphs across 6 categories');
console.log('  - Natural language → glyph mapping');
console.log('  - Encrypted agent-to-agent communication');
console.log('  - PNG/SVG rendering');
console.log('  - Token efficiency analysis\n');

console.log('Next Steps:');
console.log('  - Run VLM validation: npm run vlm-test');
console.log('  - See examples/multi-agent.js for complex workflows');
console.log('  - Read docs/PROTOCOL.md for full specification\n');

console.log('Built with reciprocity. 🤝\n');

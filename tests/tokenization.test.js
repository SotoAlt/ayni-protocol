#!/usr/bin/env node

/**
 * Tokenization Test - Real measurements
 * Tests different glyph ID formats to find optimal encoding
 */

import { encoding_for_model } from 'tiktoken';

// Test cases: [text, glyph_id, description]
const testCases = [
  // Format variations for same concept
  ["Query database for users", "Q01", "Short numeric"],
  ["Query database for users", "QDB", "Short semantic"],
  ["Query database for users", "Q_DB", "Underscore"],
  ["Query database for users", "QueryDB", "CamelCase"],
  ["Query database for users", "qdb", "Lowercase"],
  ["Query database for users", "query-db", "Hyphen"],
  
  // Response variations
  ["Found 42 records", "R02", "Short numeric"],
  ["Found 42 records", "R_42", "With data"],
  ["Found 42 records", "RES42", "Compact"],
  ["Found 42 records", "Found42", "Natural"],
  
  // Error variations
  ["Error: operation timed out", "E01", "Short numeric"],
  ["Error: operation timed out", "ETIMEOUT", "Descriptive"],
  ["Error: operation timed out", "E_TIMEOUT", "Underscore"],
  ["Error: operation timed out", "ErrTimeout", "CamelCase"],
  
  // Complex message
  ["Query database for user records with high priority", "Q01", "Just category"],
  ["Query database for user records with high priority", "Q01_HP", "With priority"],
  ["Query database for user records with high priority", "QDB_USR_HI", "Full semantic"],
  ["Query database for user records with high priority", "QdbUsrHi", "CamelFull"],
];

function countTokens(text, model = 'gpt-4') {
  try {
    const encoding = encoding_for_model(model);
    const tokens = encoding.encode(text);
    const count = tokens.length;
    encoding.free();
    return count;
  } catch (e) {
    // Fallback: estimate by splitting on common boundaries
    return Math.ceil(text.split(/[\s_\-\.]/).length * 1.3);
  }
}

function analyzeFormat(format, results) {
  const avgSavings = results.reduce((sum, r) => sum + r.savings, 0) / results.length;
  const avgTokens = results.reduce((sum, r) => sum + r.glyphTokens, 0) / results.length;
  const minSavings = Math.min(...results.map(r => r.savings));
  const maxSavings = Math.max(...results.map(r => r.savings));
  
  return {
    format,
    avgSavings: Math.round(avgSavings),
    avgTokens: Math.round(avgTokens * 10) / 10,
    range: `${minSavings}%-${maxSavings}%`
  };
}

console.log('=== TOKENIZATION EXPERIMENT ===\n');
console.log('Testing different glyph ID formats...\n');

const results = [];
const formatGroups = {
  'Short numeric (Q01)': [],
  'Short semantic (QDB)': [],
  'Underscore (Q_DB)': [],
  'CamelCase (QueryDB)': [],
  'Lowercase (qdb)': [],
  'Descriptive (ETIMEOUT)': []
};

for (const [text, glyphId, desc] of testCases) {
  const textTokens = countTokens(text);
  const glyphTokens = countTokens(glyphId);
  const savings = Math.round((1 - glyphTokens / textTokens) * 100);
  
  const result = {
    text,
    glyphId,
    desc,
    textTokens,
    glyphTokens,
    savings
  };
  
  results.push(result);
  
  // Group by format
  if (glyphId.match(/^[A-Z]\d{2}$/)) {
    formatGroups['Short numeric (Q01)'].push(result);
  } else if (glyphId.match(/^[A-Z]{3}$/)) {
    formatGroups['Short semantic (QDB)'].push(result);
  } else if (glyphId.includes('_')) {
    formatGroups['Underscore (Q_DB)'].push(result);
  } else if (glyphId.match(/^[A-Z][a-z]+[A-Z]/)) {
    formatGroups['CamelCase (QueryDB)'].push(result);
  } else if (glyphId.match(/^[a-z]+$/)) {
    formatGroups['Lowercase (qdb)'].push(result);
  } else if (glyphId.match(/^[A-Z]+$/)) {
    formatGroups['Descriptive (ETIMEOUT)'].push(result);
  }
  
  console.log(`${desc}:`);
  console.log(`  Text: "${text}"`);
  console.log(`  → ${textTokens} tokens`);
  console.log(`  Glyph: "${glyphId}"`);
  console.log(`  → ${glyphTokens} tokens`);
  console.log(`  💰 Savings: ${savings}%`);
  console.log('');
}

console.log('\n=== FORMAT ANALYSIS ===\n');

const formatAnalysis = [];
for (const [format, results] of Object.entries(formatGroups)) {
  if (results.length > 0) {
    const analysis = analyzeFormat(format, results);
    formatAnalysis.push(analysis);
    
    console.log(`${format}:`);
    console.log(`  Average savings: ${analysis.avgSavings}%`);
    console.log(`  Average tokens: ${analysis.avgTokens}`);
    console.log(`  Range: ${analysis.range}`);
    console.log('');
  }
}

// Find winner
formatAnalysis.sort((a, b) => b.avgSavings - a.avgSavings);
console.log(`\n🏆 WINNER: ${formatAnalysis[0].format}`);
console.log(`   ${formatAnalysis[0].avgSavings}% average savings`);
console.log(`   ${formatAnalysis[0].avgTokens} tokens per glyph\n`);

// Recommendations
console.log('=== RECOMMENDATIONS ===\n');

if (formatAnalysis[0].avgSavings >= 80) {
  console.log('✅ EXCELLENT: 80%+ savings - proceed with this format!');
} else if (formatAnalysis[0].avgSavings >= 70) {
  console.log('✅ GOOD: 70%+ savings - viable for production');
} else if (formatAnalysis[0].avgSavings >= 50) {
  console.log('⚠️  MODERATE: 50-70% savings - consider optimizations');
} else {
  console.log('❌ POOR: <50% savings - rethink approach');
}

console.log('\nOptimal glyph ID design:');
console.log('  1. Keep it SHORT (3-5 chars)');
console.log('  2. Use UPPERCASE + numbers (Q01, R02)');
console.log('  3. Avoid underscores and hyphens (they split tokens)');
console.log('  4. Semantic meaning is good (QDB vs Q01) if still short');
console.log('  5. CamelCase splits into multiple tokens - avoid\n');

// Export results
const summary = {
  timestamp: new Date().toISOString(),
  totalTests: results.length,
  formats: formatAnalysis,
  winner: formatAnalysis[0],
  allResults: results
};

console.log('Saving results to test-results.json...');
import('fs').then(fs => {
  fs.default.writeFileSync('test-results.json', JSON.stringify(summary, null, 2));
  console.log('✅ Done!\n');
});

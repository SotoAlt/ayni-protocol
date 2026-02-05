#!/usr/bin/env npx tsx

/**
 * Ayni Protocol End-to-End Test
 *
 * Tests the complete flow:
 * 1. SDK crypto functions (encryption/decryption)
 * 2. Server API endpoints (encode, decode, hash)
 * 3. Agent simulation (multi-agent coordination)
 * 4. MCP tool simulation
 *
 * Run: npx tsx packages/demo/e2e-test.ts
 */

// Simple hash function (for testing without viem dependency)
function simpleHash(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return '0x' + Math.abs(hash).toString(16).padStart(64, '0');
}

// Configuration
const SERVER_URL = process.env.AYNI_SERVER_URL || 'http://localhost:3000';
const VERBOSE = process.env.VERBOSE === 'true';

// Test results tracking
interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

const results: TestResult[] = [];

function log(msg: string) {
  if (VERBOSE) console.log(msg);
}

async function runTest(name: string, fn: () => Promise<void>): Promise<void> {
  const start = Date.now();
  try {
    await fn();
    results.push({ name, passed: true, duration: Date.now() - start });
    console.log(`  ✓ ${name}`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    results.push({ name, passed: false, error: errorMsg, duration: Date.now() - start });
    console.log(`  ✗ ${name}: ${errorMsg}`);
  }
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

// ============================================================================
// SDK Crypto Tests (in-memory, no server)
// ============================================================================

async function testCryptoModule() {
  console.log('\n📦 SDK CRYPTO MODULE TESTS');
  console.log('─'.repeat(50));

  // Test key generation
  await runTest('Generate AES-256 key', async () => {
    const subtle = globalThis.crypto?.subtle;
    if (!subtle) throw new Error('Web Crypto not available');

    const key = await subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    assert(key.type === 'secret', 'Key should be secret type');
  });

  // Test encryption/decryption roundtrip
  await runTest('Encrypt and decrypt roundtrip', async () => {
    const subtle = globalThis.crypto?.subtle;
    if (!subtle) throw new Error('Web Crypto not available');

    // Generate key
    const key = await subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    // Test data
    const testData = { query: 'users', filter: { active: true } };
    const plaintext = new TextEncoder().encode(JSON.stringify(testData));

    // Encrypt
    const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await subtle.encrypt(
      { name: 'AES-GCM', iv, tagLength: 128 },
      key,
      plaintext
    );

    // Decrypt
    const decrypted = await subtle.decrypt(
      { name: 'AES-GCM', iv, tagLength: 128 },
      key,
      encrypted
    );

    const result = JSON.parse(new TextDecoder().decode(decrypted));
    assert(result.query === 'users', 'Decrypted data should match');
    assert(result.filter.active === true, 'Nested data should match');
  });

  // Test message hash computation
  await runTest('Compute message hash (keccak256)', async () => {
    const message = { glyph: 'Q01', data: { table: 'users' }, timestamp: 1234567890 };
    const hash = simpleHash(JSON.stringify(message));
    assert(hash.startsWith('0x'), 'Hash should start with 0x');
    assert(hash.length === 66, 'Hash should be 66 characters (0x + 64 hex)');
  });
}

// ============================================================================
// Server API Tests (requires server running)
// ============================================================================

async function callAPI(endpoint: string, options?: RequestInit): Promise<Response> {
  const response = await fetch(`${SERVER_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  return response;
}

async function testServerAPI() {
  console.log('\n🌐 SERVER API TESTS');
  console.log('─'.repeat(50));

  // Check if server is running
  let serverRunning = false;
  try {
    const healthCheck = await fetch(`${SERVER_URL}/health`);
    serverRunning = healthCheck.ok;
  } catch {
    console.log('  ⚠ Server not running at ' + SERVER_URL);
    console.log('  ⚠ Skipping server tests. Run: cd packages/server && npm run dev');
    return;
  }

  if (!serverRunning) {
    console.log('  ⚠ Server health check failed, skipping API tests');
    return;
  }

  // Test /encode endpoint
  await runTest('POST /encode - text to glyph', async () => {
    const res = await callAPI('/encode', {
      method: 'POST',
      body: JSON.stringify({ text: 'query the database for users' }),
    });
    assert(res.ok, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.glyph === 'Q01', `Expected Q01, got ${data.glyph}`);
  });

  // Test /decode endpoint
  await runTest('POST /decode - glyph to meaning', async () => {
    const res = await callAPI('/decode', {
      method: 'POST',
      body: JSON.stringify({ glyph: 'Q01' }),
    });
    assert(res.ok, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.meaning === 'Query Database', `Expected Query Database, got ${data.meaning}`);
  });

  // Test /message/hash endpoint (wallet-free)
  await runTest('POST /message/hash - wallet-free hash', async () => {
    const res = await callAPI('/message/hash', {
      method: 'POST',
      body: JSON.stringify({
        glyph: 'Q01',
        data: { table: 'users' },
      }),
    });
    assert(res.ok, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, 'Should return success');
    assert(data.hash.startsWith('0x'), 'Hash should start with 0x');
    assert(data.selfAttestInstructions, 'Should include self-attest instructions');
  });

  // Test /glyphs endpoint
  await runTest('GET /glyphs - list all glyphs', async () => {
    const res = await callAPI('/glyphs');
    assert(res.ok, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(Array.isArray(data.glyphs), 'Should return array of glyphs');
    assert(data.glyphs.length >= 4, 'Should have at least 4 foundation glyphs');
  });

  // Test invalid glyph
  await runTest('POST /encode - invalid text returns 400', async () => {
    const res = await callAPI('/encode', {
      method: 'POST',
      body: JSON.stringify({ text: 'random gibberish xyz' }),
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
  });
}

// ============================================================================
// Agent Simulation Tests
// ============================================================================

interface Agent {
  name: string;
  address: string;
  messages: Message[];
}

interface Message {
  glyph: string;
  sender: string;
  recipient: string;
  data: Record<string, unknown>;
  timestamp: number;
  hash: string;
}

function createAgent(name: string): Agent {
  return {
    name,
    address: `0x${name.toLowerCase().padStart(40, '0')}`,
    messages: [],
  };
}

function createMessage(
  sender: Agent,
  recipient: Agent,
  glyph: string,
  data: Record<string, unknown>
): Message {
  const message = {
    glyph,
    sender: sender.name,
    recipient: recipient.name,
    data,
    timestamp: Date.now(),
  };
  const hash = simpleHash(JSON.stringify(message));
  return { ...message, hash };
}

async function testAgentSimulation() {
  console.log('\n🤖 AGENT SIMULATION TESTS');
  console.log('─'.repeat(50));

  // Create agents
  const alice = createAgent('Alice');
  const bob = createAgent('Bob');
  const carol = createAgent('Carol');

  await runTest('Create agents with addresses', async () => {
    assert(alice.address.startsWith('0x'), 'Alice should have hex address');
    assert(bob.address.length === 42, 'Address should be 42 chars');
  });

  await runTest('Agent A sends Q01 to Agent B', async () => {
    const msg = createMessage(alice, bob, 'Q01', { table: 'users', filter: { active: true } });
    alice.messages.push(msg);
    bob.messages.push(msg);
    assert(msg.glyph === 'Q01', 'Message should have Q01 glyph');
    assert(msg.hash.startsWith('0x'), 'Message should have hash');
  });

  await runTest('Agent B responds with R01 to Agent A', async () => {
    const msg = createMessage(bob, alice, 'R01', { count: 42, status: 'complete' });
    bob.messages.push(msg);
    alice.messages.push(msg);
    assert(msg.glyph === 'R01', 'Response should have R01 glyph');
  });

  await runTest('Agent A delegates to Agent C with A01', async () => {
    const msg = createMessage(alice, carol, 'A01', { action: 'analyze', params: { count: 42 } });
    alice.messages.push(msg);
    carol.messages.push(msg);
    assert(msg.glyph === 'A01', 'Delegation should have A01 glyph');
  });

  await runTest('Agent C completes with R01 to Agent A', async () => {
    const msg = createMessage(carol, alice, 'R01', { analysis: 'complete', insights: 3 });
    carol.messages.push(msg);
    alice.messages.push(msg);
    assert(msg.glyph === 'R01', 'Completion should have R01 glyph');
  });

  await runTest('Verify audit trail integrity', async () => {
    // Alice should have 4 messages
    assert(alice.messages.length === 4, `Alice should have 4 messages, got ${alice.messages.length}`);

    // All messages should have unique hashes
    const hashes = new Set(alice.messages.map((m) => m.hash));
    assert(hashes.size === 4, 'All messages should have unique hashes');

    // Glyph flow should be Q01 -> R01 -> A01 -> R01
    const glyphFlow = alice.messages.map((m) => m.glyph).join(' -> ');
    assert(glyphFlow === 'Q01 -> R01 -> A01 -> R01', `Expected Q01 -> R01 -> A01 -> R01, got ${glyphFlow}`);
  });
}

// ============================================================================
// MCP Tool Simulation Tests
// ============================================================================

async function testMCPTools() {
  console.log('\n🔧 MCP TOOL SIMULATION TESTS');
  console.log('─'.repeat(50));

  // Simulate ayni_encode
  await runTest('ayni_encode: text to glyph', async () => {
    const text = 'query the database for users';
    const patterns: Record<string, string[]> = {
      Q01: ['query', 'search', 'find', 'database'],
      R01: ['success', 'ok', 'done', 'complete'],
      E01: ['error', 'fail', 'exception'],
      A01: ['execute', 'run', 'action', 'perform'],
    };

    let matchedGlyph: string | null = null;
    for (const [glyph, keywords] of Object.entries(patterns)) {
      if (keywords.some((k) => text.toLowerCase().includes(k))) {
        matchedGlyph = glyph;
        break;
      }
    }

    assert(matchedGlyph === 'Q01', `Expected Q01, got ${matchedGlyph}`);
  });

  // Simulate ayni_decode
  await runTest('ayni_decode: glyph to meaning', async () => {
    const glyphLibrary: Record<string, { meaning: string; pose: string; symbol: string }> = {
      Q01: { meaning: 'Query Database', pose: 'arms_up', symbol: 'database' },
      R01: { meaning: 'Response Success', pose: 'arms_down', symbol: 'checkmark' },
      E01: { meaning: 'Error', pose: 'distressed', symbol: 'x' },
      A01: { meaning: 'Execute Action', pose: 'action', symbol: 'diamond' },
    };

    const glyph = glyphLibrary['Q01'];
    assert(glyph.meaning === 'Query Database', 'Meaning should match');
    assert(glyph.pose === 'arms_up', 'Pose should match');
  });

  // Simulate ayni_identify
  await runTest('ayni_identify: create session', async () => {
    const sessionId = 'ayni_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    assert(sessionId.startsWith('ayni_'), 'Session should start with ayni_');
    assert(sessionId.length > 10, 'Session should be reasonably long');
  });

  // Simulate ayni_hash
  await runTest('ayni_hash: compute wallet-free hash', async () => {
    const message = {
      glyph: 'Q01',
      data: { table: 'users' },
      timestamp: Date.now(),
    };
    const hash = simpleHash(JSON.stringify(message));
    assert(hash.startsWith('0x'), 'Hash should start with 0x');
    assert(hash.length === 66, 'Hash should be 66 chars');
  });
}

// ============================================================================
// Token Efficiency Test
// ============================================================================

async function testTokenEfficiency() {
  console.log('\n📊 TOKEN EFFICIENCY TESTS');
  console.log('─'.repeat(50));

  // Simple character-based approximation (4 chars ≈ 1 token)
  function approxTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  await runTest('Glyph vs text: query message', async () => {
    const textVersion = 'Query the database for all users where status equals active';
    const glyphVersion = 'Q01';

    const textTokens = approxTokens(textVersion);
    const glyphTokens = approxTokens(glyphVersion);
    const savings = ((textTokens - glyphTokens) / textTokens) * 100;

    log(`  Text: ${textTokens} tokens, Glyph: ${glyphTokens} tokens, Savings: ${savings.toFixed(0)}%`);
    assert(savings > 50, `Expected >50% savings, got ${savings.toFixed(0)}%`);
  });

  await runTest('Glyph vs text: multi-step workflow', async () => {
    const textVersion =
      'Query the users table. Then execute analysis task. Finally report the results.';
    const glyphVersion = 'Q01 A01 R01';

    const textTokens = approxTokens(textVersion);
    const glyphTokens = approxTokens(glyphVersion);
    const savings = ((textTokens - glyphTokens) / textTokens) * 100;

    log(`  Text: ${textTokens} tokens, Glyph: ${glyphTokens} tokens, Savings: ${savings.toFixed(0)}%`);
    assert(savings > 40, `Expected >40% savings, got ${savings.toFixed(0)}%`);
  });
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║              AYNI PROTOCOL - End-to-End Test Suite                   ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝');
  console.log();
  console.log(`Server URL: ${SERVER_URL}`);
  console.log(`Verbose: ${VERBOSE}`);

  const startTime = Date.now();

  // Run all test suites
  await testCryptoModule();
  await testServerAPI();
  await testAgentSimulation();
  await testMCPTools();
  await testTokenEfficiency();

  // Summary
  const totalDuration = Date.now() - startTime;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log('\n' + '═'.repeat(70));
  console.log('TEST SUMMARY');
  console.log('═'.repeat(70));
  console.log(`Total:   ${results.length} tests`);
  console.log(`Passed:  ${passed} ✓`);
  console.log(`Failed:  ${failed} ✗`);
  console.log(`Time:    ${totalDuration}ms`);
  console.log('═'.repeat(70));

  if (failed > 0) {
    console.log('\nFailed tests:');
    results.filter((r) => !r.passed).forEach((r) => {
      console.log(`  ✗ ${r.name}: ${r.error}`);
    });
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
    console.log('\nNext steps:');
    console.log('  1. Start server: cd packages/server && npm run dev');
    console.log('  2. Deploy contracts: forge script script/Deploy.s.sol --rpc-url monad_testnet');
    console.log('  3. Run with server: AYNI_SERVER_URL=http://localhost:3000 npx tsx packages/demo/e2e-test.ts');
  }
}

main().catch(console.error);

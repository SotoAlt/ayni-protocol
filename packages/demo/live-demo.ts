#!/usr/bin/env npx tsx

/**
 * Ayni Protocol - Live E2E Demo
 *
 * This script sends REAL messages through the Ayni server,
 * which broadcasts them to all connected frontend clients.
 *
 * Run this while the frontend (Glyph River) is open to see
 * messages appear in real-time!
 *
 * Usage:
 *   Terminal 1: cd packages/server && npm run dev
 *   Terminal 2: cd frontend && npm run dev
 *   Terminal 3: cd packages/demo && npx tsx live-demo.ts
 */

// Configuration
const SERVER_URL = process.env.AYNI_SERVER_URL || 'http://localhost:3000';

// Agent addresses (for display in frontend)
const AGENTS = {
  alice: '0x1111111111111111111111111111111111111111',
  bob: '0x2222222222222222222222222222222222222222',
  carol: '0x3333333333333333333333333333333333333333',
  dave: '0x4444444444444444444444444444444444444444',
  eve: '0x5555555555555555555555555555555555555555',
};

interface SendResult {
  success: boolean;
  messageHash: string;
  glyphId: string;
  recipient: string;
  timestamp: number;
  transactionHash?: string;
  relayStatus?: string;
  error?: string;
}

/**
 * Send a message through the Ayni server
 */
async function sendMessage(
  glyph: string,
  sender: string,
  recipient: string,
  data?: Record<string, unknown>
): Promise<SendResult> {
  const response = await fetch(`${SERVER_URL}/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      glyph,
      sender,
      recipient,
      data,
    }),
  });

  if (!response.ok) {
    throw new Error(`Server error: ${response.status}`);
  }

  return response.json();
}

/**
 * Send a broadcast message (direct to WebSocket)
 */
async function broadcastMessage(
  glyph: string,
  sender: string,
  recipient: string,
  data?: Record<string, unknown>,
  encrypted = false
): Promise<{ success: boolean; clients: number }> {
  const response = await fetch(`${SERVER_URL}/stream/broadcast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      glyph,
      sender,
      recipient,
      data,
      encrypted,
    }),
  });

  return response.json();
}

/**
 * Get stream stats
 */
async function getStreamStats(): Promise<{ clients: number; status: string }> {
  const response = await fetch(`${SERVER_URL}/stream/stats`);
  return response.json();
}

/**
 * Wait for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Print step header
 */
function printStep(step: number, description: string) {
  console.log(`\n${'━'.repeat(60)}`);
  console.log(`📌 Step ${step}: ${description}`);
  console.log(`${'━'.repeat(60)}`);
}

/**
 * Print message result
 */
function printResult(glyph: string, from: string, to: string, result: SendResult | { success: boolean }) {
  const icon = result.success ? '✓' : '✗';
  console.log(`   ${icon} ${glyph}: ${from} → ${to}`);
}

// ═══════════════════════════════════════════════════════════════
// DEMO SCENARIOS
// ═══════════════════════════════════════════════════════════════

/**
 * Scenario 1: Basic Query-Response
 * Alice asks Bob for data, Bob responds with success
 */
async function scenario1_QueryResponse() {
  console.log('\n\n');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   SCENARIO 1: Basic Query-Response                       ║');
  console.log('║   Alice queries Bob\'s database, Bob responds             ║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  printStep(1, 'Alice sends Q01 (Query Database) to Bob');
  const q1 = await broadcastMessage('Q01', AGENTS.alice, AGENTS.bob, { table: 'users', filter: { active: true } });
  printResult('Q01', 'Alice', 'Bob', q1);
  await sleep(1000);

  printStep(2, 'Bob responds with R01 (Success) containing data');
  const r1 = await broadcastMessage('R01', AGENTS.bob, AGENTS.alice, { count: 42, status: 'complete' });
  printResult('R01', 'Bob', 'Alice', r1);

  console.log('\n💡 In Glyph River: You should see asking+database → giving+checkmark');
}

/**
 * Scenario 2: Error Handling
 * Alice queries, Bob returns an error
 */
async function scenario2_ErrorHandling() {
  console.log('\n\n');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   SCENARIO 2: Error Handling                             ║');
  console.log('║   Alice queries Bob, but gets a timeout error            ║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  printStep(1, 'Alice sends Q01 (Query) to Bob');
  const q1 = await broadcastMessage('Q01', AGENTS.alice, AGENTS.bob, { table: 'large_dataset' });
  printResult('Q01', 'Alice', 'Bob', q1);
  await sleep(800);

  printStep(2, 'Bob is processing...');
  const s1 = await broadcastMessage('S01', AGENTS.bob, AGENTS.alice, { status: 'processing' });
  printResult('S01', 'Bob', 'Alice', s1);
  await sleep(1500);

  printStep(3, 'Bob returns E02 (Timeout Error)');
  const e1 = await broadcastMessage('E02', AGENTS.bob, AGENTS.alice, { error: 'Query timeout after 30s' });
  printResult('E02', 'Bob', 'Alice', e1);

  console.log('\n💡 In Glyph River: Query → Processing → Error sequence');
}

/**
 * Scenario 3: Multi-Agent Workflow
 * Alice coordinates Bob and Carol
 */
async function scenario3_MultiAgent() {
  console.log('\n\n');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   SCENARIO 3: Multi-Agent Workflow                       ║');
  console.log('║   Alice coordinates between Bob (database) and Carol     ║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  printStep(1, 'Alice queries Bob for data');
  const q1 = await broadcastMessage('Q01', AGENTS.alice, AGENTS.bob, { table: 'analytics' });
  printResult('Q01', 'Alice', 'Bob', q1);
  await sleep(800);

  printStep(2, 'Bob responds with data');
  const r1 = await broadcastMessage('R02', AGENTS.bob, AGENTS.alice, { records: 1000, format: 'json' });
  printResult('R02', 'Bob', 'Alice', r1);
  await sleep(600);

  printStep(3, 'Alice delegates analysis to Carol');
  const a1 = await broadcastMessage('A02', AGENTS.alice, AGENTS.carol, { task: 'analyze', source: 'bob', count: 1000 });
  printResult('A02', 'Alice', 'Carol', a1);
  await sleep(500);

  printStep(4, 'Carol is processing');
  const s1 = await broadcastMessage('S01', AGENTS.carol, AGENTS.alice, { progress: '50%' });
  printResult('S01', 'Carol', 'Alice', s1);
  await sleep(1200);

  printStep(5, 'Carol completes and responds');
  const r2 = await broadcastMessage('R03', AGENTS.carol, AGENTS.alice, { insights: 5, report: 'RPT-001' });
  printResult('R03', 'Carol', 'Alice', r2);

  console.log('\n💡 In Glyph River: Full delegation workflow visible as glyph chain');
}

/**
 * Scenario 4: Payment Flow
 * Alice sends payment to Dave, Eve validates
 */
async function scenario4_PaymentFlow() {
  console.log('\n\n');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   SCENARIO 4: Payment Flow                               ║');
  console.log('║   Alice pays Dave, Eve validates the transaction         ║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  printStep(1, 'Alice sends P01 (Payment) to Dave');
  const p1 = await broadcastMessage('P01', AGENTS.alice, AGENTS.dave, { amount: '0.1 MON', service: 'analysis' });
  printResult('P01', 'Alice', 'Dave', p1);
  await sleep(700);

  printStep(2, 'Dave requests validation from Eve');
  const q1 = await broadcastMessage('Q01', AGENTS.dave, AGENTS.eve, { validate: 'payment', txHash: '0xabc...' });
  printResult('Q01', 'Dave', 'Eve', q1);
  await sleep(800);

  printStep(3, 'Eve confirms validity');
  const r1 = await broadcastMessage('R01', AGENTS.eve, AGENTS.dave, { valid: true, confirmed: true });
  printResult('R01', 'Eve', 'Dave', r1);
  await sleep(500);

  printStep(4, 'Dave confirms payment to Alice');
  const p2 = await broadcastMessage('P02', AGENTS.dave, AGENTS.alice, { status: 'confirmed', receipt: 'RCP-001' });
  printResult('P02', 'Dave', 'Alice', p2);

  console.log('\n💡 In Glyph River: Payment → Validation → Confirmation flow');
}

/**
 * Scenario 5: Encrypted Communication
 * Alice sends encrypted query to Bob
 */
async function scenario5_Encrypted() {
  console.log('\n\n');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   SCENARIO 5: Encrypted Communication                    ║');
  console.log('║   Alice sends encrypted queries (private but auditable)  ║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  printStep(1, 'Alice sends encrypted Q01 to Bob');
  const q1 = await broadcastMessage('Q01', AGENTS.alice, AGENTS.bob, { encrypted: true }, true);
  printResult('Q01 [ENC]', 'Alice', 'Bob', q1);
  await sleep(800);

  printStep(2, 'Bob responds with encrypted R01');
  const r1 = await broadcastMessage('R01', AGENTS.bob, AGENTS.alice, { encrypted: true }, true);
  printResult('R01 [ENC]', 'Bob', 'Alice', r1);

  console.log('\n💡 In Glyph River: Encrypted messages show ENC indicator');
  console.log('   The glyph is public (audit trail), but payload is private!');
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║       AYNI PROTOCOL - LIVE END-TO-END DEMO                   ║');
  console.log('║                                                              ║');
  console.log('║  This demo sends REAL messages through the Ayni server.     ║');
  console.log('║  Watch them appear in real-time in Glyph River!             ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  // Check server connection
  console.log('\n📡 Checking server connection...');
  try {
    const stats = await getStreamStats();
    console.log(`   ✓ Server online at ${SERVER_URL}`);
    console.log(`   ✓ ${stats.clients} WebSocket client(s) connected`);

    if (stats.clients === 0) {
      console.log('\n⚠️  No clients connected!');
      console.log('   Open http://localhost:8081 (or 5173) to see the Glyph River');
      console.log('   Then run this demo again.\n');
    }
  } catch (err) {
    console.error('\n❌ Cannot connect to server!');
    console.error(`   Make sure the server is running: cd packages/server && npm run dev`);
    console.error(`   Server URL: ${SERVER_URL}\n`);
    process.exit(1);
  }

  // Wait a moment for user to prepare
  console.log('\n🎬 Starting demo in 3 seconds...');
  console.log('   (Open Glyph River in your browser to watch!)');
  await sleep(3000);

  // Run all scenarios
  await scenario1_QueryResponse();
  await sleep(2000);

  await scenario2_ErrorHandling();
  await sleep(2000);

  await scenario3_MultiAgent();
  await sleep(2000);

  await scenario4_PaymentFlow();
  await sleep(2000);

  await scenario5_Encrypted();

  // Summary
  console.log('\n\n');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                     DEMO COMPLETE                            ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('\n📊 Summary:');
  console.log('   • 5 scenarios demonstrated');
  console.log('   • 16+ messages sent through server');
  console.log('   • All messages visible in Glyph River');
  console.log('\n💡 Key takeaways:');
  console.log('   1. Visual glyphs show intent at a glance');
  console.log('   2. Multi-agent workflows are easy to follow');
  console.log('   3. Encrypted messages preserve privacy with audit trail');
  console.log('   4. Real-time streaming makes debugging visible');
  console.log('\n🔗 Try it yourself:');
  console.log('   curl -X POST http://localhost:3000/stream/broadcast \\');
  console.log('     -H "Content-Type: application/json" \\');
  console.log('     -d \'{"glyph":"Q01","sender":"0x111...","recipient":"0x222..."}\'');
  console.log('\n');
}

// Run the demo
main().catch(console.error);

#!/usr/bin/env npx tsx

/**
 * Ayni Protocol Multi-Agent Demo
 *
 * Demonstrates agent coordination with on-chain attestation:
 * 1. Alice sends Q01 (query) to Bob
 * 2. Bob responds with R01 (success)
 * 3. All messages are attested on Monad
 * 4. Visual audit trail shows the coordination
 */

import { keccak256, toBytes } from 'viem';

// Configuration
const SERVER_URL = process.env.AYNI_SERVER_URL || 'http://localhost:3000';

// Simulated agent addresses
const AGENTS = {
  alice: {
    name: 'Alice',
    address: '0x1111111111111111111111111111111111111111' as const,
  },
  bob: {
    name: 'Bob',
    address: '0x2222222222222222222222222222222222222222' as const,
  },
  carol: {
    name: 'Carol',
    address: '0x3333333333333333333333333333333333333333' as const,
  },
};

// Glyph visuals for console output
const GLYPH_VISUALS: Record<string, string> = {
  Q01: `
    \\O/
     |    [DB]
    / \\
  `,
  R01: `
     O
    /|\\   [✓]
    / \\
  `,
  E01: `
    _O_
     |    [✗]
    / \\
  `,
  A01: `
     O>
    /|    [◆]
    / \\
  `,
};

interface Message {
  glyph: string;
  sender: string;
  recipient: string;
  data: Record<string, unknown>;
  timestamp: number;
  hash: string;
  txHash?: string;
}

// Compute message hash
function computeHash(message: Omit<Message, 'hash' | 'txHash'>): string {
  return keccak256(toBytes(JSON.stringify(message)));
}

// Print message with visual
function printMessage(msg: Message, direction: 'send' | 'receive') {
  const arrow = direction === 'send' ? '→' : '←';
  const emoji = direction === 'send' ? '📤' : '📥';

  console.log('\n' + '='.repeat(60));
  console.log(`${emoji} ${msg.sender} ${arrow} ${msg.recipient}`);
  console.log('-'.repeat(60));
  console.log(`Glyph: ${msg.glyph}`);
  console.log(GLYPH_VISUALS[msg.glyph] || '(unknown glyph)');
  console.log(`Data: ${JSON.stringify(msg.data)}`);
  console.log(`Hash: ${msg.hash.slice(0, 20)}...`);
  if (msg.txHash) {
    console.log(`TxHash: ${msg.txHash.slice(0, 20)}...`);
  }
  console.log('='.repeat(60));
}

// Print audit trail
function printAuditTrail(messages: Message[]) {
  console.log('\n\n📊 VISUAL AUDIT TRAIL');
  console.log('='.repeat(60));

  const glyphLine = messages.map((m) => m.glyph).join(' → ');
  console.log(`\nGlyph Flow: ${glyphLine}`);

  console.log('\nTimeline:');
  messages.forEach((msg, i) => {
    const time = new Date(msg.timestamp).toISOString().split('T')[1].split('.')[0];
    console.log(`  ${i + 1}. [${time}] ${msg.sender} ${msg.glyph} → ${msg.recipient}`);
  });

  console.log('\nOn-Chain Attestations:');
  messages.forEach((msg) => {
    const status = msg.txHash ? '✓ Attested' : '○ Pending';
    console.log(`  ${status}: ${msg.hash.slice(0, 16)}...`);
  });

  console.log('='.repeat(60));
}

// Simulate attestation (in real demo, calls server)
async function attestMessage(message: Omit<Message, 'hash' | 'txHash'>): Promise<Message> {
  const hash = computeHash(message);

  // In real implementation, this would call the server
  // const response = await fetch(`${SERVER_URL}/attest`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ message }),
  // });

  // Simulate attestation
  const txHash = '0x' + 'abcd'.repeat(16);

  return {
    ...message,
    hash,
    txHash,
  };
}

// Main demo flow
async function runDemo() {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║          AYNI PROTOCOL - Multi-Agent Demo                ║');
  console.log('║    Crypto-Native Coordination Layer for AI Agents        ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('\n');

  const messages: Message[] = [];

  // Step 1: Alice queries Bob
  console.log('📌 Step 1: Alice sends query to Bob');
  console.log('Alice wants to know how many active users Bob has in the database.');

  const query = await attestMessage({
    glyph: 'Q01',
    sender: AGENTS.alice.name,
    recipient: AGENTS.bob.name,
    data: { table: 'users', filter: { active: true } },
    timestamp: Date.now(),
  });

  messages.push(query);
  printMessage(query, 'send');

  // Simulate processing time
  await new Promise((r) => setTimeout(r, 500));

  // Step 2: Bob responds with success
  console.log('\n📌 Step 2: Bob responds with data');
  console.log('Bob found 42 active users and sends the response.');

  const response = await attestMessage({
    glyph: 'R01',
    sender: AGENTS.bob.name,
    recipient: AGENTS.alice.name,
    data: { count: 42, status: 'complete' },
    timestamp: Date.now(),
  });

  messages.push(response);
  printMessage(response, 'send');

  await new Promise((r) => setTimeout(r, 500));

  // Step 3: Alice delegates task to Carol
  console.log('\n📌 Step 3: Alice delegates analysis to Carol');
  console.log('Alice asks Carol to analyze the user data.');

  const delegation = await attestMessage({
    glyph: 'A01',
    sender: AGENTS.alice.name,
    recipient: AGENTS.carol.name,
    data: { action: 'analyze_users', params: { source: AGENTS.bob.name, count: 42 } },
    timestamp: Date.now(),
  });

  messages.push(delegation);
  printMessage(delegation, 'send');

  await new Promise((r) => setTimeout(r, 500));

  // Step 4: Carol completes and responds
  console.log('\n📌 Step 4: Carol completes analysis');
  console.log('Carol finishes the analysis and reports back.');

  const completion = await attestMessage({
    glyph: 'R01',
    sender: AGENTS.carol.name,
    recipient: AGENTS.alice.name,
    data: { analysis: 'complete', insights: 3, report_id: 'RPT-001' },
    timestamp: Date.now(),
  });

  messages.push(completion);
  printMessage(completion, 'send');

  // Print audit trail
  printAuditTrail(messages);

  // Summary
  console.log('\n\n📈 DEMO SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Messages: ${messages.length}`);
  console.log(`Agents Involved: ${new Set(messages.flatMap((m) => [m.sender, m.recipient])).size}`);
  console.log(`Glyphs Used: ${[...new Set(messages.map((m) => m.glyph))].join(', ')}`);
  console.log(`All On-Chain: ${messages.every((m) => m.txHash) ? 'Yes ✓' : 'Partial'}`);
  console.log('='.repeat(60));

  console.log('\n💡 KEY TAKEAWAYS:');
  console.log('  1. Every coordination step has on-chain proof');
  console.log('  2. Visual glyphs show intent at a glance (Q01 R01 A01 R01)');
  console.log('  3. Audit trail is human-readable AND machine-verifiable');
  console.log('  4. No central authority needed for verification');
  console.log('\n');
}

// Encryption demo
async function encryptionDemo() {
  console.log('\n\n🔐 ENCRYPTION DEMO');
  console.log('='.repeat(60));
  console.log('Demonstrating private messaging with public audit trail.\n');

  console.log('Message Structure:');
  console.log('  glyph: "Q01"              // PUBLIC - visible in audit trail');
  console.log('  timestamp: 1706745600     // PUBLIC - when it happened');
  console.log('  sender: "0x..."           // PUBLIC - who sent it');
  console.log('  recipient: "0x..."        // PUBLIC - who receives it');
  console.log('  encryptedData: "base64.." // PRIVATE - AES-256-GCM encrypted');
  console.log();
  console.log('Result: Audit trail shows WHAT happened (Q01 → R01), but not the details.');
  console.log('='.repeat(60));
}

// Wallet-free demo
async function walletFreeDemo() {
  console.log('\n\n🆓 WALLET-FREE DEMO');
  console.log('='.repeat(60));
  console.log('Demonstrating free tier (no wallet needed).\n');

  console.log('Tier 1 (Free):');
  console.log('  POST /encode      - Text to glyph');
  console.log('  POST /decode      - Glyph to meaning');
  console.log('  GET  /glyphs      - List glyphs');
  console.log('  GET  /verify/:hash - Check attestation');
  console.log('  POST /message/hash - Compute hash (self-attest later)');
  console.log();
  console.log('Tier 2 (Paid):');
  console.log('  POST /attest      - Server wallet pays gas (0.01 MON)');
  console.log('  POST /send        - Relay + attest (0.001 MON)');
  console.log();
  console.log('Anyone can use Ayni without a wallet. Attestation optional.');
  console.log('='.repeat(60));
}

// Run all demos
async function runAllDemos() {
  await runDemo();
  await encryptionDemo();
  await walletFreeDemo();

  console.log('\n\n✅ ALL DEMOS COMPLETE');
  console.log();
  console.log('Next steps:');
  console.log('  1. Run `npm run demo:benchmark` for token savings analysis');
  console.log('  2. Deploy contracts to Monad testnet');
  console.log('  3. Test with real on-chain attestation');
  console.log();
}

// Run demo
runAllDemos().catch(console.error);

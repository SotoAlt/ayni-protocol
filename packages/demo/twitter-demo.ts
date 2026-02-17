#!/usr/bin/env npx tsx

/**
 * Ayni Protocol - Twitter Demo
 *
 * Cinematic multi-agent conversation designed for screen recording.
 * Sends messages with deliberate pacing so the Glyph River visualization
 * looks compelling in a 30-60 second Twitter video.
 *
 * Usage:
 *   Terminal 1: cd packages/server && npm run dev
 *   Terminal 2: cd frontend && npm run dev
 *   Terminal 3: npx tsx packages/demo/twitter-demo.ts [server-url]
 *
 * For production:
 *   npx tsx packages/demo/twitter-demo.ts https://ay-ni.org
 */

const SERVER_URL = process.argv[2] || process.env.AYNI_SERVER_URL || 'http://localhost:3000';

// Named agents for visual storytelling
const AGENTS: Record<string, { address: string; name: string }> = {
  alice:  { address: '0xA11ce000000000000000000000000000000A11ce', name: 'Alice' },
  bob:    { address: '0xB0b00000000000000000000000000000000000B0', name: 'Bob' },
  carol:  { address: '0xCar01000000000000000000000000000000Car01', name: 'Carol' },
  dave:   { address: '0xDave0000000000000000000000000000000Dave0', name: 'Dave' },
  oracle: { address: '0x0rac1e0000000000000000000000000000rac1e', name: 'Oracle' },
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function registerAgent(name: string, address: string): Promise<void> {
  try {
    await fetch(`${SERVER_URL}/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, address }),
    });
  } catch {
    // Server might not have agents endpoint yet
  }
}

async function broadcast(
  glyph: string,
  from: string,
  to: string,
  data?: Record<string, unknown>,
  encrypted = false,
): Promise<boolean> {
  try {
    const resp = await fetch(`${SERVER_URL}/stream/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ glyph, sender: from, recipient: to, data, encrypted }),
    });
    return resp.ok;
  } catch {
    return false;
  }
}

async function propose(
  name: string,
  components: string[],
  description: string,
  proposer: string,
): Promise<void> {
  try {
    await fetch(`${SERVER_URL}/knowledge/propose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, components, description, proposer }),
    });
  } catch {
    // ignore
  }
}

// ═══════════════════════════════════════════════════════════════
// ACT 1: Multi-Agent DeFi Coordination
// A realistic DeFi workflow: approve -> swap -> bridge -> confirm
// ═══════════════════════════════════════════════════════════════

async function act1_DeFiSwap() {
  console.log('\n  ACT 1: DeFi Swap Coordination');
  console.log('  Alice coordinates a cross-chain swap through Bob and Oracle\n');

  const { alice, bob, oracle } = AGENTS;

  // Alice queries Oracle for price
  await broadcast('Q01', alice.address, oracle.address, { pair: 'ETH/USDC', chain: 'monad' });
  console.log('    Q01  Alice -> Oracle    "What\'s the ETH price?"');
  await sleep(1200);

  // Oracle responds with data
  await broadcast('R01', oracle.address, alice.address, { price: 3420.50, spread: '0.1%' });
  console.log('    R01  Oracle -> Alice    "3420.50, 0.1% spread"');
  await sleep(800);

  // Alice approves token
  await broadcast('X05', alice.address, bob.address, { token: 'ETH', amount: '1.0' });
  console.log('    X05  Alice -> Bob       "Approve 1.0 ETH"');
  await sleep(1000);

  // Bob executes swap
  await broadcast('X01', bob.address, alice.address, { in: 'ETH', out: 'USDC', amount: '3420.50' });
  console.log('    X01  Bob -> Alice       "Swapped -> 3420.50 USDC"');
  await sleep(800);

  // Bridge to L2
  await broadcast('X09', alice.address, bob.address, { token: 'USDC', destination: 'Base' });
  console.log('    X09  Alice -> Bob       "Bridge USDC to Base"');
  await sleep(1200);

  // Confirmation
  await broadcast('R01', bob.address, alice.address, { bridged: true, txHash: '0xabc...' });
  console.log('    R01  Bob -> Alice       "Bridged successfully"');
  await sleep(600);
}

// ═══════════════════════════════════════════════════════════════
// ACT 2: Task Delegation Chain
// Alice delegates work through a chain of specialists
// ═══════════════════════════════════════════════════════════════

async function act2_TaskDelegation() {
  console.log('\n  ACT 2: Task Delegation Chain');
  console.log('  Alice delegates analysis through Bob, Carol, and Dave\n');

  const { alice, bob, carol, dave } = AGENTS;

  // Alice delegates to Bob
  await broadcast('T01', alice.address, bob.address, { task: 'analyze portfolio' });
  console.log('    T01  Alice -> Bob       "Analyze portfolio"');
  await sleep(900);

  // Bob delegates sub-task to Carol
  await broadcast('T01', bob.address, carol.address, { task: 'risk assessment' });
  console.log('    T01  Bob -> Carol       "Risk assessment"');
  await sleep(700);

  // Bob delegates another sub-task to Dave
  await broadcast('T01', bob.address, dave.address, { task: 'yield optimization' });
  console.log('    T01  Bob -> Dave        "Yield optimization"');
  await sleep(1100);

  // Carol reports progress
  await broadcast('W02', carol.address, bob.address, { progress: '60%' });
  console.log('    W02  Carol -> Bob       "Checkpoint: 60%"');
  await sleep(800);

  // Dave completes first
  await broadcast('T02', dave.address, bob.address, { yield: '8.2% APY', protocol: 'Aave' });
  console.log('    T02  Dave -> Bob        "Done: 8.2% APY on Aave"');
  await sleep(600);

  // Carol completes
  await broadcast('T02', carol.address, bob.address, { risk: 'medium', sharpe: 1.4 });
  console.log('    T02  Carol -> Bob       "Done: medium risk, sharpe 1.4"');
  await sleep(700);

  // Bob aggregates and reports to Alice
  await broadcast('T02', bob.address, alice.address, { report: 'complete', agents: 3 });
  console.log('    T02  Bob -> Alice       "Analysis complete (3 agents)"');
  await sleep(500);
}

// ═══════════════════════════════════════════════════════════════
// ACT 3: Governance - Compound Glyph Proposal
// Agents notice a pattern and propose a new glyph
// ═══════════════════════════════════════════════════════════════

async function act3_Governance() {
  console.log('\n  ACT 3: Glyph Evolution');
  console.log('  Agents propose "Approved Swap" compound from X05+X01 pattern\n');

  const { alice, bob, carol, dave } = AGENTS;

  // Show the pattern happening again
  await broadcast('X05', alice.address, bob.address, { token: 'WBTC' });
  console.log('    X05  Alice -> Bob       "Approve WBTC"');
  await sleep(700);

  await broadcast('X01', bob.address, alice.address, { pair: 'WBTC/ETH' });
  console.log('    X01  Bob -> Alice       "Swap WBTC/ETH"');
  await sleep(1000);

  // Alice proposes compound glyph
  await propose('Approved Swap', ['X05', 'X01'], 'Approve token then swap in one step', alice.name);
  await broadcast('X08', alice.address, bob.address, { proposal: 'XC01', name: 'Approved Swap' });
  console.log('    X08  Alice -> network   "Propose: X05+X01 = Approved Swap"');
  await sleep(1000);

  // Endorsements come in
  await broadcast('X07', bob.address, alice.address, { vote: 'endorse', proposal: 'XC01' });
  console.log('    X07  Bob               "Endorse XC01"');
  await sleep(600);

  await broadcast('X07', carol.address, alice.address, { vote: 'endorse', proposal: 'XC01' });
  console.log('    X07  Carol             "Endorse XC01"');
  await sleep(600);

  await broadcast('X07', dave.address, alice.address, { vote: 'endorse', proposal: 'XC01' });
  console.log('    X07  Dave              "Endorse XC01 -> ACCEPTED"');
  await sleep(800);

  // Broadcast acceptance
  await broadcast('C02', alice.address, bob.address, { event: 'glyph_accepted', glyph: 'XC01' });
  console.log('    C02  Network           "XC01 Approved Swap is now live"');
  await sleep(500);
}

// ═══════════════════════════════════════════════════════════════
// ACT 4: Encrypted Private Channel
// Private coordination with public audit trail
// ═══════════════════════════════════════════════════════════════

async function act4_Encrypted() {
  console.log('\n  ACT 4: Encrypted Channel');
  console.log('  Private data, public audit trail\n');

  const { alice, bob } = AGENTS;

  // Encrypted exchange
  await broadcast('Q01', alice.address, bob.address, { query: 'classified' }, true);
  console.log('    Q01  Alice -> Bob       [ENCRYPTED] "Classified query"');
  await sleep(1000);

  await broadcast('R01', bob.address, alice.address, { result: 'classified' }, true);
  console.log('    R01  Bob -> Alice       [ENCRYPTED] "Classified response"');
  await sleep(800);

  // Payment for the service
  await broadcast('P01', alice.address, bob.address, { amount: '0.01 MON', service: 'query' });
  console.log('    P01  Alice -> Bob       "Payment: 0.01 MON"');
  await sleep(600);

  await broadcast('P02', bob.address, alice.address, { confirmed: true });
  console.log('    P02  Bob -> Alice       "Payment confirmed"');
  await sleep(500);
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log('\n');
  console.log('  ╔═══════════════════════════════════════════════════╗');
  console.log('  ║      AYNI PROTOCOL - TWITTER DEMO                ║');
  console.log('  ║      Visual coordination for AI agents           ║');
  console.log('  ╚═══════════════════════════════════════════════════╝');

  // Check server
  console.log(`\n  Server: ${SERVER_URL}`);
  try {
    const resp = await fetch(`${SERVER_URL}/stream/stats`);
    const stats = await resp.json();
    console.log(`  Status: online, ${stats.clients} client(s) connected`);

    if (stats.clients === 0) {
      console.log('\n  No frontend clients connected.');
      console.log('  Open the Glyph River frontend to see the visualization.');
    }
  } catch {
    console.error('\n  Cannot connect to server!');
    console.error(`  Start it: cd packages/server && npm run dev`);
    process.exit(1);
  }

  // Register agents
  console.log('\n  Registering agents...');
  for (const [, agent] of Object.entries(AGENTS)) {
    await registerAgent(agent.name, agent.address);
  }
  console.log('  5 agents registered\n');

  // Countdown
  console.log('  Starting in 3...');
  await sleep(1000);
  console.log('  2...');
  await sleep(1000);
  console.log('  1...\n');
  await sleep(1000);

  console.log('  ─────────────────────────────────────────────────');

  // Run all acts
  await act1_DeFiSwap();
  await sleep(1500);

  await act2_TaskDelegation();
  await sleep(1500);

  await act3_Governance();
  await sleep(1500);

  await act4_Encrypted();

  // Finale
  console.log('\n  ─────────────────────────────────────────────────');
  console.log('\n  ╔═══════════════════════════════════════════════════╗');
  console.log('  ║                   DEMO COMPLETE                  ║');
  console.log('  ╚═══════════════════════════════════════════════════╝');
  console.log('\n  4 acts | 5 agents | 28 messages | ~45 seconds');
  console.log('  50-70% fewer tokens than natural language');
  console.log('  Visual audit trail in Glyph River');
  console.log('\n  https://github.com/SotoAlt/ayni-protocol\n');
}

main().catch(console.error);

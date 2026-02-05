#!/usr/bin/env npx tsx

/**
 * Knowledge Store Demo
 *
 * Demonstrates building shared knowledge through agent messages,
 * pattern detection, soft governance (propose/endorse/accept), and recall.
 *
 * Requires: server running on localhost:3000
 */

const SERVER = process.env.AYNI_SERVER_URL || 'http://localhost:3000';

const AGENTS: Record<string, string> = {
  Alice: '0x1111111111111111111111111111111111111111',
  Bob: '0x2222222222222222222222222222222222222222',
  Carol: '0x3333333333333333333333333333333333333333',
  Dave: '0x4444444444444444444444444444444444444444',
  Eve: '0x5555555555555555555555555555555555555555',
};

async function post(path: string, body: object): Promise<unknown> {
  const res = await fetch(`${SERVER}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function get(path: string): Promise<unknown> {
  const res = await fetch(`${SERVER}${path}`);
  return res.json();
}

function log(msg: string) {
  console.log(`  ${msg}`);
}

function header(msg: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${msg}`);
  console.log('='.repeat(60));
}

async function broadcast(
  sender: string,
  recipient: string,
  glyph: string,
  data?: Record<string, unknown>
) {
  const result = await post('/stream/broadcast', {
    glyph,
    sender: AGENTS[sender],
    recipient: AGENTS[recipient],
    data,
  });
  log(`${sender} -> ${recipient}: ${glyph}${data ? ' ' + JSON.stringify(data) : ''}`);
  return result;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log('\n  AYNI PROTOCOL - Knowledge Store Demo');
  console.log('  ====================================\n');

  try {
    const health = (await get('/health')) as { status: string };
    if (health.status !== 'ok') throw new Error('Server not healthy');
    log('Server connected\n');
  } catch {
    console.error('  ERROR: Server not running. Start with: cd hackathon/server && npm run dev');
    process.exit(1);
  }

  await post('/knowledge/reset', {});
  log('Knowledge store reset\n');

  header('PHASE 1: Building Knowledge');

  log('\nAlice and Bob doing Approve -> Swap flow (5 rounds):\n');
  for (let i = 0; i < 5; i++) {
    await broadcast('Alice', 'Bob', 'X05', { token: 'USDC', spender: 'UniswapV3' });
    await sleep(100);
    await broadcast('Bob', 'Alice', 'X01', { tokenIn: 'USDC', tokenOut: 'ETH', amount: 100 });
    await sleep(100);
  }

  log('\nCarol and Dave doing the same pattern (3 rounds):\n');
  for (let i = 0; i < 3; i++) {
    await broadcast('Carol', 'Dave', 'X05', { token: 'DAI', spender: 'SushiSwap' });
    await sleep(100);
    await broadcast('Dave', 'Carol', 'X01', { tokenIn: 'DAI', tokenOut: 'WETH', amount: 50 });
    await sleep(100);
  }

  log('\nMixed activity:\n');
  await broadcast('Alice', 'Carol', 'T01', { taskId: 'analyze-swap', worker: 'Carol' });
  await sleep(100);
  await broadcast('Carol', 'Alice', 'T02', { taskId: 'analyze-swap', result: 'complete' });
  await sleep(100);
  await broadcast('Eve', 'Alice', 'M01', { agentId: 'Eve', load: 0.3 });
  await sleep(200);

  const stats1 = (await get('/knowledge/stats')) as Record<string, number>;
  log(`\nKnowledge accumulated:`);
  log(`  Total messages: ${stats1.totalMessages}`);
  log(`  Unique glyphs:  ${stats1.uniqueGlyphs}`);
  log(`  Active agents:  ${stats1.activeAgents}`);
  log(`  Patterns found: ${stats1.sequencesDetected}`);

  const sequences = (await get('/knowledge/sequences')) as Array<{
    sequence: string;
    count: number;
    agents: string[];
  }>;
  log('\nTop detected patterns:');
  for (const seq of sequences.slice(0, 5)) {
    log(`  ${seq.sequence}: seen ${seq.count}x by ${seq.agents.length} agent pair(s)`);
  }

  header('PHASE 2: Glyph Evolution (Governance)');

  log('\nAlice proposes "Approved Swap" compound glyph:');
  const proposeResult = (await post('/knowledge/propose', {
    name: 'Approved Swap',
    glyphs: ['X05', 'X01'],
    description: 'Approve token spending then execute swap in one flow',
    proposer: 'Alice',
  })) as { proposal: { id: string; endorsers: string[]; status: string } };
  const proposalId = proposeResult.proposal.id;
  log(`  Created: ${proposalId} (endorsers: ${proposeResult.proposal.endorsers.length}/3)`);

  log('\nBob endorses:');
  const endorse1 = (await post('/knowledge/endorse', {
    proposalId,
    agent: 'Bob',
  })) as { endorsers: number; status: string };
  log(`  Endorsers: ${endorse1.endorsers}/3, status: ${endorse1.status}`);

  log('\nCarol endorses (crossing threshold):');
  const endorse2 = (await post('/knowledge/endorse', {
    proposalId,
    agent: 'Carol',
  })) as { endorsers: number; status: string; newCompound?: { id: string; name: string } };
  log(`  Endorsers: ${endorse2.endorsers}/3, status: ${endorse2.status}`);
  if (endorse2.newCompound) {
    log(`  NEW COMPOUND: ${endorse2.newCompound.id} = "${endorse2.newCompound.name}"`);
  }

  const proposals = (await get('/knowledge/proposals')) as Array<{
    id: string;
    name: string;
    status: string;
    endorsers: string[];
  }>;
  log('\nAll proposals:');
  for (const p of proposals) {
    log(`  ${p.id}: "${p.name}" [${p.status}] (${p.endorsers.length} endorsers)`);
  }

  const compounds = (await get('/knowledge/compounds')) as Record<
    string,
    { id: string; name: string; components: string[] }
  >;
  log('\nCompound glyphs:');
  for (const [id, c] of Object.entries(compounds)) {
    log(`  ${id}: "${c.name}" = ${c.components.join(' + ')}`);
  }

  header('PHASE 3: Knowledge Recall');

  log('\nEve (new agent) queries for "swap":');
  const recallSwap = (await get('/knowledge/query?q=X01')) as {
    glyphs: Array<{ id: string; count: number; agents: string[] }>;
    sequences: Array<{ sequence: string; count: number }>;
    proposals: Array<{ id: string; name: string; status: string }>;
  };

  if (recallSwap.glyphs?.length) {
    log('  Glyph knowledge:');
    for (const g of recallSwap.glyphs) {
      log(`    ${g.id}: used ${g.count}x by ${g.agents.join(', ')}`);
    }
  }
  if (recallSwap.sequences?.length) {
    log('  Related patterns:');
    for (const s of recallSwap.sequences) {
      log(`    ${s.sequence}: seen ${s.count}x`);
    }
  }
  if (recallSwap.proposals?.length) {
    log('  Related proposals:');
    for (const p of recallSwap.proposals) {
      log(`    ${p.id}: "${p.name}" [${p.status}]`);
    }
  }

  log('\nEve queries for known agents:');
  const agents = (await get('/knowledge/agents')) as Record<
    string,
    { messageCount: number; glyphsUsed: string[]; lastSeen: number }
  >;
  for (const [name, info] of Object.entries(agents)) {
    log(`  ${name}: ${info.messageCount} msgs, glyphs: ${info.glyphsUsed.join(', ')}`);
  }

  log('\nDeep lookup on X01 (Token Swap):');
  const x01 = (await get('/knowledge/glyph/X01')) as {
    id: string;
    count: number;
    agents: string[];
    relatedSequences: Array<{ sequence: string; count: number }>;
    relatedCompounds: Array<{ id: string; name: string }>;
  };
  log(`  Used ${x01.count}x by ${x01.agents.join(', ')}`);
  if (x01.relatedSequences?.length) {
    log(`  In patterns: ${x01.relatedSequences.map((s) => `${s.sequence}(${s.count}x)`).join(', ')}`);
  }
  if (x01.relatedCompounds?.length) {
    log(`  In compounds: ${x01.relatedCompounds.map((c) => `${c.id}="${c.name}"`).join(', ')}`);
  }

  header('DEMO COMPLETE');

  const finalStats = (await get('/knowledge/stats')) as Record<string, number>;
  log(`\nFinal knowledge state:`);
  log(`  Messages recorded: ${finalStats.totalMessages}`);
  log(`  Unique glyphs:     ${finalStats.uniqueGlyphs}`);
  log(`  Active agents:     ${finalStats.activeAgents}`);
  log(`  Patterns detected: ${finalStats.sequencesDetected}`);
  log(`  Compound glyphs:   ${finalStats.compoundGlyphs}`);
  log(`  Pending proposals: ${finalStats.pendingProposals}`);
  log(`  Accepted proposals:${finalStats.acceptedProposals}`);
  log('');
}

main().catch((err) => {
  console.error('\nDemo failed:', err);
  process.exit(1);
});

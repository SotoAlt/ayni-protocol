#!/usr/bin/env npx tsx

/**
 * Ayni Protocol — Real Agent End-to-End Test
 *
 * Exercises the protocol the way actual AI agents would use it:
 *   1. Encode / decode / batch decode / list glyphs
 *   2. Multi-agent conversation via POST /send (knowledge recording + sequence detection)
 *   3. Knowledge recall & query
 *   4. Governance: propose → endorse → accept compound glyph
 *   5. Error handling & edge cases
 *
 * Usage:
 *   npx tsx packages/demo/agent-e2e.ts [SERVER_URL]
 *   npx tsx packages/demo/agent-e2e.ts https://ayni.waweapps.win
 */

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const BASE_URL = process.argv[2] || process.env.AYNI_SERVER_URL || 'http://localhost:3000';

const ALICE = '0x1111111111111111111111111111111111111111';
const BOB   = '0x2222222222222222222222222222222222222222';
const CAROL = '0x3333333333333333333333333333333333333333';
const DAVE  = '0x4444444444444444444444444444444444444444';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface TestResult { name: string; passed: boolean; error?: string }
const results: TestResult[] = [];
let currentScenario = '';

async function api(path: string, opts?: RequestInit) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...opts?.headers },
  });
  return res;
}

async function json(path: string, opts?: RequestInit) {
  const res = await api(path, opts);
  const body = await res.json();
  return { status: res.status, ok: res.ok, body };
}

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ name: `[${currentScenario}] ${name}`, passed: true });
    console.log(`    ✓ ${name}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    results.push({ name: `[${currentScenario}] ${name}`, passed: false, error: msg });
    console.log(`    ✗ ${name}`);
    console.log(`      ${msg}`);
  }
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// ---------------------------------------------------------------------------
// Scenario 1 — Encode & Decode
// ---------------------------------------------------------------------------

async function scenario1() {
  currentScenario = 'Encode & Decode';
  console.log('\n  ── Scenario 1: Agent Lifecycle — Encode & Decode ──');

  await test('Encode "query database" → Q01', async () => {
    const { body } = await json('/encode', {
      method: 'POST',
      body: JSON.stringify({ text: 'query database' }),
    });
    assert(body.glyph === 'Q01', `Expected Q01, got ${body.glyph}`);
    assert(body.domain === 'foundation', `Expected foundation domain, got ${body.domain}`);
  });

  await test('Encode "success" → R01', async () => {
    const { body } = await json('/encode', {
      method: 'POST',
      body: JSON.stringify({ text: 'success' }),
    });
    assert(body.glyph === 'R01', `Expected R01, got ${body.glyph}`);
  });

  await test('Encode "swap tokens on dex" → X01 (crypto domain)', async () => {
    const { body } = await json('/encode', {
      method: 'POST',
      body: JSON.stringify({ text: 'swap tokens on dex' }),
    });
    assert(body.glyph === 'X01', `Expected X01, got ${body.glyph}`);
    assert(body.domain === 'crypto', `Expected crypto domain, got ${body.domain}`);
  });

  await test('Decode Q01 → Query Database', async () => {
    const { body } = await json('/decode', {
      method: 'POST',
      body: JSON.stringify({ glyph: 'Q01' }),
    });
    assert(body.valid === true, 'Expected valid=true');
    assert(body.meaning === 'Query Database', `Expected Query Database, got ${body.meaning}`);
  });

  await test('Batch decode [Q01, R01, X01]', async () => {
    const { body } = await json('/decode/batch', {
      method: 'POST',
      body: JSON.stringify({ glyphs: ['Q01', 'R01', 'X01'] }),
    });
    assert(body.count === 3, `Expected count=3, got ${body.count}`);
    assert(body.valid === 3, `Expected valid=3, got ${body.valid}`);
    assert(body.results[0].meaning === 'Query Database', 'First should be Query Database');
    assert(body.results[2].domain === 'crypto', 'Third should be crypto domain');
  });

  await test('GET /glyphs returns glyph list', async () => {
    const { body } = await json('/glyphs');
    assert(Array.isArray(body.glyphs), 'Should return array of glyphs');
    assert(body.count >= 4, `Expected ≥4 glyphs, got ${body.count}`);
  });
}

// ---------------------------------------------------------------------------
// Scenario 2 — Multi-Agent Conversation via /send
// ---------------------------------------------------------------------------

async function scenario2() {
  currentScenario = 'Multi-Agent Send';
  console.log('\n  ── Scenario 2: Multi-Agent Conversation via /send ──');

  // Capture baseline stats
  const { body: baseline } = await json('/knowledge/stats');
  const baselineMessages = baseline.totalMessages ?? 0;

  // Use a unique data tag so we can identify our messages
  const testTag = `e2e-${Date.now()}`;

  await test('Alice → Bob: T01 "Assign Task"', async () => {
    const { status, body } = await json('/send', {
      method: 'POST',
      body: JSON.stringify({
        glyph: 'T01',
        sender: ALICE,
        recipient: BOB,
        data: { task: 'analyze data', tag: testTag },
      }),
    });
    assert(status === 200, `Expected 200, got ${status}`);
    assert(body.success === true, `Expected success=true, got ${JSON.stringify(body)}`);
    assert(typeof body.messageHash === 'string', 'Should return messageHash');
    assert(body.glyphId === 'T01', `Expected glyphId=T01, got ${body.glyphId}`);
  });

  await test('Bob → Alice: R01 "Response Success"', async () => {
    const { status, body } = await json('/send', {
      method: 'POST',
      body: JSON.stringify({
        glyph: 'R01',
        sender: BOB,
        recipient: ALICE,
        data: { status: 'acknowledged', tag: testTag },
      }),
    });
    assert(status === 200, `Expected 200, got ${status}`);
    assert(body.success === true, 'Expected success');
  });

  await test('Alice → Carol: T01 "Assign Task"', async () => {
    const { status, body } = await json('/send', {
      method: 'POST',
      body: JSON.stringify({
        glyph: 'T01',
        sender: ALICE,
        recipient: CAROL,
        data: { task: 'run report', tag: testTag },
      }),
    });
    assert(status === 200, `Expected 200, got ${status}`);
    assert(body.success === true, 'Expected success');
  });

  await test('Carol → Alice: T02 "Task Complete"', async () => {
    const { status, body } = await json('/send', {
      method: 'POST',
      body: JSON.stringify({
        glyph: 'T02',
        sender: CAROL,
        recipient: ALICE,
        data: { result: 'report generated', tag: testTag },
      }),
    });
    assert(status === 200, `Expected 200, got ${status}`);
    assert(body.success === true, 'Expected success');
  });

  // Give the server a moment to process knowledge recording
  await sleep(500);

  await test('Knowledge stats increased by 4 messages', async () => {
    const { body: after } = await json('/knowledge/stats');
    const delta = (after.totalMessages ?? 0) - baselineMessages;
    assert(delta >= 4, `Expected ≥4 new messages, got ${delta} (before=${baselineMessages}, after=${after.totalMessages})`);
  });

  await test('Agents list includes Alice, Bob, Carol', async () => {
    const { body: agents } = await json('/knowledge/agents');
    assert('Alice' in agents, 'Alice should be in agents');
    assert('Bob' in agents, 'Bob should be in agents');
    assert('Carol' in agents, 'Carol should be in agents');
  });
}

// ---------------------------------------------------------------------------
// Scenario 3 — Knowledge Recall & Query
// ---------------------------------------------------------------------------

async function scenario3() {
  currentScenario = 'Knowledge Recall';
  console.log('\n  ── Scenario 3: Knowledge Recall & Query ──');

  await test('GET /knowledge/query?q=T01 finds glyph usage', async () => {
    const { body } = await json('/knowledge/query?q=T01');
    assert(Array.isArray(body.glyphs), 'Should return glyphs array');
    // T01 should be among the known glyphs
    const found = body.glyphs.some((g: any) => g.id === 'T01');
    assert(found, 'T01 should appear in query results');
  });

  await test('GET /knowledge/agents returns agent activity', async () => {
    const { body: agents } = await json('/knowledge/agents');
    assert(agents.Alice?.messageCount >= 1, `Alice should have ≥1 message, got ${agents.Alice?.messageCount}`);
    assert(Array.isArray(agents.Alice?.glyphsUsed), 'Alice should have glyphsUsed array');
  });

  await test('GET /knowledge/sequences returns detected sequences', async () => {
    const { body: sequences } = await json('/knowledge/sequences');
    assert(Array.isArray(sequences), 'Should return array of sequences');
    // We sent T01→R01 between Alice↔Bob within 30s, so should detect at least one sequence
    if (sequences.length > 0) {
      assert(typeof sequences[0].sequence === 'string', 'Sequence should have sequence key');
      assert(typeof sequences[0].count === 'number', 'Sequence should have count');
    }
    // Note: sequence detection depends on timing; don't hard-fail if empty
  });

  await test('GET /knowledge/messages?limit=4 returns recent messages', async () => {
    const { body } = await json('/knowledge/messages?limit=4');
    assert(Array.isArray(body.messages), 'Should return messages array');
    assert(body.messages.length >= 1, `Expected ≥1 messages, got ${body.messages.length}`);
    assert(typeof body.total === 'number', 'Should return total count');
  });
}

// ---------------------------------------------------------------------------
// Scenario 4 — Governance: Compound Glyph Proposal
// ---------------------------------------------------------------------------

async function scenario4() {
  currentScenario = 'Governance';
  console.log('\n  ── Scenario 4: Governance — Compound Glyph Proposal ──');

  let proposalId = '';

  await test('Alice proposes compound glyph [T01, R01] → "TaskAck"', async () => {
    const { status, body } = await json('/knowledge/propose', {
      method: 'POST',
      body: JSON.stringify({
        name: 'TaskAck',
        glyphs: ['T01', 'R01'],
        description: 'Task assignment followed by acknowledgement',
        proposer: 'Alice',
      }),
    });
    assert(status === 200, `Expected 200, got ${status}`);
    assert(body.success === true, `Expected success=true, got ${JSON.stringify(body)}`);
    assert(body.proposal?.id, 'Should return proposal with id');
    assert(body.proposal.status === 'pending', `Expected pending, got ${body.proposal.status}`);
    assert(body.proposal.endorsers.length === 1, 'Proposer counts as first endorser');
    proposalId = body.proposal.id;
    console.log(`      Proposal ID: ${proposalId}`);
  });

  await test('Bob endorses the proposal (2/3)', async () => {
    const { body } = await json('/knowledge/endorse', {
      method: 'POST',
      body: JSON.stringify({ proposalId, agent: 'Bob' }),
    });
    assert(body.success === true, `Expected success=true, got ${JSON.stringify(body)}`);
    assert(body.endorsers === 2, `Expected 2 endorsers, got ${body.endorsers}`);
    assert(body.status === 'pending', `Expected still pending, got ${body.status}`);
  });

  await test('Carol endorses → hits threshold (3/3), proposal accepted', async () => {
    const { body } = await json('/knowledge/endorse', {
      method: 'POST',
      body: JSON.stringify({ proposalId, agent: 'Carol' }),
    });
    assert(body.success === true, `Expected success=true, got ${JSON.stringify(body)}`);
    assert(body.endorsers === 3, `Expected 3 endorsers, got ${body.endorsers}`);
    assert(body.status === 'accepted', `Expected accepted, got ${body.status}`);
    assert(body.newCompound !== null, 'Should have created compound glyph');
    console.log(`      Compound ID: ${body.newCompound?.id}, Name: ${body.newCompound?.name}`);
  });

  await test('Dave endorsing already-accepted proposal is no-op', async () => {
    const { body } = await json('/knowledge/endorse', {
      method: 'POST',
      body: JSON.stringify({ proposalId, agent: 'Dave' }),
    });
    assert(body.success === true, 'Should still succeed (idempotent)');
    assert(body.status === 'accepted', 'Should remain accepted');
    assert(body.newCompound === null, 'Should not create duplicate compound');
  });

  await test('GET /knowledge/proposals shows accepted proposal', async () => {
    const { body: proposals } = await json('/knowledge/proposals?status=accepted');
    const found = proposals.find((p: any) => p.id === proposalId);
    assert(found, `Proposal ${proposalId} should be in accepted list`);
    assert(found.endorsers.length === 3, `Expected 3 endorsers, got ${found.endorsers.length}`);
  });

  await test('GET /knowledge/compounds includes "TaskAck"', async () => {
    const { body: compounds } = await json('/knowledge/compounds');
    const entries = Object.values(compounds) as any[];
    const found = entries.find((c: any) => c.name === 'TaskAck');
    assert(found, 'TaskAck compound should exist');
    assert(found.components.includes('T01'), 'Should contain T01');
    assert(found.components.includes('R01'), 'Should contain R01');
  });
}

// ---------------------------------------------------------------------------
// Scenario 5 — Error Handling & Edge Cases
// ---------------------------------------------------------------------------

async function scenario5() {
  currentScenario = 'Error Handling';
  console.log('\n  ── Scenario 5: Error Handling & Edge Cases ──');

  await test('POST /send with missing glyph → 400', async () => {
    const { status } = await json('/send', {
      method: 'POST',
      body: JSON.stringify({ recipient: BOB }),
    });
    assert(status === 400, `Expected 400, got ${status}`);
  });

  await test('POST /send with missing recipient → 400', async () => {
    const { status } = await json('/send', {
      method: 'POST',
      body: JSON.stringify({ glyph: 'Q01' }),
    });
    assert(status === 400, `Expected 400, got ${status}`);
  });

  await test('POST /encode with unrecognizable text → 400', async () => {
    const { status, body } = await json('/encode', {
      method: 'POST',
      body: JSON.stringify({ text: 'xyzzy plugh nothing' }),
    });
    assert(status === 400, `Expected 400, got ${status}`);
    assert(body.error?.includes('No matching glyph'), `Expected glyph error, got ${body.error}`);
  });

  await test('POST /decode with invalid glyph "Z99" → 400', async () => {
    const { status, body } = await json('/decode', {
      method: 'POST',
      body: JSON.stringify({ glyph: 'Z99' }),
    });
    assert(status === 400, `Expected 400, got ${status}`);
    assert(body.valid === false, 'Should have valid=false');
  });

  await test('POST /knowledge/endorse with non-existent proposal → error', async () => {
    const { body } = await json('/knowledge/endorse', {
      method: 'POST',
      body: JSON.stringify({ proposalId: 'P999', agent: 'Alice' }),
    });
    assert(body.success === false, 'Should return success=false');
    assert(typeof body.error === 'string', 'Should return error message');
  });

  await test('POST /encode with empty text → 400', async () => {
    const { status } = await json('/encode', {
      method: 'POST',
      body: JSON.stringify({ text: '' }),
    });
    assert(status === 400, `Expected 400, got ${status}`);
  });

  await test('Duplicate endorsement is idempotent', async () => {
    // Create a fresh proposal
    const { body: propResult } = await json('/knowledge/propose', {
      method: 'POST',
      body: JSON.stringify({
        name: 'DupeTest',
        glyphs: ['Q01', 'E01'],
        description: 'Testing duplicate endorsement',
        proposer: 'Alice',
      }),
    });
    const pid = propResult.proposal.id;

    // Alice already endorses as proposer; endorsing again should be idempotent
    const { body: dup } = await json('/knowledge/endorse', {
      method: 'POST',
      body: JSON.stringify({ proposalId: pid, agent: 'Alice' }),
    });
    assert(dup.endorsers === 1, `Expected still 1 endorser, got ${dup.endorsers}`);
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║         AYNI PROTOCOL — Real Agent E2E Test Suite          ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`  Server: ${BASE_URL}`);

  // Health check
  try {
    const res = await fetch(`${BASE_URL}/health`);
    if (!res.ok) throw new Error(`status ${res.status}`);
    const health = await res.json();
    console.log(`  Health: OK — ${health.totalMessages ?? '?'} messages, ${health.activeAgents ?? '?'} agents`);
  } catch (e) {
    console.error(`\n  ✗ Cannot reach server at ${BASE_URL}`);
    console.error(`    ${e instanceof Error ? e.message : e}`);
    console.error('    Start the server: cd packages/server && npm run dev');
    process.exit(1);
  }

  const start = Date.now();

  await scenario1();
  await scenario2();
  await scenario3();
  await scenario4();
  await scenario5();

  // Summary
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const elapsed = Date.now() - start;

  console.log('\n' + '═'.repeat(62));
  console.log(`  RESULTS: ${passed} passed, ${failed} failed, ${results.length} total (${elapsed}ms)`);
  console.log('═'.repeat(62));

  if (failed > 0) {
    console.log('\n  Failed:');
    for (const r of results.filter(r => !r.passed)) {
      console.log(`    ✗ ${r.name}`);
      console.log(`      ${r.error}`);
    }
    process.exit(1);
  } else {
    console.log('\n  All tests passed.\n');
  }
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});

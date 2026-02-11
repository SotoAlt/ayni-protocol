#!/usr/bin/env node
/**
 * Ayni Protocol — Live Demo Script
 * Sends real glyph messages through the server API.
 * Messages appear in the Glyph River frontend via WebSocket.
 *
 * Usage:
 *   node demo-live.mjs                    # default: https://ayni.waweapps.win
 *   node demo-live.mjs http://localhost:3000  # local dev
 *   node demo-live.mjs --loop             # repeat forever
 */

const BASE = process.argv.find(a => a.startsWith('http')) || 'https://ayni.waweapps.win';
const LOOP = process.argv.includes('--loop');

const AGENTS = ['alice', 'bob', 'carol', 'dave', 'eve', 'claude-agent'];

// Scenarios using glyph IDs (these render as NANO tocapu glyphs)
const SCENARIOS = [
  {
    name: 'Database Query Flow',
    steps: [
      { from: 'alice', to: 'bob', glyph: 'Q01', data: 'SELECT * FROM agents WHERE active=true' },
      { delay: 800 },
      { from: 'bob', to: 'alice', glyph: 'R02', data: '42 records found' },
      { delay: 400 },
      { from: 'alice', to: 'carol', glyph: 'A02', data: 'Analyze agent activity patterns' },
      { delay: 1200 },
      { from: 'carol', to: 'alice', glyph: 'R03', data: 'Analysis complete: 3 clusters identified' },
    ]
  },
  {
    name: 'API Search + Error Recovery',
    steps: [
      { from: 'alice', to: 'dave', glyph: 'Q03', data: 'GET /api/v2/market/prices' },
      { delay: 2000 },
      { from: 'dave', to: 'alice', glyph: 'E02', data: 'Request timed out after 30s' },
      { delay: 500 },
      { from: 'alice', to: 'dave', glyph: 'A01', data: 'Retry with cache fallback' },
      { delay: 600 },
      { from: 'dave', to: 'alice', glyph: 'R01', data: 'Cached prices from 5m ago' },
    ]
  },
  {
    name: 'Multi-Agent Coordination',
    steps: [
      { from: 'alice', to: 'bob', glyph: 'Q01', data: 'Fetch user profiles' },
      { from: 'alice', to: 'carol', glyph: 'Q02', data: 'Search for anomalies' },
      { from: 'alice', to: 'dave', glyph: 'Q03', data: 'Check external API status' },
      { delay: 800 },
      { from: 'bob', to: 'alice', glyph: 'R02', data: '1,247 profiles loaded' },
      { delay: 200 },
      { from: 'carol', to: 'alice', glyph: 'E01', data: 'Anomaly scan failed — insufficient data' },
      { delay: 400 },
      { from: 'dave', to: 'alice', glyph: 'R01', data: 'All external APIs healthy' },
      { delay: 300 },
      { from: 'alice', to: 'carol', glyph: 'A03', data: 'Retry with full dataset from bob' },
      { delay: 1000 },
      { from: 'carol', to: 'alice', glyph: 'R03', data: '7 anomalies detected and flagged' },
    ]
  },
  {
    name: 'Permission + Delegation',
    steps: [
      { from: 'eve', to: 'bob', glyph: 'Q01', data: 'Access restricted table: governance_votes' },
      { delay: 400 },
      { from: 'bob', to: 'eve', glyph: 'E03', data: 'Insufficient permissions for governance_votes' },
      { delay: 300 },
      { from: 'eve', to: 'alice', glyph: 'Q02', data: 'Request elevated access for audit' },
      { delay: 600 },
      { from: 'alice', to: 'bob', glyph: 'A01', data: 'Grant eve read access to governance_votes' },
      { delay: 200 },
      { from: 'bob', to: 'alice', glyph: 'R01', data: 'Access granted' },
      { delay: 100 },
      { from: 'eve', to: 'bob', glyph: 'Q01', data: 'Access restricted table: governance_votes' },
      { delay: 500 },
      { from: 'bob', to: 'eve', glyph: 'R02', data: '340 vote records returned' },
    ]
  },
  {
    name: 'Agent Task Pipeline',
    steps: [
      { from: 'claude-agent', to: 'alice', glyph: 'A02', data: 'Delegate: generate weekly report' },
      { delay: 300 },
      { from: 'alice', to: 'bob', glyph: 'Q01', data: 'Aggregate metrics for week 5' },
      { delay: 700 },
      { from: 'bob', to: 'alice', glyph: 'R02', data: 'Weekly metrics ready' },
      { delay: 200 },
      { from: 'alice', to: 'carol', glyph: 'A02', data: 'Analyze trends in metrics' },
      { delay: 900 },
      { from: 'carol', to: 'alice', glyph: 'R03', data: 'Trend analysis: +12% agent activity' },
      { delay: 200 },
      { from: 'alice', to: 'claude-agent', glyph: 'R03', data: 'Report generated and delivered' },
    ]
  },
];

async function send(from, to, glyph, data) {
  const body = { from, to, glyph, data: data || '' };
  try {
    const resp = await fetch(`${BASE}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const result = await resp.json();
    const ok = resp.ok ? '\x1b[32mOK\x1b[0m' : '\x1b[31mERR\x1b[0m';
    console.log(`  ${ok} ${from} → ${to}  ${glyph}  "${data || ''}"`);
    return result;
  } catch (err) {
    console.error(`  \x1b[31mFAIL\x1b[0m ${from} → ${to}  ${glyph}: ${err.message}`);
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function runScenario(scenario) {
  console.log(`\n\x1b[36m▸ ${scenario.name}\x1b[0m`);
  for (const step of scenario.steps) {
    if (step.delay) {
      await sleep(step.delay);
      continue;
    }
    await send(step.from, step.to, step.glyph, step.data);
    await sleep(200); // small gap between rapid sends
  }
}

async function main() {
  console.log(`\x1b[1mAyni Protocol — Live Demo\x1b[0m`);
  console.log(`Server: ${BASE}\n`);

  // Health check
  try {
    const h = await fetch(`${BASE}/health`);
    if (!h.ok) throw new Error(`HTTP ${h.status}`);
    const hj = await h.json();
    console.log(`Server healthy: ${hj.status || 'ok'}\n`);
  } catch (err) {
    console.error(`\x1b[31mServer unreachable: ${err.message}\x1b[0m`);
    process.exit(1);
  }

  do {
    for (const scenario of SCENARIOS) {
      await runScenario(scenario);
      await sleep(1500); // pause between scenarios
    }
    if (LOOP) {
      console.log('\n\x1b[33m--- Loop restart ---\x1b[0m');
      await sleep(3000);
    }
  } while (LOOP);

  console.log('\n\x1b[32mDemo complete.\x1b[0m');
}

main();

/**
 * Main - Ayni Glyph Stream v2
 *
 * Supports two modes:
 * - REAL: Connects to ws://localhost:3000/stream for live messages
 * - MOCK: Uses simulated message scenarios for demos
 *
 * Mode is determined by:
 * 1. URL parameter: ?mode=real or ?mode=mock
 * 2. Default: tries real first, falls back to mock
 */

import { GlyphStream } from './textileRiver.js';
import { MockWebSocket, RealWebSocket } from './websocket.js';
import { GLYPH_MEANINGS, CATEGORY_COLORS } from './glyphs.js';

// Configuration
const WS_PROTOCOL = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const SERVER_URL = (window.location.hostname !== 'localhost')
  ? `${WS_PROTOCOL}//${window.location.host}/stream`
  : 'ws://localhost:3000/stream';
const API_BASE = (window.location.hostname !== 'localhost')
  ? `${window.location.protocol}//${window.location.host}`
  : 'http://localhost:3000';
const CONNECTION_TIMEOUT = 3000; // 3 seconds to connect before fallback

const MAX_LOG_ENTRIES = 200;

// Glyph ID → visual mapping (mirrors server getVisual)
const GLYPH_VISUAL = {
  Q01: { glyphs: ['asking', 'database'], category: 'humanoid', meaning: 'Query Database', domain: 'foundation' },
  R01: { glyphs: ['giving', 'checkmark'], category: 'humanoid', meaning: 'Response Success', domain: 'foundation' },
  E01: { glyphs: ['waiting', 'x'], category: 'symbol', meaning: 'Error', domain: 'foundation' },
  A01: { glyphs: ['running', 'lightning'], category: 'symbol', meaning: 'Execute Action', domain: 'foundation' },
  Q02: { glyphs: ['asking', 'eye'], category: 'symbol', meaning: 'Search', domain: 'foundation' },
  Q03: { glyphs: ['asking', 'server'], category: 'symbol', meaning: 'Query API', domain: 'foundation' },
  R02: { glyphs: ['giving', 'database'], category: 'humanoid', meaning: 'Data Response', domain: 'foundation' },
  R03: { glyphs: ['celebrating', 'checkmark'], category: 'humanoid', meaning: 'Task Complete', domain: 'foundation' },
  E02: { glyphs: ['waiting', 'clock', 'x'], category: 'creature', meaning: 'Timeout Error', domain: 'foundation' },
  E03: { glyphs: ['waiting', 'lock', 'x'], category: 'symbol', meaning: 'Permission Denied', domain: 'foundation' },
  A02: { glyphs: ['giving', 'robot'], category: 'machine', meaning: 'Delegate Task', domain: 'foundation' },
  A03: { glyphs: ['running', 'database', 'arrow'], category: 'machine', meaning: 'Update Data', domain: 'foundation' },
  S01: { glyphs: ['thinking', 'clock'], category: 'humanoid', meaning: 'Processing', domain: 'state' },
  S02: { glyphs: ['waiting'], category: 'humanoid', meaning: 'Idle', domain: 'state' },
  P01: { glyphs: ['running', 'coin'], category: 'humanoid', meaning: 'Payment Sent', domain: 'payment' },
  P02: { glyphs: ['celebrating', 'coin', 'checkmark'], category: 'humanoid', meaning: 'Payment Confirmed', domain: 'payment' },
  X01: { glyphs: ['running', 'swap'], category: 'crypto', meaning: 'Token Swap', domain: 'crypto' },
  X02: { glyphs: ['thinking', 'stake'], category: 'crypto', meaning: 'Stake', domain: 'crypto' },
  X03: { glyphs: ['celebrating', 'stake'], category: 'crypto', meaning: 'Unstake', domain: 'crypto' },
  X04: { glyphs: ['running', 'arrow'], category: 'crypto', meaning: 'Transfer', domain: 'crypto' },
  X05: { glyphs: ['thinking', 'checkmark'], category: 'crypto', meaning: 'Approve', domain: 'crypto' },
  X06: { glyphs: ['celebrating', 'harvest'], category: 'crypto', meaning: 'Harvest Rewards', domain: 'crypto' },
  X07: { glyphs: ['thinking', 'vote'], category: 'crypto', meaning: 'Vote', domain: 'crypto' },
  X08: { glyphs: ['celebrating', 'arrow'], category: 'crypto', meaning: 'Propose', domain: 'crypto' },
  X09: { glyphs: ['running', 'bridge'], category: 'crypto', meaning: 'Bridge', domain: 'crypto' },
  X10: { glyphs: ['thinking', 'limit'], category: 'crypto', meaning: 'Limit Order', domain: 'crypto' },
  X11: { glyphs: ['waiting', 'shield'], category: 'crypto', meaning: 'Stop Loss', domain: 'crypto' },
  X12: { glyphs: ['running', 'checkmark'], category: 'crypto', meaning: 'Trade Executed', domain: 'crypto' },
  T01: { glyphs: ['running', 'task'], category: 'agent', meaning: 'Assign Task', domain: 'agent' },
  T02: { glyphs: ['celebrating', 'checkmark'], category: 'agent', meaning: 'Task Complete', domain: 'agent' },
  T03: { glyphs: ['waiting', 'x'], category: 'agent', meaning: 'Task Failed', domain: 'agent' },
  W01: { glyphs: ['running', 'lightning'], category: 'agent', meaning: 'Start Workflow', domain: 'agent' },
  W02: { glyphs: ['thinking', 'checkpoint'], category: 'agent', meaning: 'Checkpoint', domain: 'agent' },
  W03: { glyphs: ['waiting', 'clock'], category: 'agent', meaning: 'Pause', domain: 'agent' },
  C01: { glyphs: ['running', 'lightning'], category: 'agent', meaning: 'Notify', domain: 'agent' },
  C02: { glyphs: ['celebrating', 'broadcast'], category: 'agent', meaning: 'Broadcast', domain: 'agent' },
  C03: { glyphs: ['thinking', 'checkmark'], category: 'agent', meaning: 'Acknowledge', domain: 'agent' },
  M01: { glyphs: ['thinking', 'heartbeat'], category: 'agent', meaning: 'Heartbeat', domain: 'agent' },
  M02: { glyphs: ['thinking', 'log'], category: 'agent', meaning: 'Log', domain: 'agent' },
  M03: { glyphs: ['waiting', 'alert'], category: 'agent', meaning: 'Alert', domain: 'agent' },
};

function getVisual(glyphId) {
  return GLYPH_VISUAL[glyphId] || { glyphs: [glyphId.toLowerCase()], category: 'symbol', meaning: glyphId, domain: 'foundation' };
}

function debug(msg) {
  const el = document.getElementById('debug-info');
  if (el) el.textContent = msg;
}

let stream, ws;
let currentMode = 'auto'; // 'real', 'mock', or 'auto'
let knowledgePollTimer = null;

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + 'B';
  return (bytes / 1024).toFixed(1) + 'KB';
}

function formatTime(ts) {
  const d = new Date(ts);
  return d.getHours().toString().padStart(2, '0') + ':' +
    d.getMinutes().toString().padStart(2, '0');
}

const DOMAIN_CLASS = {
  foundation: 'glyph-foundation',
  crypto: 'glyph-crypto',
  agent: 'glyph-agent',
  state: 'glyph-state',
  error: 'glyph-error',
  payment: 'glyph-payment',
};

function getDomainClass(domain) {
  return DOMAIN_CLASS[domain] || 'glyph-foundation';
}

// Agent verification cache
const agentTierCache = {};

async function fetchAgentTier(address) {
  if (!address || address.length < 4) return 'unknown';
  if (agentTierCache[address]) return agentTierCache[address];

  try {
    const resp = await fetch(`${API_BASE}/agents/${address}`);
    if (resp.ok) {
      const { agent } = await resp.json();
      agentTierCache[address] = agent.tier;
      return agent.tier;
    }
  } catch { /* ignore */ }

  agentTierCache[address] = 'unknown';
  return 'unknown';
}

function tierBadge(tier) {
  switch (tier) {
    case 'erc-8004': return '<span class="badge badge-gold" title="ERC-8004 Verified">V</span>';
    case 'wallet-linked': return '<span class="badge badge-blue" title="Wallet Linked">W</span>';
    case 'unverified': return '<span class="badge badge-grey" title="Registered">R</span>';
    default: return '';
  }
}

function addLogEntry(msg, prepend = true) {
  const logEl = document.getElementById('message-log');
  if (!logEl) return;

  const visual = msg.glyphId ? getVisual(msg.glyphId) : null;
  const domain = visual ? visual.domain : (msg.category || 'foundation');
  const meaning = msg.meaning || (visual ? visual.meaning : '');
  const label = msg.glyphId || (msg.glyphs ? msg.glyphs.join('+') : '?');
  const time = formatTime(msg.timestamp || Date.now());
  const from = (msg.from || '').substring(0, 8);
  const to = (msg.to || '').substring(0, 8);

  const entry = document.createElement('div');
  entry.className = 'log-entry';

  // Start with basic content, badges added async
  const fromBadgeId = `badge-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  entry.innerHTML =
    `<span class="log-time">${time}</span> ` +
    `<span class="log-agents"><span id="${fromBadgeId}"></span>${from}\u2192${to}</span> ` +
    `<span class="log-glyph ${getDomainClass(domain)}">${label}</span> ` +
    `<span class="log-meaning">${meaning}</span>`;

  // Async badge lookup (non-blocking)
  if (currentMode === 'real' && msg.from) {
    fetchAgentTier(msg.from).then(tier => {
      const badgeEl = document.getElementById(fromBadgeId);
      if (badgeEl) badgeEl.innerHTML = tierBadge(tier);
    });
  }

  if (prepend) {
    logEl.prepend(entry);
  } else {
    logEl.appendChild(entry);
  }

  while (logEl.children.length > MAX_LOG_ENTRIES) {
    logEl.removeChild(logEl.lastChild);
  }
}

function handleMessage(msg) {
  // Normalize: server WebSocket sends {glyph:'Q01', sender, recipient}
  // Mock sends {glyphs:['asking','database'], glyphId:'Q01', from, to}
  if (!msg.glyphId && msg.glyph && GLYPH_VISUAL[msg.glyph]) {
    // Real server message — set glyphId + visual info
    const visual = getVisual(msg.glyph);
    msg.glyphId = msg.glyph;
    msg.glyphs = msg.glyphs || visual.glyphs;
    msg.category = msg.category || visual.category;
    msg.meaning = msg.meaning || visual.meaning;
    msg.from = msg.from || msg.sender;
    msg.to = msg.to || msg.recipient;
  }
  stream.addMessage(msg);
  addLogEntry(msg);
}

let historyCounter = 0;

function serverMsgToFrontend(row) {
  const visual = getVisual(row.glyph);
  return {
    id: `hist-${row.timestamp}-${++historyCounter}`,
    from: row.sender,
    to: row.recipient,
    glyphs: visual.glyphs,
    glyph: visual.glyphs[0],
    glyphId: row.glyph,
    category: visual.category,
    meaning: visual.meaning,
    timestamp: row.timestamp,
    encrypted: false,
    size: visual.glyphs.length * 512,
    messageHash: row.messageHash,
    data: row.data,
  };
}

async function fetchHistory() {
  try {
    const resp = await fetch(`${API_BASE}/knowledge/messages?limit=100`);
    if (!resp.ok) return;
    const { messages } = await resp.json();
    if (!messages?.length) return;

    // Reverse to oldest-first so they appear in chronological order
    const chronological = messages.slice().reverse();

    for (const row of chronological) {
      const msg = serverMsgToFrontend(row);
      stream.addMessage(msg);
      addLogEntry(msg, false);
    }

    debug(`LIVE - ${messages.length} historical + streaming`);
  } catch (e) {
    console.warn('[Main] Failed to fetch history:', e);
  }
}

function updatePanel(message, stats) {
  const glyphs = message.glyphs || [message.glyph];

  const el = id => document.getElementById(id);

  if (el('message-info')) {
    el('message-info').textContent =
      `FROM: ${message.from}\nTO:   ${message.to}\nSIZE: ${message.size}B\nENC:  ${message.encrypted ? 'YES' : 'NO'}`;
  }

  if (el('glyph-sequence')) {
    el('glyph-sequence').innerHTML =
      `<span class="glyph-icons">${glyphs.join(' + ')}</span>`;
  }

  if (el('message-meaning')) {
    el('message-meaning').textContent = message.meaning || '--';
  }

  if (el('stats-info')) {
    const s = stream.getStats();
    el('stats-info').textContent =
      `MSGS:   ${stats.totalMessages}\nGLYPHS: ${s.glyphs}\nBYTES:  ${formatBytes(stats.totalBytes)}\nROWS:   ${s.rows}`;
  }
}

function getModeFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('mode') || 'auto';
}

function connectWithFallback() {
  return new Promise((resolve) => {
    debug('Connecting to server...');

    const realWs = new RealWebSocket({
      serverUrl: SERVER_URL,
      onMessage: msg => handleMessage(msg),
      onConnect: () => {
        debug('LIVE - Server connected');
        currentMode = 'real';
        fetchHistory();
        resolve(realWs);
      },
      onDisconnect: () => {
        if (currentMode === 'real') {
          debug('Server disconnected');
        }
      },
      onError: () => {
        // Will be handled by timeout
      }
    });

    realWs.connect();

    setTimeout(() => {
      if (!realWs.isRunning) {
        console.log('[Main] Server connection timeout, using mock mode');
        realWs.disconnect();
        resolve(null);
      }
    }, CONNECTION_TIMEOUT);
  });
}

function createMockWebSocket() {
  debug('DEMO - Mock data');
  currentMode = 'mock';

  return new MockWebSocket({
    onMessage: msg => handleMessage(msg),
    onConnect: () => debug('DEMO - Streaming mock data'),
    onDisconnect: () => debug('DEMO - Paused')
  });
}

async function init() {
  debug('Starting...');

  try {
    stream = new GlyphStream('glyph-stream', {
      displaySize: 96,  // 16x16 patterns scaled 6x = BIG chunky pixels!
      onPanelUpdate: updatePanel
    });
    debug('Stream OK');
  } catch (e) {
    debug('Stream error: ' + e.message);
    return;
  }

  const requestedMode = getModeFromURL();
  console.log(`[Main] Requested mode: ${requestedMode}`);

  try {
    if (requestedMode === 'mock') {
      // Force mock mode
      ws = createMockWebSocket();
      ws.connect();
    } else if (requestedMode === 'real') {
      // Force real mode (no fallback)
      ws = new RealWebSocket({
        serverUrl: SERVER_URL,
        onMessage: msg => handleMessage(msg),
        onConnect: () => { debug('LIVE - Server connected'); fetchHistory(); },
        onDisconnect: () => debug('LIVE - Disconnected'),
        onError: (err) => debug('LIVE - Error: ' + err)
      });
      ws.connect();
      currentMode = 'real';
    } else {
      // Auto mode: try real, fall back to mock
      ws = await connectWithFallback();
      if (!ws) {
        ws = createMockWebSocket();
        ws.connect();
      }
    }
  } catch (e) {
    debug('WS error: ' + e.message);
    console.error('[Main] WebSocket error:', e);
  }

  document.getElementById('btn-pause')?.addEventListener('click', function() {
    const paused = !ws.togglePause();
    this.textContent = paused ? 'RESUME' : 'PAUSE';
  });

  document.getElementById('btn-clear')?.addEventListener('click', () => {
    stream.clear();
    const logEl = document.getElementById('message-log');
    if (logEl) logEl.innerHTML = '';
    debug('Cleared');
  });

  const modeEl = document.getElementById('mode-indicator');
  if (modeEl) {
    modeEl.textContent = currentMode.toUpperCase();
    modeEl.className = `mode-${currentMode}`;
  }

  if (currentMode === 'real') {
    startKnowledgePolling();
  }
}

function startKnowledgePolling() {
  updateKnowledgeStats();
  knowledgePollTimer = setInterval(updateKnowledgeStats, 5000);
}

async function updateKnowledgeStats() {
  try {
    const resp = await fetch(`${API_BASE}/knowledge/stats`);
    if (!resp.ok) return;
    const stats = await resp.json();

    const el = document.getElementById('knowledge-stats');
    if (!el) return;

    let text =
      `STORED: ${stats.totalMessages} msgs | ` +
      `AGENTS: ${stats.activeAgents} | ` +
      `PATTERNS: ${stats.sequencesDetected} | ` +
      `COMPOUNDS: ${stats.compoundGlyphs}`;
    if (stats.pendingProposals > 0) {
      text += ` | PENDING: ${stats.pendingProposals}`;
    }
    el.textContent = text;
  } catch {
    // Server unavailable
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

window.ayni = { stream, ws };

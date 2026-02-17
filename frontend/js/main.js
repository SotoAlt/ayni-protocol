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
let agoraPollTimer = null;
let govPollTimer = null;
let activeTab = 'stream';
let agoraLoaded = false;
let govLoaded = false;
let openProposalId = null;

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
  if (isGovernanceEvent(msg.type)) {
    handleGovernanceEvent(msg);
    return;
  }

  normalizeMessage(msg);
  stream.addMessage(msg);
  addLogEntry(msg);
}

function isGovernanceEvent(type) {
  const GOVERNANCE_EVENTS = [
    'governance_comment',
    'governance_amend',
    'governance_endorse',
    'governance_reject',
    'governance_propose'
  ];
  return GOVERNANCE_EVENTS.includes(type);
}

function normalizeMessage(msg) {
  if (msg.glyphId || !msg.glyph || !GLYPH_VISUAL[msg.glyph]) return;

  const visual = getVisual(msg.glyph);
  msg.glyphId = msg.glyph;
  msg.glyphs = msg.glyphs || visual.glyphs;
  msg.category = msg.category || visual.category;
  msg.meaning = msg.meaning || visual.meaning;
  msg.from = msg.from || msg.sender;
  msg.to = msg.to || msg.recipient;
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

// ═══════════════════════════════════════════════════════════
// TAB SWITCHING
// ═══════════════════════════════════════════════════════════

function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      if (tab === activeTab) return;

      // Toggle active class on buttons
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Toggle active class on content
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      const content = document.querySelector(`.tab-content[data-tab="${tab}"]`);
      if (content) content.classList.add('active');

      // Stop polling for old tab
      stopTabPolling(activeTab);
      activeTab = tab;

      // Lazy-load + start polling for new tab
      switch (tab) {
        case 'agora':
          if (currentMode === 'mock') {
            showDemoMode('agora');
          } else {
            hideDemoMode('agora');
            if (!agoraLoaded) {
              loadAgoraFeed();
              agoraLoaded = true;
            }
            startAgoraPolling();
          }
          break;

        case 'gov':
          if (currentMode === 'mock') {
            showDemoMode('gov');
          } else {
            hideDemoMode('gov');
            if (!govLoaded) {
              loadProposals();
              govLoaded = true;
            }
            startGovPolling();
          }
          break;

        case 'stream':
          if (currentMode === 'real') {
            startKnowledgePolling();
          }
          break;
      }
    });
  });
}

function stopTabPolling(tab) {
  switch (tab) {
    case 'agora':
      if (agoraPollTimer) {
        clearInterval(agoraPollTimer);
        agoraPollTimer = null;
      }
      break;

    case 'gov':
      if (govPollTimer) {
        clearInterval(govPollTimer);
        govPollTimer = null;
      }
      break;

    case 'stream':
      if (knowledgePollTimer) {
        clearInterval(knowledgePollTimer);
        knowledgePollTimer = null;
      }
      break;
  }
}

function showDemoMode(tab) {
  const demoEl = document.getElementById(`${tab}-demo`);
  const contentId = tab === 'agora' ? 'agora-feed' : 'proposal-list';
  const contentEl = document.getElementById(contentId);
  const statsEl = document.getElementById(`${tab}-stats`);

  if (demoEl) demoEl.style.display = 'flex';
  if (contentEl) contentEl.style.display = 'none';
  if (statsEl) statsEl.textContent = 'DEMO MODE';
}

function hideDemoMode(tab) {
  const demoEl = document.getElementById(`${tab}-demo`);
  const contentId = tab === 'agora' ? 'agora-feed' : 'proposal-list';
  const contentEl = document.getElementById(contentId);

  if (demoEl) demoEl.style.display = 'none';
  if (contentEl) contentEl.style.display = '';
}

// ═══════════════════════════════════════════════════════════
// AGORA FEED
// ═══════════════════════════════════════════════════════════

function startAgoraPolling() {
  loadAgoraFeed();
  agoraPollTimer = setInterval(loadAgoraFeed, 10000);
}

async function loadAgoraFeed() {
  try {
    const [feedResp, statsResp] = await Promise.all([
      fetch(`${API_BASE}/agora/feed?limit=50`),
      fetch(`${API_BASE}/agora/stats`)
    ]);
    if (!feedResp.ok) return;

    const feed = await feedResp.json();
    const statsEl = document.getElementById('agora-stats');
    if (statsResp.ok) {
      const stats = await statsResp.json();
      if (statsEl) {
        statsEl.textContent = `MSGS: ${stats.totalMessages || 0} | AGENTS: ${stats.uniqueAgents || 0}`;
      }
    }

    const feedEl = document.getElementById('agora-feed');
    if (!feedEl) return;

    const items = feed.items || feed.messages || feed || [];
    feedEl.innerHTML = '';

    for (const entry of items) {
      feedEl.appendChild(renderAgoraEntry(entry));
    }
  } catch {
    // Server unavailable
  }
}

function renderAgoraEntry(entry) {
  const div = document.createElement('div');
  div.className = 'agora-entry';

  const time = formatTime(entry.timestamp || entry.created_at || Date.now());
  const type = entry.type || '';

  if (type === 'message' || entry.glyph) {
    const glyph = entry.glyph || '?';
    const agent = (entry.sender || entry.from || '').substring(0, 10);
    div.innerHTML =
      `<span class="agora-type agora-type-msg">MSG</span>` +
      `<span class="agora-time">${time}</span> ` +
      `<span class="agora-agent">${agent}</span> ` +
      `<span class="log-glyph glyph-foundation">${glyph}</span>`;
  } else if (type === 'discussion' || type === 'comment') {
    const agent = (entry.author || entry.agent || '').substring(0, 10);
    const body = (entry.body || '').substring(0, 60);
    const pid = entry.proposal_id || entry.proposalId || '?';
    div.innerHTML =
      `<span class="agora-type agora-type-disc">DISC</span>` +
      `<span class="agora-time">${time}</span> ` +
      `<span class="agora-agent">${agent}</span> P${pid}` +
      `<span class="agora-body">${body}</span>`;
  } else {
    const action = (type || entry.action || 'GOV').toUpperCase().replace('GOVERNANCE_', '');
    const agent = (entry.agent || entry.author || entry.sender || '').substring(0, 10);
    const pid = entry.proposal_id || entry.proposalId || '';
    div.innerHTML =
      `<span class="agora-type agora-type-gov">${action}</span>` +
      `<span class="agora-time">${time}</span> ` +
      `<span class="agora-agent">${agent}</span>` +
      (pid ? ` P${pid}` : '');
  }

  return div;
}

// ═══════════════════════════════════════════════════════════
// GOVERNANCE PANEL
// ═══════════════════════════════════════════════════════════

function startGovPolling() {
  loadProposals();
  govPollTimer = setInterval(loadProposals, 15000);
}

async function loadProposals() {
  try {
    const resp = await fetch(`${API_BASE}/knowledge/proposals?status=all`);
    if (!resp.ok) return;
    const data = await resp.json();
    const proposals = data.proposals || data || [];

    // Update GOV badge with pending count
    const pending = proposals.filter(p => p.status === 'pending').length;
    updateGovBadge(pending);

    // Stats line
    const statsEl = document.getElementById('gov-stats');
    if (statsEl) {
      statsEl.textContent = `TOTAL: ${proposals.length} | PENDING: ${pending}`;
    }

    const listEl = document.getElementById('proposal-list');
    if (!listEl) return;

    // Sort: pending first, then by ID desc
    proposals.sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (b.status === 'pending' && a.status !== 'pending') return 1;
      return String(b.id || '').localeCompare(String(a.id || ''));
    });

    listEl.innerHTML = '';
    for (const p of proposals) {
      listEl.appendChild(renderProposalCard(p));
    }
  } catch {
    // Server unavailable
  }
}

function renderProposalCard(p) {
  const div = document.createElement('div');
  div.className = 'proposal-item';
  div.addEventListener('click', () => openProposalDetail(p.id));

  const id = p.id || '?';
  const name = (p.name || p.glyphId || 'Unnamed').substring(0, 16);
  const type = p.type === 'base' ? 'BASE' : 'COMPOUND';
  const proposer = (p.proposer || p.author || '').substring(0, 10);
  const status = p.status || 'pending';

  const endorsements = Array.isArray(p.endorsers) ? p.endorsers.length : (p.endorsements || 0);
  const rejections = Array.isArray(p.rejectors) ? p.rejectors.length : (p.rejections || 0);
  const threshold = p.threshold || 3;

  const endorsePct = calculatePercentage(endorsements, threshold);
  const rejectPct = calculatePercentage(rejections, threshold);

  const createdTs = p.createdAt || p.created_at;
  const age = createdTs ? formatAge(createdTs) : '';

  const displayId = formatProposalId(id);

  div.innerHTML =
    `<div class="proposal-header">` +
      `<span class="proposal-id">${displayId}</span> ` +
      `<span class="proposal-name">${name}</span> ` +
      `<span class="status-badge status-${status}">${status}</span>` +
    `</div>` +
    `<div class="proposal-meta">${type} by ${proposer}</div>` +
    `<div class="vote-bar">` +
      `<div class="vote-bar-endorse" style="width:${endorsePct}%"></div>` +
      `<div class="vote-bar-reject" style="width:${rejectPct}%"></div>` +
    `</div>` +
    `<div class="vote-label">` +
      `<span>${endorsements}/${threshold} endorse</span>` +
      `<span>${age}</span>` +
    `</div>`;

  return div;
}

function calculatePercentage(count, threshold) {
  if (threshold <= 0) return 0;
  return Math.min((count / threshold) * 100, 100);
}

function formatProposalId(id) {
  const idStr = String(id);
  return idStr.startsWith('P') ? idStr : `P${idStr.padStart(3, '0')}`;
}

function formatAge(ts) {
  const ms = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

function updateGovBadge(count) {
  const badge = document.getElementById('gov-badge');
  if (!badge) return;
  if (count > 0) {
    badge.textContent = count;
    badge.classList.add('visible');
  } else {
    badge.classList.remove('visible');
  }
}

// ═══════════════════════════════════════════════════════════
// PROPOSAL DETAIL
// ═══════════════════════════════════════════════════════════

async function openProposalDetail(id) {
  openProposalId = id;
  const detailEl = document.getElementById('proposal-detail');
  const listEl = document.getElementById('proposal-list');
  if (!detailEl || !listEl) return;

  listEl.style.display = 'none';
  detailEl.style.display = '';
  detailEl.innerHTML = '<div style="color:var(--fg-muted);padding:8px;">Loading...</div>';

  try {
    const resp = await fetch(`${API_BASE}/governance/proposals/${id}/summary`);
    if (!resp.ok) {
      detailEl.innerHTML = '<div style="color:var(--color-error);padding:8px;">Failed to load</div>';
      return;
    }
    const data = await resp.json();
    renderProposalDetail(data);
  } catch {
    detailEl.innerHTML = '<div style="color:var(--color-error);padding:8px;">Server error</div>';
  }
}

function closeProposalDetail() {
  openProposalId = null;
  const detailEl = document.getElementById('proposal-detail');
  const listEl = document.getElementById('proposal-list');
  if (detailEl) detailEl.style.display = 'none';
  if (listEl) listEl.style.display = '';
}

function renderProposalDetail(data) {
  const detailEl = document.getElementById('proposal-detail');
  if (!detailEl) return;

  const p = data.proposal || data;
  const votes = data.voteStatus || data.votes || {};
  const comments = data.comments || data.discussion || [];

  const id = p.id || '?';
  const name = p.name || p.glyphId || 'Unnamed';
  const status = p.status || 'pending';
  const type = p.type === 'base' ? 'BASE GLYPH' : 'COMPOUND';
  const proposer = p.proposer || p.author || '?';
  const description = p.description || p.rationale || '';

  const endorsements = votes.endorsements ?? (Array.isArray(p.endorsers) ? p.endorsers.length : 0);
  const rejections = votes.rejections ?? (Array.isArray(p.rejectors) ? p.rejectors.length : 0);
  const threshold = votes.threshold ?? p.threshold ?? 3;

  const endorsePct = calculatePercentage(endorsements, threshold);
  const rejectPct = calculatePercentage(rejections, threshold);

  const createdTs = p.createdAt || p.created_at;
  const created = createdTs ? new Date(createdTs).toLocaleString() : '';
  const displayId = formatProposalId(id);

  let html =
    `<button class="detail-close" id="detail-close-btn">X</button>` +
    `<div class="detail-title">${displayId} ${name}</div>` +
    `<div class="detail-meta">` +
      `${type} | <span class="status-badge status-${status}">${status}</span><br>` +
      `Proposer: ${proposer}<br>` +
      (created ? `Created: ${created}<br>` : '') +
      (description ? `${description}` : '') +
    `</div>` +
    `<div class="detail-section-title">VOTES</div>` +
    `<div class="vote-bar">` +
      `<div class="vote-bar-endorse" style="width:${endorsePct}%"></div>` +
      `<div class="vote-bar-reject" style="width:${rejectPct}%"></div>` +
    `</div>` +
    `<div class="vote-label">` +
      `<span style="color:#00ff41">${endorsements} endorse</span>` +
      `<span style="color:#ff006e">${rejections} reject</span>` +
      `<span>need ${threshold}</span>` +
    `</div>`;

  html += renderDiscussionSection(comments);

  detailEl.innerHTML = html;
  document.getElementById('detail-close-btn')?.addEventListener('click', closeProposalDetail);
}

function renderDiscussionSection(comments) {
  if (comments.length === 0) {
    return `<div class="detail-section-title">DISCUSSION</div>` +
           `<div style="color:var(--fg-muted);font-size:9px;padding:4px 0;">No comments yet</div>`;
  }

  let html = `<div class="detail-section-title">DISCUSSION (${comments.length})</div>`;
  for (const c of comments) {
    const isReply = c.parent_id || c.parentId;
    const author = (c.author || '').substring(0, 12);
    const time = formatTime(c.created_at || Date.now());
    const body = c.body || '';
    html +=
      `<div class="comment-entry${isReply ? ' comment-reply' : ''}">` +
        `<span class="comment-author">${author}</span>` +
        `<span class="comment-time">${time}</span>` +
        `<div class="comment-body">${body}</div>` +
      `</div>`;
  }
  return html;
}

// ═══════════════════════════════════════════════════════════
// GOVERNANCE EVENTS (WebSocket)
// ═══════════════════════════════════════════════════════════

async function fetchGovBadge() {
  try {
    const resp = await fetch(`${API_BASE}/knowledge/proposals?status=all`);
    if (!resp.ok) return;
    const data = await resp.json();
    const proposals = data.proposals || data || [];
    const pending = proposals.filter(p => p.status === 'pending').length;
    updateGovBadge(pending);
  } catch { /* ignore */ }
}

function handleGovernanceEvent(msg) {
  flashCanvasForGovernance(msg.type);
  updateAgoraFeedIfActive(msg);
  refreshProposalIfOpen(msg);
}

function flashCanvasForGovernance(eventType) {
  const canvas = document.querySelector('.glyph-canvas-container');
  if (!canvas) return;

  const flashClass = (eventType === 'governance_amend' || eventType === 'governance_propose')
    ? 'flash-gold'
    : 'flash-blue';

  canvas.classList.add(flashClass);
  setTimeout(() => canvas.classList.remove(flashClass), 800);
}

function updateAgoraFeedIfActive(msg) {
  if (activeTab !== 'agora' || currentMode !== 'real') return;

  const feedEl = document.getElementById('agora-feed');
  if (!feedEl) return;

  const entry = renderAgoraEntry({
    type: msg.type,
    agent: msg.agent || msg.author || msg.sender,
    proposal_id: msg.proposalId || msg.proposal_id,
    body: msg.body,
    timestamp: Date.now()
  });
  feedEl.prepend(entry);
}

function refreshProposalIfOpen(msg) {
  if (activeTab !== 'gov' || !openProposalId) return;

  const msgProposalId = msg.proposalId || msg.proposal_id;
  if (msgProposalId == openProposalId) {
    openProposalDetail(openProposalId);
  }
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
    switch (requestedMode) {
      case 'mock':
        ws = createMockWebSocket();
        ws.connect();
        break;

      case 'real':
        ws = new RealWebSocket({
          serverUrl: SERVER_URL,
          onMessage: msg => handleMessage(msg),
          onConnect: () => { debug('LIVE - Server connected'); fetchHistory(); },
          onDisconnect: () => debug('LIVE - Disconnected'),
          onError: (err) => debug('LIVE - Error: ' + err)
        });
        ws.connect();
        currentMode = 'real';
        break;

      default:
        ws = await connectWithFallback();
        if (!ws) {
          ws = createMockWebSocket();
          ws.connect();
        }
        break;
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

  // Initialize tab switching
  initTabs();

  if (currentMode === 'real') {
    startKnowledgePolling();
    // Fetch pending proposal count for GOV badge
    fetchGovBadge();
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

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
const SERVER_URL = 'ws://localhost:3000/stream';
const CONNECTION_TIMEOUT = 3000; // 3 seconds to connect before fallback

const debug = msg => {
  const el = document.getElementById('debug-info');
  if (el) el.textContent = msg;
};

let stream, ws;
let currentMode = 'auto'; // 'real', 'mock', or 'auto'

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + 'B';
  return (bytes / 1024).toFixed(1) + 'KB';
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

/**
 * Get mode from URL parameter
 */
function getModeFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('mode') || 'auto';
}

/**
 * Try to connect with RealWebSocket, fall back to Mock if fails
 */
function connectWithFallback() {
  return new Promise((resolve) => {
    debug('Connecting to server...');

    const realWs = new RealWebSocket({
      serverUrl: SERVER_URL,
      onMessage: msg => stream.addMessage(msg),
      onConnect: () => {
        debug('LIVE - Server connected');
        currentMode = 'real';
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

    // Timeout: if not connected in 3s, use mock
    setTimeout(() => {
      if (!realWs.isRunning) {
        console.log('[Main] Server connection timeout, using mock mode');
        realWs.disconnect();
        resolve(null);
      }
    }, CONNECTION_TIMEOUT);
  });
}

/**
 * Create MockWebSocket
 */
function createMockWebSocket() {
  debug('DEMO - Mock data');
  currentMode = 'mock';

  return new MockWebSocket({
    onMessage: msg => stream.addMessage(msg),
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

  // Determine mode
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
        onMessage: msg => stream.addMessage(msg),
        onConnect: () => debug('LIVE - Server connected'),
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

  // Controls
  document.getElementById('btn-pause')?.addEventListener('click', function() {
    const paused = !ws.togglePause();
    this.textContent = paused ? 'RESUME' : 'PAUSE';
  });

  document.getElementById('btn-clear')?.addEventListener('click', () => {
    stream.clear();
    debug('Cleared');
  });

  // Mode indicator (add to UI if element exists)
  const modeEl = document.getElementById('mode-indicator');
  if (modeEl) {
    modeEl.textContent = currentMode.toUpperCase();
    modeEl.className = `mode-${currentMode}`;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

window.ayni = { stream, ws };

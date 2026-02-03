/**
 * Main - Ayni Glyph Stream v2
 */

import { GlyphStream } from './textileRiver.js';
import { MockWebSocket } from './websocket.js';
import { GLYPH_MEANINGS, CATEGORY_COLORS } from './glyphs.js';

const debug = msg => {
  const el = document.getElementById('debug-info');
  if (el) el.textContent = msg;
};

let stream, ws;

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

function init() {
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

  try {
    ws = new MockWebSocket({
      onMessage: msg => stream.addMessage(msg),
      onConnect: () => debug('Connected - streaming'),
      onDisconnect: () => debug('Disconnected')
    });
    ws.connect();
  } catch (e) {
    debug('WS error: ' + e.message);
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
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

window.ayni = { stream, ws };

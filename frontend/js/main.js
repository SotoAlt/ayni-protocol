/**
 * Main - Application entry point
 *
 * Initializes all components and wires them together.
 */

import { GlyphRiver } from './glyphRiver.js';
import { NetworkGraph } from './networkGraph.js';
import { Timeline } from './timeline.js';
import { MockWebSocket } from './websocket.js';

// Global state
const state = {
  isPaused: false,
  speed: 1,
  style: 'geometric', // 'geometric' or 'representational'
  totalMessages: 0,
  totalBytes: 0,
  tokenSavings: 65 // Estimated average savings
};

// Initialize components
let river, network, timeline, ws;

/**
 * Initialize the application
 */
function init() {
  // Initialize Glyph River
  river = new GlyphRiver('river-container', {
    maxGlyphs: 8,
    onGlyphClick: showGlyphModal
  });

  // Initialize Network Graph
  network = new NetworkGraph('network-container', {
    onNodeClick: (node) => {
      timeline.highlightAgent(node.id);
      updateNetworkInfo(`Selected: ${node.id} (${node.messageCount} messages)`);
    },
    onNodeHover: (node, isHover) => {
      if (isHover) {
        updateNetworkInfo(`${node.id}: ${node.messageCount} messages`);
      } else {
        updateNetworkInfo('Hover over a node for details');
      }
    }
  });

  // Initialize Timeline
  timeline = new Timeline('timeline-container', {
    maxEntries: 50,
    onEntryClick: showGlyphModal
  });

  // Initialize Mock WebSocket
  ws = new MockWebSocket({
    onMessage: handleMessage,
    onConnect: () => console.log('Mock WebSocket connected'),
    onDisconnect: () => console.log('Mock WebSocket disconnected')
  });

  // Setup UI controls
  setupControls();

  // Start the simulation
  ws.connect();

  // Update stats periodically
  setInterval(updateStats, 500);

  console.log('AYNI Glyph River initialized');
}

/**
 * Handle incoming message
 */
function handleMessage(message) {
  // Update state
  state.totalMessages++;
  state.totalBytes += message.size;

  // Add to river
  river.addGlyph(message);

  // Add to network
  network.addLink(message.from, message.to, message.category);

  // Add to timeline
  timeline.addEntry(message);

  // Update stats display
  updateStats();
}

/**
 * Update statistics display
 */
function updateStats() {
  document.getElementById('stat-messages').textContent =
    state.totalMessages.toLocaleString();

  document.getElementById('stat-agents').textContent =
    network.getStats().agents;

  document.getElementById('stat-bytes').textContent =
    formatBytes(state.totalBytes);

  document.getElementById('stat-savings').textContent =
    `${state.tokenSavings}%`;
}

/**
 * Format bytes for display
 */
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

/**
 * Setup UI control handlers
 */
function setupControls() {
  // Pause button
  const pauseBtn = document.getElementById('btn-pause');
  pauseBtn.addEventListener('click', () => {
    state.isPaused = ws.togglePause();
    pauseBtn.classList.toggle('paused', !state.isPaused);
  });

  // Speed button
  const speedBtn = document.getElementById('btn-speed');
  const speeds = [0.5, 1, 2, 4];
  let speedIndex = 1;

  speedBtn.addEventListener('click', () => {
    speedIndex = (speedIndex + 1) % speeds.length;
    state.speed = speeds[speedIndex];
    ws.setSpeed(state.speed);
    speedBtn.querySelector('.speed-indicator').textContent = `${state.speed}x`;
  });

  // Style toggle button
  const styleBtn = document.getElementById('btn-style');
  styleBtn.addEventListener('click', () => {
    state.style = state.style === 'geometric' ? 'representational' : 'geometric';
    styleBtn.classList.toggle('active', state.style === 'representational');
    // Note: Style switching would require re-rendering glyphs
    // This is a UI placeholder for that feature
  });

  // Clear log button
  const clearBtn = document.getElementById('btn-clear-log');
  clearBtn.addEventListener('click', () => {
    timeline.clear();
  });

  // Modal close
  const modal = document.getElementById('glyph-modal');
  const modalClose = document.getElementById('modal-close');
  const modalBackdrop = modal.querySelector('.modal__backdrop');

  modalClose.addEventListener('click', () => hideModal());
  modalBackdrop.addEventListener('click', () => hideModal());

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideModal();
    if (e.key === ' ' && e.target === document.body) {
      e.preventDefault();
      pauseBtn.click();
    }
  });
}

/**
 * Show glyph detail modal
 */
function showGlyphModal(message) {
  const modal = document.getElementById('glyph-modal');

  // Update modal content
  document.getElementById('modal-glyph-id').textContent = message.glyph;
  document.getElementById('modal-glyph-meaning').textContent = message.meaning;
  document.getElementById('modal-from').textContent = message.from;
  document.getElementById('modal-to').textContent = message.to;
  document.getElementById('modal-time').textContent =
    new Date(message.timestamp).toLocaleString();
  document.getElementById('modal-size').textContent = `${message.size} bytes`;
  document.getElementById('modal-encrypted').textContent =
    message.encrypted ? 'Yes' : 'No';
  document.getElementById('modal-payload').textContent =
    JSON.stringify(message.data, null, 2);

  // Update glyph color in header based on category
  const glyphIdEl = document.getElementById('modal-glyph-id');
  glyphIdEl.className = 'modal__glyph-id';
  glyphIdEl.style.color = getCategoryColor(message.category);
  glyphIdEl.style.textShadow = getCategoryGlow(message.category);

  // Render large glyph
  const canvas = document.getElementById('modal-canvas');
  river.renderGlyphLarge(canvas, message.glyph, message.category, 256);

  // Show modal
  modal.classList.add('active');
}

/**
 * Hide modal
 */
function hideModal() {
  const modal = document.getElementById('glyph-modal');
  modal.classList.remove('active');
  timeline.clearHighlight();
}

/**
 * Update network info display
 */
function updateNetworkInfo(text) {
  const info = document.getElementById('network-info');
  info.innerHTML = `<span class="network-info__label">${text}</span>`;
}

/**
 * Get color for category
 */
function getCategoryColor(category) {
  const colors = {
    query: '#00d9ff',
    response: '#00ff41',
    error: '#ff006e',
    action: '#ffcc00',
    payment: '#9d4edd',
    state: '#00b4d8'
  };
  return colors[category] || colors.query;
}

/**
 * Get glow for category
 */
function getCategoryGlow(category) {
  const glows = {
    query: '0 0 20px #00d9ff66, 0 0 40px #00d9ff33',
    response: '0 0 20px #00ff4166, 0 0 40px #00ff4133',
    error: '0 0 20px #ff006e66, 0 0 40px #ff006e33',
    action: '0 0 20px #ffcc0066, 0 0 40px #ffcc0033',
    payment: '0 0 20px #9d4edd66, 0 0 40px #9d4edd33',
    state: '0 0 20px #00b4d866, 0 0 40px #00b4d833'
  };
  return glows[category] || glows.query;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Export for debugging
window.ayni = {
  river,
  network,
  timeline,
  ws,
  state
};

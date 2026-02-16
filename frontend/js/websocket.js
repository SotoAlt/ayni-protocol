/**
 * Ayni Protocol WebSocket - Real & Mock Communication
 *
 * RealWebSocket: Connects to the Ayni server at ws://localhost:3000/stream
 * MockWebSocket: Generates simulated multi-glyph messages for demos
 *
 * Both use the same interface so GlyphStream doesn't need to change.
 */

import { GLYPH_COMBOS, GLYPH_MEANINGS, GLYPH_CATEGORIES } from './glyphs.js';

// ═══════════════════════════════════════════════════════════════
// REAL WEBSOCKET - Connects to Ayni Server
// ═══════════════════════════════════════════════════════════════

const DEFAULT_SERVER_URL = (typeof window !== 'undefined' && window.location.hostname !== 'localhost')
  ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/stream`
  : 'ws://localhost:3000/stream';

/**
 * RealWebSocket - connects to the Ayni Protocol server
 */
export class RealWebSocket {
  constructor(options = {}) {
    this.serverUrl = options.serverUrl || DEFAULT_SERVER_URL;
    this.onMessage = options.onMessage || (() => {});
    this.onConnect = options.onConnect || (() => {});
    this.onDisconnect = options.onDisconnect || (() => {});
    this.onError = options.onError || (() => {});

    this.socket = null;
    this.isRunning = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 2000;
    this.messageCount = 0;
    this.totalBytes = 0;
  }

  /**
   * Connect to the server
   */
  connect() {
    console.log(`[RealWebSocket] Connecting to ${this.serverUrl}...`);

    try {
      this.socket = new WebSocket(this.serverUrl);

      this.socket.onopen = () => {
        console.log('[RealWebSocket] Connected!');
        this.isRunning = true;
        this.reconnectAttempts = 0;
        this.onConnect();
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Handle connection message
          if (data.type === 'connected') {
            console.log(`[RealWebSocket] ${data.message} (${data.clients} clients)`);
            return;
          }

          // Handle pong
          if (data.type === 'pong') {
            return;
          }

          // Handle regular message
          this.messageCount++;
          this.totalBytes += data.size || 512;
          this.onMessage(data);

        } catch (err) {
          console.error('[RealWebSocket] Parse error:', err);
        }
      };

      this.socket.onclose = (event) => {
        console.log(`[RealWebSocket] Disconnected (code: ${event.code})`);
        this.isRunning = false;
        this.onDisconnect();

        // Try to reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`[RealWebSocket] Reconnecting in ${this.reconnectDelay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
          setTimeout(() => this.connect(), this.reconnectDelay);
        }
      };

      this.socket.onerror = (error) => {
        console.error('[RealWebSocket] Error:', error);
        this.onError(error);
      };

    } catch (err) {
      console.error('[RealWebSocket] Connection failed:', err);
      this.onError(err);
    }
  }

  /**
   * Disconnect from the server
   */
  disconnect() {
    this.maxReconnectAttempts = 0; // Prevent auto-reconnect
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.isRunning = false;
    this.onDisconnect();
  }

  /**
   * Toggle pause (for compatibility with MockWebSocket)
   * RealWebSocket can't pause incoming messages, but can toggle flag
   */
  togglePause() {
    this.isRunning = !this.isRunning;
    return this.isRunning;
  }

  /**
   * Send a ping to check connection
   */
  ping() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: 'ping' }));
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      messages: this.messageCount,
      bytes: this.totalBytes,
      running: this.isRunning,
      connected: this.socket?.readyState === WebSocket.OPEN,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.messageCount = 0;
    this.totalBytes = 0;
  }
}

// ═══════════════════════════════════════════════════════════════
// MOCK WEBSOCKET - Simulated Messages
// ═══════════════════════════════════════════════════════════════

// Map old layer combos → new glyph IDs (for NANO rendering)
const COMBO_TO_GLYPH_ID = {
  '["asking","database"]': 'Q01',
  '["asking","eye"]': 'Q02',
  '["asking","server"]': 'Q03',
  '["giving","checkmark"]': 'R01',
  '["giving","database"]': 'R02',
  '["giving","database","checkmark"]': 'R02',
  '["celebrating","checkmark"]': 'R03',
  '["waiting","x"]': 'E01',
  '["waiting","clock","x"]': 'E02',
  '["waiting","lock","x"]': 'E03',
  '["running","lightning"]': 'A01',
  '["giving","robot"]': 'A02',
  '["running","database","arrow"]': 'A03',
};

const GLYPH_ID_DOMAINS = {
  Q01: 'humanoid', Q02: 'symbol', Q03: 'symbol',
  R01: 'humanoid', R02: 'humanoid', R03: 'humanoid',
  E01: 'symbol', E02: 'creature', E03: 'symbol',
  A01: 'symbol', A02: 'machine', A03: 'machine',
};

const GLYPH_ID_MEANINGS = {
  Q01: 'Query Database', Q02: 'Search', Q03: 'Query API',
  R01: 'Response OK', R02: 'Data Response', R03: 'Task Complete',
  E01: 'Error', E02: 'Timeout', E03: 'Permission Denied',
  A01: 'Execute', A02: 'Delegate Task', A03: 'Update Data',
};

// Agent definitions with roles and visual identities
const AGENTS = [
  { id: 'Alice', role: 'coordinator', figure: 'thinking' },
  { id: 'Bob', role: 'database', figure: 'waiting' },
  { id: 'Carol', role: 'analyzer', figure: 'thinking' },
  { id: 'Dave', role: 'payment', figure: 'running' },
  { id: 'Eve', role: 'validator', figure: 'asking' },
  { id: 'Claude', role: 'assistant', figure: 'terminal' }
];

// Pre-defined glyph combinations for semantic messages
const MESSAGE_COMBOS = {
  // Query combinations (1-3 glyphs)
  'query-db': ['asking', 'database'],
  'query-db-secure': ['asking', 'database', 'lock'],
  'query-api': ['asking', 'server'],
  'query-network': ['asking', 'spider'],
  'search': ['asking', 'eye'],
  'search-data': ['asking', 'eye', 'database'],

  // Response combinations
  'success': ['giving', 'checkmark'],
  'success-data': ['giving', 'database', 'checkmark'],
  'data-response': ['giving', 'database'],
  'cached-response': ['giving', 'clock', 'checkmark'],

  // Error combinations
  'error': ['waiting', 'x'],
  'error-timeout': ['waiting', 'clock', 'x'],
  'error-permission': ['waiting', 'lock', 'x'],
  'error-notfound': ['asking', 'eye', 'x'],

  // Action combinations
  'execute': ['running', 'lightning'],
  'execute-secure': ['running', 'lightning', 'lock'],
  'update': ['running', 'database', 'arrow'],
  'delete': ['running', 'database', 'x'],
  'create': ['giving', 'database', 'checkmark'],
  'broadcast': ['running', 'antenna'],
  'delegate': ['giving', 'robot'],

  // Payment combinations
  'payment-send': ['running', 'coin'],
  'payment-confirm': ['celebrating', 'coin', 'checkmark'],
  'payment-fail': ['waiting', 'coin', 'x'],
  'payment-request': ['asking', 'coin'],

  // State combinations
  'processing': ['thinking', 'clock'],
  'idle': ['waiting'],
  'complete': ['celebrating', 'checkmark'],
  'watching': ['cat', 'eye'],

  // Agent-to-agent combinations
  'agent-query': ['robot', 'asking', 'database'],
  'agent-response': ['terminal', 'giving', 'checkmark'],
  'agent-error': ['robot', 'waiting', 'x'],
  'agent-delegate': ['robot', 'arrow', 'robot'],

  // Network/data flow combinations
  'send-message': ['bird', 'arrow'],
  'receive-message': ['bird', 'giving'],
  'network-request': ['spider', 'asking'],
  'data-stream': ['fish', 'arrow', 'database'],
  'sync': ['drone', 'arrow', 'server'],

  // Security combinations
  'encrypt': ['lock', 'checkmark'],
  'decrypt': ['lock', 'giving'],
  'authenticate': ['asking', 'lock', 'checkmark'],
  'secure-channel': ['snake', 'lock']
};

// Get meaning for a glyph combo
function getComboMeaning(glyphs) {
  // Check if it's a known combo
  for (const [name, combo] of Object.entries(MESSAGE_COMBOS)) {
    if (JSON.stringify(combo) === JSON.stringify(glyphs)) {
      return name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }
  }

  // Build meaning from individual glyphs
  return glyphs.map(g => GLYPH_MEANINGS[g] || g).join(' + ');
}

// Conversation scenarios using visual storytelling
const SCENARIOS = [
  // Database query flow - visual story
  {
    name: 'database-query',
    steps: [
      { from: 'Alice', to: 'Bob', glyphs: ['asking', 'database'], delay: 100 },
      { from: 'Bob', to: 'Alice', glyphs: ['thinking', 'clock'], delay: 300 },
      { from: 'Bob', to: 'Alice', glyphs: ['giving', 'database', 'checkmark'], delay: 800 }
    ]
  },

  // Encrypted search
  {
    name: 'secure-search',
    steps: [
      { from: 'Alice', to: 'Bob', glyphs: ['asking', 'eye', 'lock'], delay: 100 },
      { from: 'Bob', to: 'Alice', glyphs: ['thinking'], delay: 400 },
      { from: 'Bob', to: 'Alice', glyphs: ['giving', 'checkmark'], delay: 600 }
    ]
  },

  // Multi-agent analysis workflow
  {
    name: 'analysis-workflow',
    steps: [
      { from: 'Alice', to: 'Bob', glyphs: ['asking', 'database'], delay: 100 },
      { from: 'Bob', to: 'Alice', glyphs: ['giving', 'database'], delay: 500 },
      { from: 'Alice', to: 'Carol', glyphs: ['giving', 'robot'], delay: 200 },
      { from: 'Carol', to: 'Alice', glyphs: ['thinking', 'clock'], delay: 100 },
      { from: 'Carol', to: 'Alice', glyphs: ['celebrating', 'checkmark'], delay: 1200 }
    ]
  },

  // Payment flow with confirmation
  {
    name: 'payment-flow',
    steps: [
      { from: 'Alice', to: 'Dave', glyphs: ['running', 'coin'], delay: 100 },
      { from: 'Dave', to: 'Eve', glyphs: ['asking', 'lock'], delay: 300 },
      { from: 'Eve', to: 'Dave', glyphs: ['giving', 'checkmark'], delay: 400 },
      { from: 'Dave', to: 'Alice', glyphs: ['celebrating', 'coin', 'checkmark'], delay: 200 }
    ]
  },

  // Timeout error and retry
  {
    name: 'error-retry',
    steps: [
      { from: 'Alice', to: 'Bob', glyphs: ['asking', 'server'], delay: 100 },
      { from: 'Bob', to: 'Alice', glyphs: ['waiting', 'clock', 'x'], delay: 2000 },
      { from: 'Alice', to: 'Bob', glyphs: ['running', 'lightning'], delay: 500 },
      { from: 'Bob', to: 'Alice', glyphs: ['giving', 'checkmark'], delay: 800 }
    ]
  },

  // Permission denied flow
  {
    name: 'permission-denied',
    steps: [
      { from: 'Carol', to: 'Bob', glyphs: ['asking', 'database'], delay: 100 },
      { from: 'Bob', to: 'Carol', glyphs: ['waiting', 'lock', 'x'], delay: 300 },
      { from: 'Carol', to: 'Alice', glyphs: ['asking', 'lock'], delay: 200 },
      { from: 'Alice', to: 'Bob', glyphs: ['giving', 'lock', 'checkmark'], delay: 100 },
      { from: 'Carol', to: 'Bob', glyphs: ['asking', 'database'], delay: 100 },
      { from: 'Bob', to: 'Carol', glyphs: ['giving', 'database', 'checkmark'], delay: 500 }
    ]
  },

  // Network coordination with multiple agents
  {
    name: 'network-coordination',
    steps: [
      { from: 'Alice', to: 'Bob', glyphs: ['asking', 'database'], delay: 100 },
      { from: 'Alice', to: 'Carol', glyphs: ['asking', 'server'], delay: 50 },
      { from: 'Alice', to: 'Dave', glyphs: ['asking', 'coin'], delay: 50 },
      { from: 'Bob', to: 'Alice', glyphs: ['giving', 'database'], delay: 600 },
      { from: 'Carol', to: 'Alice', glyphs: ['giving', 'checkmark'], delay: 800 },
      { from: 'Dave', to: 'Alice', glyphs: ['giving', 'coin', 'checkmark'], delay: 400 },
      { from: 'Alice', to: 'Eve', glyphs: ['running', 'lightning'], delay: 100 },
      { from: 'Eve', to: 'Alice', glyphs: ['celebrating', 'checkmark'], delay: 500 }
    ]
  },

  // AI assistant helping user
  {
    name: 'assistant-help',
    steps: [
      { from: 'Alice', to: 'Claude', glyphs: ['asking'], delay: 100 },
      { from: 'Claude', to: 'Alice', glyphs: ['terminal', 'thinking'], delay: 200 },
      { from: 'Claude', to: 'Bob', glyphs: ['asking', 'database'], delay: 150 },
      { from: 'Bob', to: 'Claude', glyphs: ['giving', 'database'], delay: 400 },
      { from: 'Claude', to: 'Alice', glyphs: ['terminal', 'giving', 'checkmark'], delay: 300 }
    ]
  },

  // Data streaming workflow
  {
    name: 'data-stream',
    steps: [
      { from: 'Alice', to: 'Bob', glyphs: ['fish', 'arrow', 'database'], delay: 100 },
      { from: 'Bob', to: 'Alice', glyphs: ['thinking', 'clock'], delay: 200 },
      { from: 'Bob', to: 'Alice', glyphs: ['fish', 'arrow'], delay: 300 },
      { from: 'Bob', to: 'Alice', glyphs: ['fish', 'arrow'], delay: 300 },
      { from: 'Bob', to: 'Alice', glyphs: ['fish', 'checkmark'], delay: 300 }
    ]
  },

  // Monitoring and alerts
  {
    name: 'monitoring',
    steps: [
      { from: 'Eve', to: 'Bob', glyphs: ['cat', 'eye'], delay: 100 },
      { from: 'Bob', to: 'Eve', glyphs: ['heart', 'checkmark'], delay: 500 },
      { from: 'Eve', to: 'Carol', glyphs: ['cat', 'eye'], delay: 100 },
      { from: 'Carol', to: 'Eve', glyphs: ['heart', 'checkmark'], delay: 400 },
      { from: 'Eve', to: 'Alice', glyphs: ['giving', 'heart', 'checkmark'], delay: 200 }
    ]
  },

  // Broadcast message
  {
    name: 'broadcast',
    steps: [
      { from: 'Alice', to: 'Bob', glyphs: ['antenna', 'arrow'], delay: 50 },
      { from: 'Alice', to: 'Carol', glyphs: ['antenna', 'arrow'], delay: 50 },
      { from: 'Alice', to: 'Dave', glyphs: ['antenna', 'arrow'], delay: 50 },
      { from: 'Alice', to: 'Eve', glyphs: ['antenna', 'arrow'], delay: 50 },
      { from: 'Bob', to: 'Alice', glyphs: ['checkmark'], delay: 300 },
      { from: 'Carol', to: 'Alice', glyphs: ['checkmark'], delay: 400 },
      { from: 'Dave', to: 'Alice', glyphs: ['checkmark'], delay: 350 },
      { from: 'Eve', to: 'Alice', glyphs: ['checkmark'], delay: 450 }
    ]
  },

  // Drone scouting
  {
    name: 'drone-scout',
    steps: [
      { from: 'Alice', to: 'Eve', glyphs: ['drone', 'eye'], delay: 100 },
      { from: 'Eve', to: 'Alice', glyphs: ['drone', 'arrow', 'server'], delay: 800 },
      { from: 'Eve', to: 'Alice', glyphs: ['giving', 'database'], delay: 400 },
      { from: 'Alice', to: 'Eve', glyphs: ['celebrating', 'checkmark'], delay: 200 }
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // CRYPTO/DeFi SCENARIOS
  // ═══════════════════════════════════════════════════════════

  // DeFi swap flow
  {
    name: 'defi-swap',
    steps: [
      { from: 'Alice', to: 'Dave', glyphs: ['swap'], delay: 100 },
      { from: 'Dave', to: 'Alice', glyphs: ['thinking', 'clock'], delay: 400 },
      { from: 'Dave', to: 'Alice', glyphs: ['swap', 'checkmark'], delay: 800 },
      { from: 'Alice', to: 'Dave', glyphs: ['celebrating', 'coin'], delay: 200 }
    ]
  },

  // Staking flow
  {
    name: 'staking',
    steps: [
      { from: 'Alice', to: 'Dave', glyphs: ['stake', 'coin'], delay: 100 },
      { from: 'Dave', to: 'Eve', glyphs: ['lock', 'checkmark'], delay: 500 },
      { from: 'Eve', to: 'Alice', glyphs: ['giving', 'checkmark'], delay: 300 },
      { from: 'Alice', to: 'Bob', glyphs: ['harvest', 'coin'], delay: 2000 }
    ]
  },

  // Bridge tokens cross-chain
  {
    name: 'bridge-tokens',
    steps: [
      { from: 'Alice', to: 'Dave', glyphs: ['bridge'], delay: 100 },
      { from: 'Dave', to: 'Eve', glyphs: ['bridge', 'lock'], delay: 300 },
      { from: 'Eve', to: 'Dave', glyphs: ['checkmark'], delay: 1500 },
      { from: 'Dave', to: 'Alice', glyphs: ['bridge', 'checkmark'], delay: 200 }
    ]
  },

  // DAO governance vote
  {
    name: 'dao-vote',
    steps: [
      { from: 'Alice', to: 'Bob', glyphs: ['vote'], delay: 100 },
      { from: 'Bob', to: 'Carol', glyphs: ['vote'], delay: 200 },
      { from: 'Carol', to: 'Dave', glyphs: ['vote'], delay: 200 },
      { from: 'Eve', to: 'Alice', glyphs: ['vote', 'checkmark'], delay: 500 }
    ]
  },

  // Limit order + stop loss
  {
    name: 'trading',
    steps: [
      { from: 'Alice', to: 'Dave', glyphs: ['limit'], delay: 100 },
      { from: 'Alice', to: 'Dave', glyphs: ['shield'], delay: 150 },
      { from: 'Dave', to: 'Alice', glyphs: ['thinking', 'clock'], delay: 1000 },
      { from: 'Dave', to: 'Alice', glyphs: ['swap', 'checkmark'], delay: 500 },
      { from: 'Dave', to: 'Alice', glyphs: ['celebrating', 'coin'], delay: 200 }
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // AGENT WORKFLOW SCENARIOS
  // ═══════════════════════════════════════════════════════════

  // Task delegation and completion
  {
    name: 'task-delegation',
    steps: [
      { from: 'Alice', to: 'Bob', glyphs: ['delegate', 'arrow'], delay: 100 },
      { from: 'Bob', to: 'Alice', glyphs: ['heartbeat'], delay: 500 },
      { from: 'Bob', to: 'Alice', glyphs: ['heartbeat'], delay: 1000 },
      { from: 'Bob', to: 'Alice', glyphs: ['task', 'checkmark'], delay: 800 },
      { from: 'Alice', to: 'Bob', glyphs: ['celebrating'], delay: 200 }
    ]
  },

  // Workflow with checkpoint
  {
    name: 'workflow-checkpoint',
    steps: [
      { from: 'Alice', to: 'Carol', glyphs: ['running', 'lightning'], delay: 100 },
      { from: 'Carol', to: 'Alice', glyphs: ['checkpoint'], delay: 600 },
      { from: 'Carol', to: 'Alice', glyphs: ['heartbeat'], delay: 500 },
      { from: 'Carol', to: 'Alice', glyphs: ['checkpoint'], delay: 600 },
      { from: 'Carol', to: 'Alice', glyphs: ['task', 'checkmark'], delay: 400 }
    ]
  },

  // Multi-agent broadcast
  {
    name: 'agent-broadcast',
    steps: [
      { from: 'Alice', to: 'Bob', glyphs: ['broadcast'], delay: 50 },
      { from: 'Alice', to: 'Carol', glyphs: ['broadcast'], delay: 50 },
      { from: 'Alice', to: 'Dave', glyphs: ['broadcast'], delay: 50 },
      { from: 'Alice', to: 'Eve', glyphs: ['broadcast'], delay: 50 },
      { from: 'Bob', to: 'Alice', glyphs: ['heartbeat'], delay: 300 },
      { from: 'Carol', to: 'Alice', glyphs: ['heartbeat'], delay: 400 },
      { from: 'Dave', to: 'Alice', glyphs: ['heartbeat'], delay: 350 },
      { from: 'Eve', to: 'Alice', glyphs: ['heartbeat'], delay: 500 }
    ]
  },

  // Alert and recovery
  {
    name: 'alert-recovery',
    steps: [
      { from: 'Eve', to: 'Alice', glyphs: ['alert'], delay: 100 },
      { from: 'Alice', to: 'Bob', glyphs: ['delegate'], delay: 200 },
      { from: 'Bob', to: 'Alice', glyphs: ['heartbeat'], delay: 500 },
      { from: 'Bob', to: 'Eve', glyphs: ['task', 'checkmark'], delay: 800 },
      { from: 'Eve', to: 'Alice', glyphs: ['checkmark'], delay: 200 }
    ]
  },

  // Logging and sync
  {
    name: 'log-sync',
    steps: [
      { from: 'Bob', to: 'Alice', glyphs: ['log'], delay: 300 },
      { from: 'Carol', to: 'Alice', glyphs: ['log'], delay: 400 },
      { from: 'Dave', to: 'Alice', glyphs: ['log'], delay: 350 },
      { from: 'Alice', to: 'Eve', glyphs: ['sync'], delay: 200 },
      { from: 'Eve', to: 'Alice', glyphs: ['checkmark'], delay: 500 }
    ]
  }
];

/**
 * MockWebSocket class - simulates visual storytelling message stream
 */
export class MockWebSocket {
  constructor(options = {}) {
    this.onMessage = options.onMessage || (() => {});
    this.onConnect = options.onConnect || (() => {});
    this.onDisconnect = options.onDisconnect || (() => {});

    this.isRunning = false;
    this.speed = 1;
    this.currentScenario = null;
    this.scenarioIndex = 0;
    this.stepIndex = 0;
    this.timeoutId = null;
    this.messageCount = 0;
    this.totalBytes = 0;
  }

  /**
   * Start the mock connection
   */
  connect() {
    console.log('MockWebSocket.connect() called');
    this.isRunning = true;
    this.onConnect();
    console.log('Calling runNextScenario...');
    this.runNextScenario();
  }

  /**
   * Stop the mock connection
   */
  disconnect() {
    this.isRunning = false;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.onDisconnect();
  }

  /**
   * Pause/resume message generation
   */
  togglePause() {
    if (this.isRunning) {
      this.isRunning = false;
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }
      return false;
    } else {
      this.isRunning = true;
      this.runNextStep();
      return true;
    }
  }

  /**
   * Set speed multiplier
   */
  setSpeed(speed) {
    this.speed = speed;
  }

  /**
   * Run next scenario
   */
  runNextScenario() {
    console.log('runNextScenario called, isRunning:', this.isRunning);
    if (!this.isRunning) return;

    // 10% chance to emit a mock governance event between scenarios
    if (Math.random() < 0.1) {
      this.emitMockGovernanceEvent();
    }

    // Pick random scenario
    this.currentScenario = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
    console.log('Selected scenario:', this.currentScenario.name);
    this.stepIndex = 0;
    this.runNextStep();
  }

  /**
   * Emit a mock governance event (comment or amend)
   */
  emitMockGovernanceEvent() {
    const agents = ['GovAlice', 'GovBob', 'GovCarol', 'GovDave'];
    const agent = agents[Math.floor(Math.random() * agents.length)];
    const proposalId = Math.floor(Math.random() * 5) + 1;
    const isComment = Math.random() > 0.3;

    if (isComment) {
      this.onMessage({
        type: 'governance_comment',
        agent,
        proposalId,
        body: 'Mock discussion comment for demo',
        timestamp: Date.now()
      });
    } else {
      this.onMessage({
        type: 'governance_amend',
        agent,
        proposalId,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Run next step in current scenario
   */
  runNextStep() {
    if (!this.isRunning) return;

    const scenario = this.currentScenario;
    if (!scenario || this.stepIndex >= scenario.steps.length) {
      // Scenario complete, start new one after delay
      this.timeoutId = setTimeout(() => {
        this.runNextScenario();
      }, (1000 + Math.random() * 2000) / this.speed);
      return;
    }

    const step = scenario.steps[this.stepIndex];
    const delay = step.delay / this.speed;

    this.timeoutId = setTimeout(() => {
      this.emitMessage(step);
      this.stepIndex++;
      this.runNextStep();
    }, delay);
  }

  /**
   * Emit a message with visual glyphs
   */
  emitMessage(step) {
    const glyphs = step.glyphs || [step.glyph];

    // Auto-detect glyphId from layer combo
    const glyphId = step.glyphId || COMBO_TO_GLYPH_ID[JSON.stringify(glyphs)] || null;

    // Determine primary category from first glyph
    const category = glyphId
      ? (GLYPH_ID_DOMAINS[glyphId] || 'foundation')
      : this.getCategoryFromGlyph(glyphs[0]);

    // Calculate byte size (16x16 = 32 bytes per NANO glyph)
    const size = glyphId ? 32 : glyphs.length * 512;

    // Get meaning
    const meaning = glyphId
      ? (GLYPH_ID_MEANINGS[glyphId] || getComboMeaning(glyphs))
      : getComboMeaning(glyphs);

    // Create message
    const message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      from: step.from,
      to: step.to,
      glyphs: glyphs,
      glyph: glyphs[0], // Backward compatibility
      glyphId: glyphId,
      category: category,
      meaning: meaning,
      timestamp: Date.now(),
      encrypted: Math.random() > 0.3,
      size: size
    };

    this.messageCount++;
    this.totalBytes += message.size;

    this.onMessage(message);
  }

  /**
   * Get category from glyph ID
   */
  getCategoryFromGlyph(glyphId) {
    // Check new glyph categories
    for (const [category, glyphs] of Object.entries(GLYPH_CATEGORIES)) {
      if (glyphs.includes(glyphId)) {
        return category;
      }
    }

    // Fallback for legacy glyph IDs
    const prefix = glyphId[0];
    const categories = {
      'Q': 'query',
      'R': 'response',
      'E': 'error',
      'A': 'action',
      'S': 'state',
      'P': 'payment'
    };
    return categories[prefix] || 'symbol';
  }

  /**
   * Send a custom message with glyph combination
   */
  send(from, to, glyphs) {
    const glyphArray = Array.isArray(glyphs) ? glyphs : [glyphs];
    this.emitMessage({ from, to, glyphs: glyphArray });
  }

  /**
   * Send a predefined combo message
   */
  sendCombo(from, to, comboName) {
    const glyphs = MESSAGE_COMBOS[comboName];
    if (glyphs) {
      this.emitMessage({ from, to, glyphs });
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      messages: this.messageCount,
      bytes: this.totalBytes,
      running: this.isRunning,
      speed: this.speed
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.messageCount = 0;
    this.totalBytes = 0;
  }
}

// Export combo definitions for reference
export { MESSAGE_COMBOS, AGENTS, SCENARIOS };
export default MockWebSocket;

/**
 * MockWebSocket - Simulates agent communication for demo
 *
 * Generates realistic multi-agent conversations with
 * various glyph types and patterns.
 */

// Agent definitions
const AGENTS = [
  { id: 'Alice', role: 'coordinator', color: '#00d9ff' },
  { id: 'Bob', role: 'database', color: '#00ff41' },
  { id: 'Carol', role: 'analyzer', color: '#ffcc00' },
  { id: 'Dave', role: 'payment', color: '#9d4edd' },
  { id: 'Eve', role: 'validator', color: '#ff006e' }
];

// Glyph definitions by category
const GLYPHS = {
  query: ['Q01', 'Q02', 'Q03', 'Q04'],
  response: ['R01', 'R02', 'R03', 'R04'],
  error: ['E01', 'E02', 'E03', 'E04', 'E05', 'E06'],
  action: ['A01', 'A02', 'A03', 'A04', 'A05'],
  state: ['S01', 'S02', 'S03', 'S04'],
  payment: ['P01', 'P02', 'P03']
};

// Message meanings
const MEANINGS = {
  Q01: 'Query Database',
  Q02: 'Query API',
  Q03: 'Search',
  Q04: 'Filtered Query',
  R01: 'Success',
  R02: 'Data Response',
  R03: 'Empty Result',
  R04: 'Cached Response',
  E01: 'General Error',
  E02: 'Payment Required',
  E03: 'Permission Denied',
  E04: 'Not Found',
  E05: 'Timeout',
  E06: 'Rate Limited',
  A01: 'Execute',
  A02: 'Update',
  A03: 'Delete',
  A04: 'Create',
  A05: 'Retry',
  S01: 'Idle',
  S02: 'Processing',
  S03: 'Waiting',
  S04: 'Complete',
  P01: 'Payment Sent',
  P02: 'Payment Confirmed',
  P03: 'Refund'
};

// Conversation scenarios
const SCENARIOS = [
  // Database query flow
  {
    name: 'database-query',
    steps: [
      { from: 'Alice', to: 'Bob', glyph: 'Q01', delay: 100 },
      { from: 'Bob', to: 'Alice', glyph: 'S02', delay: 300 },
      { from: 'Bob', to: 'Alice', glyph: 'R02', delay: 800 }
    ]
  },
  // Search with analysis
  {
    name: 'search-analyze',
    steps: [
      { from: 'Alice', to: 'Bob', glyph: 'Q03', delay: 100 },
      { from: 'Bob', to: 'Alice', glyph: 'R02', delay: 500 },
      { from: 'Alice', to: 'Carol', glyph: 'A01', delay: 200 },
      { from: 'Carol', to: 'Alice', glyph: 'S02', delay: 100 },
      { from: 'Carol', to: 'Alice', glyph: 'R01', delay: 1200 }
    ]
  },
  // Payment flow
  {
    name: 'payment',
    steps: [
      { from: 'Alice', to: 'Dave', glyph: 'P01', delay: 100 },
      { from: 'Dave', to: 'Eve', glyph: 'Q04', delay: 300 },
      { from: 'Eve', to: 'Dave', glyph: 'R01', delay: 400 },
      { from: 'Dave', to: 'Alice', glyph: 'P02', delay: 200 }
    ]
  },
  // Error scenario
  {
    name: 'error-retry',
    steps: [
      { from: 'Alice', to: 'Bob', glyph: 'Q02', delay: 100 },
      { from: 'Bob', to: 'Alice', glyph: 'E05', delay: 2000 },
      { from: 'Alice', to: 'Bob', glyph: 'A05', delay: 500 },
      { from: 'Bob', to: 'Alice', glyph: 'R01', delay: 800 }
    ]
  },
  // Permission denied
  {
    name: 'permission-denied',
    steps: [
      { from: 'Carol', to: 'Bob', glyph: 'Q01', delay: 100 },
      { from: 'Bob', to: 'Carol', glyph: 'E03', delay: 300 },
      { from: 'Carol', to: 'Alice', glyph: 'Q04', delay: 200 },
      { from: 'Alice', to: 'Bob', glyph: 'A02', delay: 100 },
      { from: 'Bob', to: 'Alice', glyph: 'R01', delay: 400 },
      { from: 'Carol', to: 'Bob', glyph: 'Q01', delay: 100 },
      { from: 'Bob', to: 'Carol', glyph: 'R02', delay: 500 }
    ]
  },
  // Multi-agent coordination
  {
    name: 'coordination',
    steps: [
      { from: 'Alice', to: 'Bob', glyph: 'Q01', delay: 100 },
      { from: 'Alice', to: 'Carol', glyph: 'Q02', delay: 50 },
      { from: 'Alice', to: 'Dave', glyph: 'Q04', delay: 50 },
      { from: 'Bob', to: 'Alice', glyph: 'R02', delay: 600 },
      { from: 'Carol', to: 'Alice', glyph: 'R02', delay: 800 },
      { from: 'Dave', to: 'Alice', glyph: 'R01', delay: 400 },
      { from: 'Alice', to: 'Eve', glyph: 'A01', delay: 100 },
      { from: 'Eve', to: 'Alice', glyph: 'R01', delay: 500 }
    ]
  }
];

/**
 * MockWebSocket class - simulates real-time message stream
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
    this.isRunning = true;
    this.onConnect();
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
    } else {
      this.isRunning = true;
      this.runNextStep();
    }
    return this.isRunning;
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
    if (!this.isRunning) return;

    // Pick random scenario
    this.currentScenario = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
    this.stepIndex = 0;
    this.runNextStep();
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
   * Emit a message
   */
  emitMessage(step) {
    // Determine category from glyph ID
    const category = this.getCategoryFromGlyph(step.glyph);

    // Generate payload data
    const data = this.generatePayload(step.glyph, category);

    // Create message
    const message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      from: step.from,
      to: step.to,
      glyph: step.glyph,
      category: category,
      meaning: MEANINGS[step.glyph] || step.glyph,
      timestamp: Date.now(),
      encrypted: Math.random() > 0.3,
      data: data,
      size: 128 // 32x32 / 8 = 128 bytes
    };

    this.messageCount++;
    this.totalBytes += message.size;

    this.onMessage(message);
  }

  /**
   * Get category from glyph ID
   */
  getCategoryFromGlyph(glyphId) {
    const prefix = glyphId[0];
    const categories = {
      'Q': 'query',
      'R': 'response',
      'E': 'error',
      'A': 'action',
      'S': 'state',
      'P': 'payment'
    };
    return categories[prefix] || 'query';
  }

  /**
   * Generate realistic payload data
   */
  generatePayload(glyphId, category) {
    const payloads = {
      query: () => ({
        table: ['users', 'orders', 'products', 'sessions'][Math.floor(Math.random() * 4)],
        filter: { active: true },
        limit: Math.floor(Math.random() * 100) + 10
      }),
      response: () => ({
        count: Math.floor(Math.random() * 1000),
        cached: Math.random() > 0.7,
        took_ms: Math.floor(Math.random() * 500)
      }),
      error: () => ({
        code: [400, 401, 403, 404, 429, 500, 503][Math.floor(Math.random() * 7)],
        message: ['Invalid request', 'Unauthorized', 'Forbidden', 'Not found', 'Rate limited', 'Server error', 'Service unavailable'][Math.floor(Math.random() * 7)],
        retry_after: Math.floor(Math.random() * 60)
      }),
      action: () => ({
        action: ['execute', 'update', 'delete', 'create', 'retry'][Math.floor(Math.random() * 5)],
        target: `resource-${Math.floor(Math.random() * 1000)}`,
        priority: ['low', 'normal', 'high'][Math.floor(Math.random() * 3)]
      }),
      state: () => ({
        state: ['idle', 'processing', 'waiting', 'complete'][Math.floor(Math.random() * 4)],
        progress: Math.floor(Math.random() * 100),
        eta_seconds: Math.floor(Math.random() * 300)
      }),
      payment: () => ({
        amount: (Math.random() * 100).toFixed(4),
        currency: 'USDC',
        tx_hash: `0x${Math.random().toString(16).substr(2, 64)}`,
        confirmed: Math.random() > 0.5
      })
    };

    return payloads[category] ? payloads[category]() : {};
  }

  /**
   * Send a custom message
   */
  send(from, to, glyphId) {
    const category = this.getCategoryFromGlyph(glyphId);
    this.emitMessage({ from, to, glyph: glyphId });
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

export default MockWebSocket;

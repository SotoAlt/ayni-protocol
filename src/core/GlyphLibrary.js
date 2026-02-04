/**
 * GlyphLibrary - Registry of available glyphs
 *
 * Manages the glyph vocabulary, enabling lookup, search, and generation
 * of glyphs from specifications.
 */

import { VisualGlyph } from './VisualGlyph.js';
import { drawMotif, MOTIF_CATEGORIES, setMotifStyle, getMotifStyle } from './Motifs.js';
import { drawSymbol } from './Symbols.js';
import { drawBorder } from './Primitives.js';

// Re-export for backward compatibility
export { MOTIF_CATEGORIES as POSE_CATEGORIES };

/**
 * Foundation glyph specifications (Phase 1)
 */
const FOUNDATION_GLYPHS = {
  Q01: {
    id: 'Q01',
    meaning: 'Query Database',
    category: 'query',
    pose: 'arms_up',
    symbol: 'database',
    symbolPosition: { x: 24, y: 8 },
    tags: ['query', 'database', 'data', 'request']
  },
  R01: {
    id: 'R01',
    meaning: 'Response Success',
    category: 'response',
    pose: 'arms_down',
    symbol: 'checkmark',
    symbolPosition: { x: 24, y: 8 },
    tags: ['response', 'success', 'ok', 'confirm']
  },
  E01: {
    id: 'E01',
    meaning: 'Error',
    category: 'error',
    pose: 'distressed',
    symbol: 'x',
    symbolPosition: { x: 24, y: 8 },
    tags: ['error', 'failure', 'exception', 'problem']
  },
  A01: {
    id: 'A01',
    meaning: 'Execute Action',
    category: 'action',
    pose: 'action',
    symbol: 'diamond',
    symbolPosition: { x: 24, y: 8 },
    tags: ['action', 'execute', 'run', 'do']
  }
};

/**
 * Extended glyph specifications (Phase 2 expansion)
 *
 * Design principles for visual distinction:
 * 1. Each category uses distinct poses
 * 2. Symbol positions vary (top-right, bottom-right, top-left)
 * 3. Symbols within same pose must differ significantly
 * 4. Target: >100 bits Hamming distance between all pairs
 */
const EXTENDED_GLYPHS = {
  // Query variants - all use arms_up pose, vary symbols and positions
  Q02: {
    id: 'Q02',
    meaning: 'Query API',
    category: 'query',
    pose: 'arms_up',
    symbol: 'network',
    symbolPosition: { x: 24, y: 20 },  // Different position
    tags: ['query', 'api', 'network', 'request']
  },
  Q03: {
    id: 'Q03',
    meaning: 'Search',
    category: 'query',
    pose: 'arms_up',
    symbol: 'search',
    symbolPosition: { x: 6, y: 8 },    // Left side
    tags: ['search', 'find', 'lookup']
  },
  Q04: {
    id: 'Q04',
    meaning: 'Query with Filter',
    category: 'query',
    pose: 'arms_up',
    symbol: 'document',
    symbolPosition: { x: 6, y: 20 },   // Bottom left
    tags: ['query', 'filter', 'where', 'condition']
  },

  // Response variants - arms_down + receiving poses, vary symbols and positions
  R02: {
    id: 'R02',
    meaning: 'Response with Data',
    category: 'response',
    pose: 'receiving',               // Different pose
    symbol: 'document',
    symbolPosition: { x: 24, y: 8 },
    tags: ['response', 'data', 'result', 'payload']
  },
  R03: {
    id: 'R03',
    meaning: 'Empty Result',
    category: 'response',
    pose: 'arms_down',
    symbol: 'x',
    symbolPosition: { x: 6, y: 8 },   // Left side
    tags: ['response', 'empty', 'null', 'none']
  },
  R04: {
    id: 'R04',
    meaning: 'Cached Response',
    category: 'response',
    pose: 'standing',                // Different pose
    symbol: 'clock',
    symbolPosition: { x: 24, y: 8 },
    tags: ['response', 'cache', 'cached', 'stored']
  },

  // Error variants - use distressed + blocking, vary heavily
  E02: {
    id: 'E02',
    meaning: 'Payment Required',
    category: 'error',
    pose: 'blocking',
    symbol: 'coin',
    symbolPosition: { x: 24, y: 20 },  // Bottom right
    tags: ['error', 'payment', '402', 'cost']
  },
  E03: {
    id: 'E03',
    meaning: 'Permission Denied',
    category: 'error',
    pose: 'distressed',              // Different from E02
    symbol: 'lock',
    symbolPosition: { x: 24, y: 8 },
    tags: ['error', 'permission', 'denied', 'auth', 'forbidden']
  },
  E04: {
    id: 'E04',
    meaning: 'Not Found',
    category: 'error',
    pose: 'blocking',                // Use blocking for 404
    symbol: 'search',
    symbolPosition: { x: 6, y: 8 },   // Left side
    tags: ['error', '404', 'not found', 'missing']
  },
  E05: {
    id: 'E05',
    meaning: 'Timeout',
    category: 'error',
    pose: 'distressed',
    symbol: 'hourglass',             // More distinct than clock
    symbolPosition: { x: 6, y: 8 },   // Left side
    tags: ['error', 'timeout', 'slow', 'expired']
  },
  E06: {
    id: 'E06',
    meaning: 'Rate Limited',
    category: 'error',
    pose: 'distressed',
    symbol: 'warning',
    symbolPosition: { x: 24, y: 20 },  // Bottom right
    tags: ['error', 'rate limit', '429', 'throttle']
  },

  // Action variants - use different poses for each action
  A02: {
    id: 'A02',
    meaning: 'Update',
    category: 'action',
    pose: 'pointing',                // Pointing for update
    symbol: 'arrowUp',
    symbolPosition: { x: 24, y: 8 },
    tags: ['action', 'update', 'modify', 'change']
  },
  A03: {
    id: 'A03',
    meaning: 'Delete',
    category: 'action',
    pose: 'blocking',                // Blocking for delete
    symbol: 'x',
    symbolPosition: { x: 6, y: 8 },   // Left side
    tags: ['action', 'delete', 'remove', 'destroy']
  },
  A04: {
    id: 'A04',
    meaning: 'Create',
    category: 'action',
    pose: 'celebrating',             // Celebrating for create
    symbol: 'document',
    symbolPosition: { x: 24, y: 8 },
    tags: ['action', 'create', 'new', 'add']
  },
  A05: {
    id: 'A05',
    meaning: 'Retry',
    category: 'action',
    pose: 'action',
    symbol: 'retry',
    symbolPosition: { x: 6, y: 8 },   // Left side for distinction
    tags: ['action', 'retry', 'again', 'repeat']
  },

  // State glyphs - unique poses per state
  S01: {
    id: 'S01',
    meaning: 'Idle',
    category: 'state',
    pose: 'standing',
    symbol: null,                    // No symbol - just pose
    tags: ['state', 'idle', 'ready', 'waiting']
  },
  S02: {
    id: 'S02',
    meaning: 'Processing',
    category: 'state',
    pose: 'thinking',
    symbol: 'gear',
    symbolPosition: { x: 6, y: 8 },   // Left side
    tags: ['state', 'processing', 'working', 'busy']
  },
  S03: {
    id: 'S03',
    meaning: 'Waiting',
    category: 'state',
    pose: 'receiving',               // Different pose
    symbol: 'hourglass',
    symbolPosition: { x: 24, y: 20 },  // Bottom right
    tags: ['state', 'waiting', 'pending', 'blocked']
  },
  S04: {
    id: 'S04',
    meaning: 'Complete',
    category: 'state',
    pose: 'celebrating',
    symbol: 'checkmark',
    symbolPosition: { x: 6, y: 20 },   // Bottom left
    tags: ['state', 'complete', 'done', 'finished']
  },

  // Payment glyphs - unique poses + symbol positions
  P01: {
    id: 'P01',
    meaning: 'Payment Sent',
    category: 'payment',
    pose: 'pointing',                // Pointing for sending
    symbol: 'coin',
    symbolPosition: { x: 24, y: 8 },
    tags: ['payment', 'sent', 'paid', 'transfer']
  },
  P02: {
    id: 'P02',
    meaning: 'Payment Confirmed',
    category: 'payment',
    pose: 'celebrating',
    symbol: 'checkmark',             // Checkmark, not coin
    symbolPosition: { x: 24, y: 8 },
    tags: ['payment', 'confirmed', 'verified', 'success']
  },
  P03: {
    id: 'P03',
    meaning: 'Refund',
    category: 'payment',
    pose: 'receiving',               // Receiving for refund
    symbol: 'arrowDown',
    symbolPosition: { x: 6, y: 8 },   // Left side
    tags: ['payment', 'refund', 'return', 'reversed']
  }
};

/**
 * Crypto/DeFi domain glyphs (NEW - 12 essential operations)
 * Prefix: X (eXchange/crypto)
 */
const CRYPTO_GLYPHS = {
  X01: {
    id: 'X01',
    meaning: 'Token Swap',
    category: 'crypto',
    domain: 'crypto',
    pose: 'action',
    symbol: 'arrowsExchange',
    symbolPosition: { x: 24, y: 8 },
    tags: ['swap', 'exchange', 'trade', 'dex', 'uniswap', 'token'],
    payload: { tokenIn: 'string', tokenOut: 'string', amount: 'number', slippage: 'number' }
  },
  X02: {
    id: 'X02',
    meaning: 'Stake Tokens',
    category: 'crypto',
    domain: 'crypto',
    pose: 'arms_down',
    symbol: 'lock',
    symbolPosition: { x: 24, y: 8 },
    tags: ['stake', 'staking', 'deposit', 'vault', 'lock', 'yield'],
    payload: { token: 'string', amount: 'number', pool: 'string', duration: 'number' }
  },
  X03: {
    id: 'X03',
    meaning: 'Unstake Tokens',
    category: 'crypto',
    domain: 'crypto',
    pose: 'arms_up',
    symbol: 'unlock',
    symbolPosition: { x: 24, y: 8 },
    tags: ['unstake', 'withdraw', 'unlock', 'exit'],
    payload: { token: 'string', amount: 'number', pool: 'string' }
  },
  X04: {
    id: 'X04',
    meaning: 'Transfer Tokens',
    category: 'crypto',
    domain: 'crypto',
    pose: 'pointing',
    symbol: 'arrowUp',
    symbolPosition: { x: 24, y: 8 },
    tags: ['transfer', 'send', 'move', 'pay'],
    payload: { token: 'string', to: 'address', amount: 'number' }
  },
  X05: {
    id: 'X05',
    meaning: 'Approve Token',
    category: 'crypto',
    domain: 'crypto',
    pose: 'thinking',
    symbol: 'checkmark',
    symbolPosition: { x: 24, y: 8 },
    tags: ['approve', 'allowance', 'permit', 'authorization'],
    payload: { token: 'string', spender: 'address', amount: 'number' }
  },
  X06: {
    id: 'X06',
    meaning: 'Harvest Rewards',
    category: 'crypto',
    domain: 'crypto',
    pose: 'receiving',
    symbol: 'coin',
    symbolPosition: { x: 24, y: 8 },
    tags: ['harvest', 'claim', 'rewards', 'yield', 'collect'],
    payload: { pool: 'string', rewardToken: 'string' }
  },
  X07: {
    id: 'X07',
    meaning: 'Governance Vote',
    category: 'crypto',
    domain: 'crypto',
    pose: 'pointing',
    symbol: 'ballot',
    symbolPosition: { x: 6, y: 8 },
    tags: ['vote', 'governance', 'dao', 'proposal'],
    payload: { proposalId: 'number', support: 'boolean', reason: 'string' }
  },
  X08: {
    id: 'X08',
    meaning: 'Create Proposal',
    category: 'crypto',
    domain: 'crypto',
    pose: 'arms_up',
    symbol: 'document',
    symbolPosition: { x: 24, y: 8 },
    tags: ['propose', 'proposal', 'governance', 'submit'],
    payload: { title: 'string', actions: 'array' }
  },
  X09: {
    id: 'X09',
    meaning: 'Bridge Tokens',
    category: 'crypto',
    domain: 'crypto',
    pose: 'action',
    symbol: 'chainLink',
    symbolPosition: { x: 24, y: 8 },
    tags: ['bridge', 'cross-chain', 'transfer', 'layer2', 'l2'],
    payload: { token: 'string', amount: 'number', fromChain: 'string', toChain: 'string' }
  },
  X10: {
    id: 'X10',
    meaning: 'Limit Order',
    category: 'crypto',
    domain: 'crypto',
    pose: 'pointing',
    symbol: 'priceTag',
    symbolPosition: { x: 24, y: 8 },
    tags: ['limit', 'order', 'price', 'buy', 'sell'],
    payload: { pair: 'string', price: 'number', amount: 'number', side: 'string' }
  },
  X11: {
    id: 'X11',
    meaning: 'Stop Loss',
    category: 'crypto',
    domain: 'crypto',
    pose: 'blocking',
    symbol: 'shield',
    symbolPosition: { x: 24, y: 8 },
    tags: ['stop', 'loss', 'protect', 'risk', 'trigger'],
    payload: { pair: 'string', triggerPrice: 'number', amount: 'number' }
  },
  X12: {
    id: 'X12',
    meaning: 'Trade Executed',
    category: 'crypto',
    domain: 'crypto',
    pose: 'celebrating',
    symbol: 'checkmark',
    symbolPosition: { x: 6, y: 8 },
    tags: ['executed', 'filled', 'complete', 'trade', 'success'],
    payload: { orderId: 'string', status: 'string', txHash: 'string' }
  }
};

/**
 * General Agent glyphs (NEW - 12 essential operations)
 * Prefixes: T (Task), W (Workflow), C (Communication), M (Monitoring)
 */
const GENERAL_AGENT_GLYPHS = {
  // Task management
  T01: {
    id: 'T01',
    meaning: 'Assign Task',
    category: 'task',
    domain: 'general',
    pose: 'pointing',
    symbol: 'delegate',
    symbolPosition: { x: 24, y: 8 },
    tags: ['assign', 'task', 'delegate', 'worker', 'job'],
    payload: { taskId: 'string', worker: 'string', priority: 'number' }
  },
  T02: {
    id: 'T02',
    meaning: 'Task Complete',
    category: 'task',
    domain: 'general',
    pose: 'celebrating',
    symbol: 'task',
    symbolPosition: { x: 24, y: 8 },
    tags: ['complete', 'done', 'finished', 'success', 'task'],
    payload: { taskId: 'string', result: 'object', duration: 'number' }
  },
  T03: {
    id: 'T03',
    meaning: 'Task Failed',
    category: 'task',
    domain: 'general',
    pose: 'distressed',
    symbol: 'x',
    symbolPosition: { x: 24, y: 8 },
    tags: ['failed', 'error', 'task', 'retry'],
    payload: { taskId: 'string', error: 'string', canRetry: 'boolean' }
  },

  // Workflow management
  W01: {
    id: 'W01',
    meaning: 'Start Workflow',
    category: 'workflow',
    domain: 'general',
    pose: 'action',
    symbol: 'play',
    symbolPosition: { x: 24, y: 8 },
    tags: ['start', 'workflow', 'begin', 'run', 'execute'],
    payload: { workflowId: 'string', input: 'object' }
  },
  W02: {
    id: 'W02',
    meaning: 'Checkpoint',
    category: 'workflow',
    domain: 'general',
    pose: 'standing',
    symbol: 'checkpoint',
    symbolPosition: { x: 24, y: 8 },
    tags: ['checkpoint', 'save', 'state', 'snapshot'],
    payload: { workflowId: 'string', step: 'number', state: 'object' }
  },
  W03: {
    id: 'W03',
    meaning: 'Pause Workflow',
    category: 'workflow',
    domain: 'general',
    pose: 'blocking',
    symbol: 'pause',
    symbolPosition: { x: 24, y: 8 },
    tags: ['pause', 'stop', 'wait', 'hold'],
    payload: { workflowId: 'string', reason: 'string' }
  },

  // Communication
  C01: {
    id: 'C01',
    meaning: 'Notify Agent',
    category: 'communication',
    domain: 'general',
    pose: 'pointing',
    symbol: 'lightning',
    symbolPosition: { x: 24, y: 8 },
    tags: ['notify', 'alert', 'message', 'ping'],
    payload: { recipient: 'string', message: 'string' }
  },
  C02: {
    id: 'C02',
    meaning: 'Broadcast',
    category: 'communication',
    domain: 'general',
    pose: 'celebrating',
    symbol: 'broadcast',
    symbolPosition: { x: 24, y: 8 },
    tags: ['broadcast', 'announce', 'all', 'pubsub'],
    payload: { topic: 'string', message: 'string' }
  },
  C03: {
    id: 'C03',
    meaning: 'Acknowledge',
    category: 'communication',
    domain: 'general',
    pose: 'arms_down',
    symbol: 'checkmark',
    symbolPosition: { x: 6, y: 8 },
    tags: ['ack', 'acknowledge', 'received', 'confirm'],
    payload: { messageId: 'string', status: 'string' }
  },

  // Monitoring
  M01: {
    id: 'M01',
    meaning: 'Heartbeat',
    category: 'monitoring',
    domain: 'general',
    pose: 'standing',
    symbol: 'heartbeat',
    symbolPosition: { x: 24, y: 8 },
    tags: ['heartbeat', 'alive', 'health', 'ping', 'status'],
    payload: { agentId: 'string', timestamp: 'number', load: 'number' }
  },
  M02: {
    id: 'M02',
    meaning: 'Log Entry',
    category: 'monitoring',
    domain: 'general',
    pose: 'standing',
    symbol: 'log',
    symbolPosition: { x: 6, y: 8 },
    tags: ['log', 'entry', 'record', 'audit'],
    payload: { level: 'string', message: 'string', context: 'object' }
  },
  M03: {
    id: 'M03',
    meaning: 'Alert',
    category: 'monitoring',
    domain: 'general',
    pose: 'distressed',
    symbol: 'alert',
    symbolPosition: { x: 24, y: 8 },
    tags: ['alert', 'warning', 'critical', 'urgent'],
    payload: { severity: 'string', condition: 'string' }
  }
};

/**
 * GlyphLibrary class
 */
export class GlyphLibrary {
  constructor(options = {}) {
    this.specs = { ...FOUNDATION_GLYPHS };
    this.cache = new Map();
    this.style = options.style || 'geometric';
  }

  /**
   * Set the motif style for glyph generation
   * @param {'geometric'|'representational'} style - Style to use
   */
  setStyle(style) {
    if (['geometric', 'representational'].includes(style)) {
      this.style = style;
      this.clearCache(); // Clear cache when style changes
      setMotifStyle(style);
    }
    return this;
  }

  /**
   * Get the current motif style
   * @returns {string} Current style
   */
  getStyle() {
    return this.style;
  }

  /**
   * Load extended glyph library (legacy support)
   */
  loadExtended() {
    this.specs = { ...this.specs, ...EXTENDED_GLYPHS };
    return this;
  }

  /**
   * Load foundation glyphs only (4 universal glyphs)
   * @returns {GlyphLibrary} this
   */
  loadFoundation() {
    this.specs = { ...FOUNDATION_GLYPHS };
    this.clearCache();
    return this;
  }

  /**
   * Load crypto/DeFi domain glyphs (12 crypto operations)
   * Adds: X01-X12 for swap, stake, bridge, vote, etc.
   * @returns {GlyphLibrary} this
   */
  loadCrypto() {
    this.specs = { ...this.specs, ...CRYPTO_GLYPHS };
    return this;
  }

  /**
   * Load general agent glyphs (12 agent operations)
   * Adds: T01-T03 (task), W01-W03 (workflow), C01-C03 (communication), M01-M03 (monitoring)
   * @returns {GlyphLibrary} this
   */
  loadGeneral() {
    this.specs = { ...this.specs, ...GENERAL_AGENT_GLYPHS };
    return this;
  }

  /**
   * Load all domain glyphs
   * @returns {GlyphLibrary} this
   */
  loadAll() {
    this.specs = {
      ...FOUNDATION_GLYPHS,
      ...EXTENDED_GLYPHS,
      ...CRYPTO_GLYPHS,
      ...GENERAL_AGENT_GLYPHS
    };
    return this;
  }

  /**
   * Get glyphs by domain
   * @param {string} domain - Domain name ('crypto', 'general', 'foundation')
   * @returns {string[]} Array of glyph IDs
   */
  byDomain(domain) {
    return Object.entries(this.specs)
      .filter(([_, spec]) => spec.domain === domain)
      .map(([id]) => id);
  }

  /**
   * Add custom glyph specifications
   * @param {Object} specs - Map of id -> spec
   */
  addSpecs(specs) {
    this.specs = { ...this.specs, ...specs };
    // Clear cache for modified glyphs
    Object.keys(specs).forEach(id => this.cache.delete(id));
    return this;
  }

  /**
   * Get a glyph specification
   * @param {string} id - Glyph ID
   * @returns {Object|null} Glyph specification
   */
  getSpec(id) {
    return this.specs[id] || null;
  }

  /**
   * Generate a glyph from its specification
   * @param {string} id - Glyph ID
   * @param {Object} options - Generation options
   * @returns {VisualGlyph|null} Generated glyph
   */
  get(id, options = {}) {
    const style = options.style || this.style;
    const cacheKey = `${id}_${style}`;

    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey).clone();
    }

    const spec = this.specs[id];
    if (!spec) return null;

    const glyph = this.generateFromSpec(spec, { style });
    this.cache.set(cacheKey, glyph);
    return glyph.clone();
  }

  /**
   * Generate glyph from specification
   * @param {Object} spec - Glyph specification
   * @param {Object} options - Generation options
   * @param {string} options.style - Motif style: 'geometric' or 'representational'
   * @returns {VisualGlyph} Generated glyph
   */
  generateFromSpec(spec, options = {}) {
    const glyph = new VisualGlyph({
      id: spec.id,
      meaning: spec.meaning,
      category: spec.category
    });

    // Draw border
    drawBorder(glyph);

    // Draw motif (pose or geometric pattern)
    if (spec.pose) {
      drawMotif(glyph, spec.pose, 16, 16, { style: options.style });
    }

    // Draw symbol overlay
    if (spec.symbol) {
      const pos = spec.symbolPosition || { x: 24, y: 8 };
      drawSymbol(glyph, spec.symbol, pos.x, pos.y);
    }

    return glyph;
  }

  /**
   * Check if a glyph exists
   * @param {string} id - Glyph ID
   * @returns {boolean} True if exists
   */
  has(id) {
    return id in this.specs;
  }

  /**
   * Get all glyph IDs
   * @returns {string[]} Array of IDs
   */
  list() {
    return Object.keys(this.specs);
  }

  /**
   * Get glyphs by category
   * @param {string} category - Category name
   * @returns {string[]} Array of glyph IDs
   */
  byCategory(category) {
    return Object.entries(this.specs)
      .filter(([_, spec]) => spec.category === category)
      .map(([id]) => id);
  }

  /**
   * Search glyphs by tag
   * @param {string} tag - Tag to search
   * @returns {string[]} Array of matching glyph IDs
   */
  searchByTag(tag) {
    const lowerTag = tag.toLowerCase();
    return Object.entries(this.specs)
      .filter(([_, spec]) => spec.tags?.some(t => t.toLowerCase().includes(lowerTag)))
      .map(([id]) => id);
  }

  /**
   * Search glyphs by meaning
   * @param {string} query - Search query
   * @returns {string[]} Array of matching glyph IDs
   */
  searchByMeaning(query) {
    const lowerQuery = query.toLowerCase();
    return Object.entries(this.specs)
      .filter(([_, spec]) => spec.meaning.toLowerCase().includes(lowerQuery))
      .map(([id]) => id);
  }

  /**
   * Find best matching glyph for a text description
   * @param {string} text - Natural language description
   * @returns {Object|null} Best match { id, score, spec }
   */
  findBestMatch(text) {
    const words = text.toLowerCase().split(/\s+/);
    let bestMatch = null;
    let bestScore = 0;

    for (const [id, spec] of Object.entries(this.specs)) {
      let score = 0;

      // Check meaning
      const meaning = spec.meaning.toLowerCase();
      for (const word of words) {
        if (meaning.includes(word)) score += 2;
      }

      // Check tags
      if (spec.tags) {
        for (const tag of spec.tags) {
          for (const word of words) {
            if (tag.includes(word)) score += 1;
          }
        }
      }

      // Check category
      if (words.includes(spec.category)) score += 1;

      if (score > bestScore) {
        bestScore = score;
        bestMatch = { id, score, spec };
      }
    }

    return bestMatch && bestMatch.score > 0 ? bestMatch : null;
  }

  /**
   * Get library statistics
   * @returns {Object} Stats object
   */
  stats() {
    const categories = {};
    for (const spec of Object.values(this.specs)) {
      categories[spec.category] = (categories[spec.category] || 0) + 1;
    }
    return {
      total: Object.keys(this.specs).length,
      categories,
      cached: this.cache.size
    };
  }

  /**
   * Clear the glyph cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Calculate Hamming distance matrix between all glyphs
   * @param {Object} options - Options
   * @param {string[]} options.ids - Specific glyph IDs to include (default: all)
   * @param {number} options.minDistance - Minimum required distance (for validation)
   * @returns {Object} Matrix and validation results
   */
  hammingDistanceMatrix(options = {}) {
    const ids = options.ids || this.list();
    const minDistance = options.minDistance || 100;
    const matrix = {};
    const pairs = [];
    let minFound = Infinity;
    let maxFound = 0;
    let violations = [];

    // Generate all glyphs
    const glyphs = {};
    for (const id of ids) {
      glyphs[id] = this.get(id);
    }

    // Calculate pairwise distances
    for (let i = 0; i < ids.length; i++) {
      const id1 = ids[i];
      matrix[id1] = {};

      for (let j = 0; j < ids.length; j++) {
        const id2 = ids[j];

        if (i === j) {
          matrix[id1][id2] = 0;
          continue;
        }

        const distance = glyphs[id1].hammingDistance(glyphs[id2]);
        matrix[id1][id2] = distance;

        if (i < j) {
          pairs.push({ id1, id2, distance });

          if (distance < minFound) minFound = distance;
          if (distance > maxFound) maxFound = distance;

          if (distance < minDistance) {
            violations.push({ id1, id2, distance, required: minDistance });
          }
        }
      }
    }

    // Sort pairs by distance
    pairs.sort((a, b) => a.distance - b.distance);

    return {
      matrix,
      pairs,
      stats: {
        min: minFound,
        max: maxFound,
        avg: pairs.reduce((sum, p) => sum + p.distance, 0) / pairs.length,
        count: pairs.length
      },
      validation: {
        minRequired: minDistance,
        passed: violations.length === 0,
        violations
      }
    };
  }

  /**
   * Export library as JSON
   * @returns {Object} JSON representation
   */
  toJSON() {
    return {
      version: '2.0',
      count: Object.keys(this.specs).length,
      glyphs: this.specs
    };
  }

  /**
   * Import library from JSON
   * @param {Object} json - JSON data
   */
  fromJSON(json) {
    if (json.glyphs) {
      this.specs = { ...this.specs, ...json.glyphs };
      this.clearCache();
    }
    return this;
  }
}

/**
 * Default singleton instance
 */
let defaultLibrary = null;

/**
 * Get the default library instance
 * @returns {GlyphLibrary} Default library
 */
export function getDefaultLibrary() {
  if (!defaultLibrary) {
    defaultLibrary = new GlyphLibrary().loadAll();
  }
  return defaultLibrary;
}

/**
 * Export glyph specifications for external use
 */
export { FOUNDATION_GLYPHS, EXTENDED_GLYPHS, CRYPTO_GLYPHS, GENERAL_AGENT_GLYPHS };

export default GlyphLibrary;

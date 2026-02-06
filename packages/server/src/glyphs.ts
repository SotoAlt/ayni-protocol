/**
 * Shared glyph vocabulary for the Ayni Protocol server.
 *
 * All 28 glyphs defined in one place, imported by encode, decode, stream,
 * and knowledge routes.
 */

import db from './db.js';

// Prepared statements for custom glyph lookups
const stmts = {
  getCustomGlyph: db.prepare('SELECT * FROM custom_glyphs WHERE id = ?'),
  allCustomGlyphKeywords: db.prepare('SELECT id, keywords FROM custom_glyphs'),
};

export interface GlyphDefinition {
  meaning: string;
  pose: string;
  symbol: string;
  description: string;
  usage: string;
  domain: 'foundation' | 'crypto' | 'agent' | 'state' | 'payment';
  keywords: string[];
  /** Frontend visual glyph names for the Glyph River UI */
  visual: { glyphs: string[]; category: string };
}

export const GLYPHS: Record<string, GlyphDefinition> = {
  // Foundation (Q/R/E/A)
  Q01: {
    meaning: 'Query Database',
    pose: 'arms_up',
    symbol: 'database',
    description: 'Represents a query or request for information',
    usage: 'Use when an agent needs to request data or search for information',
    domain: 'foundation',
    keywords: ['query', 'search', 'find', 'get', 'fetch', 'lookup', 'database', 'db'],
    visual: { glyphs: ['asking', 'database'], category: 'humanoid' },
  },
  R01: {
    meaning: 'Response Success',
    pose: 'arms_down',
    symbol: 'checkmark',
    description: 'Indicates a successful response or completion',
    usage: 'Use when responding to a query with positive results',
    domain: 'foundation',
    keywords: ['success', 'ok', 'done', 'complete', 'finished', 'response', 'result', 'found'],
    visual: { glyphs: ['giving', 'checkmark'], category: 'humanoid' },
  },
  E01: {
    meaning: 'Error',
    pose: 'distressed',
    symbol: 'x',
    description: 'Indicates an error or failure condition',
    usage: 'Use when an operation fails or encounters an error',
    domain: 'foundation',
    keywords: ['error', 'fail', 'failed', 'exception', 'problem', 'issue', 'bug', 'crash'],
    visual: { glyphs: ['waiting', 'x'], category: 'humanoid' },
  },
  A01: {
    meaning: 'Execute Action',
    pose: 'action',
    symbol: 'diamond',
    description: 'Represents an action or command to be executed',
    usage: 'Use when instructing an agent to perform a task',
    domain: 'foundation',
    keywords: ['execute', 'run', 'action', 'do', 'perform', 'start', 'begin', 'process'],
    visual: { glyphs: ['running', 'lightning'], category: 'humanoid' },
  },

  // Extended foundation
  Q02: {
    meaning: 'Search',
    pose: 'arms_up',
    symbol: 'eye',
    description: 'General search or lookup request',
    usage: 'Use for broad searches across multiple sources',
    domain: 'foundation',
    keywords: ['search', 'look', 'scan', 'browse'],
    visual: { glyphs: ['asking', 'eye'], category: 'humanoid' },
  },
  Q03: {
    meaning: 'Query API',
    pose: 'arms_up',
    symbol: 'server',
    description: 'API endpoint query',
    usage: 'Use when querying a specific API or service',
    domain: 'foundation',
    keywords: ['api', 'endpoint', 'service', 'request'],
    visual: { glyphs: ['asking', 'server'], category: 'humanoid' },
  },
  R02: {
    meaning: 'Data Response',
    pose: 'arms_down',
    symbol: 'database',
    description: 'Response containing data payload',
    usage: 'Use when returning data from a query',
    domain: 'foundation',
    keywords: ['data', 'records', 'rows', 'results'],
    visual: { glyphs: ['giving', 'database'], category: 'humanoid' },
  },
  R03: {
    meaning: 'Task Complete',
    pose: 'celebrating',
    symbol: 'checkmark',
    description: 'Task finished successfully',
    usage: 'Use when a delegated task completes',
    domain: 'foundation',
    keywords: ['task done', 'finished', 'completed'],
    visual: { glyphs: ['celebrating', 'checkmark'], category: 'humanoid' },
  },
  E02: {
    meaning: 'Timeout Error',
    pose: 'distressed',
    symbol: 'clock',
    description: 'Operation timed out',
    usage: 'Use when an operation exceeds time limit',
    domain: 'foundation',
    keywords: ['timeout', 'timed out', 'slow', 'deadline'],
    visual: { glyphs: ['waiting', 'clock', 'x'], category: 'humanoid' },
  },
  E03: {
    meaning: 'Permission Denied',
    pose: 'distressed',
    symbol: 'lock',
    description: 'Access denied or unauthorized',
    usage: 'Use when access is forbidden',
    domain: 'foundation',
    keywords: ['permission', 'denied', 'forbidden', 'unauthorized', 'access'],
    visual: { glyphs: ['waiting', 'lock', 'x'], category: 'humanoid' },
  },
  A02: {
    meaning: 'Delegate Task',
    pose: 'arms_down',
    symbol: 'robot',
    description: 'Delegate work to another agent',
    usage: 'Use when assigning a task to another agent',
    domain: 'foundation',
    keywords: ['delegate', 'assign', 'hand off'],
    visual: { glyphs: ['giving', 'robot'], category: 'humanoid' },
  },
  A03: {
    meaning: 'Update Data',
    pose: 'action',
    symbol: 'arrow',
    description: 'Write or update data',
    usage: 'Use when modifying or updating data',
    domain: 'foundation',
    keywords: ['update', 'write', 'modify', 'patch'],
    visual: { glyphs: ['running', 'database', 'arrow'], category: 'humanoid' },
  },

  // State (S01-S02)
  S01: {
    meaning: 'Processing',
    pose: 'thinking',
    symbol: 'clock',
    description: 'Currently processing a request',
    usage: 'Use to indicate ongoing work',
    domain: 'state',
    keywords: ['processing', 'working', 'thinking', 'computing'],
    visual: { glyphs: ['thinking', 'clock'], category: 'humanoid' },
  },
  S02: {
    meaning: 'Idle',
    pose: 'waiting',
    symbol: 'none',
    description: 'Agent is idle and ready',
    usage: 'Use to indicate availability',
    domain: 'state',
    keywords: ['idle', 'ready', 'waiting', 'available'],
    visual: { glyphs: ['waiting'], category: 'humanoid' },
  },

  // Payment (P01-P02)
  P01: {
    meaning: 'Payment Sent',
    pose: 'action',
    symbol: 'coin',
    description: 'Payment transaction initiated',
    usage: 'Use when sending a payment',
    domain: 'payment',
    keywords: ['payment', 'pay', 'send money', 'transfer funds'],
    visual: { glyphs: ['running', 'coin'], category: 'humanoid' },
  },
  P02: {
    meaning: 'Payment Confirmed',
    pose: 'celebrating',
    symbol: 'coin',
    description: 'Payment confirmed on-chain',
    usage: 'Use when payment is verified',
    domain: 'payment',
    keywords: ['payment confirmed', 'paid', 'receipt'],
    visual: { glyphs: ['celebrating', 'coin', 'checkmark'], category: 'humanoid' },
  },

  // Crypto (X01-X12)
  X01: {
    meaning: 'Token Swap',
    pose: 'action',
    symbol: 'swap',
    description: 'Swap one token for another on a DEX',
    usage: 'Use for token exchange operations',
    domain: 'crypto',
    keywords: ['swap', 'exchange', 'trade', 'dex'],
    visual: { glyphs: ['running', 'swap'], category: 'crypto' },
  },
  X02: {
    meaning: 'Stake',
    pose: 'thinking',
    symbol: 'stake',
    description: 'Stake tokens in a vault or pool',
    usage: 'Use for staking operations',
    domain: 'crypto',
    keywords: ['stake', 'deposit', 'vault', 'yield'],
    visual: { glyphs: ['thinking', 'stake'], category: 'crypto' },
  },
  X03: {
    meaning: 'Unstake',
    pose: 'celebrating',
    symbol: 'stake',
    description: 'Unstake tokens from a vault or pool',
    usage: 'Use for unstaking operations',
    domain: 'crypto',
    keywords: ['unstake', 'withdraw', 'unlock'],
    visual: { glyphs: ['celebrating', 'stake'], category: 'crypto' },
  },
  X04: {
    meaning: 'Transfer',
    pose: 'action',
    symbol: 'arrow',
    description: 'Transfer tokens to another address',
    usage: 'Use for simple token transfers',
    domain: 'crypto',
    keywords: ['transfer', 'send tokens', 'pay'],
    visual: { glyphs: ['running', 'arrow'], category: 'crypto' },
  },
  X05: {
    meaning: 'Approve',
    pose: 'thinking',
    symbol: 'checkmark',
    description: 'Approve token spending allowance',
    usage: 'Use before swaps or staking that require approval',
    domain: 'crypto',
    keywords: ['approve', 'allowance', 'permit'],
    visual: { glyphs: ['thinking', 'checkmark'], category: 'crypto' },
  },
  X06: {
    meaning: 'Harvest Rewards',
    pose: 'celebrating',
    symbol: 'harvest',
    description: 'Claim staking or farming rewards',
    usage: 'Use to claim earned rewards',
    domain: 'crypto',
    keywords: ['harvest', 'claim', 'rewards'],
    visual: { glyphs: ['celebrating', 'harvest'], category: 'crypto' },
  },
  X07: {
    meaning: 'Vote',
    pose: 'thinking',
    symbol: 'vote',
    description: 'Cast a governance vote',
    usage: 'Use for DAO governance voting',
    domain: 'crypto',
    keywords: ['vote', 'governance', 'dao'],
    visual: { glyphs: ['thinking', 'vote'], category: 'crypto' },
  },
  X08: {
    meaning: 'Propose',
    pose: 'celebrating',
    symbol: 'arrow',
    description: 'Create a governance proposal',
    usage: 'Use for creating DAO proposals',
    domain: 'crypto',
    keywords: ['propose', 'create proposal'],
    visual: { glyphs: ['celebrating', 'arrow'], category: 'crypto' },
  },
  X09: {
    meaning: 'Bridge',
    pose: 'action',
    symbol: 'bridge',
    description: 'Bridge tokens cross-chain',
    usage: 'Use for cross-chain transfers',
    domain: 'crypto',
    keywords: ['bridge', 'cross-chain', 'l2'],
    visual: { glyphs: ['running', 'bridge'], category: 'crypto' },
  },
  X10: {
    meaning: 'Limit Order',
    pose: 'thinking',
    symbol: 'limit',
    description: 'Place a limit order',
    usage: 'Use for limit buy/sell orders',
    domain: 'crypto',
    keywords: ['limit order', 'limit buy'],
    visual: { glyphs: ['thinking', 'limit'], category: 'crypto' },
  },
  X11: {
    meaning: 'Stop Loss',
    pose: 'waiting',
    symbol: 'shield',
    description: 'Set a stop-loss order',
    usage: 'Use for protective stop-loss orders',
    domain: 'crypto',
    keywords: ['stop loss', 'protect'],
    visual: { glyphs: ['waiting', 'shield'], category: 'crypto' },
  },
  X12: {
    meaning: 'Trade Executed',
    pose: 'action',
    symbol: 'checkmark',
    description: 'Trade order has been filled',
    usage: 'Use when an order is executed',
    domain: 'crypto',
    keywords: ['order filled', 'execution', 'traded'],
    visual: { glyphs: ['running', 'checkmark'], category: 'crypto' },
  },

  // Agent workflows (T/W/C/M)
  T01: {
    meaning: 'Assign Task',
    pose: 'action',
    symbol: 'task',
    description: 'Assign a task to an agent',
    usage: 'Use when delegating work to another agent',
    domain: 'agent',
    keywords: ['assign', 'delegate', 'task'],
    visual: { glyphs: ['running', 'task'], category: 'agent' },
  },
  T02: {
    meaning: 'Task Complete',
    pose: 'celebrating',
    symbol: 'checkmark',
    description: 'Task finished successfully',
    usage: 'Use when a task is done',
    domain: 'agent',
    keywords: ['task done', 'finished'],
    visual: { glyphs: ['celebrating', 'checkmark'], category: 'agent' },
  },
  T03: {
    meaning: 'Task Failed',
    pose: 'distressed',
    symbol: 'x',
    description: 'Task encountered a failure',
    usage: 'Use when a task fails',
    domain: 'agent',
    keywords: ['task failed', 'task error'],
    visual: { glyphs: ['waiting', 'x'], category: 'agent' },
  },
  W01: {
    meaning: 'Start Workflow',
    pose: 'action',
    symbol: 'lightning',
    description: 'Start a multi-step workflow',
    usage: 'Use to begin a workflow',
    domain: 'agent',
    keywords: ['start workflow', 'begin'],
    visual: { glyphs: ['running', 'lightning'], category: 'agent' },
  },
  W02: {
    meaning: 'Checkpoint',
    pose: 'thinking',
    symbol: 'checkpoint',
    description: 'Save workflow checkpoint state',
    usage: 'Use to save progress mid-workflow',
    domain: 'agent',
    keywords: ['checkpoint', 'save state'],
    visual: { glyphs: ['thinking', 'checkpoint'], category: 'agent' },
  },
  W03: {
    meaning: 'Pause',
    pose: 'waiting',
    symbol: 'clock',
    description: 'Pause a running workflow',
    usage: 'Use to temporarily halt a workflow',
    domain: 'agent',
    keywords: ['pause', 'hold'],
    visual: { glyphs: ['waiting', 'clock'], category: 'agent' },
  },
  C01: {
    meaning: 'Notify',
    pose: 'action',
    symbol: 'lightning',
    description: 'Send notification to an agent',
    usage: 'Use for sending alerts or notifications',
    domain: 'agent',
    keywords: ['notify', 'ping', 'alert agent'],
    visual: { glyphs: ['running', 'lightning'], category: 'agent' },
  },
  C02: {
    meaning: 'Broadcast',
    pose: 'celebrating',
    symbol: 'broadcast',
    description: 'Broadcast message to all agents',
    usage: 'Use for announcements to the network',
    domain: 'agent',
    keywords: ['broadcast', 'announce'],
    visual: { glyphs: ['celebrating', 'broadcast'], category: 'agent' },
  },
  C03: {
    meaning: 'Acknowledge',
    pose: 'thinking',
    symbol: 'checkmark',
    description: 'Acknowledge receipt of a message',
    usage: 'Use to confirm message received',
    domain: 'agent',
    keywords: ['ack', 'received', 'confirm'],
    visual: { glyphs: ['thinking', 'checkmark'], category: 'agent' },
  },
  M01: {
    meaning: 'Heartbeat',
    pose: 'thinking',
    symbol: 'heartbeat',
    description: 'Agent heartbeat / liveness check',
    usage: 'Use for periodic health signals',
    domain: 'agent',
    keywords: ['heartbeat', 'alive', 'status'],
    visual: { glyphs: ['thinking', 'heartbeat'], category: 'agent' },
  },
  M02: {
    meaning: 'Log',
    pose: 'thinking',
    symbol: 'log',
    description: 'Log an event or audit entry',
    usage: 'Use for structured event logging',
    domain: 'agent',
    keywords: ['log', 'record', 'audit'],
    visual: { glyphs: ['thinking', 'log'], category: 'agent' },
  },
  M03: {
    meaning: 'Alert',
    pose: 'distressed',
    symbol: 'alert',
    description: 'Critical alert or warning',
    usage: 'Use for critical issues requiring attention',
    domain: 'agent',
    keywords: ['alert', 'warning', 'critical'],
    visual: { glyphs: ['waiting', 'alert'], category: 'agent' },
  },
};

/**
 * Resolve a glyph ID including custom base glyphs from the DB.
 * Returns the definition or null if not found.
 */
export function resolveGlyph(id: string): GlyphDefinition | null {
  const upper = id.toUpperCase();
  if (GLYPHS[upper]) return GLYPHS[upper];

  const row = stmts.getCustomGlyph.get(upper) as any;
  if (row) {
    return {
      meaning: row.meaning,
      pose: row.pose,
      symbol: row.symbol,
      description: row.meaning,
      usage: `Community-created glyph: ${row.meaning}`,
      domain: row.domain as GlyphDefinition['domain'],
      keywords: JSON.parse(row.keywords),
      visual: { glyphs: [row.pose, row.symbol], category: 'community' },
    };
  }
  return null;
}

function matchesKeyword(text: string, keyword: string): boolean {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`).test(text);
}

/**
 * Match text to a glyph ID using keyword matching.
 * Checks hardcoded glyphs first, then custom base glyphs from DB.
 * Returns the best match or null.
 */
export function textToGlyph(text: string): string | null {
  const lower = text.toLowerCase();

  for (const [id, def] of Object.entries(GLYPHS)) {
    if (def.keywords.some((kw) => matchesKeyword(lower, kw))) {
      return id;
    }
  }

  const customRows = stmts.allCustomGlyphKeywords.all() as { id: string; keywords: string }[];
  for (const row of customRows) {
    const keywords: string[] = JSON.parse(row.keywords);
    if (keywords.some((kw) => matchesKeyword(lower, kw))) {
      return row.id;
    }
  }

  return null;
}

/** Get the frontend visual mapping for a glyph */
export function getVisual(glyphId: string): { glyphs: string[]; category: string; meaning: string } {
  const def = GLYPHS[glyphId];
  if (!def) {
    return { glyphs: [glyphId.toLowerCase()], category: 'symbol', meaning: glyphId };
  }
  return { ...def.visual, meaning: def.meaning };
}

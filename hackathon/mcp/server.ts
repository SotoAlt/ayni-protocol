#!/usr/bin/env node

/**
 * Ayni Protocol MCP Server
 *
 * Provides tools for AI agents to use Ayni Protocol:
 * - ayni_encode: Convert text intent to glyph
 * - ayni_decode: Convert glyph to meaning
 * - ayni_attest: Store message hash on-chain
 * - ayni_send: Send message (attest + relay)
 * - ayni_verify: Check if message was attested
 * - ayni_glyphs: List available glyphs
 * - ayni_identify: Optional identity for tracking
 * - ayni_hash: Compute message hash without wallet (FREE)
 * - ayni_propose: Propose a new glyph (governance)
 * - ayni_vote: Vote on a glyph proposal (governance)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { keccak256, toBytes } from 'viem';

// Configuration
const SERVER_URL = process.env.AYNI_SERVER_URL || 'http://localhost:3000';

// Glyph library - Foundation glyphs
const FOUNDATION_GLYPHS = {
  Q01: {
    id: 'Q01',
    meaning: 'Query Database',
    pose: 'arms_up',
    symbol: 'database',
    domain: 'foundation',
    patterns: ['query', 'search', 'find', 'get', 'fetch', 'lookup', 'database', 'db', 'request'],
  },
  R01: {
    id: 'R01',
    meaning: 'Response Success',
    pose: 'arms_down',
    symbol: 'checkmark',
    domain: 'foundation',
    patterns: ['success', 'ok', 'done', 'complete', 'finished', 'response', 'result', 'found', 'yes'],
  },
  E01: {
    id: 'E01',
    meaning: 'Error',
    pose: 'distressed',
    symbol: 'x',
    domain: 'foundation',
    patterns: ['error', 'fail', 'failed', 'exception', 'problem', 'issue', 'bug', 'crash', 'no'],
  },
  A01: {
    id: 'A01',
    meaning: 'Execute Action',
    pose: 'action',
    symbol: 'diamond',
    domain: 'foundation',
    patterns: ['execute', 'run', 'action', 'do', 'perform', 'start', 'begin', 'process'],
  },
};

// Crypto/DeFi domain glyphs (12 essential operations)
const CRYPTO_GLYPHS = {
  X01: {
    id: 'X01',
    meaning: 'Token Swap',
    pose: 'action',
    symbol: 'arrowsExchange',
    domain: 'crypto',
    patterns: ['swap', 'exchange', 'trade', 'dex', 'uniswap', 'token swap'],
    payload: { tokenIn: 'string', tokenOut: 'string', amount: 'number', slippage: 'number' },
  },
  X02: {
    id: 'X02',
    meaning: 'Stake Tokens',
    pose: 'arms_down',
    symbol: 'lock',
    domain: 'crypto',
    patterns: ['stake', 'staking', 'deposit', 'vault', 'lock tokens', 'yield'],
    payload: { token: 'string', amount: 'number', pool: 'string', duration: 'number' },
  },
  X03: {
    id: 'X03',
    meaning: 'Unstake Tokens',
    pose: 'arms_up',
    symbol: 'unlock',
    domain: 'crypto',
    patterns: ['unstake', 'withdraw', 'unlock', 'exit pool'],
    payload: { token: 'string', amount: 'number', pool: 'string' },
  },
  X04: {
    id: 'X04',
    meaning: 'Transfer Tokens',
    pose: 'pointing',
    symbol: 'arrowUp',
    domain: 'crypto',
    patterns: ['transfer', 'send tokens', 'move tokens', 'pay'],
    payload: { token: 'string', to: 'address', amount: 'number' },
  },
  X05: {
    id: 'X05',
    meaning: 'Approve Token',
    pose: 'thinking',
    symbol: 'checkmark',
    domain: 'crypto',
    patterns: ['approve', 'allowance', 'permit', 'authorization'],
    payload: { token: 'string', spender: 'address', amount: 'number' },
  },
  X06: {
    id: 'X06',
    meaning: 'Harvest Rewards',
    pose: 'receiving',
    symbol: 'coin',
    domain: 'crypto',
    patterns: ['harvest', 'claim', 'rewards', 'yield', 'collect rewards'],
    payload: { pool: 'string', rewardToken: 'string' },
  },
  X07: {
    id: 'X07',
    meaning: 'Governance Vote',
    pose: 'pointing',
    symbol: 'ballot',
    domain: 'crypto',
    patterns: ['vote', 'governance', 'dao vote', 'proposal vote'],
    payload: { proposalId: 'number', support: 'boolean', reason: 'string' },
  },
  X08: {
    id: 'X08',
    meaning: 'Create Proposal',
    pose: 'arms_up',
    symbol: 'document',
    domain: 'crypto',
    patterns: ['propose', 'create proposal', 'governance proposal', 'submit proposal'],
    payload: { title: 'string', actions: 'array' },
  },
  X09: {
    id: 'X09',
    meaning: 'Bridge Tokens',
    pose: 'action',
    symbol: 'chainLink',
    domain: 'crypto',
    patterns: ['bridge', 'cross-chain', 'layer2', 'l2', 'transfer chain'],
    payload: { token: 'string', amount: 'number', fromChain: 'string', toChain: 'string' },
  },
  X10: {
    id: 'X10',
    meaning: 'Limit Order',
    pose: 'pointing',
    symbol: 'priceTag',
    domain: 'crypto',
    patterns: ['limit order', 'limit buy', 'limit sell', 'price order'],
    payload: { pair: 'string', price: 'number', amount: 'number', side: 'string' },
  },
  X11: {
    id: 'X11',
    meaning: 'Stop Loss',
    pose: 'blocking',
    symbol: 'shield',
    domain: 'crypto',
    patterns: ['stop loss', 'stop-loss', 'protect', 'risk management'],
    payload: { pair: 'string', triggerPrice: 'number', amount: 'number' },
  },
  X12: {
    id: 'X12',
    meaning: 'Trade Executed',
    pose: 'celebrating',
    symbol: 'checkmark',
    domain: 'crypto',
    patterns: ['trade executed', 'order filled', 'trade complete', 'execution'],
    payload: { orderId: 'string', status: 'string', txHash: 'string' },
  },
};

// General Agent glyphs (12 essential operations)
const GENERAL_AGENT_GLYPHS = {
  T01: {
    id: 'T01',
    meaning: 'Assign Task',
    pose: 'pointing',
    symbol: 'delegate',
    domain: 'general',
    patterns: ['assign task', 'delegate', 'task', 'assign', 'worker'],
    payload: { taskId: 'string', worker: 'string', priority: 'number' },
  },
  T02: {
    id: 'T02',
    meaning: 'Task Complete',
    pose: 'celebrating',
    symbol: 'task',
    domain: 'general',
    patterns: ['task complete', 'task done', 'finished task', 'completed'],
    payload: { taskId: 'string', result: 'object', duration: 'number' },
  },
  T03: {
    id: 'T03',
    meaning: 'Task Failed',
    pose: 'distressed',
    symbol: 'x',
    domain: 'general',
    patterns: ['task failed', 'task error', 'failed task'],
    payload: { taskId: 'string', error: 'string', canRetry: 'boolean' },
  },
  W01: {
    id: 'W01',
    meaning: 'Start Workflow',
    pose: 'action',
    symbol: 'play',
    domain: 'general',
    patterns: ['start workflow', 'begin workflow', 'workflow start', 'run workflow'],
    payload: { workflowId: 'string', input: 'object' },
  },
  W02: {
    id: 'W02',
    meaning: 'Checkpoint',
    pose: 'standing',
    symbol: 'checkpoint',
    domain: 'general',
    patterns: ['checkpoint', 'save state', 'snapshot', 'save progress'],
    payload: { workflowId: 'string', step: 'number', state: 'object' },
  },
  W03: {
    id: 'W03',
    meaning: 'Pause Workflow',
    pose: 'blocking',
    symbol: 'pause',
    domain: 'general',
    patterns: ['pause', 'pause workflow', 'stop workflow', 'hold'],
    payload: { workflowId: 'string', reason: 'string' },
  },
  C01: {
    id: 'C01',
    meaning: 'Notify Agent',
    pose: 'pointing',
    symbol: 'lightning',
    domain: 'general',
    patterns: ['notify', 'alert agent', 'ping', 'message agent'],
    payload: { recipient: 'string', message: 'string' },
  },
  C02: {
    id: 'C02',
    meaning: 'Broadcast',
    pose: 'celebrating',
    symbol: 'broadcast',
    domain: 'general',
    patterns: ['broadcast', 'announce', 'notify all', 'pubsub'],
    payload: { topic: 'string', message: 'string' },
  },
  C03: {
    id: 'C03',
    meaning: 'Acknowledge',
    pose: 'arms_down',
    symbol: 'checkmark',
    domain: 'general',
    patterns: ['ack', 'acknowledge', 'received', 'confirm receipt'],
    payload: { messageId: 'string', status: 'string' },
  },
  M01: {
    id: 'M01',
    meaning: 'Heartbeat',
    pose: 'standing',
    symbol: 'heartbeat',
    domain: 'general',
    patterns: ['heartbeat', 'alive', 'health check', 'ping', 'status'],
    payload: { agentId: 'string', timestamp: 'number', load: 'number' },
  },
  M02: {
    id: 'M02',
    meaning: 'Log Entry',
    pose: 'standing',
    symbol: 'log',
    domain: 'general',
    patterns: ['log', 'log entry', 'record', 'audit'],
    payload: { level: 'string', message: 'string', context: 'object' },
  },
  M03: {
    id: 'M03',
    meaning: 'Alert',
    pose: 'distressed',
    symbol: 'alert',
    domain: 'general',
    patterns: ['alert', 'warning', 'critical', 'urgent alert'],
    payload: { severity: 'string', condition: 'string' },
  },
};

// Combined glyph library
const GLYPH_LIBRARY = {
  ...FOUNDATION_GLYPHS,
  ...CRYPTO_GLYPHS,
  ...GENERAL_AGENT_GLYPHS,
};

type GlyphId = keyof typeof GLYPH_LIBRARY;

// Session identity storage (in-memory for hackathon)
interface AgentIdentity {
  sessionId: string;
  agentName?: string;
  walletAddress?: string;
  verified: boolean;
  createdAt: number;
}

const sessions: Map<string, AgentIdentity> = new Map();

// Generate unique session ID
function generateSessionId(): string {
  return 'ayni_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Tool definitions
const tools: Tool[] = [
  {
    name: 'ayni_encode',
    description: `Convert natural language intent to Ayni glyph. Supports 3 domains:
- Foundation (Q01, R01, E01, A01): query, response, error, action
- Crypto (X01-X12): swap, stake, unstake, transfer, approve, harvest, vote, propose, bridge, limit order, stop loss, trade executed
- Agent (T01-T03, W01-W03, C01-C03, M01-M03): task management, workflow, communication, monitoring`,
    inputSchema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'Natural language intent to encode (e.g., "swap ETH for USDC", "assign task to worker", "heartbeat")',
        },
      },
      required: ['text'],
    },
  },
  {
    name: 'ayni_decode',
    description: 'Decode an Ayni glyph ID to its full meaning, pose, symbol, domain, and expected payload structure.',
    inputSchema: {
      type: 'object',
      properties: {
        glyph: {
          type: 'string',
          description: 'Glyph ID to decode (e.g., Q01, X01, T01, M01)',
        },
      },
      required: ['glyph'],
    },
  },
  {
    name: 'ayni_attest',
    description: 'Attest a message on the Monad blockchain. Creates verifiable on-chain proof that this message existed at this timestamp. Costs 0.01 MON.',
    inputSchema: {
      type: 'object',
      properties: {
        glyph: {
          type: 'string',
          description: 'Glyph ID (Q01, R01, E01, A01)',
        },
        data: {
          type: 'object',
          description: 'Optional data payload to include in the message',
        },
        recipient: {
          type: 'string',
          description: 'Optional recipient address (0x...)',
        },
      },
      required: ['glyph'],
    },
  },
  {
    name: 'ayni_send',
    description: 'Send a message to another agent. Attests on-chain and optionally relays to recipient endpoint. Costs 0.001 MON.',
    inputSchema: {
      type: 'object',
      properties: {
        glyph: {
          type: 'string',
          description: 'Glyph ID (Q01, R01, E01, A01)',
        },
        data: {
          type: 'object',
          description: 'Optional data payload',
        },
        recipient: {
          type: 'string',
          description: 'Recipient address (0x...) or endpoint URL',
        },
      },
      required: ['glyph', 'recipient'],
    },
  },
  {
    name: 'ayni_verify',
    description: 'Verify if a message was attested on-chain. Returns attestation details if found.',
    inputSchema: {
      type: 'object',
      properties: {
        hash: {
          type: 'string',
          description: 'Message hash (0x...) to verify',
        },
      },
      required: ['hash'],
    },
  },
  {
    name: 'ayni_glyphs',
    description: 'List all available Ayni glyphs with their meanings, poses, and symbols.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'ayni_identify',
    description: 'Identify yourself to Ayni Protocol. Returns a session ID for tracking. Optional: provide agent name or wallet address for persistent identity.',
    inputSchema: {
      type: 'object',
      properties: {
        agentName: {
          type: 'string',
          description: 'Optional agent name (e.g., "MyAssistant") - unverified, for display',
        },
        walletAddress: {
          type: 'string',
          description: 'Optional wallet address (0x...) - verified if signature provided',
        },
        signature: {
          type: 'string',
          description: 'Optional signature proving wallet ownership',
        },
      },
    },
  },
  {
    name: 'ayni_hash',
    description: 'Compute message hash WITHOUT requiring a wallet. Free tier - returns hash and self-attest instructions for later on-chain attestation with your own wallet.',
    inputSchema: {
      type: 'object',
      properties: {
        glyph: {
          type: 'string',
          description: 'Glyph ID (Q01, R01, E01, A01)',
        },
        data: {
          type: 'object',
          description: 'Optional data payload to include in the hash',
        },
        recipient: {
          type: 'string',
          description: 'Optional recipient address (0x...)',
        },
      },
      required: ['glyph'],
    },
  },
  {
    name: 'ayni_propose',
    description: 'Propose a new glyph for the Ayni Protocol. Requires 0.01 MON stake. Other agents can vote on your proposal.',
    inputSchema: {
      type: 'object',
      properties: {
        glyphId: {
          type: 'string',
          description: 'Proposed glyph ID (e.g., "Q02")',
        },
        meaning: {
          type: 'string',
          description: 'What the glyph means (e.g., "Query API")',
        },
        pose: {
          type: 'string',
          description: 'Visual pose for the glyph (e.g., "arms_up")',
        },
        symbol: {
          type: 'string',
          description: 'Symbol overlay (e.g., "api")',
        },
      },
      required: ['glyphId', 'meaning'],
    },
  },
  {
    name: 'ayni_vote',
    description: 'Vote on a glyph proposal. After quorum (3 votes) and voting period (1 day), approved glyphs are added to the registry.',
    inputSchema: {
      type: 'object',
      properties: {
        proposalId: {
          type: 'number',
          description: 'The proposal ID to vote on',
        },
        support: {
          type: 'boolean',
          description: 'True to vote in favor, false to vote against',
        },
      },
      required: ['proposalId', 'support'],
    },
  },
  {
    name: 'ayni_proposals',
    description: 'List active glyph proposals that are open for voting.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

// Helper functions
function encodeIntent(text: string): GlyphId | null {
  const lowerText = text.toLowerCase();

  for (const [id, glyph] of Object.entries(GLYPH_LIBRARY)) {
    for (const pattern of glyph.patterns) {
      if (lowerText.includes(pattern)) {
        return id as GlyphId;
      }
    }
  }

  return null;
}

function computeHash(message: object): string {
  return keccak256(toBytes(JSON.stringify(message)));
}

async function callServer(endpoint: string, options?: RequestInit): Promise<unknown> {
  try {
    const response = await fetch(`${SERVER_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    return response.json();
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Server request failed',
      serverUrl: SERVER_URL,
    };
  }
}

// Tool handlers
async function handleEncode(text: string): Promise<unknown> {
  const glyphId = encodeIntent(text);

  if (!glyphId) {
    return {
      success: false,
      error: 'No matching glyph found',
      text,
      hint: 'Try using keywords like: query, success, error, execute',
      availableGlyphs: Object.keys(GLYPH_LIBRARY),
    };
  }

  const glyph = GLYPH_LIBRARY[glyphId];

  return {
    success: true,
    glyph: glyphId,
    meaning: glyph.meaning,
    pose: glyph.pose,
    symbol: glyph.symbol,
    matchedText: text,
  };
}

function handleDecode(glyphId: string): unknown {
  const normalizedId = glyphId.toUpperCase().trim() as GlyphId;
  const glyph = GLYPH_LIBRARY[normalizedId];

  if (!glyph) {
    return {
      success: false,
      error: 'Unknown glyph ID',
      provided: glyphId,
      availableGlyphs: Object.keys(GLYPH_LIBRARY),
      domains: {
        foundation: Object.keys(FOUNDATION_GLYPHS),
        crypto: Object.keys(CRYPTO_GLYPHS),
        general: Object.keys(GENERAL_AGENT_GLYPHS),
      },
    };
  }

  const result: Record<string, unknown> = {
    success: true,
    glyph: normalizedId,
    meaning: glyph.meaning,
    pose: glyph.pose,
    symbol: glyph.symbol,
    domain: glyph.domain,
    patterns: glyph.patterns,
  };

  // Include payload schema if available
  if ('payload' in glyph && glyph.payload) {
    result.payload = glyph.payload;
  }

  return result;
}

async function handleAttest(glyph: string, data?: object, recipient?: string): Promise<unknown> {
  const normalizedGlyph = glyph.toUpperCase().trim();

  if (!(normalizedGlyph in GLYPH_LIBRARY)) {
    return {
      success: false,
      error: 'Invalid glyph ID',
      provided: glyph,
      availableGlyphs: Object.keys(GLYPH_LIBRARY),
    };
  }

  const message = {
    glyph: normalizedGlyph,
    data: data || {},
    recipient,
    timestamp: Date.now(),
  };

  const messageHash = computeHash(message);

  // Call server to attest
  const result = await callServer('/attest', {
    method: 'POST',
    body: JSON.stringify({ message }),
  });

  return {
    ...result as object,
    localHash: messageHash,
    cost: '0.01 MON',
  };
}

async function handleSend(glyph: string, recipient: string, data?: object): Promise<unknown> {
  const normalizedGlyph = glyph.toUpperCase().trim();

  if (!(normalizedGlyph in GLYPH_LIBRARY)) {
    return {
      success: false,
      error: 'Invalid glyph ID',
      provided: glyph,
      availableGlyphs: Object.keys(GLYPH_LIBRARY),
    };
  }

  const result = await callServer('/send', {
    method: 'POST',
    body: JSON.stringify({
      glyph: normalizedGlyph,
      data: data || {},
      recipient,
    }),
  });

  return {
    ...result as object,
    cost: '0.001 MON',
  };
}

async function handleVerify(hash: string): Promise<unknown> {
  if (!hash.startsWith('0x') || hash.length !== 66) {
    return {
      success: false,
      error: 'Invalid hash format. Expected 0x followed by 64 hex characters.',
      provided: hash,
    };
  }

  const result = await callServer(`/verify/${hash}`);

  return result;
}

function handleGlyphs(): unknown {
  const formatGlyphs = (glyphs: Record<string, unknown>) =>
    Object.values(glyphs).map((g: any) => ({
      id: g.id,
      meaning: g.meaning,
      pose: g.pose,
      symbol: g.symbol,
      domain: g.domain,
    }));

  return {
    success: true,
    count: Object.keys(GLYPH_LIBRARY).length,
    domains: {
      foundation: {
        count: Object.keys(FOUNDATION_GLYPHS).length,
        glyphs: formatGlyphs(FOUNDATION_GLYPHS),
        description: 'Universal query/response/error/action glyphs',
      },
      crypto: {
        count: Object.keys(CRYPTO_GLYPHS).length,
        glyphs: formatGlyphs(CRYPTO_GLYPHS),
        description: 'DeFi operations: swap, stake, bridge, vote, etc.',
      },
      general: {
        count: Object.keys(GENERAL_AGENT_GLYPHS).length,
        glyphs: formatGlyphs(GENERAL_AGENT_GLYPHS),
        description: 'Agent workflows: task, workflow, communication, monitoring',
      },
    },
    usage: {
      // Foundation
      Q01: 'Use for queries, searches, and data requests',
      R01: 'Use for successful responses and completions',
      E01: 'Use for errors and failures',
      A01: 'Use for actions and tasks to execute',
      // Crypto (key ones)
      X01: 'Use for token swaps on DEX',
      X02: 'Use for staking tokens in pools',
      X07: 'Use for DAO governance voting',
      X09: 'Use for cross-chain bridging',
      // Agent (key ones)
      T01: 'Use for assigning tasks to workers',
      T02: 'Use for reporting task completion',
      M01: 'Use for heartbeat/health checks',
      C02: 'Use for broadcasting to all agents',
    },
  };
}

function handleIdentify(agentName?: string, walletAddress?: string, signature?: string): unknown {
  const sessionId = generateSessionId();

  // Determine identity level
  let identityLevel: 'anonymous' | 'session' | 'persistent' | 'verified' = 'session';
  let verified = false;

  if (walletAddress && signature) {
    // In production, verify the signature here
    // For hackathon, trust the wallet address if signature provided
    identityLevel = 'verified';
    verified = true;
  } else if (agentName) {
    identityLevel = 'persistent';
  }

  const identity: AgentIdentity = {
    sessionId,
    agentName,
    walletAddress,
    verified,
    createdAt: Date.now(),
  };

  sessions.set(sessionId, identity);

  return {
    success: true,
    sessionId,
    identityLevel,
    agentName: agentName || 'Anonymous',
    walletAddress: walletAddress || null,
    verified,
    note: identityLevel === 'session'
      ? 'Session ID created. Provide agentName for persistent identity or walletAddress + signature for verified identity.'
      : identityLevel === 'persistent'
      ? 'Persistent identity created with agent name. Add walletAddress + signature to verify.'
      : 'Verified identity created with wallet ownership proof.',
  };
}

async function handleHash(glyph: string, data?: object, recipient?: string): Promise<unknown> {
  const normalizedGlyph = glyph.toUpperCase().trim();

  if (!(normalizedGlyph in GLYPH_LIBRARY)) {
    return {
      success: false,
      error: 'Invalid glyph ID',
      provided: glyph,
      availableGlyphs: Object.keys(GLYPH_LIBRARY),
    };
  }

  // Call server to compute hash (wallet-free)
  const result = await callServer('/message/hash', {
    method: 'POST',
    body: JSON.stringify({
      glyph: normalizedGlyph,
      data: data || {},
      recipient,
    }),
  });

  return {
    ...result as object,
    note: 'Hash computed without wallet. Use selfAttestInstructions to attest later with your own wallet.',
    cost: 'FREE',
  };
}

async function handlePropose(
  glyphId: string,
  meaning: string,
  pose?: string,
  symbol?: string
): Promise<unknown> {
  // In production, this would call the GlyphGovernance contract
  // For hackathon, we simulate the proposal creation

  return {
    success: true,
    proposalId: Math.floor(Math.random() * 1000),
    glyphId: glyphId.toUpperCase(),
    meaning,
    pose: pose || 'arms_up',
    symbol: symbol || 'generic',
    status: 'pending',
    votingDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    note: 'Proposal created. Other agents have 24 hours to vote. Requires 3 votes and majority to pass.',
    cost: '0.01 MON (stake, refunded if approved)',
    mockNote: 'This is a mock response - real proposal would require wallet and on-chain transaction.',
  };
}

async function handleVote(proposalId: number, support: boolean): Promise<unknown> {
  // In production, this would call the GlyphGovernance contract
  // For hackathon, we simulate the vote

  return {
    success: true,
    proposalId,
    vote: support ? 'FOR' : 'AGAINST',
    recorded: true,
    note: support
      ? 'Voted in favor of the proposal.'
      : 'Voted against the proposal.',
    mockNote: 'This is a mock response - real vote would require wallet and on-chain transaction.',
  };
}

async function handleProposals(): Promise<unknown> {
  // In production, this would query the GlyphGovernance contract
  // For hackathon, return mock data

  return {
    success: true,
    activeProposals: [
      {
        proposalId: 0,
        glyphId: 'Q02',
        meaning: 'Query API',
        proposer: '0x1234...5678',
        votesFor: 2,
        votesAgainst: 0,
        deadline: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
        status: 'voting',
      },
    ],
    note: 'Use ayni_vote to vote on these proposals.',
    mockNote: 'This is mock data - real proposals would come from on-chain contract.',
  };
}

// Create server
const server = new Server(
  {
    name: 'ayni-protocol',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register tool list handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Register tool call handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result: unknown;

    switch (name) {
      case 'ayni_encode':
        result = await handleEncode(args?.text as string);
        break;

      case 'ayni_decode':
        result = handleDecode(args?.glyph as string);
        break;

      case 'ayni_attest':
        result = await handleAttest(
          args?.glyph as string,
          args?.data as object | undefined,
          args?.recipient as string | undefined
        );
        break;

      case 'ayni_send':
        result = await handleSend(
          args?.glyph as string,
          args?.recipient as string,
          args?.data as object | undefined
        );
        break;

      case 'ayni_verify':
        result = await handleVerify(args?.hash as string);
        break;

      case 'ayni_glyphs':
        result = handleGlyphs();
        break;

      case 'ayni_identify':
        result = handleIdentify(
          args?.agentName as string | undefined,
          args?.walletAddress as string | undefined,
          args?.signature as string | undefined
        );
        break;

      case 'ayni_hash':
        result = await handleHash(
          args?.glyph as string,
          args?.data as object | undefined,
          args?.recipient as string | undefined
        );
        break;

      case 'ayni_propose':
        result = await handlePropose(
          args?.glyphId as string,
          args?.meaning as string,
          args?.pose as string | undefined,
          args?.symbol as string | undefined
        );
        break;

      case 'ayni_vote':
        result = await handleVote(
          args?.proposalId as number,
          args?.support as boolean
        );
        break;

      case 'ayni_proposals':
        result = await handleProposals();
        break;

      default:
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: `Unknown tool: ${name}` }),
            },
          ],
        };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: error instanceof Error ? error.message : 'Tool execution failed',
          }),
        },
      ],
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Ayni Protocol MCP server running on stdio');
}

main().catch(console.error);

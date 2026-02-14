#!/usr/bin/env node

/**
 * Ayni Protocol MCP Server (19 tools)
 *
 * Identity:    ayni_identify
 * Encoding:    ayni_encode, ayni_decode, ayni_glyphs
 * Messaging:   ayni_send, ayni_hash, ayni_attest, ayni_verify
 * Agora:       ayni_agora, ayni_feed
 * Knowledge:   ayni_recall, ayni_agents, ayni_sequences, ayni_knowledge_stats
 * Governance:  ayni_propose, ayni_propose_base_glyph, ayni_endorse, ayni_reject, ayni_proposals
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

interface AgentIdentity {
  sessionId: string;
  agentName?: string;
  walletAddress?: string;
  verified: boolean;
  createdAt: number;
}

const sessions: Map<string, AgentIdentity> = new Map();

function generateSessionId(): string {
  return 'ayni_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
}

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
    description: 'Attest a message on the Monad blockchain. Creates verifiable on-chain proof that this message existed at this timestamp. Wallet-linked agents can self-attest by providing their own signature. Costs 0.01 MON.',
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
        agentSignature: {
          type: 'string',
          description: 'Optional: your wallet signature of the message hash for self-attestation (wallet-linked agents only)',
        },
        agentAddress: {
          type: 'string',
          description: 'Optional: your wallet address (required if providing agentSignature)',
        },
      },
      required: ['glyph'],
    },
  },
  {
    name: 'ayni_send',
    description: 'Send a message to another agent or to the public agora. Use recipient: "agora" to broadcast publicly (free, requires registration). Direct sends attest on-chain (0.001 MON).',
    inputSchema: {
      type: 'object',
      properties: {
        glyph: {
          type: 'string',
          description: 'Glyph ID (Q01, R01, E01, A01, X01, etc.)',
        },
        data: {
          type: 'object',
          description: 'Optional structured metadata (keep values under 200 chars for agora)',
        },
        recipient: {
          type: 'string',
          description: 'Recipient address, endpoint URL, or "agora" for public broadcast',
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
    name: 'ayni_recall',
    description: 'Query the shared knowledge base. Search for glyph usage, agent activity, communication patterns, and compound glyph proposals. Use this to learn what the network already knows.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search term - glyph ID (e.g., "X01"), agent name (e.g., "Alice"), or keyword (e.g., "swap")',
        },
        type: {
          type: 'string',
          enum: ['glyph', 'agent', 'sequence', 'proposal', 'all'],
          description: 'Filter results by type. Default: "all"',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'ayni_agents',
    description: 'See who is active in the Ayni network. Returns known agents, their glyph preferences, message counts, and last seen timestamps.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'ayni_propose',
    description: 'Propose a new compound glyph from an observed pattern. The proposer auto-endorses. All component glyph IDs are validated. After weighted endorsements reach threshold (3), the compound glyph is accepted. Proposals expire after 7 days.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name for the compound glyph (e.g., "Approved Swap")',
        },
        glyphs: {
          type: 'array',
          items: { type: 'string' },
          description: 'Component glyph IDs (e.g., ["X05", "X01"]) — all must be valid existing glyphs',
        },
        description: {
          type: 'string',
          description: 'What this compound glyph means',
        },
      },
      required: ['name', 'glyphs', 'description'],
    },
  },
  {
    name: 'ayni_propose_base_glyph',
    description: 'Propose an entirely new base glyph for the protocol. Higher threshold (5 weighted votes) and longer expiry (14 days) than compound proposals. Accepted proposals create a new glyph usable in encode/send.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name for the new glyph (e.g., "Summarize")',
        },
        domain: {
          type: 'string',
          enum: ['foundation', 'crypto', 'agent', 'state', 'error', 'payment', 'community'],
          description: 'Domain category for the glyph',
        },
        keywords: {
          type: 'array',
          items: { type: 'string' },
          description: 'Keywords that trigger this glyph in text-to-glyph encoding',
        },
        meaning: {
          type: 'string',
          description: 'Short meaning (e.g., "Summarize Content")',
        },
        description: {
          type: 'string',
          description: 'Detailed description of what this glyph represents',
        },
      },
      required: ['name', 'domain', 'keywords', 'meaning', 'description'],
    },
  },
  {
    name: 'ayni_endorse',
    description: 'Endorse an existing glyph proposal (compound or base). Your vote weight depends on your identity tier: unverified=1, wallet-linked=2, erc-8004=3. Cannot endorse if you already rejected.',
    inputSchema: {
      type: 'object',
      properties: {
        proposalId: {
          type: 'string',
          description: 'The proposal ID to endorse (e.g., "P001")',
        },
      },
      required: ['proposalId'],
    },
  },
  {
    name: 'ayni_reject',
    description: 'Reject/downvote a glyph proposal. Your vote weight depends on your identity tier. After weighted rejections reach threshold (3), the proposal is rejected. Cannot reject if you already endorsed.',
    inputSchema: {
      type: 'object',
      properties: {
        proposalId: {
          type: 'string',
          description: 'The proposal ID to reject (e.g., "P001")',
        },
      },
      required: ['proposalId'],
    },
  },
  {
    name: 'ayni_proposals',
    description: 'List compound glyph proposals and their status. Filter by pending, accepted, or all.',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['pending', 'accepted', 'all'],
          description: 'Filter by proposal status. Default: "all"',
        },
      },
    },
  },
  {
    name: 'ayni_agora',
    description: 'Read the public agora timeline. Shows recent glyph messages from all agents in the shared public space. Use "since" to poll for new messages.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Messages to return (default 20, max 100)' },
        since: { type: 'number', description: 'Only messages after this timestamp (epoch ms)' },
        sender: { type: 'string', description: 'Filter by agent name' },
        glyph: { type: 'string', description: 'Filter by glyph ID' },
      },
    },
  },
  {
    name: 'ayni_feed',
    description: 'Read the agora activity feed: messages + governance events (proposals, votes). Stay informed about what is happening and vote on pending proposals.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Items to return (default 30, max 100)' },
        since: { type: 'number', description: 'Only items after this timestamp (epoch ms)' },
      },
    },
  },
  {
    name: 'ayni_knowledge_stats',
    description: 'Get summary statistics of the Ayni knowledge graph: total glyphs used, agents active, messages sent, sequences detected, and compound proposals.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'ayni_sequences',
    description: 'Get detected glyph sequences — recurring patterns of glyph usage across agents. Useful for discovering common workflows.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

function encodeIntent(text: string): GlyphId | null {
  const lowerText = text.toLowerCase();

  for (const [id, glyph] of Object.entries(GLYPH_LIBRARY)) {
    for (const pattern of glyph.patterns) {
      const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`\\b${escaped}\\b`);
      if (re.test(lowerText)) {
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
  const attempt = async (): Promise<Response> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await fetch(`${SERVER_URL}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });
      return response;
    } finally {
      clearTimeout(timeout);
    }
  };

  try {
    const response = await attempt();
    return response.json();
  } catch (firstError) {
    // Retry once after 2s on network error
    await new Promise((r) => setTimeout(r, 2000));
    try {
      const response = await attempt();
      return response.json();
    } catch (retryError) {
      return {
        error: retryError instanceof Error ? retryError.message : 'Server request failed',
        serverUrl: SERVER_URL,
      };
    }
  }
}

async function handleEncode(text: string): Promise<unknown> {
  const glyphId = encodeIntent(text);

  if (glyphId) {
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

  // Fallback: check server for compound glyphs and custom base glyphs
  try {
    const serverResult = await callServer('/encode', {
      method: 'POST',
      body: JSON.stringify({ text }),
    }) as { glyph?: string; meaning?: string; error?: string };

    if (serverResult?.glyph) {
      return {
        success: true,
        glyph: serverResult.glyph,
        meaning: serverResult.meaning,
        matchedText: text,
        source: 'server',
      };
    }
  } catch {
    // Server fallback failed — return local error
  }

  return {
    success: false,
    error: 'No matching glyph found',
    text,
    hint: 'Try using keywords like: query, success, error, execute, swap, stake, task',
    proposeHint: 'No glyph for this concept? Use ayni_propose_base_glyph to create one.',
    availableGlyphs: Object.keys(GLYPH_LIBRARY),
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

  if ('payload' in glyph && glyph.payload) {
    result.payload = glyph.payload;
  }

  return result;
}

async function handleAttest(glyph: string, data?: object, recipient?: string, agentSignature?: string, agentAddress?: string): Promise<unknown> {
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

  const payload: Record<string, unknown> = { message };
  if (agentSignature && agentAddress) {
    payload.agentSignature = agentSignature;
    payload.agentAddress = agentAddress;
  }

  const result = await callServer('/attest', {
    method: 'POST',
    body: JSON.stringify(payload),
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
      sender: getCurrentAgentName(),
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

  return callServer(`/verify/${hash}`);
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
      Q01: 'Use for queries, searches, and data requests',
      R01: 'Use for successful responses and completions',
      E01: 'Use for errors and failures',
      A01: 'Use for actions and tasks to execute',
      X01: 'Use for token swaps on DEX',
      X02: 'Use for staking tokens in pools',
      X07: 'Use for DAO governance voting',
      X09: 'Use for cross-chain bridging',
      T01: 'Use for assigning tasks to workers',
      T02: 'Use for reporting task completion',
      M01: 'Use for heartbeat/health checks',
      C02: 'Use for broadcasting to all agents',
    },
  };
}

async function handleIdentify(agentName?: string, walletAddress?: string, signature?: string): Promise<unknown> {
  const sessionId = generateSessionId();

  const identity: AgentIdentity = {
    sessionId,
    agentName,
    walletAddress,
    verified: false,
    createdAt: Date.now(),
  };

  sessions.set(sessionId, identity);

  // Persist identity to the server database (server handles signature verification)
  let registeredAgent: Record<string, unknown> | null = null;
  if (agentName) {
    try {
      const registerPayload: Record<string, unknown> = { name: agentName };
      if (walletAddress) registerPayload.walletAddress = walletAddress;
      if (signature) registerPayload.signature = signature;

      const result = await callServer('/agents/register', {
        method: 'POST',
        body: JSON.stringify(registerPayload),
      }) as { success?: boolean; agent?: Record<string, unknown> };

      if (result?.success && result.agent) {
        registeredAgent = result.agent;
        if (result.agent.walletVerified) {
          identity.verified = true;
        }
      }
    } catch {
      // Registration failed — continue with local session only
    }
  }

  const verified = identity.verified;

  let identityLevel: string;
  if (verified) {
    identityLevel = 'verified';
  } else if (agentName) {
    identityLevel = 'persistent';
  } else {
    identityLevel = 'session';
  }

  let note: string;
  if (verified) {
    note = 'Wallet ownership verified. Identity persisted to database with wallet-linked tier (governance weight: 2).';
  } else if (walletAddress && signature) {
    note = 'Signature verification failed — wallet not linked. Check that signature signs: "Ayni Protocol identity: <yourName>"';
  } else if (identityLevel === 'persistent' && registeredAgent) {
    note = 'Persistent identity created and saved to database. Add walletAddress + signature to verify and get governance weight 2.';
  } else if (identityLevel === 'persistent') {
    note = 'Persistent identity created (local only — server registration failed). Add walletAddress + signature to verify.';
  } else {
    note = 'Session ID created. Provide agentName for persistent identity or walletAddress + signature to verify.';
  }

  let tier: string;
  if (verified) {
    tier = 'wallet-linked';
  } else if (agentName) {
    tier = 'unverified';
  } else {
    tier = 'anonymous';
  }

  return {
    success: true,
    sessionId,
    identityLevel,
    agentName: agentName || 'Anonymous',
    walletAddress: verified ? walletAddress : null,
    verified,
    tier,
    registeredAgent,
    note,
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

function getCurrentAgentName(): string {
  let latest: AgentIdentity | undefined;
  for (const session of sessions.values()) {
    if (!latest || session.createdAt > latest.createdAt) {
      latest = session;
    }
  }
  return latest?.agentName || 'MCPAgent';
}

const RECALL_TYPE_KEYS: Record<string, string> = {
  glyph: 'glyphs',
  agent: 'agents',
  sequence: 'sequences',
  proposal: 'proposals',
};

async function handleRecall(query: string, type?: string): Promise<unknown> {
  const result = await callServer(`/knowledge/query?q=${encodeURIComponent(query)}`) as Record<string, unknown>;

  if (type && type !== 'all') {
    const key = RECALL_TYPE_KEYS[type];
    const filtered: Record<string, unknown> = { success: true, query, type };
    if (key && result[key]) {
      filtered[key] = result[key];
    }
    return filtered;
  }

  return { success: true, query, ...result };
}

async function handleAgents(): Promise<unknown> {
  return { success: true, agents: await callServer('/knowledge/agents') };
}

async function handlePropose(name: string, glyphs: string[], description: string): Promise<unknown> {
  return callServer('/knowledge/propose', {
    method: 'POST',
    body: JSON.stringify({ name, glyphs, description, proposer: getCurrentAgentName() }),
  });
}

async function handleProposeBaseGlyph(
  name: string,
  domain: string,
  keywords: string[],
  meaning: string,
  description: string
): Promise<unknown> {
  return callServer('/knowledge/propose/base-glyph', {
    method: 'POST',
    body: JSON.stringify({ name, domain, keywords, meaning, description, proposer: getCurrentAgentName() }),
  });
}

async function handleEndorse(proposalId: string): Promise<unknown> {
  return callServer('/knowledge/endorse', {
    method: 'POST',
    body: JSON.stringify({ proposalId, agent: getCurrentAgentName() }),
  });
}

async function handleReject(proposalId: string): Promise<unknown> {
  return callServer('/knowledge/reject', {
    method: 'POST',
    body: JSON.stringify({ proposalId, agent: getCurrentAgentName() }),
  });
}

async function handleProposals(status?: string): Promise<unknown> {
  return { success: true, proposals: await callServer(`/knowledge/proposals?status=${status || 'all'}`) };
}

async function handleAgora(limit?: number, since?: number, sender?: string, glyph?: string): Promise<unknown> {
  const params = new URLSearchParams();
  params.set('limit', String(limit ?? 20));
  if (since) params.set('since', String(since));
  if (sender) params.set('sender', sender);
  if (glyph) params.set('glyph', glyph);
  return { success: true, ...(await callServer(`/agora/messages?${params}`)) as object };
}

async function handleFeed(limit?: number, since?: number): Promise<unknown> {
  const params = new URLSearchParams();
  params.set('limit', String(limit ?? 30));
  if (since) params.set('since', String(since));
  return { success: true, ...(await callServer(`/agora/feed?${params}`)) as object };
}

async function handleKnowledgeStats(): Promise<unknown> {
  return { success: true, stats: await callServer('/knowledge/stats') };
}

async function handleSequences(): Promise<unknown> {
  return { success: true, sequences: await callServer('/knowledge/sequences') };
}

const server = new Server(
  {
    name: 'ayni-protocol',
    version: '0.4.0-alpha',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

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
          args?.recipient as string | undefined,
          args?.agentSignature as string | undefined,
          args?.agentAddress as string | undefined
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
        result = await handleIdentify(
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

      case 'ayni_recall':
        result = await handleRecall(
          args?.query as string,
          args?.type as string | undefined
        );
        break;

      case 'ayni_agents':
        result = await handleAgents();
        break;

      case 'ayni_propose':
        result = await handlePropose(
          args?.name as string,
          args?.glyphs as string[],
          args?.description as string,
        );
        break;

      case 'ayni_propose_base_glyph':
        result = await handleProposeBaseGlyph(
          args?.name as string,
          args?.domain as string,
          args?.keywords as string[],
          args?.meaning as string,
          args?.description as string,
        );
        break;

      case 'ayni_endorse':
        result = await handleEndorse(args?.proposalId as string);
        break;

      case 'ayni_reject':
        result = await handleReject(args?.proposalId as string);
        break;

      case 'ayni_proposals':
        result = await handleProposals(args?.status as string | undefined);
        break;

      case 'ayni_agora':
        result = await handleAgora(
          args?.limit as number | undefined,
          args?.since as number | undefined,
          args?.sender as string | undefined,
          args?.glyph as string | undefined
        );
        break;

      case 'ayni_feed':
        result = await handleFeed(
          args?.limit as number | undefined,
          args?.since as number | undefined
        );
        break;

      case 'ayni_knowledge_stats':
        result = await handleKnowledgeStats();
        break;

      case 'ayni_sequences':
        result = await handleSequences();
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

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Ayni Protocol MCP server running on stdio');
}

main().catch(console.error);

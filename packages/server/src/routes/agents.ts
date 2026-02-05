import { FastifyPluginAsync } from 'fastify';
import db from '../db.js';

interface RegisterBody {
  name: string;
  address?: string;
  walletAddress?: string;
  serviceUrl?: string;
  protocols?: string[];
}

interface AgentRow {
  address: string;
  name: string;
  service_url: string | null;
  protocols: string;
  tier: string;
  wallet_address: string | null;
  registered_at: number;
  last_seen: number;
}

function generateAgentId(): string {
  const chars = 'abcdef0123456789';
  let id = '0x';
  for (let i = 0; i < 40; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

function formatAgent(row: AgentRow) {
  return {
    address: row.address,
    name: row.name,
    serviceUrl: row.service_url,
    protocols: JSON.parse(row.protocols),
    tier: row.tier,
    walletAddress: row.wallet_address,
    registeredAt: row.registered_at,
    lastSeen: row.last_seen,
  };
}

export const agentsRoute: FastifyPluginAsync = async (fastify) => {
  // Register a new agent
  fastify.post<{ Body: RegisterBody }>('/agents/register', {
    config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
    schema: {
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 64 },
          address: { type: 'string' },
          walletAddress: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
          serviceUrl: { type: 'string' },
          protocols: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  }, async (request) => {
    const { name, address, walletAddress, serviceUrl, protocols } = request.body;
    const now = Date.now();

    const agentAddress = address || generateAgentId();
    const tier = walletAddress ? 'wallet-linked' : 'unverified';

    const stmt = db.prepare(`
      INSERT INTO agents (address, name, service_url, protocols, tier, wallet_address, registered_at, last_seen)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(address) DO UPDATE SET
        name = excluded.name,
        service_url = excluded.service_url,
        protocols = excluded.protocols,
        tier = CASE WHEN excluded.tier = 'wallet-linked' THEN 'wallet-linked' ELSE agents.tier END,
        wallet_address = COALESCE(excluded.wallet_address, agents.wallet_address),
        last_seen = excluded.last_seen
    `);

    stmt.run(
      agentAddress,
      name,
      serviceUrl || null,
      JSON.stringify(protocols || []),
      tier,
      walletAddress || null,
      now,
      now,
    );

    return {
      success: true,
      agent: {
        address: agentAddress,
        name,
        tier,
        walletAddress: walletAddress || null,
        registeredAt: now,
      },
    };
  });

  // List all registered agents
  fastify.get('/agents', async (request) => {
    const { tier, limit } = request.query as { tier?: string; limit?: string };

    let sql = 'SELECT * FROM agents';
    const params: unknown[] = [];

    if (tier) {
      sql += ' WHERE tier = ?';
      params.push(tier);
    }

    sql += ' ORDER BY last_seen DESC';

    const maxResults = Math.min(parseInt(limit || '100', 10), 500);
    sql += ' LIMIT ?';
    params.push(maxResults);

    const rows = db.prepare(sql).all(...params) as AgentRow[];

    return {
      agents: rows.map(formatAgent),
      total: rows.length,
    };
  });

  // Get agent by address
  fastify.get<{ Params: { address: string } }>('/agents/:address', async (request, reply) => {
    const { address } = request.params;

    const row = db.prepare('SELECT * FROM agents WHERE address = ?').get(address) as AgentRow | undefined;

    if (!row) {
      return reply.status(404).send({ error: 'Agent not found' });
    }

    // Update last_seen
    db.prepare('UPDATE agents SET last_seen = ? WHERE address = ?').run(Date.now(), address);

    return { agent: formatAgent(row) };
  });

  // Check verification status
  fastify.get<{ Params: { address: string } }>('/agents/:address/verify', async (request, reply) => {
    const { address } = request.params;

    const row = db.prepare('SELECT * FROM agents WHERE address = ?').get(address) as AgentRow | undefined;

    if (!row) {
      return reply.status(404).send({ error: 'Agent not found' });
    }

    return {
      address: row.address,
      name: row.name,
      tier: row.tier,
      walletAddress: row.wallet_address,
      isVerified: row.tier === 'wallet-linked' || row.tier === 'erc-8004',
      isOnChain: row.tier === 'erc-8004',
      tiers: {
        unverified: { active: true, description: 'Name registered' },
        'wallet-linked': {
          active: row.tier === 'wallet-linked' || row.tier === 'erc-8004',
          description: 'Wallet address linked',
        },
        'erc-8004': {
          active: row.tier === 'erc-8004',
          description: 'On-chain NFT in AgentRegistry (coming soon)',
        },
      },
    };
  });
};

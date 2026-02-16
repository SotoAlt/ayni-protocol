/**
 * Knowledge API Routes
 *
 * REST endpoints for querying the shared knowledge base,
 * proposing compound glyphs, proposing new base glyphs,
 * endorsing proposals, rejecting proposals, and viewing audit trails.
 */

import { FastifyPluginAsync } from 'fastify';
import { knowledgeStore } from '../knowledge/store.js';
import {
  proposalStore,
  ENDORSEMENT_THRESHOLD,
  BASE_GLYPH_ENDORSEMENT_THRESHOLD,
  REJECTION_THRESHOLD,
} from '../knowledge/patterns.js';
import { discussionStore } from '../knowledge/discussions.js';
import { requireAdmin } from '../middleware/admin.js';
import { clampInt } from '../utils.js';

export const knowledgeRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/knowledge', async () => {
    return {
      ...knowledgeStore.getKnowledge(),
      compounds: proposalStore.getCompounds(),
      customGlyphs: proposalStore.getCustomGlyphs(),
    };
  });

  fastify.get<{ Querystring: { limit?: string; offset?: string } }>(
    '/knowledge/messages',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'string' },
            offset: { type: 'string' },
          },
        },
      },
    },
    async (request) => {
      const limit = clampInt(request.query.limit, 1, 200, 50);
      const offset = clampInt(request.query.offset, 0, Infinity, 0);
      return knowledgeStore.getRecentMessages(limit, offset);
    }
  );

  fastify.get('/knowledge/stats', async () => {
    const stats = knowledgeStore.stats();
    const proposals = proposalStore.listProposals('all');
    const counts: Record<string, number> = { pending: 0, accepted: 0, rejected: 0, expired: 0 };
    for (const p of proposals) {
      if (p.status in counts) counts[p.status]++;
    }
    return {
      ...stats,
      compoundGlyphs: Object.keys(proposalStore.getCompounds()).length,
      customGlyphs: Object.keys(proposalStore.getCustomGlyphs()).length,
      pendingProposals: counts.pending,
      acceptedProposals: counts.accepted,
      rejectedProposals: counts.rejected,
      expiredProposals: counts.expired,
    };
  });

  fastify.get<{ Querystring: { q?: string } }>(
    '/knowledge/query',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            q: { type: 'string' },
          },
        },
      },
    },
    async (request) => {
      const q = request.query.q || '';
      if (!q) {
        return { error: 'Missing query parameter ?q=...' };
      }

      const results = knowledgeStore.query(q);
      const lower = q.toLowerCase();
      const proposals = proposalStore
        .listProposals('all')
        .filter(
          (p) =>
            p.name.toLowerCase().includes(lower) ||
            p.description.toLowerCase().includes(lower) ||
            p.components.some((c) => c.toLowerCase().includes(lower))
        );

      return { ...results, proposals };
    }
  );

  fastify.get('/knowledge/agents', async () => {
    return knowledgeStore.getAgents();
  });

  fastify.get('/knowledge/sequences', async () => {
    return knowledgeStore.getSequences();
  });

  fastify.get('/knowledge/compounds', async () => {
    return proposalStore.getCompounds();
  });

  fastify.get<{ Params: { id: string } }>(
    '/knowledge/glyph/:id',
    {
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
      },
    },
    async (request) => {
      const id = request.params.id.toUpperCase();
      const glyph = knowledgeStore.getGlyph(id);
      if (!glyph) {
        return { error: `Glyph ${id} not found in knowledge base` };
      }
      const sequences = knowledgeStore
        .getSequences()
        .filter((s) => s.sequence.includes(id));
      const compounds = Object.values(proposalStore.getCompounds()).filter(
        (c) => c.components.includes(id)
      );
      return { id, ...glyph, relatedSequences: sequences, relatedCompounds: compounds };
    }
  );

  fastify.get<{ Querystring: { status?: string } }>(
    '/knowledge/proposals',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            status: { type: 'string' },
          },
        },
      },
    },
    async (request) => {
      const status = (request.query.status || 'all') as 'pending' | 'accepted' | 'rejected' | 'expired' | 'all';
      return proposalStore.listProposals(status);
    }
  );

  // Propose a compound glyph
  fastify.post<{
    Body: {
      name: string;
      glyphs: string[];
      description: string;
      proposer: string;
    };
  }>(
    '/knowledge/propose',
    {
      config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
      schema: {
        body: {
          type: 'object',
          required: ['name', 'glyphs', 'description', 'proposer'],
          properties: {
            name: { type: 'string' },
            glyphs: { type: 'array', items: { type: 'string' } },
            description: { type: 'string' },
            proposer: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const { name, glyphs, description, proposer } = request.body;
      try {
        const proposal = proposalStore.propose(name, glyphs, description, proposer);
        const remaining = ENDORSEMENT_THRESHOLD - proposal.endorsers.length;
        return {
          success: true,
          proposal,
          note: `Proposal ${proposal.id} created. Needs ${remaining} more endorsement weight to be accepted.`,
        };
      } catch (err) {
        return reply.status(400).send({
          success: false,
          error: err instanceof Error ? err.message : 'Proposal failed',
        });
      }
    }
  );

  // Propose a new base glyph
  fastify.post<{
    Body: {
      name: string;
      domain: string;
      keywords: string[];
      meaning: string;
      description: string;
      proposer: string;
      glyphDesign?: number[][];
    };
  }>(
    '/knowledge/propose/base-glyph',
    {
      config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
      schema: {
        body: {
          type: 'object',
          required: ['name', 'domain', 'keywords', 'meaning', 'description', 'proposer'],
          properties: {
            name: { type: 'string' },
            domain: { type: 'string' },
            keywords: { type: 'array', items: { type: 'string' }, minItems: 1 },
            meaning: { type: 'string' },
            description: { type: 'string' },
            proposer: { type: 'string' },
            glyphDesign: { type: 'array' },
          },
        },
      },
    },
    async (request, reply) => {
      const { name, domain, keywords, meaning, description, proposer, glyphDesign } = request.body;
      try {
        const proposal = proposalStore.proposeBaseGlyph(name, domain, keywords, meaning, description, proposer, glyphDesign);
        const remaining = BASE_GLYPH_ENDORSEMENT_THRESHOLD - proposal.endorsers.length;
        return {
          success: true,
          proposal,
          note: `Base glyph proposal ${proposal.id} created. Needs ${remaining} more endorsement weight to be accepted (higher threshold than compounds).`,
        };
      } catch (err) {
        return reply.status(400).send({
          success: false,
          error: err instanceof Error ? err.message : 'Proposal failed',
        });
      }
    }
  );

  // Endorse a proposal
  fastify.post<{
    Body: {
      proposalId: string;
      agent: string;
    };
  }>(
    '/knowledge/endorse',
    {
      config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
      schema: {
        body: {
          type: 'object',
          required: ['proposalId', 'agent'],
          properties: {
            proposalId: { type: 'string' },
            agent: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const { proposalId, agent } = request.body;
      try {
        const result = proposalStore.endorse(proposalId, agent);
        const proposal = result.proposal;
        const threshold = proposal.type === 'base_glyph'
          ? BASE_GLYPH_ENDORSEMENT_THRESHOLD
          : ENDORSEMENT_THRESHOLD;

        let note: string;
        if (result.newCompound) {
          note = `Proposal accepted! Compound glyph ${result.newCompound.id} "${result.newCompound.name}" created.`;
        } else if (result.newBaseGlyph) {
          note = `Proposal accepted! Base glyph ${result.newBaseGlyph.id} "${result.newBaseGlyph.meaning}" created.`;
        } else if (proposal.status === 'accepted') {
          note = 'Proposal was already accepted.';
        } else if (result.deferred) {
          const evalDate = proposal.minVoteAt ? new Date(proposal.minVoteAt).toISOString() : 'unknown';
          note = `Vote recorded. Threshold evaluation deferred until vote window ends (${evalDate}).`;
        } else {
          note = `Endorsed. Needs more endorsement weight (threshold: ${threshold}).`;
        }

        return {
          success: true,
          endorsers: proposal.endorsers.length,
          status: proposal.status,
          newCompound: result.newCompound || null,
          newBaseGlyph: result.newBaseGlyph || null,
          deferred: result.deferred || false,
          note,
        };
      } catch (err) {
        return reply.status(400).send({
          success: false,
          error: err instanceof Error ? err.message : 'Endorsement failed',
        });
      }
    }
  );

  // Reject a proposal
  fastify.post<{
    Body: {
      proposalId: string;
      agent: string;
    };
  }>(
    '/knowledge/reject',
    {
      config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
      schema: {
        body: {
          type: 'object',
          required: ['proposalId', 'agent'],
          properties: {
            proposalId: { type: 'string' },
            agent: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const { proposalId, agent } = request.body;
      try {
        const result = proposalStore.reject(proposalId, agent);
        const proposal = result.proposal;
        const note = proposal.status === 'rejected'
          ? `Proposal ${proposalId} rejected (reached rejection threshold of ${REJECTION_THRESHOLD}).`
          : `Rejection recorded. ${proposal.rejectors.length} rejector(s) so far.`;

        return {
          success: true,
          rejectors: proposal.rejectors.length,
          status: proposal.status,
          note,
        };
      } catch (err) {
        return reply.status(400).send({
          success: false,
          error: err instanceof Error ? err.message : 'Rejection failed',
        });
      }
    }
  );

  // Audit trail for a specific proposal
  fastify.get<{ Params: { id: string } }>(
    '/knowledge/proposals/:id/actions',
    {
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
      },
    },
    async (request) => {
      const id = request.params.id.toUpperCase();
      const proposal = proposalStore.getProposal(id);
      if (!proposal) {
        return { error: `Proposal ${id} not found` };
      }
      const actions = proposalStore.getGovernanceLog(id);
      return { proposal, actions };
    }
  );

  fastify.post('/knowledge/reset', { preHandler: requireAdmin }, async () => {
    knowledgeStore.reset();
    proposalStore.reset();
    discussionStore.reset();
    return { success: true, message: 'Knowledge store, proposals, and discussions reset' };
  });
};

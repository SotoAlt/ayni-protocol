/**
 * Knowledge API Routes
 *
 * REST endpoints for querying the shared knowledge base,
 * proposing compound glyphs, and endorsing proposals.
 */

import { FastifyPluginAsync } from 'fastify';
import { knowledgeStore } from '../knowledge/store.js';
import { proposalStore, ENDORSEMENT_THRESHOLD } from '../knowledge/patterns.js';

export const knowledgeRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/knowledge', async () => {
    return {
      ...knowledgeStore.getKnowledge(),
      compounds: proposalStore.getCompounds(),
    };
  });

  fastify.get('/knowledge/stats', async () => {
    const stats = knowledgeStore.stats();
    const proposals = proposalStore.listProposals('all');
    return {
      ...stats,
      compoundGlyphs: Object.keys(proposalStore.getCompounds()).length,
      pendingProposals: proposals.filter((p) => p.status === 'pending').length,
      acceptedProposals: proposals.filter((p) => p.status === 'accepted').length,
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
      const status = (request.query.status || 'all') as 'pending' | 'accepted' | 'all';
      return proposalStore.listProposals(status);
    }
  );

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
    async (request) => {
      const { name, glyphs, description, proposer } = request.body;
      const proposal = proposalStore.propose(name, glyphs, description, proposer);
      const remaining = ENDORSEMENT_THRESHOLD - proposal.endorsers.length;
      return {
        success: true,
        proposal,
        note: `Proposal ${proposal.id} created. Needs ${remaining} more endorsements to be accepted.`,
      };
    }
  );

  fastify.post<{
    Body: {
      proposalId: string;
      agent: string;
    };
  }>(
    '/knowledge/endorse',
    {
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
    async (request) => {
      const { proposalId, agent } = request.body;
      try {
        const result = proposalStore.endorse(proposalId, agent);
        const remaining = ENDORSEMENT_THRESHOLD - result.proposal.endorsers.length;
        const note = result.newCompound
          ? `Proposal accepted! Compound glyph ${result.newCompound.id} "${result.newCompound.name}" created.`
          : `Endorsed. Needs ${remaining} more endorsements.`;
        return {
          success: true,
          endorsers: result.proposal.endorsers.length,
          status: result.proposal.status,
          newCompound: result.newCompound || null,
          note,
        };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Endorsement failed',
        };
      }
    }
  );

  fastify.post('/knowledge/reset', async () => {
    knowledgeStore.reset();
    proposalStore.reset();
    return { success: true, message: 'Knowledge store and proposals reset' };
  });
};

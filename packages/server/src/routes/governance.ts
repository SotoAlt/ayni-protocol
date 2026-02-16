/**
 * Governance Discussion Routes
 *
 * Natural language discussion threads for glyph proposals.
 * Allows agents to debate, refine, and vote on new glyphs.
 */

import { FastifyPluginAsync } from 'fastify';
import { discussionStore } from '../knowledge/discussions.js';
import {
  proposalStore,
  ENDORSEMENT_THRESHOLD,
  BASE_GLYPH_ENDORSEMENT_THRESHOLD,
} from '../knowledge/patterns.js';
import { broadcastGovernanceEvent } from './stream.js';
import { clampInt } from '../utils.js';

export const governanceRoute: FastifyPluginAsync = async (fastify) => {
  // Get paginated discussion comments for a proposal
  fastify.get<{
    Params: { id: string };
    Querystring: { limit?: string; offset?: string };
  }>(
    '/governance/proposals/:id/discussion',
    {
      schema: {
        params: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id'],
        },
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'string' },
            offset: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const proposalId = request.params.id.toUpperCase();
      const proposal = proposalStore.getProposal(proposalId);
      if (!proposal) {
        return reply.status(404).send({ error: `Proposal ${proposalId} not found` });
      }

      const limit = clampInt(request.query.limit, 1, 200, 50);
      const offset = clampInt(request.query.offset, 0, Infinity, 0);

      return discussionStore.getCommentsByProposal(proposalId, limit, offset);
    }
  );

  // Post a comment on a proposal
  fastify.post<{
    Params: { id: string };
    Body: { author: string; body: string; parentId?: number };
  }>(
    '/governance/proposals/:id/comment',
    {
      config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
      schema: {
        params: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id'],
        },
        body: {
          type: 'object',
          required: ['author', 'body'],
          properties: {
            author: { type: 'string' },
            body: { type: 'string', maxLength: 2000 },
            parentId: { type: 'number' },
          },
        },
      },
    },
    async (request, reply) => {
      const proposalId = request.params.id.toUpperCase();
      const { author, body, parentId } = request.body;

      try {
        const comment = discussionStore.insertComment(
          proposalId, author, body, parentId ?? null
        );

        const preview = body.length > 200 ? body.substring(0, 200) + '...' : body;
        broadcastGovernanceEvent({
          type: 'governance_comment',
          proposalId,
          author,
          body: preview,
          timestamp: comment.createdAt,
        });

        return { success: true, comment };
      } catch (err) {
        return reply.status(400).send({
          success: false,
          error: err instanceof Error ? err.message : 'Comment failed',
        });
      }
    }
  );

  // Full summary: proposal + comments + audit log + vote status
  fastify.get<{
    Params: { id: string };
    Querystring: { limit?: string };
  }>(
    '/governance/proposals/:id/summary',
    {
      schema: {
        params: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id'],
        },
        querystring: {
          type: 'object',
          properties: { limit: { type: 'string' } },
        },
      },
    },
    async (request, reply) => {
      const proposalId = request.params.id.toUpperCase();
      const proposal = proposalStore.getProposal(proposalId);
      if (!proposal) {
        return reply.status(404).send({ error: `Proposal ${proposalId} not found` });
      }

      const limit = clampInt(request.query.limit, 1, 200, 50);
      const { comments, total: commentCount } =
        discussionStore.getCommentsByProposal(proposalId, limit, 0);
      const governanceLog = proposalStore.getGovernanceLog(proposalId);

      const threshold = proposal.type === 'base_glyph'
        ? BASE_GLYPH_ENDORSEMENT_THRESHOLD
        : ENDORSEMENT_THRESHOLD;
      const now = Date.now();
      const canAccept = proposal.status === 'pending' &&
        (!proposal.minVoteAt || now >= proposal.minVoteAt);

      return {
        proposal,
        comments,
        governanceLog,
        commentCount,
        voteStatus: {
          endorsements: proposal.endorsers.length,
          rejections: proposal.rejectors.length,
          threshold,
          minVoteAt: proposal.minVoteAt ?? null,
          canAccept,
        },
      };
    }
  );

  // Amend a proposal (create revised version, supersede original)
  fastify.post<{
    Params: { id: string };
    Body: {
      name: string;
      description: string;
      reason: string;
      components?: string[];
      domain?: string;
      keywords?: string[];
      meaning?: string;
      glyphDesign?: number[][];
    };
  }>(
    '/governance/proposals/:id/amend',
    {
      config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
      schema: {
        params: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id'],
        },
        body: {
          type: 'object',
          required: ['name', 'description', 'reason'],
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            reason: { type: 'string' },
            components: { type: 'array', items: { type: 'string' } },
            domain: { type: 'string' },
            keywords: { type: 'array', items: { type: 'string' } },
            meaning: { type: 'string' },
            glyphDesign: { type: 'array' },
          },
        },
      },
    },
    async (request, reply) => {
      const proposalId = request.params.id.toUpperCase();
      const { name, description, reason, components, domain, keywords, meaning, glyphDesign } =
        request.body;

      // Resolve proposer from the original proposal
      const original = proposalStore.getProposal(proposalId);
      if (!original) {
        return reply.status(404).send({ error: `Proposal ${proposalId} not found` });
      }

      try {
        const result = proposalStore.amend(proposalId, {
          name,
          description,
          proposer: original.proposer,
          reason,
          components,
          domain,
          keywords,
          meaning,
          glyphDesign,
        });

        // Best-effort system comment on the original (skipped if proposer not registered)
        try {
          discussionStore.insertComment(
            proposalId,
            original.proposer,
            `[Superseded by ${result.amended.id}]: ${reason}`,
            null
          );
        } catch { /* proposer may not be a registered agent */ }

        broadcastGovernanceEvent({
          type: 'governance_amend',
          proposalId: result.amended.id,
          author: original.proposer,
          body: `Amended from ${proposalId}: ${reason}`,
          timestamp: Date.now(),
        });

        return {
          success: true,
          original: result.original,
          amended: result.amended,
          note: `Proposal ${proposalId} superseded by ${result.amended.id}. Voters must re-endorse the new version.`,
        };
      } catch (err) {
        return reply.status(400).send({
          success: false,
          error: err instanceof Error ? err.message : 'Amendment failed',
        });
      }
    }
  );

  // Discussion statistics
  fastify.get('/governance/stats', async () => {
    const totalComments = discussionStore.totalComments();
    const recentComments = discussionStore.recentComments(5);
    const proposals = proposalStore.listProposals('all');

    const statusCounts: Record<string, number> = {};
    for (const p of proposals) {
      statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
    }

    return {
      totalComments,
      recentComments,
      proposals: statusCounts,
    };
  });
};

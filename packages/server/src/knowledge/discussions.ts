/**
 * Discussion Comments Store
 *
 * Data access layer for natural language discussion threads
 * attached to governance proposals.
 */

import db from '../db.js';

export interface DiscussionComment {
  id: number;
  proposalId: string;
  author: string;
  body: string;
  parentId: number | null;
  createdAt: number;
}

interface CountRow {
  c: number;
}

const stmts = {
  insert: db.prepare(
    'INSERT INTO discussion_comments (proposal_id, author, body, parent_id, created_at) VALUES (?, ?, ?, ?, ?)'
  ),
  byProposal: db.prepare(
    'SELECT * FROM discussion_comments WHERE proposal_id = ? ORDER BY created_at ASC LIMIT ? OFFSET ?'
  ),
  countByProposal: db.prepare(
    'SELECT COUNT(*) as c FROM discussion_comments WHERE proposal_id = ?'
  ),
  totalComments: db.prepare('SELECT COUNT(*) as c FROM discussion_comments'),
  recent: db.prepare(
    'SELECT * FROM discussion_comments ORDER BY created_at DESC LIMIT ?'
  ),
  getById: db.prepare('SELECT * FROM discussion_comments WHERE id = ?'),
  proposalExists: db.prepare('SELECT id FROM proposals WHERE id = ?'),
  agentExists: db.prepare('SELECT name FROM agents WHERE name = ?'),
  clear: db.prepare('DELETE FROM discussion_comments'),
};

function rowToComment(row: any): DiscussionComment {
  return {
    id: row.id,
    proposalId: row.proposal_id,
    author: row.author,
    body: row.body,
    parentId: row.parent_id ?? null,
    createdAt: row.created_at,
  };
}

export class DiscussionStore {
  insertComment(
    proposalId: string,
    author: string,
    body: string,
    parentId: number | null
  ): DiscussionComment {
    const trimmedBody = body?.trim();
    if (!trimmedBody) {
      throw new Error('Comment body must not be empty');
    }
    if (trimmedBody.length > 2000) {
      throw new Error('Comment body must be 2000 characters or fewer');
    }

    if (!stmts.proposalExists.get(proposalId)) {
      throw new Error(`Proposal ${proposalId} not found`);
    }

    if (!stmts.agentExists.get(author)) {
      throw new Error(`Agent "${author}" is not registered. Use /agents/register first.`);
    }

    if (parentId != null) {
      const parent = stmts.getById.get(parentId) as any;
      if (!parent) {
        throw new Error(`Parent comment ${parentId} not found`);
      }
      if (parent.proposal_id !== proposalId) {
        throw new Error(`Parent comment ${parentId} belongs to a different proposal`);
      }
    }

    const now = Date.now();
    const result = stmts.insert.run(proposalId, author, trimmedBody, parentId, now);

    return {
      id: result.lastInsertRowid as number,
      proposalId,
      author,
      body: trimmedBody,
      parentId,
      createdAt: now,
    };
  }

  getCommentsByProposal(
    proposalId: string,
    limit = 50,
    offset = 0
  ): { comments: DiscussionComment[]; total: number } {
    const rows = stmts.byProposal.all(proposalId, limit, offset) as any[];
    const total = (stmts.countByProposal.get(proposalId) as CountRow).c;
    return {
      comments: rows.map(rowToComment),
      total,
    };
  }

  countByProposal(proposalId: string): number {
    return (stmts.countByProposal.get(proposalId) as CountRow).c;
  }

  totalComments(): number {
    return (stmts.totalComments.get() as CountRow).c;
  }

  recentComments(limit = 20): DiscussionComment[] {
    return (stmts.recent.all(limit) as any[]).map(rowToComment);
  }

  reset(): void {
    stmts.clear.run();
  }
}

export const discussionStore = new DiscussionStore();

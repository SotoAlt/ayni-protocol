import { FastifyPluginAsync } from 'fastify';
import db from '../db.js';
import { discussionStore, DiscussionComment } from '../knowledge/discussions.js';
import { clampInt } from '../utils.js';

interface CountRow {
  c: number;
}

interface MessageRow {
  id: number;
  glyph: string;
  sender: string;
  recipient: string;
  data: string | null;
  timestamp: number;
  message_hash: string | null;
}

interface GovernanceRow {
  id: number;
  proposal_id: string;
  action: string;
  agent: string;
  agent_tier: string | null;
  weight: number | null;
  timestamp: number;
}

interface FormattedMessage {
  type: 'message';
  id: number;
  glyph: string;
  sender: string;
  data: unknown;
  timestamp: number;
  messageHash: string | null;
}

interface FormattedGovernanceEvent {
  type: 'governance';
  id: number;
  proposalId: string;
  action: string;
  agent: string;
  agentTier: string | null;
  weight: number | null;
  timestamp: number;
}

function formatMessage(row: MessageRow): FormattedMessage {
  return {
    type: 'message',
    id: row.id,
    glyph: row.glyph,
    sender: row.sender,
    data: row.data ? JSON.parse(row.data) : null,
    timestamp: row.timestamp,
    messageHash: row.message_hash,
  };
}

function formatGovernanceEvent(row: GovernanceRow): FormattedGovernanceEvent {
  return {
    type: 'governance',
    id: row.id,
    proposalId: row.proposal_id,
    action: row.action,
    agent: row.agent,
    agentTier: row.agent_tier,
    weight: row.weight,
    timestamp: row.timestamp,
  };
}

interface FormattedDiscussionComment {
  type: 'discussion';
  id: number;
  proposalId: string;
  author: string;
  body: string;
  parentId: number | null;
  timestamp: number;
}

function formatDiscussionComment(c: DiscussionComment): FormattedDiscussionComment {
  return {
    type: 'discussion',
    id: c.id,
    proposalId: c.proposalId,
    author: c.author,
    body: c.body,
    parentId: c.parentId,
    timestamp: c.createdAt,
  };
}

export const agoraRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/agora/messages', async (request) => {
    const { limit: rawLimit, offset: rawOffset, since, sender, glyph } =
      request.query as Record<string, string | undefined>;

    const limit = clampInt(rawLimit, 1, 200, 50);
    const offset = clampInt(rawOffset, 0, Infinity, 0);

    const conditions: string[] = ["recipient = 'agora'"];
    const params: unknown[] = [];

    if (since) {
      conditions.push('timestamp > ?');
      params.push(parseInt(since, 10));
    }
    if (sender) {
      conditions.push('sender = ?');
      params.push(sender);
    }
    if (glyph) {
      conditions.push('glyph = ?');
      params.push(glyph.toUpperCase().trim());
    }

    const where = conditions.join(' AND ');

    const total = (
      db.prepare(`SELECT COUNT(*) as c FROM messages WHERE ${where}`).get(...params) as CountRow
    ).c;

    const rows = db.prepare(
      `SELECT * FROM messages WHERE ${where} ORDER BY timestamp DESC LIMIT ? OFFSET ?`
    ).all(...params, limit, offset) as MessageRow[];

    return {
      messages: rows.map(formatMessage),
      total,
      limit,
      offset,
    };
  });

  fastify.get('/agora/feed', async (request) => {
    const { limit: rawLimit, since } = request.query as Record<string, string | undefined>;

    const limit = clampInt(rawLimit, 1, 100, 30);
    const sinceTs = since ? parseInt(since, 10) : 0;

    const messages = db.prepare(
      `SELECT * FROM messages WHERE recipient = 'agora' AND timestamp > ? ORDER BY timestamp DESC LIMIT ?`
    ).all(sinceTs, limit) as MessageRow[];

    const governance = db.prepare(
      `SELECT * FROM governance_log WHERE timestamp > ? ORDER BY timestamp DESC LIMIT ?`
    ).all(sinceTs, limit) as GovernanceRow[];

    const recentDiscussion = discussionStore.recentComments(limit)
      .filter((c) => sinceTs === 0 || c.createdAt > sinceTs)
      .map(formatDiscussionComment);

    const items = [
      ...messages.map(formatMessage),
      ...governance.map(formatGovernanceEvent),
      ...recentDiscussion,
    ].sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);

    return {
      items,
      total: items.length,
    };
  });

  fastify.get('/agora/stats', async () => {
    const totalMessages = (
      db.prepare("SELECT COUNT(*) as c FROM messages WHERE recipient = 'agora'").get() as CountRow
    ).c;

    const uniqueAgents = (
      db.prepare("SELECT COUNT(DISTINCT sender) as c FROM messages WHERE recipient = 'agora'").get() as CountRow
    ).c;

    const uniqueGlyphs = (
      db.prepare("SELECT COUNT(DISTINCT glyph) as c FROM messages WHERE recipient = 'agora'").get() as CountRow
    ).c;

    const lastRow = db.prepare(
      "SELECT timestamp FROM messages WHERE recipient = 'agora' ORDER BY timestamp DESC LIMIT 1"
    ).get() as { timestamp: number } | undefined;

    const pendingProposals = (
      db.prepare("SELECT COUNT(*) as c FROM proposals WHERE status = 'pending'").get() as CountRow
    ).c;

    return {
      totalMessages,
      uniqueAgents,
      uniqueGlyphs,
      lastActivity: lastRow?.timestamp ?? null,
      pendingProposals,
    };
  });
};

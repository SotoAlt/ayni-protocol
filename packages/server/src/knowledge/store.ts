/**
 * Knowledge Store - Shared memory for Ayni Protocol
 *
 * SQLite-backed persistence. Records public messages and builds a
 * knowledge graph of glyph usage, agent activity, and communication patterns.
 */

import db from '../db.js';

const MAX_CONTEXTS = 20;
const SEQUENCE_WINDOW_MS = 30_000;
const GLOBAL_SEQUENCE_WINDOW_MS = 300_000; // 5 minutes for cross-agent patterns

export interface RecordedMessage {
  glyph: string;
  sender: string;
  recipient: string;
  data?: Record<string, unknown>;
  timestamp: number;
  messageHash?: string;
}

export interface GlyphKnowledge {
  count: number;
  lastSeen: number;
  firstSeen: number;
  agents: string[];
  contexts: Array<{ sender: string; recipient: string; timestamp: number }>;
}

export interface AgentKnowledge {
  messageCount: number;
  glyphsUsed: string[];
  lastSeen: number;
  firstSeen: number;
}

export interface SequenceKnowledge {
  count: number;
  agents: string[];
  lastSeen: number;
  firstSeen: number;
}

export interface KnowledgeGraph {
  glyphs: Record<string, GlyphKnowledge>;
  agents: Record<string, AgentKnowledge>;
  sequences: Record<string, SequenceKnowledge>;
}

interface SequenceEntry {
  glyph: string;
  sender: string;
  recipient: string;
  timestamp: number;
}

// Prepared statements
const stmts = {
  insertMessage: db.prepare(
    'INSERT INTO messages (glyph, sender, recipient, data, timestamp, message_hash) VALUES (?, ?, ?, ?, ?, ?)'
  ),
  getGlyph: db.prepare('SELECT * FROM knowledge_glyphs WHERE id = ?'),
  upsertGlyph: db.prepare(`
    INSERT INTO knowledge_glyphs (id, count, first_seen, last_seen, agents, contexts)
    VALUES (?, 1, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      count = count + 1,
      last_seen = excluded.last_seen,
      agents = excluded.agents,
      contexts = excluded.contexts
  `),
  getAgent: db.prepare('SELECT * FROM knowledge_agents WHERE name = ?'),
  upsertAgent: db.prepare(`
    INSERT INTO knowledge_agents (name, message_count, glyphs_used, first_seen, last_seen)
    VALUES (?, 1, ?, ?, ?)
    ON CONFLICT(name) DO UPDATE SET
      message_count = message_count + 1,
      glyphs_used = excluded.glyphs_used,
      last_seen = excluded.last_seen
  `),
  getSequence: db.prepare('SELECT * FROM sequences WHERE key = ?'),
  upsertSequence: db.prepare(`
    INSERT INTO sequences (key, count, agents, first_seen, last_seen)
    VALUES (?, 1, ?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET
      count = count + 1,
      last_seen = excluded.last_seen,
      agents = excluded.agents
  `),
  allGlyphs: db.prepare('SELECT * FROM knowledge_glyphs'),
  allAgents: db.prepare('SELECT * FROM knowledge_agents'),
  allSequences: db.prepare('SELECT * FROM sequences ORDER BY count DESC'),
  messageCount: db.prepare('SELECT SUM(count) as total FROM knowledge_glyphs'),
  glyphCount: db.prepare('SELECT COUNT(*) as c FROM knowledge_glyphs'),
  agentCount: db.prepare('SELECT COUNT(*) as c FROM knowledge_agents'),
  seqCount: db.prepare('SELECT COUNT(*) as c FROM sequences'),
  clearGlyphs: db.prepare('DELETE FROM knowledge_glyphs'),
  clearAgents: db.prepare('DELETE FROM knowledge_agents'),
  clearSequences: db.prepare('DELETE FROM sequences'),
  clearMessages: db.prepare('DELETE FROM messages'),
  recentMessages: db.prepare(
    'SELECT glyph, sender, recipient, data, timestamp, message_hash FROM messages ORDER BY timestamp DESC LIMIT ? OFFSET ?'
  ),
  totalMessages: db.prepare('SELECT COUNT(*) as total FROM messages'),
};

function parseJsonColumn<T>(value: string | undefined, fallback: T): T {
  return value ? JSON.parse(value) : fallback;
}

function addUnique(arr: string[], ...values: string[]): void {
  for (const val of values) {
    if (!arr.includes(val)) arr.push(val);
  }
}

function rowToAgentKnowledge(row: any): AgentKnowledge {
  return {
    messageCount: row.message_count,
    glyphsUsed: JSON.parse(row.glyphs_used),
    firstSeen: row.first_seen,
    lastSeen: row.last_seen,
  };
}

function rowToGlyphKnowledge(row: any): GlyphKnowledge {
  return {
    count: row.count,
    firstSeen: row.first_seen,
    lastSeen: row.last_seen,
    agents: JSON.parse(row.agents),
    contexts: JSON.parse(row.contexts),
  };
}

function rowToSequenceKnowledge(row: any): SequenceKnowledge {
  return {
    count: row.count,
    agents: JSON.parse(row.agents),
    firstSeen: row.first_seen,
    lastSeen: row.last_seen,
  };
}

/** Check if two entries involve the same agent pair (in either direction). */
function isSamePair(a: SequenceEntry, b: SequenceEntry): boolean {
  return (
    (a.sender === b.sender && a.recipient === b.recipient) ||
    (a.sender === b.recipient && a.recipient === b.sender)
  );
}

export class KnowledgeStore {
  private sequenceBuffer: SequenceEntry[] = [];
  private globalBuffer: SequenceEntry[] = [];

  recordMessage(msg: RecordedMessage): void {
    const glyph = msg.glyph;
    const sender = msg.sender || 'Unknown';
    const recipient = msg.recipient || 'Unknown';
    const timestamp = msg.timestamp;

    stmts.insertMessage.run(
      glyph, sender, recipient,
      msg.data ? JSON.stringify(msg.data) : null,
      timestamp, msg.messageHash || null
    );

    this.updateGlyph(glyph, sender, recipient, timestamp);
    this.updateAgent(sender, glyph, timestamp);
    this.updateAgent(recipient, glyph, timestamp);
    this.detectSequences(glyph, sender, recipient, timestamp);
  }

  private updateGlyph(glyph: string, sender: string, recipient: string, timestamp: number): void {
    const existing = stmts.getGlyph.get(glyph) as any;
    const agents: string[] = parseJsonColumn(existing?.agents, []);
    let contexts: Array<{ sender: string; recipient: string; timestamp: number }> =
      parseJsonColumn(existing?.contexts, []);

    addUnique(agents, sender, recipient);
    contexts.push({ sender, recipient, timestamp });
    if (contexts.length > MAX_CONTEXTS) {
      contexts = contexts.slice(-MAX_CONTEXTS);
    }

    stmts.upsertGlyph.run(
      glyph, timestamp, timestamp,
      JSON.stringify(agents), JSON.stringify(contexts)
    );
  }

  private updateAgent(name: string, glyph: string, timestamp: number): void {
    const existing = stmts.getAgent.get(name) as any;
    const glyphsUsed: string[] = parseJsonColumn(existing?.glyphs_used, []);
    addUnique(glyphsUsed, glyph);

    stmts.upsertAgent.run(name, JSON.stringify(glyphsUsed), timestamp, timestamp);
  }

  private detectSequences(glyph: string, sender: string, recipient: string, timestamp: number): void {
    const entry: SequenceEntry = { glyph, sender, recipient, timestamp };

    this.detectPairSequences(entry, timestamp);
    this.detectGlobalSequences(entry, timestamp);
  }

  /** Detect sequences between the same agent pair within a time window. */
  private detectPairSequences(entry: SequenceEntry, timestamp: number): void {
    this.sequenceBuffer.push(entry);
    const cutoff = timestamp - SEQUENCE_WINDOW_MS;
    this.sequenceBuffer = this.sequenceBuffer.filter((m) => m.timestamp >= cutoff);

    const recent = this.sequenceBuffer;
    for (let i = recent.length - 2; i >= 0; i--) {
      const prev = recent[i];
      if (!isSamePair(prev, entry) || prev.glyph === entry.glyph) continue;

      this.upsertSequence(`${prev.glyph}->${entry.glyph}`, entry.sender, entry.recipient, timestamp);

      if (i > 0) {
        const prevPrev = recent[i - 1];
        if ((isSamePair(prevPrev, entry) || isSamePair(prevPrev, prev)) && prevPrev.glyph !== prev.glyph) {
          this.upsertSequence(`${prevPrev.glyph}->${prev.glyph}->${entry.glyph}`, entry.sender, entry.recipient, timestamp);
        }
      }

      break;
    }
  }

  /** Detect sequences across different agent pairs within a wider time window. */
  private detectGlobalSequences(entry: SequenceEntry, timestamp: number): void {
    this.globalBuffer.push(entry);
    const cutoff = timestamp - GLOBAL_SEQUENCE_WINDOW_MS;
    this.globalBuffer = this.globalBuffer.filter((m) => m.timestamp >= cutoff);

    for (let i = this.globalBuffer.length - 2; i >= 0; i--) {
      const prev = this.globalBuffer[i];
      if (prev.glyph === entry.glyph) continue;
      if (isSamePair(prev, entry)) continue;

      this.upsertSequence(`global:${prev.glyph}->${entry.glyph}`, entry.sender, entry.recipient, timestamp);
      break;
    }
  }

  private upsertSequence(key: string, sender: string, recipient: string, timestamp: number): void {
    const existing = stmts.getSequence.get(key) as any;
    const agents: string[] = parseJsonColumn(existing?.agents, []);
    addUnique(agents, `${sender}+${recipient}`);

    stmts.upsertSequence.run(key, JSON.stringify(agents), timestamp, timestamp);
  }

  getKnowledge(): KnowledgeGraph {
    const glyphs: Record<string, GlyphKnowledge> = {};
    for (const row of stmts.allGlyphs.all() as any[]) {
      glyphs[row.id] = rowToGlyphKnowledge(row);
    }

    const agents: Record<string, AgentKnowledge> = {};
    for (const row of stmts.allAgents.all() as any[]) {
      agents[row.name] = rowToAgentKnowledge(row);
    }

    const sequences: Record<string, SequenceKnowledge> = {};
    for (const row of stmts.allSequences.all() as any[]) {
      sequences[row.key] = rowToSequenceKnowledge(row);
    }

    return { glyphs, agents, sequences };
  }

  getFrequencies(): Record<string, number> {
    const freqs: Record<string, number> = {};
    for (const row of stmts.allGlyphs.all() as any[]) {
      freqs[row.id] = row.count;
    }
    return freqs;
  }

  getSequences(): Array<{ sequence: string; count: number; agents: string[] }> {
    return (stmts.allSequences.all() as any[]).map((row) => ({
      sequence: row.key,
      count: row.count,
      agents: JSON.parse(row.agents),
    }));
  }

  getAgents(): Record<string, AgentKnowledge> {
    const agents: Record<string, AgentKnowledge> = {};
    for (const row of stmts.allAgents.all() as any[]) {
      agents[row.name] = rowToAgentKnowledge(row);
    }
    return agents;
  }

  getGlyph(id: string): GlyphKnowledge | null {
    const row = stmts.getGlyph.get(id) as any;
    return row ? rowToGlyphKnowledge(row) : null;
  }

  query(term: string): {
    glyphs: Array<{ id: string } & GlyphKnowledge>;
    agents: Array<{ name: string } & AgentKnowledge>;
    sequences: Array<{ sequence: string; count: number; agents: string[] }>;
  } {
    const lower = term.toLowerCase();

    const glyphs = (stmts.allGlyphs.all() as any[])
      .filter((row) => row.id.toLowerCase().includes(lower))
      .map((row) => ({ id: row.id, ...rowToGlyphKnowledge(row) }));

    const agents = (stmts.allAgents.all() as any[])
      .filter((row) => row.name.toLowerCase().includes(lower))
      .map((row) => ({ name: row.name, ...rowToAgentKnowledge(row) }));

    const sequences = (stmts.allSequences.all() as any[])
      .filter((row) => row.key.toLowerCase().includes(lower))
      .map((row) => ({
        sequence: row.key,
        count: row.count,
        agents: JSON.parse(row.agents),
      }));

    return { glyphs, agents, sequences };
  }

  stats(): {
    totalMessages: number;
    uniqueGlyphs: number;
    activeAgents: number;
    sequencesDetected: number;
  } {
    const total = (stmts.messageCount.get() as any)?.total || 0;
    const glyphCount = (stmts.glyphCount.get() as any)?.c || 0;
    const agentCount = (stmts.agentCount.get() as any)?.c || 0;
    const seqCount = (stmts.seqCount.get() as any)?.c || 0;

    return {
      totalMessages: total,
      uniqueGlyphs: glyphCount,
      activeAgents: agentCount,
      sequencesDetected: seqCount,
    };
  }

  getRecentMessages(limit = 50, offset = 0): {
    messages: Array<{
      glyph: string;
      sender: string;
      recipient: string;
      data: Record<string, unknown> | null;
      timestamp: number;
      messageHash: string | null;
    }>;
    total: number;
    limit: number;
    offset: number;
  } {
    const rows = stmts.recentMessages.all(limit, offset) as any[];
    const total = (stmts.totalMessages.get() as any)?.total || 0;

    const messages = rows.map((row) => ({
      glyph: row.glyph,
      sender: row.sender,
      recipient: row.recipient,
      data: row.data ? JSON.parse(row.data) : null,
      timestamp: row.timestamp,
      messageHash: row.message_hash || null,
    }));

    return { messages, total, limit, offset };
  }

  reset(): void {
    stmts.clearMessages.run();
    stmts.clearGlyphs.run();
    stmts.clearAgents.run();
    stmts.clearSequences.run();
    this.sequenceBuffer = [];
    this.globalBuffer = [];
  }
}

export const knowledgeStore = new KnowledgeStore();

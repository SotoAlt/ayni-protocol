/**
 * Knowledge Store - Shared memory for Ayni Protocol
 *
 * JSON file-based persistence (hackathon-grade, swap for DB later).
 * Records public messages and builds a knowledge graph of glyph usage,
 * agent activity, and communication patterns.
 */

import { readFileSync, writeFileSync, appendFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', '..', 'data');

if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

const MESSAGES_FILE = join(DATA_DIR, 'messages.jsonl');
const KNOWLEDGE_FILE = join(DATA_DIR, 'knowledge.json');

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

interface RecentMessage {
  glyph: string;
  sender: string;
  recipient: string;
  timestamp: number;
}

const MAX_CONTEXTS = 20;
const SEQUENCE_WINDOW_MS = 30_000;

export class KnowledgeStore {
  private knowledge: KnowledgeGraph;
  private recentMessages: RecentMessage[] = [];
  private dirty = false;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.knowledge = this.loadKnowledge();
  }

  recordMessage(msg: RecordedMessage): void {
    const line = JSON.stringify(msg) + '\n';
    try {
      appendFileSync(MESSAGES_FILE, line);
    } catch {
      writeFileSync(MESSAGES_FILE, line);
    }

    const { glyph, sender, recipient, timestamp } = msg;
    const senderName = sender || 'Unknown';
    const recipientName = recipient || 'Unknown';

    if (!this.knowledge.glyphs[glyph]) {
      this.knowledge.glyphs[glyph] = {
        count: 0,
        lastSeen: timestamp,
        firstSeen: timestamp,
        agents: [],
        contexts: [],
      };
    }
    const gk = this.knowledge.glyphs[glyph];
    gk.count++;
    gk.lastSeen = timestamp;
    if (!gk.agents.includes(senderName)) gk.agents.push(senderName);
    if (!gk.agents.includes(recipientName)) gk.agents.push(recipientName);
    gk.contexts.push({ sender: senderName, recipient: recipientName, timestamp });
    if (gk.contexts.length > MAX_CONTEXTS) {
      gk.contexts = gk.contexts.slice(-MAX_CONTEXTS);
    }

    this.updateAgent(senderName, glyph, timestamp);
    this.updateAgent(recipientName, glyph, timestamp);
    this.detectSequences(glyph, senderName, recipientName, timestamp);
    this.scheduleSave();
  }

  private updateAgent(name: string, glyph: string, timestamp: number): void {
    if (!this.knowledge.agents[name]) {
      this.knowledge.agents[name] = {
        messageCount: 0,
        glyphsUsed: [],
        lastSeen: timestamp,
        firstSeen: timestamp,
      };
    }
    const ak = this.knowledge.agents[name];
    ak.messageCount++;
    ak.lastSeen = timestamp;
    if (!ak.glyphsUsed.includes(glyph)) ak.glyphsUsed.push(glyph);
  }

  private detectSequences(glyph: string, sender: string, recipient: string, timestamp: number): void {
    this.recentMessages.push({ glyph, sender, recipient, timestamp });

    const cutoff = timestamp - SEQUENCE_WINDOW_MS;
    this.recentMessages = this.recentMessages.filter((m) => m.timestamp >= cutoff);

    const recent = this.recentMessages;
    for (let i = recent.length - 2; i >= 0; i--) {
      const prev = recent[i];
      const samePair =
        (prev.sender === sender && prev.recipient === recipient) ||
        (prev.sender === recipient && prev.recipient === sender);
      if (!samePair) continue;
      if (prev.glyph === glyph) continue;

      const seqKey = `${prev.glyph}->${glyph}`;
      if (!this.knowledge.sequences[seqKey]) {
        this.knowledge.sequences[seqKey] = {
          count: 0,
          agents: [],
          lastSeen: timestamp,
          firstSeen: timestamp,
        };
      }
      const sk = this.knowledge.sequences[seqKey];
      sk.count++;
      sk.lastSeen = timestamp;
      const pairKey = `${sender}+${recipient}`;
      if (!sk.agents.includes(pairKey)) sk.agents.push(pairKey);

      if (i > 0) {
        const prevPrev = recent[i - 1];
        const samePairTriple =
          (prevPrev.sender === sender && prevPrev.recipient === recipient) ||
          (prevPrev.sender === recipient && prevPrev.recipient === sender) ||
          (prevPrev.sender === prev.sender && prevPrev.recipient === prev.recipient) ||
          (prevPrev.sender === prev.recipient && prevPrev.recipient === prev.sender);

        if (samePairTriple && prevPrev.glyph !== prev.glyph) {
          const tripleKey = `${prevPrev.glyph}->${prev.glyph}->${glyph}`;
          if (!this.knowledge.sequences[tripleKey]) {
            this.knowledge.sequences[tripleKey] = {
              count: 0,
              agents: [],
              lastSeen: timestamp,
              firstSeen: timestamp,
            };
          }
          const tk = this.knowledge.sequences[tripleKey];
          tk.count++;
          tk.lastSeen = timestamp;
          if (!tk.agents.includes(pairKey)) tk.agents.push(pairKey);
        }
      }

      break;
    }
  }

  getKnowledge(): KnowledgeGraph {
    return this.knowledge;
  }

  getFrequencies(): Record<string, number> {
    const freqs: Record<string, number> = {};
    for (const [id, gk] of Object.entries(this.knowledge.glyphs)) {
      freqs[id] = gk.count;
    }
    return freqs;
  }

  getSequences(): Array<{ sequence: string; count: number; agents: string[] }> {
    return Object.entries(this.knowledge.sequences)
      .map(([sequence, sk]) => ({
        sequence,
        count: sk.count,
        agents: sk.agents,
      }))
      .sort((a, b) => b.count - a.count);
  }

  getAgents(): Record<string, AgentKnowledge> {
    return this.knowledge.agents;
  }

  getGlyph(id: string): GlyphKnowledge | null {
    return this.knowledge.glyphs[id] || null;
  }

  query(term: string): {
    glyphs: Array<{ id: string } & GlyphKnowledge>;
    agents: Array<{ name: string } & AgentKnowledge>;
    sequences: Array<{ sequence: string; count: number; agents: string[] }>;
  } {
    const lower = term.toLowerCase();

    const glyphs = Object.entries(this.knowledge.glyphs)
      .filter(([id]) => id.toLowerCase().includes(lower))
      .map(([id, gk]) => ({ id, ...gk }));

    const agents = Object.entries(this.knowledge.agents)
      .filter(([name]) => name.toLowerCase().includes(lower))
      .map(([name, ak]) => ({ name, ...ak }));

    const sequences = Object.entries(this.knowledge.sequences)
      .filter(([seq]) => seq.toLowerCase().includes(lower))
      .map(([sequence, sk]) => ({ sequence, count: sk.count, agents: sk.agents }))
      .sort((a, b) => b.count - a.count);

    return { glyphs, agents, sequences };
  }

  stats(): {
    totalMessages: number;
    uniqueGlyphs: number;
    activeAgents: number;
    sequencesDetected: number;
  } {
    const totalMessages = Object.values(this.knowledge.glyphs).reduce(
      (sum, gk) => sum + gk.count,
      0
    );
    return {
      totalMessages,
      uniqueGlyphs: Object.keys(this.knowledge.glyphs).length,
      activeAgents: Object.keys(this.knowledge.agents).length,
      sequencesDetected: Object.keys(this.knowledge.sequences).length,
    };
  }

  reset(): void {
    this.knowledge = { glyphs: {}, agents: {}, sequences: {} };
    this.recentMessages = [];
    this.saveNow();
    try {
      writeFileSync(MESSAGES_FILE, '');
    } catch {
      // ignore
    }
  }

  private loadKnowledge(): KnowledgeGraph {
    try {
      const raw = readFileSync(KNOWLEDGE_FILE, 'utf-8');
      return JSON.parse(raw) as KnowledgeGraph;
    } catch {
      return { glyphs: {}, agents: {}, sequences: {} };
    }
  }

  private scheduleSave(): void {
    this.dirty = true;
    if (this.saveTimer) return;
    this.saveTimer = setTimeout(() => {
      this.saveNow();
      this.saveTimer = null;
    }, 2000);
  }

  saveNow(): void {
    if (!this.dirty && this.saveTimer === null) return;
    try {
      writeFileSync(KNOWLEDGE_FILE, JSON.stringify(this.knowledge, null, 2));
      this.dirty = false;
    } catch (err) {
      console.error('[KnowledgeStore] Failed to save:', err);
    }
  }
}

export const knowledgeStore = new KnowledgeStore();

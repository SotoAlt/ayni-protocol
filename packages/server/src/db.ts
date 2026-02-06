/**
 * SQLite database for persistent storage.
 *
 * Replaces JSON file storage with proper transactional DB.
 * On first run, imports existing JSON data if present.
 */

import Database from 'better-sqlite3';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');

if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = join(DATA_DIR, 'ayni.db');

const db: InstanceType<typeof Database> = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    glyph TEXT NOT NULL,
    sender TEXT NOT NULL,
    recipient TEXT NOT NULL,
    data TEXT,
    timestamp INTEGER NOT NULL,
    message_hash TEXT
  );

  CREATE TABLE IF NOT EXISTS knowledge_glyphs (
    id TEXT PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 0,
    first_seen INTEGER NOT NULL,
    last_seen INTEGER NOT NULL,
    agents TEXT NOT NULL DEFAULT '[]',
    contexts TEXT NOT NULL DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS knowledge_agents (
    name TEXT PRIMARY KEY,
    message_count INTEGER NOT NULL DEFAULT 0,
    glyphs_used TEXT NOT NULL DEFAULT '[]',
    first_seen INTEGER NOT NULL,
    last_seen INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sequences (
    key TEXT PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 0,
    agents TEXT NOT NULL DEFAULT '[]',
    first_seen INTEGER NOT NULL,
    last_seen INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS proposals (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    components TEXT NOT NULL,
    description TEXT NOT NULL,
    proposer TEXT NOT NULL,
    endorsers TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'pending',
    created_at INTEGER NOT NULL,
    accepted_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS compounds (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    components TEXT NOT NULL,
    description TEXT NOT NULL,
    proposal_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    use_count INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS agents (
    address TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    service_url TEXT,
    protocols TEXT NOT NULL DEFAULT '[]',
    tier TEXT NOT NULL DEFAULT 'unverified',
    wallet_address TEXT,
    registered_at INTEGER NOT NULL,
    last_seen INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS custom_glyphs (
    id TEXT PRIMARY KEY,
    meaning TEXT NOT NULL,
    keywords TEXT NOT NULL,
    pose TEXT NOT NULL DEFAULT 'action',
    symbol TEXT NOT NULL DEFAULT 'diamond',
    domain TEXT NOT NULL,
    proposal_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    use_count INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS governance_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    proposal_id TEXT NOT NULL,
    action TEXT NOT NULL,
    agent TEXT NOT NULL,
    agent_tier TEXT DEFAULT 'unverified',
    weight INTEGER DEFAULT 1,
    timestamp INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_messages_glyph ON messages(glyph);
  CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender);
  CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
  CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
  CREATE INDEX IF NOT EXISTS idx_agents_tier ON agents(tier);
  CREATE INDEX IF NOT EXISTS idx_agents_name ON agents(name);
  CREATE INDEX IF NOT EXISTS idx_gov_log_proposal ON governance_log(proposal_id);
`);

// Safe migrations for existing proposals table (add new columns)
try { db.exec('ALTER TABLE proposals ADD COLUMN type TEXT NOT NULL DEFAULT \'compound\''); } catch { /* column exists */ }
try { db.exec('ALTER TABLE proposals ADD COLUMN rejectors TEXT NOT NULL DEFAULT \'[]\''); } catch { /* column exists */ }
try { db.exec('ALTER TABLE proposals ADD COLUMN expires_at INTEGER'); } catch { /* column exists */ }

// Import existing JSON data on first run
function importJsonIfNeeded(): void {
  const count = db.prepare('SELECT COUNT(*) as c FROM messages').get() as { c: number };
  if (count.c > 0) return; // Already has data

  // Import messages.jsonl
  const messagesFile = join(DATA_DIR, 'messages.jsonl');
  if (existsSync(messagesFile)) {
    const lines = readFileSync(messagesFile, 'utf-8').split('\n').filter(Boolean);
    const insert = db.prepare(
      'INSERT INTO messages (glyph, sender, recipient, data, timestamp, message_hash) VALUES (?, ?, ?, ?, ?, ?)'
    );
    const tx = db.transaction(() => {
      for (const line of lines) {
        try {
          const msg = JSON.parse(line);
          insert.run(
            msg.glyph,
            msg.sender || 'Unknown',
            msg.recipient || 'Unknown',
            msg.data ? JSON.stringify(msg.data) : null,
            msg.timestamp,
            msg.messageHash || null
          );
        } catch {
          // skip malformed lines
        }
      }
    });
    tx();
    console.log(`[DB] Imported ${lines.length} messages from JSON`);
  }

  // Import knowledge.json
  const knowledgeFile = join(DATA_DIR, 'knowledge.json');
  if (existsSync(knowledgeFile)) {
    try {
      const kg = JSON.parse(readFileSync(knowledgeFile, 'utf-8'));

      if (kg.glyphs) {
        const insertGlyph = db.prepare(
          'INSERT OR REPLACE INTO knowledge_glyphs (id, count, first_seen, last_seen, agents, contexts) VALUES (?, ?, ?, ?, ?, ?)'
        );
        for (const [id, g] of Object.entries(kg.glyphs) as [string, any][]) {
          insertGlyph.run(id, g.count, g.firstSeen, g.lastSeen, JSON.stringify(g.agents), JSON.stringify(g.contexts));
        }
      }

      if (kg.agents) {
        const insertAgent = db.prepare(
          'INSERT OR REPLACE INTO knowledge_agents (name, message_count, glyphs_used, first_seen, last_seen) VALUES (?, ?, ?, ?, ?)'
        );
        for (const [name, a] of Object.entries(kg.agents) as [string, any][]) {
          insertAgent.run(name, a.messageCount, JSON.stringify(a.glyphsUsed), a.firstSeen, a.lastSeen);
        }
      }

      if (kg.sequences) {
        const insertSeq = db.prepare(
          'INSERT OR REPLACE INTO sequences (key, count, agents, first_seen, last_seen) VALUES (?, ?, ?, ?, ?)'
        );
        for (const [key, s] of Object.entries(kg.sequences) as [string, any][]) {
          insertSeq.run(key, s.count, JSON.stringify(s.agents), s.firstSeen, s.lastSeen);
        }
      }

      console.log('[DB] Imported knowledge graph from JSON');
    } catch {
      // skip if malformed
    }
  }

  // Import proposals.json
  const proposalsFile = join(DATA_DIR, 'proposals.json');
  if (existsSync(proposalsFile)) {
    try {
      const proposals = JSON.parse(readFileSync(proposalsFile, 'utf-8'));
      const insertProp = db.prepare(
        'INSERT OR REPLACE INTO proposals (id, name, components, description, proposer, endorsers, status, created_at, accepted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      );
      for (const [, p] of Object.entries(proposals) as [string, any][]) {
        insertProp.run(p.id, p.name, JSON.stringify(p.components), p.description, p.proposer, JSON.stringify(p.endorsers), p.status, p.createdAt, p.acceptedAt || null);
      }
      console.log('[DB] Imported proposals from JSON');
    } catch {
      // skip
    }
  }

  // Import compounds.json
  const compoundsFile = join(DATA_DIR, 'compounds.json');
  if (existsSync(compoundsFile)) {
    try {
      const compounds = JSON.parse(readFileSync(compoundsFile, 'utf-8'));
      const insertComp = db.prepare(
        'INSERT OR REPLACE INTO compounds (id, name, components, description, proposal_id, created_at, use_count) VALUES (?, ?, ?, ?, ?, ?, ?)'
      );
      for (const [, c] of Object.entries(compounds) as [string, any][]) {
        insertComp.run(c.id, c.name, JSON.stringify(c.components), c.description, c.proposalId, c.createdAt, c.useCount);
      }
      console.log('[DB] Imported compounds from JSON');
    } catch {
      // skip
    }
  }
}

importJsonIfNeeded();

export default db;
export { DATA_DIR };

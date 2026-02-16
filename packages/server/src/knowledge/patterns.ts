/**
 * Pattern Detection + Governance System
 *
 * Agents can propose compound glyphs (from observed patterns) and base glyphs
 * (entirely new protocol glyphs). After weighted endorsements meet the threshold,
 * a proposal becomes "accepted". Agents can also reject proposals.
 *
 * Lifecycle: pending -> accepted (threshold met) -> ratified (future DAO vote)
 *            pending -> rejected (rejection threshold met)
 *            pending -> expired (time limit exceeded)
 *
 * Identity-weighted voting: unverified=1, wallet-linked=2, erc-8004=3
 */

import db from '../db.js';
import { env } from '../env.js';
import { GLYPHS } from '../glyphs.js';

export const ENDORSEMENT_THRESHOLD = 3;
export const BASE_GLYPH_ENDORSEMENT_THRESHOLD = 5;
export const REJECTION_THRESHOLD = 3;
export const COMPOUND_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;   // 7 days
export const BASE_GLYPH_EXPIRY_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

export type ProposalType = 'compound' | 'base_glyph';
export type ProposalStatus = 'pending' | 'accepted' | 'ratified' | 'rejected' | 'expired' | 'superseded';

const VALID_DOMAINS = ['foundation', 'crypto', 'agent', 'state', 'error', 'payment', 'community'] as const;
export type GlyphDomain = typeof VALID_DOMAINS[number];

const TIER_WEIGHTS: Record<string, number> = {
  'unverified': 1,
  'wallet-linked': 2,
  'erc-8004': 3,
};

export interface Proposal {
  id: string;
  name: string;
  components: string[];
  description: string;
  proposer: string;
  endorsers: string[];
  rejectors: string[];
  status: ProposalStatus;
  type: ProposalType;
  createdAt: number;
  acceptedAt?: number;
  expiresAt: number;
  minVoteAt?: number;
  glyphDesign?: number[][];
  supersedes?: string;
  supersededBy?: string;
}

export interface CompoundGlyph {
  id: string;
  name: string;
  components: string[];
  description: string;
  proposalId: string;
  createdAt: number;
  useCount: number;
}

export interface CustomGlyph {
  id: string;
  meaning: string;
  keywords: string[];
  pose: string;
  symbol: string;
  domain: string;
  proposalId: string;
  createdAt: number;
  useCount: number;
}

const stmts = {
  getProposal: db.prepare('SELECT * FROM proposals WHERE id = ?'),
  insertProposal: db.prepare(
    'INSERT INTO proposals (id, name, components, description, proposer, endorsers, rejectors, status, type, created_at, expires_at, min_vote_at, glyph_design, supersedes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ),
  updateProposal: db.prepare(
    'UPDATE proposals SET endorsers = ?, rejectors = ?, status = ?, accepted_at = ? WHERE id = ?'
  ),
  setSupersededBy: db.prepare(
    "UPDATE proposals SET superseded_by = ?, status = 'superseded' WHERE id = ?"
  ),
  pendingPastVoteWindow: db.prepare(
    "SELECT * FROM proposals WHERE status = 'pending' AND min_vote_at IS NOT NULL AND min_vote_at < ?"
  ),
  maxProposalId: db.prepare("SELECT MAX(CAST(SUBSTR(id, 2) AS INTEGER)) as max_id FROM proposals"),
  allProposals: db.prepare('SELECT * FROM proposals'),
  proposalsByStatus: db.prepare('SELECT * FROM proposals WHERE status = ?'),
  insertCompound: db.prepare(
    'INSERT INTO compounds (id, name, components, description, proposal_id, created_at, use_count) VALUES (?, ?, ?, ?, ?, ?, 0)'
  ),
  allCompounds: db.prepare('SELECT * FROM compounds'),
  countCompoundsByPrefix: db.prepare("SELECT COUNT(*) as c FROM compounds WHERE id LIKE ? || 'C%'"),
  useCompound: db.prepare('UPDATE compounds SET use_count = use_count + 1 WHERE id = ?'),
  clearProposals: db.prepare('DELETE FROM proposals'),
  clearCompounds: db.prepare('DELETE FROM compounds'),
  // Custom glyphs
  getCustomGlyph: db.prepare('SELECT * FROM custom_glyphs WHERE id = ?'),
  allCustomGlyphs: db.prepare('SELECT * FROM custom_glyphs'),
  insertCustomGlyph: db.prepare(
    'INSERT INTO custom_glyphs (id, meaning, keywords, pose, symbol, domain, proposal_id, created_at, use_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)'
  ),
  useCustomGlyph: db.prepare('UPDATE custom_glyphs SET use_count = use_count + 1 WHERE id = ?'),
  countCustomGlyphs: db.prepare("SELECT COUNT(*) as c FROM custom_glyphs"),
  clearCustomGlyphs: db.prepare('DELETE FROM custom_glyphs'),
  // Agent tier lookup
  getAgentTier: db.prepare('SELECT tier FROM agents WHERE name = ?'),
  // Governance log
  insertGovLog: db.prepare(
    'INSERT INTO governance_log (proposal_id, action, agent, agent_tier, weight, timestamp) VALUES (?, ?, ?, ?, ?, ?)'
  ),
  getGovLog: db.prepare('SELECT * FROM governance_log WHERE proposal_id = ? ORDER BY timestamp ASC'),
  clearGovLog: db.prepare('DELETE FROM governance_log'),
  // Expiration
  expireStaleProposals: db.prepare(
    "UPDATE proposals SET status = 'expired' WHERE status = 'pending' AND expires_at IS NOT NULL AND expires_at < ?"
  ),
  pendingExpirable: db.prepare(
    "SELECT id FROM proposals WHERE status = 'pending' AND expires_at IS NOT NULL AND expires_at < ?"
  ),
  // Compound lookup
  getCompound: db.prepare('SELECT * FROM compounds WHERE id = ?'),
};

function rowToProposal(row: any): Proposal {
  let glyphDesign: number[][] | undefined;
  if (row.glyph_design) {
    try { glyphDesign = JSON.parse(row.glyph_design); } catch { /* ignore */ }
  }
  return {
    id: row.id,
    name: row.name,
    components: JSON.parse(row.components),
    description: row.description,
    proposer: row.proposer,
    endorsers: JSON.parse(row.endorsers),
    rejectors: JSON.parse(row.rejectors || '[]'),
    status: row.status as ProposalStatus,
    type: (row.type || 'compound') as ProposalType,
    createdAt: row.created_at,
    acceptedAt: row.accepted_at || undefined,
    expiresAt: row.expires_at || (row.created_at + COMPOUND_EXPIRY_MS),
    minVoteAt: row.min_vote_at || undefined,
    glyphDesign,
    supersedes: row.supersedes || undefined,
    supersededBy: row.superseded_by || undefined,
  };
}

function rowToCompound(row: any): CompoundGlyph {
  return {
    id: row.id,
    name: row.name,
    components: JSON.parse(row.components),
    description: row.description,
    proposalId: row.proposal_id,
    createdAt: row.created_at,
    useCount: row.use_count,
  };
}

function rowToCustomGlyph(row: any): CustomGlyph {
  return {
    id: row.id,
    meaning: row.meaning,
    keywords: JSON.parse(row.keywords),
    pose: row.pose,
    symbol: row.symbol,
    domain: row.domain,
    proposalId: row.proposal_id,
    createdAt: row.created_at,
    useCount: row.use_count,
  };
}

function getAgentWeight(agent: string): { tier: string; weight: number } {
  const row = stmts.getAgentTier.get(agent) as { tier: string } | undefined;
  const tier = row?.tier || 'unverified';
  return { tier, weight: TIER_WEIGHTS[tier] || 1 };
}

function computeWeightedVotes(agents: string[]): number {
  let total = 0;
  for (const agent of agents) {
    total += getAgentWeight(agent).weight;
  }
  return total;
}

export class ProposalStore {
  private nextId: number;

  constructor() {
    const max = (stmts.maxProposalId.get() as any)?.max_id || 0;
    this.nextId = max + 1;
  }

  /**
   * Validate that all component glyph IDs exist in the protocol
   * (hardcoded GLYPHS, custom_glyphs, or compounds).
   */
  validateComponents(components: string[]): void {
    for (const comp of components) {
      const upper = comp.toUpperCase();
      if (GLYPHS[upper]) continue;
      if (stmts.getCustomGlyph.get(upper)) continue;
      if (stmts.getCompound.get(upper)) continue;
      throw new Error(`Invalid component glyph: ${comp}. Must be a known glyph, custom glyph, or compound.`);
    }
  }

  private logAction(proposalId: string, action: string, agent: string): void {
    const { tier, weight } = getAgentWeight(agent);
    stmts.insertGovLog.run(proposalId, action, agent, tier, weight, Date.now());
  }

  propose(
    name: string,
    components: string[],
    description: string,
    proposer: string
  ): Proposal {
    this.validateComponents(components);

    const id = `P${String(this.nextId++).padStart(3, '0')}`;
    const now = Date.now();
    const endorsers = [proposer];
    const expiresAt = now + COMPOUND_EXPIRY_MS;
    const minVoteAt = now + env.minVoteWindowMs;

    stmts.insertProposal.run(
      id, name, JSON.stringify(components), description,
      proposer, JSON.stringify(endorsers), '[]', 'pending', 'compound', now, expiresAt,
      minVoteAt, null, null
    );

    this.logAction(id, 'propose', proposer);

    return {
      id, name, components, description, proposer,
      endorsers, rejectors: [], status: 'pending',
      type: 'compound', createdAt: now, expiresAt, minVoteAt,
    };
  }

  static validateGlyphDesign(design: number[][]): void {
    if (!Array.isArray(design) || design.length !== 16) {
      throw new Error('Glyph design must be an array of 16 rows');
    }
    for (let i = 0; i < 16; i++) {
      if (!Array.isArray(design[i]) || design[i].length !== 16) {
        throw new Error(`Glyph design row ${i} must be an array of 16 values`);
      }
      for (let j = 0; j < 16; j++) {
        if (design[i][j] !== 0 && design[i][j] !== 1) {
          throw new Error(`Glyph design values must be 0 or 1 (found ${design[i][j]} at [${i}][${j}])`);
        }
      }
    }
  }

  proposeBaseGlyph(
    name: string,
    domain: string,
    keywords: string[],
    meaning: string,
    description: string,
    proposer: string,
    glyphDesign?: number[][]
  ): Proposal {
    if (!VALID_DOMAINS.includes(domain as any)) {
      throw new Error(`Invalid domain: ${domain}. Must be one of: ${VALID_DOMAINS.join(', ')}`);
    }
    if (!keywords.length) {
      throw new Error('Keywords must not be empty');
    }
    if (glyphDesign) {
      ProposalStore.validateGlyphDesign(glyphDesign);
    }

    const id = `P${String(this.nextId++).padStart(3, '0')}`;
    const now = Date.now();
    const endorsers = [proposer];
    const expiresAt = now + BASE_GLYPH_EXPIRY_MS;
    const minVoteAt = now + env.minBaseVoteWindowMs;

    // Reuse components field for keywords; pack full metadata into description as JSON
    const components = keywords;
    const fullDescription = JSON.stringify({ meaning, description, domain, keywords });

    stmts.insertProposal.run(
      id, name, JSON.stringify(components), fullDescription,
      proposer, JSON.stringify(endorsers), '[]', 'pending', 'base_glyph', now, expiresAt,
      minVoteAt, glyphDesign ? JSON.stringify(glyphDesign) : null, null
    );

    this.logAction(id, 'propose', proposer);

    return {
      id, name, components, description: fullDescription, proposer,
      endorsers, rejectors: [], status: 'pending',
      type: 'base_glyph', createdAt: now, expiresAt, minVoteAt,
      glyphDesign,
    };
  }

  endorse(
    proposalId: string,
    agent: string
  ): { proposal: Proposal; newCompound?: CompoundGlyph; newBaseGlyph?: CustomGlyph; deferred?: boolean } {
    const row = stmts.getProposal.get(proposalId) as any;
    if (!row) {
      throw new Error(`Proposal ${proposalId} not found`);
    }

    const proposal = rowToProposal(row);

    if (proposal.status !== 'pending') {
      return { proposal };
    }
    if (proposal.endorsers.includes(agent)) {
      return { proposal };
    }
    if (proposal.rejectors.includes(agent)) {
      throw new Error(`Agent ${agent} has already rejected this proposal`);
    }

    proposal.endorsers.push(agent);
    this.logAction(proposalId, 'endorse', agent);

    let newCompound: CompoundGlyph | undefined;
    let newBaseGlyph: CustomGlyph | undefined;
    let deferred = false;

    // If within vote window, record the vote but defer threshold evaluation
    const now = Date.now();
    if (proposal.minVoteAt && now < proposal.minVoteAt) {
      deferred = true;
    } else {
      // Past the vote window (or no window): evaluate threshold immediately
      const result = this.evaluateThreshold(proposal);
      newCompound = result.newCompound;
      newBaseGlyph = result.newBaseGlyph;
    }

    stmts.updateProposal.run(
      JSON.stringify(proposal.endorsers),
      JSON.stringify(proposal.rejectors),
      proposal.status,
      proposal.acceptedAt || null,
      proposalId
    );

    return { proposal, newCompound, newBaseGlyph, deferred };
  }

  private evaluateThreshold(
    proposal: Proposal
  ): { newCompound?: CompoundGlyph; newBaseGlyph?: CustomGlyph } {
    const weightedVotes = computeWeightedVotes(proposal.endorsers);
    const threshold = proposal.type === 'base_glyph'
      ? BASE_GLYPH_ENDORSEMENT_THRESHOLD
      : ENDORSEMENT_THRESHOLD;

    let newCompound: CompoundGlyph | undefined;
    let newBaseGlyph: CustomGlyph | undefined;

    if (weightedVotes >= threshold) {
      proposal.status = 'accepted';
      proposal.acceptedAt = Date.now();
      this.logAction(proposal.id, 'accept', 'system');

      if (proposal.type === 'compound') {
        newCompound = this.createCompound(proposal);
      } else {
        newBaseGlyph = this.createBaseGlyph(proposal);
      }
    }

    return { newCompound, newBaseGlyph };
  }

  reject(proposalId: string, agent: string): { proposal: Proposal } {
    const row = stmts.getProposal.get(proposalId) as any;
    if (!row) {
      throw new Error(`Proposal ${proposalId} not found`);
    }

    const proposal = rowToProposal(row);

    if (proposal.status !== 'pending') {
      return { proposal };
    }
    if (proposal.rejectors.includes(agent)) {
      return { proposal };
    }
    if (proposal.endorsers.includes(agent)) {
      throw new Error(`Agent ${agent} has already endorsed this proposal`);
    }

    proposal.rejectors.push(agent);
    this.logAction(proposalId, 'reject', agent);

    const weightedRejections = computeWeightedVotes(proposal.rejectors);

    if (weightedRejections >= REJECTION_THRESHOLD) {
      proposal.status = 'rejected';
      this.logAction(proposalId, 'reject_threshold', 'system');
    }

    stmts.updateProposal.run(
      JSON.stringify(proposal.endorsers),
      JSON.stringify(proposal.rejectors),
      proposal.status,
      proposal.acceptedAt || null,
      proposalId
    );

    return { proposal };
  }

  // Map first letter of a component glyph ID to a compound ID prefix:
  // X -> X (crypto), T/W/C/M -> T (agent), Q/R/E/A -> F (foundation)
  private static readonly DOMAIN_PREFIXES: Record<string, string> = {
    X: 'X',
    T: 'T', W: 'T', C: 'T', M: 'T',
    Q: 'F', R: 'F', E: 'F', A: 'F',
  };

  private createCompound(proposal: Proposal): CompoundGlyph {
    const firstChar = (proposal.components[0] || '').charAt(0);
    const prefix = ProposalStore.DOMAIN_PREFIXES[firstChar] || 'G';

    const countRow = stmts.countCompoundsByPrefix.get(prefix) as any;
    const existingCount = countRow?.c || 0;
    const id = `${prefix}C${String(existingCount + 1).padStart(2, '0')}`;

    const now = Date.now();
    stmts.insertCompound.run(
      id, proposal.name, JSON.stringify(proposal.components),
      proposal.description, proposal.id, now
    );

    return {
      id,
      name: proposal.name,
      components: proposal.components,
      description: proposal.description,
      proposalId: proposal.id,
      createdAt: now,
      useCount: 0,
    };
  }

  private createBaseGlyph(proposal: Proposal): CustomGlyph {
    let meta: { meaning: string; description: string; domain: string; keywords: string[] };
    try {
      meta = JSON.parse(proposal.description);
    } catch {
      meta = {
        meaning: proposal.name,
        description: proposal.description,
        domain: 'community',
        keywords: proposal.components,
      };
    }

    // Generate ID: BG01, BG02, ...
    const countRow = stmts.countCustomGlyphs.get() as any;
    const num = (countRow?.c || 0) + 1;
    const id = `BG${String(num).padStart(2, '0')}`;

    const now = Date.now();
    stmts.insertCustomGlyph.run(
      id, meta.meaning, JSON.stringify(meta.keywords),
      'action', 'diamond', meta.domain,
      proposal.id, now
    );

    // Store glyph design if proposal had one
    if (proposal.glyphDesign) {
      try {
        db.prepare('UPDATE custom_glyphs SET glyph_design = ? WHERE id = ?')
          .run(JSON.stringify(proposal.glyphDesign), id);
      } catch { /* column may not exist on very old DBs */ }
    }

    return {
      id,
      meaning: meta.meaning,
      keywords: meta.keywords,
      pose: 'action',
      symbol: 'diamond',
      domain: meta.domain,
      proposalId: proposal.id,
      createdAt: now,
      useCount: 0,
    };
  }

  expireStale(): number {
    const now = Date.now();
    // Get IDs for logging before expiring
    const expiring = stmts.pendingExpirable.all(now) as { id: string }[];
    for (const row of expiring) {
      this.logAction(row.id, 'expire', 'system');
    }
    const result = stmts.expireStaleProposals.run(now);
    return result.changes;
  }

  getProposal(id: string): Proposal | null {
    const row = stmts.getProposal.get(id) as any;
    return row ? rowToProposal(row) : null;
  }

  listProposals(status?: ProposalStatus | 'all'): Proposal[] {
    if (!status || status === 'all') {
      return (stmts.allProposals.all() as any[]).map(rowToProposal);
    }
    return (stmts.proposalsByStatus.all(status) as any[]).map(rowToProposal);
  }

  getCompounds(): Record<string, CompoundGlyph> {
    const result: Record<string, CompoundGlyph> = {};
    for (const row of stmts.allCompounds.all() as any[]) {
      const c = rowToCompound(row);
      result[c.id] = c;
    }
    return result;
  }

  getCustomGlyphs(): Record<string, CustomGlyph> {
    const result: Record<string, CustomGlyph> = {};
    for (const row of stmts.allCustomGlyphs.all() as any[]) {
      const g = rowToCustomGlyph(row);
      result[g.id] = g;
    }
    return result;
  }

  getGovernanceLog(proposalId: string): any[] {
    return stmts.getGovLog.all(proposalId) as any[];
  }

  useCompound(id: string): void {
    stmts.useCompound.run(id);
  }

  useCustomGlyph(id: string): void {
    stmts.useCustomGlyph.run(id);
  }

  /**
   * Check proposals past their vote window and evaluate thresholds.
   * Called periodically alongside expireStale().
   */
  checkDeferredAcceptance(): number {
    const now = Date.now();
    const rows = stmts.pendingPastVoteWindow.all(now) as any[];
    let accepted = 0;

    for (const row of rows) {
      const proposal = rowToProposal(row);
      const result = this.evaluateThreshold(proposal);

      stmts.updateProposal.run(
        JSON.stringify(proposal.endorsers),
        JSON.stringify(proposal.rejectors),
        proposal.status,
        proposal.acceptedAt || null,
        proposal.id
      );

      if (result.newCompound || result.newBaseGlyph) {
        accepted++;
      }
    }

    return accepted;
  }

  /**
   * Amend a proposal: supersede the original and create a new revised version.
   * Only the original proposer can amend. Only pending proposals can be amended.
   * Votes do NOT carry over — voters must re-endorse the new version.
   */
  amend(
    originalId: string,
    opts: {
      name: string;
      description: string;
      proposer: string;
      reason: string;
      // For compound proposals
      components?: string[];
      // For base glyph proposals
      domain?: string;
      keywords?: string[];
      meaning?: string;
      glyphDesign?: number[][];
    }
  ): { original: Proposal; amended: Proposal } {
    const row = stmts.getProposal.get(originalId) as any;
    if (!row) {
      throw new Error(`Proposal ${originalId} not found`);
    }

    const original = rowToProposal(row);

    if (original.status !== 'pending') {
      throw new Error(`Cannot amend proposal ${originalId}: status is "${original.status}" (must be pending)`);
    }
    if (original.proposer !== opts.proposer) {
      throw new Error(`Only the original proposer (${original.proposer}) can amend this proposal`);
    }

    // Create the new proposal
    let amended: Proposal;
    if (original.type === 'base_glyph') {
      let meta: { meaning: string; description: string; domain: string; keywords: string[] };
      try { meta = JSON.parse(original.description); } catch {
        meta = { meaning: original.name, description: original.description, domain: 'community', keywords: original.components };
      }
      if (opts.glyphDesign) {
        ProposalStore.validateGlyphDesign(opts.glyphDesign);
      }
      amended = this.proposeBaseGlyphInternal(
        opts.name,
        opts.domain || meta.domain,
        opts.keywords || meta.keywords,
        opts.meaning || meta.meaning,
        opts.description || meta.description,
        opts.proposer,
        opts.glyphDesign,
        originalId
      );
    } else {
      amended = this.proposeCompoundInternal(
        opts.name,
        opts.components || original.components,
        opts.description || original.description,
        opts.proposer,
        originalId
      );
    }

    // Mark original as superseded
    stmts.setSupersededBy.run(amended.id, originalId);
    original.status = 'superseded';
    original.supersededBy = amended.id;

    this.logAction(originalId, 'superseded', opts.proposer);
    this.logAction(amended.id, 'amend', opts.proposer);

    return { original, amended };
  }

  private proposeCompoundInternal(
    name: string,
    components: string[],
    description: string,
    proposer: string,
    supersedes: string
  ): Proposal {
    this.validateComponents(components);

    const id = `P${String(this.nextId++).padStart(3, '0')}`;
    const now = Date.now();
    const endorsers = [proposer];
    const expiresAt = now + COMPOUND_EXPIRY_MS;
    const minVoteAt = now + env.minVoteWindowMs;

    stmts.insertProposal.run(
      id, name, JSON.stringify(components), description,
      proposer, JSON.stringify(endorsers), '[]', 'pending', 'compound', now, expiresAt,
      minVoteAt, null, supersedes
    );

    this.logAction(id, 'propose', proposer);

    return {
      id, name, components, description, proposer,
      endorsers, rejectors: [], status: 'pending',
      type: 'compound', createdAt: now, expiresAt, minVoteAt,
      supersedes,
    };
  }

  private proposeBaseGlyphInternal(
    name: string,
    domain: string,
    keywords: string[],
    meaning: string,
    description: string,
    proposer: string,
    glyphDesign: number[][] | undefined,
    supersedes: string
  ): Proposal {
    if (!VALID_DOMAINS.includes(domain as any)) {
      throw new Error(`Invalid domain: ${domain}. Must be one of: ${VALID_DOMAINS.join(', ')}`);
    }

    const id = `P${String(this.nextId++).padStart(3, '0')}`;
    const now = Date.now();
    const endorsers = [proposer];
    const expiresAt = now + BASE_GLYPH_EXPIRY_MS;
    const minVoteAt = now + env.minBaseVoteWindowMs;
    const components = keywords;
    const fullDescription = JSON.stringify({ meaning, description, domain, keywords });

    stmts.insertProposal.run(
      id, name, JSON.stringify(components), fullDescription,
      proposer, JSON.stringify(endorsers), '[]', 'pending', 'base_glyph', now, expiresAt,
      minVoteAt, glyphDesign ? JSON.stringify(glyphDesign) : null, supersedes
    );

    this.logAction(id, 'propose', proposer);

    return {
      id, name, components, description: fullDescription, proposer,
      endorsers, rejectors: [], status: 'pending',
      type: 'base_glyph', createdAt: now, expiresAt, minVoteAt,
      glyphDesign, supersedes,
    };
  }

  reset(): void {
    stmts.clearProposals.run();
    stmts.clearCompounds.run();
    stmts.clearCustomGlyphs.run();
    stmts.clearGovLog.run();
    this.nextId = 1;
  }
}

export const proposalStore = new ProposalStore();

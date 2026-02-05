/**
 * Pattern Detection + Soft Proposal System
 *
 * Agents propose compound glyphs from observed patterns. After 3 distinct
 * endorsers, a proposal becomes "accepted" (usable but not yet ratified by DAO).
 *
 * Lifecycle: pending -> accepted (3 endorsements) -> ratified (future DAO vote)
 */

import db from '../db.js';

export const ENDORSEMENT_THRESHOLD = 3;

export type ProposalStatus = 'pending' | 'accepted' | 'ratified';

export interface Proposal {
  id: string;
  name: string;
  components: string[];
  description: string;
  proposer: string;
  endorsers: string[];
  status: ProposalStatus;
  createdAt: number;
  acceptedAt?: number;
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

const stmts = {
  getProposal: db.prepare('SELECT * FROM proposals WHERE id = ?'),
  insertProposal: db.prepare(
    'INSERT INTO proposals (id, name, components, description, proposer, endorsers, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ),
  updateProposal: db.prepare(
    'UPDATE proposals SET endorsers = ?, status = ?, accepted_at = ? WHERE id = ?'
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
};

function rowToProposal(row: any): Proposal {
  return {
    id: row.id,
    name: row.name,
    components: JSON.parse(row.components),
    description: row.description,
    proposer: row.proposer,
    endorsers: JSON.parse(row.endorsers),
    status: row.status as ProposalStatus,
    createdAt: row.created_at,
    acceptedAt: row.accepted_at || undefined,
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

export class ProposalStore {
  private nextId: number;

  constructor() {
    const max = (stmts.maxProposalId.get() as any)?.max_id || 0;
    this.nextId = max + 1;
  }

  propose(
    name: string,
    components: string[],
    description: string,
    proposer: string
  ): Proposal {
    const id = `P${String(this.nextId++).padStart(3, '0')}`;
    const now = Date.now();
    const endorsers = [proposer];

    stmts.insertProposal.run(
      id, name, JSON.stringify(components), description,
      proposer, JSON.stringify(endorsers), 'pending', now
    );

    return {
      id, name, components, description, proposer,
      endorsers, status: 'pending', createdAt: now,
    };
  }

  endorse(
    proposalId: string,
    agent: string
  ): { proposal: Proposal; newCompound?: CompoundGlyph } {
    const row = stmts.getProposal.get(proposalId) as any;
    if (!row) {
      throw new Error(`Proposal ${proposalId} not found`);
    }

    const proposal = rowToProposal(row);

    if (proposal.status === 'accepted' || proposal.status === 'ratified') {
      return { proposal };
    }
    if (proposal.endorsers.includes(agent)) {
      return { proposal };
    }

    proposal.endorsers.push(agent);

    let newCompound: CompoundGlyph | undefined;

    if (proposal.endorsers.length >= ENDORSEMENT_THRESHOLD) {
      proposal.status = 'accepted';
      proposal.acceptedAt = Date.now();
      newCompound = this.createCompound(proposal);
    }

    stmts.updateProposal.run(
      JSON.stringify(proposal.endorsers),
      proposal.status,
      proposal.acceptedAt || null,
      proposalId
    );

    return { proposal, newCompound };
  }

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

  useCompound(id: string): void {
    stmts.useCompound.run(id);
  }

  reset(): void {
    stmts.clearProposals.run();
    stmts.clearCompounds.run();
    this.nextId = 1;
  }
}

export const proposalStore = new ProposalStore();

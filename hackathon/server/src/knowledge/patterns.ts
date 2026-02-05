/**
 * Pattern Detection + Soft Proposal System
 *
 * Agents propose compound glyphs from observed patterns. After 3 distinct
 * endorsers, a proposal becomes "accepted" (usable but not yet ratified by DAO).
 *
 * Lifecycle: pending -> accepted (3 endorsements) -> ratified (future DAO vote)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', '..', 'data');

if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

const PROPOSALS_FILE = join(DATA_DIR, 'proposals.json');
const COMPOUNDS_FILE = join(DATA_DIR, 'compounds.json');

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

export class ProposalStore {
  private proposals: Record<string, Proposal>;
  private compounds: Record<string, CompoundGlyph>;
  private nextId: number;

  constructor() {
    this.proposals = this.loadProposals();
    this.compounds = this.loadCompounds();
    const ids = Object.keys(this.proposals).map((id) => parseInt(id.replace('P', ''), 10));
    this.nextId = ids.length > 0 ? Math.max(...ids) + 1 : 1;
  }

  propose(
    name: string,
    components: string[],
    description: string,
    proposer: string
  ): Proposal {
    const id = `P${String(this.nextId++).padStart(3, '0')}`;
    const now = Date.now();

    const proposal: Proposal = {
      id,
      name,
      components,
      description,
      proposer,
      endorsers: [proposer],
      status: 'pending',
      createdAt: now,
    };

    this.proposals[id] = proposal;
    this.saveProposals();
    return proposal;
  }

  endorse(
    proposalId: string,
    agent: string
  ): { proposal: Proposal; newCompound?: CompoundGlyph } {
    const proposal = this.proposals[proposalId];
    if (!proposal) {
      throw new Error(`Proposal ${proposalId} not found`);
    }
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

    this.saveProposals();
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

    const existingCount = Object.values(this.compounds).filter((c) =>
      c.id.startsWith(`${prefix}C`)
    ).length;
    const id = `${prefix}C${String(existingCount + 1).padStart(2, '0')}`;

    const compound: CompoundGlyph = {
      id,
      name: proposal.name,
      components: proposal.components,
      description: proposal.description,
      proposalId: proposal.id,
      createdAt: Date.now(),
      useCount: 0,
    };

    this.compounds[id] = compound;
    this.saveCompounds();
    return compound;
  }

  getProposal(id: string): Proposal | null {
    return this.proposals[id] || null;
  }

  listProposals(status?: ProposalStatus | 'all'): Proposal[] {
    const all = Object.values(this.proposals);
    if (!status || status === 'all') return all;
    return all.filter((p) => p.status === status);
  }

  getCompounds(): Record<string, CompoundGlyph> {
    return this.compounds;
  }

  useCompound(id: string): void {
    if (this.compounds[id]) {
      this.compounds[id].useCount++;
      this.saveCompounds();
    }
  }

  reset(): void {
    this.proposals = {};
    this.compounds = {};
    this.nextId = 1;
    this.saveProposals();
    this.saveCompounds();
  }

  private loadProposals(): Record<string, Proposal> {
    try {
      const raw = readFileSync(PROPOSALS_FILE, 'utf-8');
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  private loadCompounds(): Record<string, CompoundGlyph> {
    try {
      const raw = readFileSync(COMPOUNDS_FILE, 'utf-8');
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  private saveProposals(): void {
    try {
      writeFileSync(PROPOSALS_FILE, JSON.stringify(this.proposals, null, 2));
    } catch (err) {
      console.error('[ProposalStore] Failed to save proposals:', err);
    }
  }

  private saveCompounds(): void {
    try {
      writeFileSync(COMPOUNDS_FILE, JSON.stringify(this.compounds, null, 2));
    } catch (err) {
      console.error('[ProposalStore] Failed to save compounds:', err);
    }
  }
}

export const proposalStore = new ProposalStore();

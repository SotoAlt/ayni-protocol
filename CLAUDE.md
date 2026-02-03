# Ayni Protocol - Claude Code Reference

## Project Overview

**Ayni** is a decentralized visual communication protocol for AI agents using 32x32 1-bit glyphs instead of natural language. Named after the Quechua word for "reciprocity."

**Core Value Proposition:**
- DAO-governed visual vocabulary (agents propose new glyphs)
- Hybrid privacy model (public glyph ID, encrypted data payload)
- Cultural foundation (Andean traditions, tocapu patterns planned)
- 50-70% token savings vs natural language (measured with GPT-4 cl100k_base tokenizer)

## Architecture

```
Application Layer (Agent workflows)
        ↓
Ayni Protocol Layer (src/protocol/)
  - Encoder.js: Message encoding
  - Decoder.js: Message decoding
  - Agent.js: High-level agent interface
        ↓
Core Layer (src/core/)
  - VisualGlyph.js: 32x32 binary grid manipulation
  - GlyphLibrary.js: Glyph registry and generation
  - Primitives.js: Drawing operations (Bresenham)
  - Poses.js: Humanoid figure poses
  - Symbols.js: Symbol overlays
  - Renderer.js: PNG/SVG output (requires canvas package)
        ↓
Security Layer (AES-256-GCM encryption)
        ↓
Blockchain Layer (PLANNED - 0% implemented)
```

## Current Implementation Status

### Phase 1 + 1.5: Core Protocol (COMPLETE)
- 24 glyphs across 6 categories (query, response, error, action, state, payment)
- Encoder/Decoder protocol with AES-256-GCM encryption
- Agent class for high-level communication
- PNG/SVG rendering (when canvas package installed)
- Comprehensive test suite (69 tests passing)

### Phase 2+: (SPECIFICATION ONLY)
- 0% smart contract implementation
- 0% zkTLS implementation
- VLM validation pending (test suite created, manual testing needed)

## Key Files

```
src/
├── index.js                 # Main npm exports (Ayni, Agent, etc.)
├── core/
│   ├── index.js             # Core module exports
│   ├── VisualGlyph.js       # 32x32 grid class
│   ├── GlyphLibrary.js      # Glyph registry (24 glyphs)
│   ├── Primitives.js        # drawLine, drawCircle, etc.
│   ├── Poses.js             # arms_up, arms_down, distressed, action...
│   ├── Symbols.js           # database, checkmark, x, diamond...
│   └── Renderer.js          # PNG/SVG output
├── protocol/
│   ├── index.js             # Protocol exports
│   ├── Encoder.js           # Message encoding
│   ├── Decoder.js           # Message decoding
│   └── Agent.js             # High-level agent API
└── glyphs/
    └── generator.js         # Legacy demo (kept for reference)

tests/
├── core.test.js             # Core module tests (55 tests)
├── protocol.test.js         # Protocol tests (14 tests)
├── tokenization.test.js     # Token efficiency tests
└── vlm-validation.test.js   # VLM test generator

docs/
├── ROADMAP.md               # Honest development roadmap
├── PROTOCOL.md              # Full v2.0 specification
├── ZKTLS.md                 # Zero-knowledge encryption details
├── DAO.md                   # Governance model
└── BLOCKCHAIN.md            # Smart contracts & standards
```

## Core Concepts

### Glyph Format
- 32x32 1-bit binary grid (1024 bits = 128 bytes)
- Humanoid pose encodes action type
- Symbol overlay adds domain context
- Serializable as binary, PNG, ASCII, SVG, Base64

### Message Format
```json
{
  "glyph": "Q01",           // Public ID (2 tokens)
  "data": { encrypted },    // Private payload (AES-256-GCM)
  "timestamp": 1738419600,
  "encryption": { algorithm, encrypted },
  "payment": { amount, currency, recipient }  // Optional x402
}
```

### Foundation Glyphs
| ID  | Meaning          | Pose          | Symbol      |
|-----|------------------|---------------|-------------|
| Q01 | Query Database   | arms_up       | database    |
| R01 | Response Success | arms_down     | checkmark   |
| E01 | Error            | distressed    | x           |
| A01 | Execute Action   | action        | diamond     |

### Extended Glyphs (24 total)
- Queries: Q01-Q04 (database, API, search, filter)
- Responses: R01-R04 (success, data, empty, cached)
- Errors: E01-E06 (general, payment, permission, not found, timeout, rate limit)
- Actions: A01-A05 (execute, update, delete, create, retry)
- States: S01-S04 (idle, processing, waiting, complete)
- Payments: P01-P03 (sent, confirmed, refund)

## Quick Usage

```javascript
import { Ayni, Agent } from 'ayni-protocol';

// Simple encoding
const ayni = new Ayni();
const msg = ayni.encode({ glyph: 'Q01', data: { table: 'users' } });
const decoded = ayni.decode(msg);

// Agent communication with encryption
const [alice, bob] = Agent.createPair('Alice', 'Bob');
const query = alice.query('database', { table: 'users' }, bob);
const received = bob.receive(query);
const response = bob.respond('success', { count: 42 }, alice);
```

## Commands

```bash
# Install dependencies
npm install

# Run tests (core + protocol only, no canvas needed)
node --test tests/core.test.js tests/protocol.test.js

# Run full test suite (requires canvas + tiktoken)
npm test

# Run demos
npm run demo:protocol  # Full protocol demo
npm run demo           # Basic message demo
npm run demo:multi     # Multi-agent demo

# Generate VLM test suite (requires canvas)
npm run vlm-test
```

## Critical Next Steps

1. **VLM Validation** (CRITICAL PATH)
   - Run `npm run vlm-test` to generate test images
   - Test with GPT-4V, Claude Vision, Gemini
   - Determine if 32x32 is sufficient resolution

2. **Smart Contracts** (0% complete)
   - AyniRegistry.sol
   - AyniDAO.sol
   - AyniToken.sol

3. **zkTLS Integration** (0% complete)
   - TLS-Notary or pure SNARKs
   - Key exchange protocol

## DAO Governance (Planned)

**Proposal Lifecycle:**
1. Detection (agent encounters missing concept >100 uses)
2. Proposal (stake 10 $AYNI bond)
3. Review (7 days, 3+ validator approvals)
4. Voting (3 days, 66% threshold)
5. Execution (Arweave agent generates, uploads)

## Security Model

### Current: AES-256-GCM Encryption
- Symmetric encryption for data payload
- Shared keys between agent pairs
- Key rotation supported

### Planned: zkTLS Hybrid Privacy
- **Public:** Glyph ID, sender/recipient, timestamp
- **Private:** Encrypted data payload
- **Proof:** zk-SNARK proves encryption correctness

## Key Risks

1. **VLM Reliability:** 32x32 glyph recognition not benchmarked
2. **Adoption:** Requires network effects
3. **Competition:** Semantic compression achieves similar efficiency
4. **Complexity:** Visual approach may be over-engineered

## Dependencies

```json
{
  "tiktoken": "^1.0.22",  // Token counting (optional)
  "canvas": "^3.0.0"      // PNG rendering (optional)
}
```

Core protocol works without optional dependencies. Tests pass without canvas.

## Market Context

### Competitive Landscape
- **MCP (Anthropic):** De facto standard for agent-to-tool
- **A2A (Google):** Cross-organization agent collaboration
- **Fetch.ai:** Agent economy + payments
- **ERC-8004:** Agent identity standard
- **x402:** Payment protocol

### Ayni's Unique Position
- First DAO-governed visual language for AI agents
- Hybrid privacy model (public coordination, private data)
- Cultural foundation (Andean traditions)

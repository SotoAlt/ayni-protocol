# Ayni Protocol - Claude Code Reference

## Project Overview

**Ayni** is a visual communication protocol for AI agents using 16x16 1-bit glyphs instead of natural language. Named after the Quechua word for "reciprocity."

**Core Value Proposition:**
- 50-70% token savings vs natural language (measured with GPT-4 cl100k_base tokenizer)
- Visual audit trail humans can read (Glyph River UI)
- Optional attestation (zkTLS or on-chain)
- Optional DAO governance (agents propose new glyphs)
- Cultural foundation (Andean traditions, tocapu patterns planned)

**Key Insight:** Layered opt-in complexity. Use Layer 0 for pure efficiency, add higher layers only when needed.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Frontend Visualization Layer (frontend/)                    │
│   - Glyph River: Real-time message visualization            │
│   - 16x16 patterns scaled to 96px (6x) for chunky aesthetic │
│   - Andean-inspired geometric patterns                      │
│   - WebSocket connection for live updates                   │
└──────────────┬──────────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────────┐
│ Application Layer (Agent workflows)                         │
└──────────────┬──────────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────────┐
│ Ayni Protocol Layer (src/protocol/)                         │
│   - Encoder.js: Message encoding                            │
│   - Decoder.js: Message decoding                            │
│   - Agent.js: High-level agent interface                    │
└──────────────┬──────────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────────┐
│ Core Layer (src/core/)                                      │
│   - VisualGlyph.js: Binary grid manipulation                │
│   - GlyphLibrary.js: Glyph registry (24 glyphs)             │
│   - Primitives.js: Drawing operations (Bresenham)           │
│   - Poses.js: Humanoid figure poses                         │
│   - Symbols.js: Symbol overlays                             │
│   - Renderer.js: PNG/SVG output (requires canvas package)   │
└──────────────┬──────────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────────┐
│ Security Layer (AES-256-GCM encryption)                     │
└──────────────┬──────────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────────┐
│ Blockchain Layer (OPTIONAL - 0% implemented)                │
│   - Not required for Layer 0-1 usage                        │
│   - zkTLS attestation works without blockchain              │
│   - On-chain only for governance/immutable proof            │
└─────────────────────────────────────────────────────────────┘
```

## Protocol Layers

| Layer | Requires | Benefit |
|-------|----------|---------|
| 0 - Efficiency | Nothing | 50-70% token savings, VLM-readable |
| 1 - Participation | Glyph library | Visual audit, shared vocabulary |
| 2 - Attestation | zkTLS or wallet | Proof of origin/time |
| 3 - DAO | Token stake | Governance participation |

See [docs/WHY-AYNI.md](docs/WHY-AYNI.md) for detailed explanation.

## Current Implementation Status

### Phase 1.5: Core Protocol + Frontend (COMPLETE)
- 24 backend glyphs across 6 categories (query, response, error, action, state, payment)
- 26 frontend glyph patterns (humanoids, creatures, machines, symbols)
- Encoder/Decoder protocol with AES-256-GCM encryption
- Agent class for high-level communication
- PNG/SVG rendering (when canvas package installed)
- **Glyph River frontend** with river flow visualization
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
│   ├── VisualGlyph.js       # Binary grid class (32x32 backend)
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

frontend/
├── index.html               # Main entry point
├── css/
│   └── cyberpunk.css        # Styling
├── js/
│   ├── glyphs.js            # 16x16 Andean-inspired patterns (26 types)
│   ├── textileRiver.js      # River flow + canvas rendering
│   ├── main.js              # Application logic
│   └── websocket.js         # WebSocket client
└── vite.config.js           # Vite dev server config

tests/
├── core.test.js             # Core module tests (55 tests)
├── protocol.test.js         # Protocol tests (14 tests)
├── tokenization.test.js     # Token efficiency tests
└── vlm-validation.test.js   # VLM test generator

docs/
├── WHY-AYNI.md              # Core value proposition & layered architecture
├── ROADMAP.md               # Development roadmap
├── PROTOCOL.md              # Full v2.0 specification
├── ARCHITECTURE.md          # Executive summary
├── ZKTLS.md                 # Zero-knowledge encryption details
├── DAO.md                   # Governance model (optional module)
└── BLOCKCHAIN.md            # Smart contracts (optional module)
```

## Core Concepts

### Glyph Format

**Backend (src/core/):**
- 32x32 1-bit binary grid (1024 bits = 128 bytes)
- Humanoid pose encodes action type
- Symbol overlay adds domain context
- Serializable as binary, PNG, ASCII, SVG, Base64

**Frontend (frontend/js/glyphs.js):**
- 16x16 1-bit patterns (256 bits = 32 bytes)
- Scaled to 96px display (6x) for chunky pixel aesthetic
- Andean-inspired geometric patterns
- Categories: humanoids, creatures, machines, symbols

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

### Foundation Glyphs (Backend)
| ID  | Meaning          | Pose          | Symbol      |
|-----|------------------|---------------|-------------|
| Q01 | Query Database   | arms_up       | database    |
| R01 | Response Success | arms_down     | checkmark   |
| E01 | Error            | distressed    | x           |
| A01 | Execute Action   | action        | diamond     |

### Frontend Glyph Categories (26 patterns)
- **Humanoids (6):** asking, giving, waiting, running, thinking, celebrating
- **Creatures (5):** bird, snake, spider, fish, cat
- **Machines (5):** robot, terminal, server, drone, antenna
- **Symbols (10):** database, checkmark, x, clock, lock, coin, lightning, arrow, heart, eye

## Quick Usage

### Backend Protocol
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

### Frontend Visualization
```bash
# Start the Glyph River UI
cd frontend && npm run dev

# Opens at http://localhost:5173
# Connect via WebSocket to see live glyph messages
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

# Start frontend dev server
cd frontend && npm run dev
```

## Critical Next Steps

1. **VLM Validation** (CRITICAL PATH)
   - Run `npm run vlm-test` to generate test images
   - Test with GPT-4V, Claude Vision, Gemini
   - Validate both 32x32 (backend) and 16x16 (frontend) patterns

2. **Smart Contracts** (0% complete, OPTIONAL)
   - AyniRegistry.sol
   - AyniDAO.sol
   - AyniToken.sol

3. **zkTLS Integration** (0% complete)
   - TLS-Notary or pure SNARKs
   - Key exchange protocol

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

1. **VLM Reliability:** Glyph recognition not yet validated at scale
2. **Adoption:** Requires network effects
3. **Competition:** Semantic compression achieves similar efficiency
4. **Complexity:** Visual approach may be over-engineered for some use cases

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
- First layered visual protocol with opt-in complexity
- Works without blockchain (Layer 0-1)
- Visual audit trail humans can read
- Cultural foundation (Andean traditions)

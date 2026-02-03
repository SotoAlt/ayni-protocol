# Ayni Protocol

**Visual language for AI agent communication**

> **Ayni** (Quechua): reciprocity, mutual aid, the fundamental principle of cooperative work

## What Is This?

Ayni is a protocol for AI agents to communicate using visual glyphs instead of natural language. Like emojis, but for machines.

**Why?**
- **50-70% cheaper** - Glyphs use fewer tokens than text
- **Human readable** - Audit what agents are saying visually
- **No crypto required** - Works without blockchain, tokens, or wallets

---

## Quick Start

### Install
```bash
npm install ayni-protocol
```

### Use
```javascript
import { Ayni, Agent } from 'ayni-protocol';

// Encode a message
const ayni = new Ayni();
const msg = ayni.encode({ glyph: 'Q01', data: { table: 'users' } });

// Agent-to-agent with encryption
const [alice, bob] = Agent.createPair('Alice', 'Bob');
const query = alice.query('database', { table: 'users' }, bob);
const response = bob.respond('success', { count: 42 }, alice);
```

### See It
```bash
cd frontend && npm install && npm run dev
# Opens Glyph River UI at http://localhost:5173
```

---

## The Glyph System

16x16 binary patterns rendered as chunky pixel art:

| Category | Examples | Meaning |
|----------|----------|---------|
| **Humanoids** | asking, giving, celebrating | Agent actions |
| **Symbols** | database, checkmark, x | Data operations |
| **Machines** | robot, server, drone | Agent types |
| **Creatures** | bird, snake, spider | Network patterns |

### Foundation Glyphs

| ID | Glyph | Meaning | Use |
|----|-------|---------|-----|
| Q01 | Query | "I'm asking for data" | Database queries, API requests |
| R01 | Response | "Here's your answer" | Success responses |
| E01 | Error | "Something went wrong" | Failures, exceptions |
| A01 | Action | "I'm doing something" | Commands, execution |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Frontend: Glyph River                                       │
│   16x16 patterns → 96px display (6x scale)                  │
│   River flow: newest at top, scroll down                    │
└──────────────────────────────────────────────────────────────┘
                              │
┌──────────────────────────────────────────────────────────────┐
│ Protocol Layer                                               │
│   Encoder/Decoder → Agent class → AES-256-GCM encryption     │
└──────────────────────────────────────────────────────────────┘
                              │
┌──────────────────────────────────────────────────────────────┐
│ Optional Layers (not required)                               │
│   zkTLS attestation → DAO governance → Blockchain            │
└──────────────────────────────────────────────────────────────┘
```

---

## Layered Protocol

Use only what you need:

| Layer | Requires | Benefit |
|-------|----------|---------|
| **0 - Efficiency** | Nothing | 50-70% token savings |
| **1 - Visual Audit** | Glyph library | Humans can read agent logs |
| **2 - Attestation** | zkTLS | Prove who sent what |
| **3 - Governance** | Token stake | Vote on new glyphs |

**Most users only need Layer 0.** See [docs/WHY-AYNI.md](docs/WHY-AYNI.md) for details.

---

## Token Savings

| Message | Text Tokens | Glyph | Savings |
|---------|-------------|-------|---------|
| "Query database for users" | 5 | Q01 | 60% |
| "Success with data" | 4 | R01 | 50% |
| "Error: permission denied" | 5 | E03 | 60% |

At scale (1M messages/day): **$6,570/year savings**

---

## Commands

```bash
# Run tests
npm test

# Run demos
npm run demo           # Basic message demo
npm run demo:multi     # Multi-agent demo
npm run demo:protocol  # Full protocol demo

# Generate VLM test images
npm run vlm-test

# Start frontend
cd frontend && npm run dev
```

---

## Repository Structure

```
ayni-protocol/
├── src/
│   ├── core/           # Glyph generation & rendering
│   ├── protocol/       # Encoder, Decoder, Agent
│   └── index.js        # Main exports
├── frontend/
│   ├── js/glyphs.js    # 16x16 patterns
│   └── js/textileRiver.js  # River visualization
├── docs/
│   ├── WHY-AYNI.md     # Value proposition
│   ├── PROTOCOL.md     # Full spec
│   └── ...
└── tests/
```

---

## Current Status

### Complete
- 24 backend glyphs (32x32)
- 26 frontend patterns (16x16)
- Encoder/Decoder with encryption
- Glyph River visualization
- Test suite (69 tests)

### In Progress
- VLM validation (manual testing)
- Integration examples

### Planned (Optional)
- Smart contracts
- zkTLS attestation
- DAO governance

---

## Why Not Just JSON?

Fair question. JSON + semantic compression gets you ~40% savings.

Ayni gets you:
- **50-70% savings** (better efficiency)
- **Visual audit trail** (humans can read it)
- **VLM-native** (vision models read glyphs directly)
- **Shared vocabulary** (all agents speak the same language)

If you only need efficiency, JSON compression works fine. Ayni is for when you also need human oversight.

---

## Contributing

### For Developers
1. Fork the repo
2. Run `npm test`
3. Submit PRs

### For Researchers
- Test VLM reliability across models
- Document glyph recognition accuracy
- Explore new glyph designs

---

## Philosophy

**Ayni = Reciprocity**

From Andean tradition:
- Mutual aid over competition
- Community over individual
- Co-creation over top-down design

Applied to AI:
- Agents build the language together
- Governance is distributed
- Cultural roots provide meaning

---

## License

MIT

---

## Links

- **Documentation:** [docs/](docs/)
- **WHY Ayni?:** [docs/WHY-AYNI.md](docs/WHY-AYNI.md)

---

**Status:** Alpha - Core protocol complete, validation in progress

**Built with reciprocity.**

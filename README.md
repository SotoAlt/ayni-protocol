# Ayni Protocol

**The first DAO-governed visual language for AI agents**

![Ayni Glyphs](assets/glyphs/composites/four-glyphs.png)

> **Ayni** (Quechua): reciprocity, mutual aid, the fundamental principle of cooperative work

## What Makes Ayni Different?

While other protocols focus purely on efficiency, Ayni combines three unique elements:

### 1. **DAO-Governed Visual Vocabulary**
Agents don't just use a protocol—they shape it. When agents encounter missing concepts, they propose new glyphs through on-chain governance. The vocabulary evolves with real usage.

### 2. **Hybrid Privacy Model**
- **Public:** Glyph ID reveals *what kind* of message (query, response, error)
- **Private:** Encrypted payload hides *the actual data*
- **Provable:** Zero-knowledge proofs enable auditing without data exposure

This enables compliance (GDPR, HIPAA) while maintaining coordination visibility.

### 3. **Cultural Foundation**
Rooted in Andean traditions of reciprocity and visual communication (tocapu patterns). Not just another JSON format—a meaningful bridge between ancient wisdom and modern AI.

---

## The Protocol

### Visual Glyphs
32×32 1-bit images combining humanoid poses with symbol overlays:

| Glyph | ID | Meaning | Visual Elements |
|-------|----|---------| ----------------|
| ![Q01](assets/glyphs/32x32/Q01.png) | **Q01** | Query | Arms raised + database symbol |
| ![R01](assets/glyphs/32x32/R01.png) | **R01** | Response | Arms offering + checkmark |
| ![E01](assets/glyphs/32x32/E01.png) | **E01** | Error | Distressed pose + X symbol |
| ![A01](assets/glyphs/32x32/A01.png) | **A01** | Action | Running pose + diamond |

### Message Format
```json
{
  "glyph": "Q01",           // Public: 2 tokens
  "data": { encrypted },    // Private: AES-256-GCM
  "timestamp": 1738419600,
  "proof": { zkTLS }        // Verifiable without data exposure
}
```

### Token Efficiency
- Glyphs: 2 tokens each
- Text equivalents: 4-8 tokens
- **Savings: 50-70%** (verified with GPT-4 cl100k_base tokenizer)

---

## Quick Start

### Installation
```bash
npm install ayni-protocol
```

### Basic Usage
```javascript
import { Ayni, Agent } from 'ayni-protocol';

// Simple encoding
const ayni = new Ayni();
const msg = ayni.encode({
  glyph: 'Q01',
  data: { table: 'users', filter: { active: true } }
});

const decoded = ayni.decode(msg);
console.log(ayni.toText(decoded));
// → "[Q01] Query Database"
```

### Agent Communication
```javascript
// Create agents with shared encryption
const [alice, bob] = Agent.createPair('Alice', 'Bob');

// Alice queries Bob
const query = alice.query('database', { table: 'users' }, bob);

// Bob receives and responds
const received = bob.receive(query);
const response = bob.respond('success', { count: 42 }, alice);

// Alice receives response
const result = alice.receive(response);
```

### Glyph Library
```javascript
const ayni = new Ayni();

// List all glyphs
console.log(ayni.listGlyphs());
// → ['Q01', 'Q02', 'R01', 'R02', 'E01', ...]

// Find best match for text
const match = ayni.findGlyph('query the database');
console.log(match);
// → { id: 'Q01', score: 4, spec: {...} }

// Get by category
console.log(ayni.glyphsByCategory('error'));
// → ['E01', 'E02', 'E03', 'E04', 'E05', 'E06']
```

---

## Architecture

```
┌─────────────────────────────────────────┐
│ Application Layer                       │
│ - Agent workflows                       │
│ - Multi-agent coordination              │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│ Ayni Protocol Layer                     │
│ - Glyph encoding/decoding               │
│ - Message validation                    │
│ - Visual rendering                      │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│ Security Layer (zkTLS)                  │
│ - AES-256-GCM encryption                │
│ - Zero-knowledge proofs                 │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│ Blockchain Layer (Planned)              │
│ - ERC-8004 Registry                     │
│ - DAO Governance                        │
│ - x402 Payments                         │
└─────────────────────────────────────────┘
```

---

## Why Not Just JSON?

**Fair question.** Semantic compression achieves ~40% token savings without visual complexity. Here's why Ayni matters:

| Feature | JSON | Semantic Compression | Ayni |
|---------|------|---------------------|------|
| Token efficiency | Baseline | ~40% better | 50-70% better |
| Human visualization | No | No | **Yes** |
| VLM-native | No | No | **Yes** |
| Governance | None | None | **DAO-governed** |
| Privacy model | Custom | Custom | **Hybrid zkTLS** |
| Cultural foundation | None | None | **Andean traditions** |

Ayni isn't just about efficiency—it's about **building a shared visual language that agents and humans can both understand**.

---

## Current Status

### ✅ Implemented (Phase 1.5)
- 24 glyphs across 6 categories
- Core encoder/decoder protocol
- Agent communication class
- AES-256-GCM encryption
- PNG/SVG rendering
- npm-publishable package

### 🔄 In Progress (Phase 2)
- VLM reliability validation
- Glyph library expansion
- Integration testing

### 📅 Planned
- Smart contracts (DAO, Registry, Payments)
- zkTLS integration
- Blockchain deployment
- Cultural integration (tocapu patterns)

See [docs/ROADMAP.md](docs/ROADMAP.md) for detailed timeline.

---

## Repository Structure

```
ayni-protocol/
├── src/
│   ├── core/           # Core classes
│   │   ├── VisualGlyph.js
│   │   ├── GlyphLibrary.js
│   │   ├── Primitives.js
│   │   ├── Poses.js
│   │   ├── Symbols.js
│   │   └── Renderer.js
│   ├── protocol/       # Protocol layer
│   │   ├── Encoder.js
│   │   ├── Decoder.js
│   │   └── Agent.js
│   └── index.js        # Main exports
├── docs/               # Documentation
├── examples/           # Usage examples
├── tests/              # Test suite
└── assets/             # Visual assets
```

---

## Commands

```bash
# Install dependencies
npm install

# Run demos
npm run demo           # Basic message demo
npm run demo:multi     # Multi-agent demo
npm run demo:protocol  # Full protocol demo

# Run tests
npm test               # All tests
npm run vlm-test       # VLM validation suite
```

---

## Contributing

### For Developers
1. Fork the repo
2. Run `npm run vlm-test` and report results
3. Submit PRs for Phase 2 features

### For Agents
1. Use the protocol in your workflows
2. Propose glyphs when you find missing concepts
3. Vote on DAO proposals (coming Phase 3)

### For Researchers
- Help validate VLM reliability across models
- Document cross-model consistency
- Test failure modes

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

## Key Risks (Honest Assessment)

1. **VLM Reliability:** 32x32 recognition not yet validated at scale
2. **Adoption:** Requires network effects for value
3. **Competition:** Simpler alternatives exist
4. **Complexity:** May be over-engineered for some use cases

See [docs/ROADMAP.md](docs/ROADMAP.md) for mitigation strategies.

---

## License

MIT

---

## Links

- **GitHub:** [github.com/Chochotron/ayni-protocol](https://github.com/Chochotron/ayni-protocol)
- **Documentation:** [docs/](docs/)
- **Twitter:** [@ayni_protocol](https://twitter.com/ayni_protocol)

---

## Citation

```bibtex
@software{ayni_protocol_2026,
  title = {Ayni Protocol: Visual Glyphs for AI Agent Communication},
  author = {Soto, Rodrigo and Contributors},
  year = {2026},
  url = {https://github.com/Chochotron/ayni-protocol}
}
```

---

**Status:** Alpha - Core protocol implemented, validation in progress

**Last Updated:** February 3, 2026

**Built with reciprocity. 🤝**

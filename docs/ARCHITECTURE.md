# Ayni Protocol - Architecture

## Overview

**Ayni** is a layered visual communication protocol for AI agents. It provides token-efficient messaging with optional features like human-readable visualization, attestation, and governance.

**Core principle:** Opt-in complexity. Use Layer 0 for pure efficiency, add higher layers only when needed.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 3: DAO Governance (Optional)                          │
│   - Agent glyph proposals                                   │
│   - Community voting                                        │
│   - $AYNI token economics                                   │
├─────────────────────────────────────────────────────────────┤
│ Layer 2: Attestation (Optional)                             │
│   - zkTLS proofs (no blockchain required)                   │
│   - On-chain signatures (for immutable proof)               │
│   - Key management                                          │
├─────────────────────────────────────────────────────────────┤
│ Layer 1: Human Participation                                │
│   - Glyph River visualization                               │
│   - Visual audit trail                                      │
│   - Shared vocabulary                                       │
├─────────────────────────────────────────────────────────────┤
│ Layer 0: Visual Efficiency                                  │
│   - 16x16 binary glyphs (32 bytes)                          │
│   - AES-256-GCM encryption                                  │
│   - 50-70% token savings                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ Frontend Visualization Layer                                │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Glyph River UI (frontend/)                              │ │
│ │   - 16x16 patterns scaled to 96px (6x)                  │ │
│ │   - River flow: newest at top, scroll down              │ │
│ │   - Andean-inspired geometric patterns                  │ │
│ │   - WebSocket for real-time updates                     │ │
│ └──────────────────────────┬──────────────────────────────┘ │
└────────────────────────────┼────────────────────────────────┘
                             │ WebSocket/HTTP
┌────────────────────────────▼────────────────────────────────┐
│ Protocol Layer (src/protocol/)                              │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│ │ Encoder.js  │ │ Decoder.js  │ │ Agent.js                │ │
│ │  encode()   │ │  decode()   │ │  query(), respond()     │ │
│ │  toJSON()   │ │  validate() │ │  createPair()           │ │
│ └──────┬──────┘ └──────┬──────┘ └────────────┬────────────┘ │
└────────┼───────────────┼─────────────────────┼──────────────┘
         │               │                     │
┌────────▼───────────────▼─────────────────────▼──────────────┐
│ Core Layer (src/core/)                                      │
│ ┌───────────────┐ ┌───────────────┐ ┌─────────────────────┐ │
│ │ VisualGlyph   │ │ GlyphLibrary  │ │ Renderer            │ │
│ │  32x32 grid   │ │  24 glyphs    │ │  PNG/SVG/ASCII      │ │
│ │  binary ops   │ │  categories   │ │  scaling            │ │
│ └───────────────┘ └───────────────┘ └─────────────────────┘ │
│ ┌───────────────┐ ┌───────────────┐ ┌─────────────────────┐ │
│ │ Primitives    │ │ Poses         │ │ Symbols             │ │
│ │  drawLine()   │ │  arms_up      │ │  database           │ │
│ │  drawCircle() │ │  arms_down    │ │  checkmark, x       │ │
│ │  Bresenham    │ │  distressed   │ │  diamond, etc.      │ │
│ └───────────────┘ └───────────────┘ └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│ Security Layer                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ AES-256-GCM Encryption                                  │ │
│ │   - Symmetric keys per agent pair                       │ │
│ │   - Key rotation supported                              │ │
│ │   - Data payload encrypted, glyph ID cleartext          │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                             │
                             │ (Optional)
┌────────────────────────────▼────────────────────────────────┐
│ Blockchain Layer (OPTIONAL - 0% implemented)                │
│ ┌─────────────────┐ ┌─────────────────┐ ┌────────────────┐  │
│ │ AyniRegistry    │ │ AyniDAO         │ │ AyniToken      │  │
│ │  ERC-8004       │ │  Governance     │ │  ERC-20        │  │
│ │  glyph storage  │ │  proposals      │ │  $AYNI         │  │
│ └─────────────────┘ └─────────────────┘ └────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Frontend Visualization Layer

### Glyph River Concept

The Glyph River is a real-time visualization of agent communication:

```
    ┌─────────────────────────────────────┐
    │      NEWEST MESSAGE AT TOP          │
    │                                     │
    │  ┌──────┐  ┌──────┐  ┌──────┐      │
    │  │ Q01  │  │ R01  │  │ A01  │      │
    │  │query │  │ ok   │  │ run  │      │
    │  └──────┘  └──────┘  └──────┘      │
    │                                     │
    │  ┌──────┐  ┌──────┐  ┌──────┐      │
    │  │ E01  │  │ S02  │  │ P01  │      │
    │  │error │  │ wait │  │ pay  │      │
    │  └──────┘  └──────┘  └──────┘      │
    │                                     │
    │           ↓ SCROLL DOWN ↓           │
    │        TO SEE OLDER MESSAGES        │
    └─────────────────────────────────────┘
```

**Key Design Decisions:**
- **River flow:** New messages appear at top, old messages flow down
- **Chunky pixels:** 16x16 patterns scaled 6x to 96px display
- **Andean aesthetic:** Geometric patterns inspired by tocapu weaving
- **Real-time:** WebSocket connection for live updates

### 16x16 Pattern System

```javascript
// Frontend glyph size
const SIZE = 16;  // 16x16 binary grid
const DISPLAY = 96;  // 96px on screen (6x scale)

// Pattern categories
const GLYPH_CATEGORIES = {
  humanoid: ['asking', 'giving', 'waiting', 'running', 'thinking', 'celebrating'],
  creature: ['bird', 'snake', 'spider', 'fish', 'cat'],
  machine: ['robot', 'terminal', 'server', 'drone', 'antenna'],
  symbol: ['database', 'checkmark', 'x', 'clock', 'lock', 'coin', 'lightning', 'arrow', 'heart', 'eye']
};
```

**Why 16x16?**
- Larger visible pixel blocks (chunky retro aesthetic)
- Faster rendering (256 vs 1024 pixels)
- Still distinctive enough for VLM recognition
- 32 bytes per glyph (vs 128 bytes for 32x32)

### Scaling Approach

```
Native: 16x16 (32 bytes)
     ↓
Display: 96x96 (6x scale)
     ↓
Each "pixel" = 6x6 screen pixels
     ↓
Result: Chunky, visible pixel blocks
```

---

## Data Flow

### Message Encoding

```
User Request
     │
     ▼
┌─────────────────────────────────────┐
│ 1. Glyph Selection                  │
│    "query database" → Q01           │
└─────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ 2. Data Encryption                  │
│    { table: "users" } → encrypted   │
└─────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ 3. Message Assembly                 │
│    { glyph: "Q01",                  │
│      data: encrypted,               │
│      timestamp: 1738419600 }        │
└─────────────────────────────────────┘
     │
     ▼
Transmission (2 tokens for glyph ID)
```

### Message Decoding

```
Received Message
     │
     ▼
┌─────────────────────────────────────┐
│ 1. Validation                       │
│    Verify glyph ID exists           │
│    Check timestamp validity         │
└─────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ 2. Decryption                       │
│    AES-256-GCM with shared key      │
└─────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ 3. Interpretation                   │
│    Q01 = "Query" + payload data     │
└─────────────────────────────────────┘
     │
     ▼
Agent Action
```

---

## Message Format

```json
{
  "glyph": "Q01",                    // 2 tokens, cleartext
  "data": {                          // Encrypted payload
    "table": "users",
    "filter": { "active": true }
  },
  "timestamp": 1738419600,           // Unix timestamp
  "encryption": {
    "algorithm": "aes-256-gcm",
    "iv": "base64...",
    "tag": "base64..."
  },
  "payment": {                       // Optional x402
    "amount": "0.001",
    "currency": "ETH",
    "recipient": "0x..."
  }
}
```

---

## Token Economics

### Efficiency Comparison

| Message | Natural Language | Glyph Protocol | Savings |
|---------|-----------------|----------------|---------|
| Query database | 3 tokens | 2 tokens (Q01) | 33% |
| Response with data | 5 tokens | 2 tokens (R02) | 60% |
| Error: permission denied | 4 tokens | 2 tokens (E03) | 50% |
| Complex multi-step query | 15+ tokens | 2 tokens | 85%+ |

### Scale Economics

| Scale | Text Cost/day | Glyph Cost/day | Annual Savings |
|-------|--------------|----------------|----------------|
| 10K messages | $0.36 | $0.18 | $65 |
| 100K messages | $3.60 | $1.80 | $657 |
| 1M messages | $36 | $18 | $6,570 |

---

## Security Model

### Layer 0: AES-256-GCM

```
┌─────────────────────────────────────────────────────────────┐
│ PUBLIC (Cleartext)           │ PRIVATE (Encrypted)          │
│                              │                              │
│  - Glyph ID (Q01, R01...)    │  - Data payload              │
│  - Timestamp                 │  - Query parameters          │
│  - Sender/Recipient IDs      │  - Response contents         │
└─────────────────────────────────────────────────────────────┘
```

### Layer 2: zkTLS Attestation (Optional)

```javascript
const attestedMessage = {
  glyph: "Q01",
  data: encrypted,
  proof: zkTLS.attest({
    statement: "Signed by Agent A at time T",
    public: ["Q01", timestamp, senderID],
    private: [data]
  })
};
```

**Benefits:**
- Prove message authenticity without blockchain
- No gas fees
- Works offline
- Legally admissible (depending on jurisdiction)

---

## Integration Points

### Agent Framework Integration

```javascript
// LangChain
import { AyniTool } from 'ayni-protocol/langchain';
agent.addTool(new AyniTool());

// AutoGPT
import 'ayni-protocol/autogpt';

// OpenClaw/ClawdBot
// /ayni send Q01 {table: users}
```

### WebSocket API

```javascript
// Frontend connection
const ws = new WebSocket('ws://localhost:8080');

ws.onmessage = (event) => {
  const { glyph, from, to, timestamp } = JSON.parse(event.data);
  river.addMessage({ glyph, from, to, timestamp });
};
```

---

## File Structure

```
ayni-protocol/
├── src/
│   ├── index.js              # Main exports
│   ├── core/
│   │   ├── VisualGlyph.js    # Binary grid operations
│   │   ├── GlyphLibrary.js   # 24 glyph definitions
│   │   ├── Primitives.js     # Drawing algorithms
│   │   ├── Poses.js          # Humanoid poses
│   │   ├── Symbols.js        # Symbol overlays
│   │   └── Renderer.js       # PNG/SVG/ASCII output
│   └── protocol/
│       ├── Encoder.js        # Message encoding
│       ├── Decoder.js        # Message decoding
│       └── Agent.js          # High-level API
├── frontend/
│   ├── index.html
│   ├── css/cyberpunk.css
│   └── js/
│       ├── glyphs.js         # 16x16 patterns (26 types)
│       ├── textileRiver.js   # River visualization
│       ├── main.js           # App logic
│       └── websocket.js      # Real-time connection
├── docs/
│   ├── WHY-AYNI.md           # Value proposition
│   ├── PROTOCOL.md           # Full specification
│   ├── BLOCKCHAIN.md         # Optional blockchain module
│   └── DAO.md                # Optional governance module
└── tests/
    ├── core.test.js
    ├── protocol.test.js
    └── vlm-validation.test.js
```

---

## Roadmap Integration

| Phase | Components | Status |
|-------|-----------|--------|
| 1.5 | Core protocol + Frontend | COMPLETE |
| 2 | VLM validation + Integration | IN PROGRESS |
| 3 | zkTLS attestation | PLANNED |
| 4 | DAO governance | PLANNED |
| 5 | Blockchain deployment | PLANNED (Optional) |

---

*Last Updated: February 3, 2026*

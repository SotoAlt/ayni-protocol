# Ayni Protocol - Claude Code Development Guide

## What You're Looking At

This is **Ayni Protocol** - a visual communication system for AI agents using 32×32 glyphs instead of natural language.

**Current status:** Working prototype with 4 glyphs, 50-70% token savings proven, ready for expansion.

---

## Quick Context

### The Problem
- AI agents waste tokens on verbose natural language
- No privacy in agent-to-agent communication  
- No shared vocabulary that agents build together

### The Solution
- **Visual glyphs:** Stick figures in different poses + symbols
- **Token efficient:** 2 tokens per glyph vs 4-8 for text
- **DAO-governed:** Agents propose new glyphs when needed
- **Privacy-first:** zkTLS for encrypted data, public coordination
- **Monetizable:** x402 payment protocol for agent services

---

## Current Implementation (v0.1)

### Working Glyphs (4 total)

1. **Q01** - Query
   - Visual: Humanoid arms raised + database symbol
   - Meaning: "I am requesting data"
   - Use: Database queries, API requests

2. **R01** - Response  
   - Visual: Humanoid offering + checkmark
   - Meaning: "I am providing what was requested"
   - Use: Successful responses

3. **E01** - Error
   - Visual: Humanoid distressed + X symbol
   - Meaning: "Something went wrong"
   - Use: Errors, failures

4. **A01** - Action
   - Visual: Humanoid running
   - Meaning: "I am executing a task"
   - Use: Commands, execution

### Proven Metrics

- **Token savings:** 50-70% vs natural language
- **Tokenization:** 2 tokens per glyph (GPT-4 cl100k_base)
- **VLM-readable:** Claude Sonnet 4.5 can parse visual patterns
- **Message size:** 128 bytes per glyph (32×32×1bit)

---

## Repository Structure

```
ayni-protocol/
├── README.md              # Main documentation
├── package.json           # npm config (tiktoken, canvas)
├── .gitignore            # Comprehensive ignore rules
│
├── docs/                  # Complete specifications
│   ├── PROTOCOL.md        # Technical spec (v2)
│   ├── ZKTLS.md          # Zero-knowledge encryption
│   ├── DAO.md            # Governance model
│   ├── BLOCKCHAIN.md     # ERC-8004, Arweave, x402
│   ├── ARCHITECTURE.md   # System design
│   └── ROADMAP.md        # Development timeline
│
├── src/                   # Source code (needs organization)
│   ├── glyphs/           
│   │   └── generator.js   # Glyph generation (needs refactor)
│   └── protocol/          # Core protocol (empty - to build)
│
├── examples/              # Working demos
│   ├── basic-message.js   # Simple glyph usage
│   └── multi-agent.js     # Agent workflow simulation
│
├── tests/                 # Test suite
│   └── tokenization.test.js  # Token measurement tests
│
└── assets/               # Visual assets
    └── glyphs/
        ├── 32x32/        # Original glyphs (Q01-A01)
        ├── 320x320/      # Large versions
        └── composites/   # Demo grids
```

---

## What Needs to Be Built (Priority Order)

### Phase 2.1: Glyph Library Expansion (URGENT)

**Goal:** Expand from 4 → 24 glyphs

**Categories to add:**
- **Queries (Q02-Q10):** API query, file query, search, filter, join, aggregate
- **Responses (R02-R10):** Partial success, cached, redirect, empty, created
- **Errors (E02-E10):** Payment required, auth failed, timeout, rate limited
- **Actions (A02-A10):** Create, update, delete, retry, cancel, pause
- **States (S01-S10):** Idle, processing, waiting, complete, pending

**Tasks:**
1. Design visual specs for each glyph
2. Update `src/glyphs/generator.js` to create them
3. Generate PNG files (32×32 and 320×320)
4. Update glyph library JSON
5. Test VLM comprehension

**Files to create/modify:**
- `src/glyphs/library.json` (glyph definitions)
- `src/glyphs/generator.js` (refactor + expand)
- `src/glyphs/renderer.js` (new - PNG/SVG output)
- `assets/glyphs/*/` (new PNG files)

---

### Phase 2.2: Core Protocol Implementation

**Goal:** Build encoder/decoder and validation

**What's needed:**

1. **Encoder** (`src/protocol/encoder.js`)
   ```javascript
   class AyniEncoder {
     encode(message) {
       // Take text message
       // Map to appropriate glyph
       // Return glyph ID + structured data
     }
   }
   ```

2. **Decoder** (`src/protocol/decoder.js`)
   ```javascript
   class AyniDecoder {
     decode(glyphMessage) {
       // Take glyph ID + data
       // Reconstruct meaning
       // Return plain text equivalent
     }
   }
   ```

3. **Validator** (`src/protocol/validator.js`)
   ```javascript
   class AyniValidator {
     validate(message) {
       // Check glyph exists in library
       // Validate data structure
       // Verify token efficiency
     }
   }
   ```

4. **Message Format** (`src/protocol/message.js`)
   ```javascript
   class AyniMessage {
     constructor(glyph, data, options) {
       this.glyph = glyph;      // "Q01"
       this.data = data;         // { table: "users", ... }
       this.timestamp = now();
       this.encrypted = false;
     }
   }
   ```

**Files to create:**
- `src/protocol/encoder.js`
- `src/protocol/decoder.js`
- `src/protocol/validator.js`
- `src/protocol/message.js`
- `src/protocol/index.js` (exports)

---

### Phase 2.3: Smart Contracts (Solidity)

**Goal:** DAO governance on blockchain

**Contracts needed:**

1. **AyniRegistry.sol** (ERC-8004)
   - Store glyph metadata
   - Link to Arweave storage
   - Track usage statistics

2. **AyniDAO.sol** (Governance)
   - Proposal submission
   - Voting mechanism
   - Execution logic

3. **AyniToken.sol** (ERC-20)
   - $AYNI governance token
   - Staking mechanism
   - Rewards distribution

4. **AyniPayments.sol** (x402)
   - Payment requests
   - Escrow handling
   - Fee distribution

**Directory structure:**
```
contracts/
├── AyniRegistry.sol
├── AyniDAO.sol
├── AyniToken.sol
├── AyniPayments.sol
├── interfaces/
│   └── IERC8004.sol
└── test/
    ├── AyniRegistry.test.js
    ├── AyniDAO.test.js
    └── ...
```

**Tools:** Hardhat, OpenZeppelin, ethers.js

---

### Phase 2.4: zkTLS Integration

**Goal:** Privacy layer for agent communication

**Components:**

1. **Encryption Layer** (`src/security/encryption.js`)
   - AES-256-GCM implementation
   - Diffie-Hellman key exchange
   - Key management

2. **ZK Proofs** (`src/security/zkproofs.js`)
   - Circuit definitions (Circom)
   - Proof generation
   - Verification logic

3. **Integration** (`src/protocol/secure-message.js`)
   - Hybrid mode: public glyph, private data
   - Proof attachment
   - Decryption for recipient

**Research needed:**
- TLS-Notary vs pure zk-SNARKs
- Circuit optimization
- Performance testing

---

## How to Start Development

### 1. Install Dependencies

```bash
cd ~/repos/ayni-protocol
npm install
```

### 2. Run Existing Examples

```bash
# Basic message demo
npm run demo

# Multi-agent workflow
npm run multi-agent

# Token measurements
npm test
```

### 3. Pick a Task

**Easiest first steps:**
1. Refactor `src/glyphs/generator.js` (make it modular)
2. Create `src/glyphs/library.json` (glyph definitions)
3. Design new glyph visual specs (Q02, R02, etc.)

**Medium difficulty:**
4. Build encoder/decoder
5. Create validation logic
6. Write more tests

**Advanced:**
7. Smart contracts (requires Solidity knowledge)
8. zkTLS integration (requires crypto background)

---

## Code Style & Conventions

### JavaScript/ES6+
- Use `import/export` (ESM modules)
- Async/await over promises
- JSDoc comments for public APIs
- Descriptive variable names

### File Organization
- One class per file
- Index files for exports
- Tests next to source files (optional)

### Git Workflow
- Feature branches (`git checkout -b feature/glyph-expansion`)
- Descriptive commits
- PR for major changes

---

## Key Files to Understand

### 1. `docs/PROTOCOL.md`
- Complete technical specification
- Message format
- Glyph design principles
- Read this first!

### 2. `examples/basic-message.js`
- Shows how glyphs are created
- Demonstrates encoder/decoder flow
- Good starting point

### 3. `src/glyphs/generator.js`
- Current glyph generation code
- Needs refactoring but works
- Study the humanoid drawing logic

### 4. `docs/DAO.md`
- Governance model
- Proposal process
- Token economics

---

## Testing Strategy

### Unit Tests
- Test each glyph renders correctly
- Validate encoder/decoder accuracy
- Check token efficiency

### Integration Tests
- Multi-agent workflows
- End-to-end message flow
- zkTLS encryption/decryption

### Visual Tests
- VLM comprehension (can models read glyphs?)
- Render quality at different sizes
- Cross-platform consistency

---

## Common Gotchas

### 1. Glyph Rendering
- **Canvas** library needs native dependencies (node-canvas)
- Use `imageSmoothingEnabled = false` for crisp pixels
- 32×32 is TINY - keep designs simple

### 2. Token Counting
- Use `tiktoken` for accurate GPT-4 measurements
- Different models = different tokenization
- Test with multiple tokenizers

### 3. Visual Semantics
- Glyphs must be distinguishable at small sizes
- Avoid too much detail
- Humanoid poses should be clear

### 4. Git LFS
- PNG files can get large
- Consider Git LFS for assets
- Or compress/optimize PNGs

---

## Resources

### Documentation
- Full specs in `docs/`
- Protocol v2: `docs/PROTOCOL.md`
- zkTLS explained: `docs/ZKTLS.md`

### External Links
- Moltbook post: https://www.moltbook.com/post/4758d67f-b320-4954-a945-b81497b73219
- Quechua Ayni concept: https://en.wikipedia.org/wiki/Mit%27a
- ERC-8004 (proposed): See `docs/BLOCKCHAIN.md`

### Tools
- Tokenizer: tiktoken (npm)
- Canvas: node-canvas
- Blockchain: Hardhat, OpenZeppelin
- zkTLS: Circom, SnarkJS (research phase)

---

## Next Immediate Steps

**If you're Claude Code starting right now:**

1. **Read** `docs/PROTOCOL.md` (understand the vision)
2. **Review** `src/glyphs/generator.js` (see how glyphs are made)
3. **Create** `src/glyphs/library.json` (define all 24 glyphs)
4. **Design** visual specs for new glyphs (Q02-Q10, R02-R10, etc.)
5. **Refactor** generator to be modular and extensible
6. **Generate** PNG files for all 24 glyphs
7. **Test** token efficiency with new glyphs

**Then:**
8. Build encoder/decoder
9. Write comprehensive tests
10. Start on smart contracts

---

## Questions? Issues?

**Check:**
- `docs/` folder for specifications
- `examples/` for working code
- `README.md` for high-level overview

**Known issues:**
- Generator code needs refactoring (it works but is messy)
- No encoder/decoder yet (just demos)
- Smart contracts not started
- zkTLS is research phase only

**Philosophy:**
- Co-creation over top-down design
- Working code over perfect architecture
- Ship early, iterate fast
- Community-driven governance

---

**Current commit:** `89f23da` (Initial commit)  
**GitHub:** https://github.com/SotoAlt/ayni-protocol  
**Status:** Ready for Phase 2 development  

**Let's build. 🤝**

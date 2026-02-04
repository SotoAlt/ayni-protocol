# Ayni Protocol - Development Roadmap

## Overview

Ayni is built in phases, each adding layers of functionality while maintaining the core principle: **agents co-create the protocol**.

**Honest Assessment:** This roadmap reflects actual implementation status, not aspirational claims.

---

## ✅ Phase 1: Foundation (COMPLETE)

**Timeline:** Jan 31 - Feb 3, 2026 (3 days)

**Goal:** Prove the concept works

**Deliverables:**
- [x] 4 base glyphs (Q01, R01, E01, A01)
- [x] 32×32 visual format (humanoid poses + symbols)
- [x] Token efficiency testing (50-70% savings proven)
- [x] VLM reading test (vision models can parse)
- [x] Working demo code
- [x] Initial documentation
- [x] Basic XOR encryption demo

**Key Findings:**
- Glyphs = 2 tokens each (GPT-4 cl100k_base)
- Text equivalents = 4-8 tokens
- Real savings: 50-70% on average
- VLMs understand visual patterns naturally

**Status:** Complete ✅

---

## ✅ Phase 1.5: Core Protocol Implementation (COMPLETE)

**Timeline:** Feb 3-4, 2026 (1-2 days)

**Goal:** Build proper modular architecture and core protocol

**Deliverables:**
- [x] Modular codebase architecture
  - `src/core/` - VisualGlyph, Primitives, Poses, Symbols, Renderer
  - `src/protocol/` - Encoder, Decoder, Agent
- [x] 24 glyphs across 6 categories (query, response, error, action, state, payment)
- [x] Encoder/Decoder protocol implementation
- [x] Agent class for high-level communication
- [x] AES-256-GCM encryption support
- [x] PNG/SVG rendering
- [x] JSON-based glyph library (extensible)
- [x] VLM validation test suite
- [x] npm-publishable package structure

**Code Quality Improvements:**
- Split monolithic `generator.js` (408 lines) into 7 focused modules
- Clean separation of concerns (rendering, encoding, communication)
- Proper ES module exports
- Comprehensive JSDoc documentation

**Technical Validation:**
- Hamming distance analysis for visual confusion risk
- Multi-resolution export (32x32 to 256x256)
- Test prompt generation for VLM testing

**Status:** Complete ✅

---

## 🔄 Phase 2: Validation & Expansion (Current)

**Timeline:** Feb 4 - Feb 28, 2026 (3-4 weeks)

**Goal:** Validate VLM reliability and expand glyph library

### Week 1-2: VLM Validation (CRITICAL)
- [ ] Run VLM tests with GPT-4V, Claude Vision, Gemini
- [ ] Test at multiple resolutions (32x32, 64x64, 128x128)
- [ ] Document accuracy by model and resolution
- [ ] Determine minimum viable resolution
- [ ] **Decision point:** If <95% accuracy, pivot strategy

### Week 2-3: Glyph Library Expansion
- [ ] Design additional glyphs based on usage patterns
- [ ] Expand to 50+ glyphs if VLM validation passes
- [ ] Add domain-specific symbol overlays
- [ ] Create visual design guidelines
- [ ] Implement glyph proposal workflow

### Week 3-4: Integration Testing
- [ ] End-to-end multi-agent workflow tests
- [ ] Encryption/decryption stress tests
- [ ] Token efficiency benchmarks at scale
- [ ] Edge case handling

**Success Criteria:**
- VLM accuracy ≥95% on foundation glyphs
- 50+ glyphs in library
- <100ms encoding/decoding latency
- Working encryption demo

**Risks:**
- VLM reliability is UNVALIDATED (critical unknown)
- May require resolution increase (32→64) if accuracy is low
- Cross-model consistency unknown

**Status:** Not started 🔄

---

## 📅 Phase 3: DAO Contracts (Mar 2026)

**Timeline:** Mar 1 - Mar 31, 2026 (4 weeks)

**Goal:** Implement on-chain governance

**Prerequisites:**
- Phase 2 VLM validation must pass
- Glyph library stabilized (no major changes)

### Deliverables
- [ ] AyniRegistry.sol - Glyph registry (ERC-8004 compatible)
- [ ] AyniToken.sol - Governance token (ERC-20)
- [ ] AyniDAO.sol - Proposal and voting system
- [ ] Comprehensive test suite (100%+ coverage)
- [ ] Sepolia testnet deployment
- [ ] Basic governance UI

**Technical Decisions Needed:**
- Final ERC-8004 specification
- Token economics (supply, distribution, staking)
- Proposal bond amount
- Voting thresholds

**Current Status:** 0 lines of Solidity written (specification only)

---

## 📅 Phase 4: zkTLS Integration (Apr 2026)

**Timeline:** Apr 1 - Apr 30, 2026 (4 weeks)

**Goal:** Production-grade privacy layer

**Options Analysis:**
1. **TLS-Notary** (Recommended for MVP)
   - Proven technology
   - Semi-trusted model
   - 4-6 weeks implementation
   - Lower risk

2. **Pure zk-SNARKs**
   - Fully trustless
   - 12+ weeks implementation
   - Higher risk, higher reward

### Deliverables
- [ ] zkTLS implementation choice (TLS-Notary recommended)
- [ ] AES-256-GCM encryption integration
- [ ] Key exchange (Diffie-Hellman)
- [ ] Proof generation and verification
- [ ] Privacy documentation

**Current Status:** Architecture documented, 0% implemented

---

## 📅 Phase 5: Blockchain Deployment (May-Jun 2026)

**Timeline:** May 1 - Jun 30, 2026 (8 weeks)

**Goal:** Production launch

### May: Audit & Preparation
- [ ] Professional smart contract audit ($20-50K)
- [ ] Fix vulnerabilities
- [ ] Extensive testnet testing
- [ ] Security review of zkTLS

### June: Mainnet Launch
- [ ] Ethereum mainnet deployment
- [ ] Multisig setup (3-of-5)
- [ ] Initialize glyph registry
- [ ] $AYNI token launch
- [ ] Block explorer integration

### x402 Payment Protocol
- [ ] AyniPayments.sol
- [ ] Payment flow integration
- [ ] Pricing model documentation

**Milestone:** First paid agent query via Ayni ✨

---

## 📅 Phase 6: Ecosystem Growth (Jul-Dec 2026)

**Timeline:** Jul 1 - Dec 31, 2026 (6 months)

**Goal:** Wide adoption and integrations

### Platform Integrations
- [ ] LangChain integration
- [ ] AutoGPT plugin
- [ ] OpenAI function calling compatible
- [ ] MCP server implementation

### Developer Tools
- [ ] JavaScript SDK (npm package) ← partially done
- [ ] Python SDK (pip package)
- [ ] CLI tool (`ayni-cli`)
- [ ] Visual glyph editor (web app)
- [ ] Documentation site

### Community Building
- [ ] Discord server
- [ ] Weekly community calls
- [ ] Bounty program
- [ ] Hackathon sponsorship

**Milestone:** 100+ agents using Ayni daily 🎯

---

## 📅 Phase 7: Cultural Integration (2027+)

**Timeline:** Jan 2027 onward

**Goal:** Fulfill original vision - bridge ancient and modern

### Tocapu Research
- [ ] Partner with Andean cultural organizations
- [ ] Digitize tocapu pattern vocabulary
- [ ] Document symbolic meanings
- [ ] Study compositional grammar
- [ ] Establish ethical review board

### Integration
- [ ] Expand visual vocabulary with tocapu patterns
- [ ] Maintain cultural accuracy
- [ ] Share benefits with source communities
- [ ] Educational programs

**Milestone:** Protocol as cultural bridge 🌉

---

## Implementation Gap Analysis

### What Exists (as of Feb 3, 2026)

| Component | Status | Location |
|-----------|--------|----------|
| Core glyph class | ✅ 100% | `src/core/VisualGlyph.js` |
| Drawing primitives | ✅ 100% | `src/core/Primitives.js` |
| Humanoid poses | ✅ 100% | `src/core/Poses.js` |
| Symbol overlays | ✅ 100% | `src/core/Symbols.js` |
| Glyph library | ✅ 100% | `src/core/GlyphLibrary.js` |
| PNG/SVG rendering | ✅ 100% | `src/core/Renderer.js` |
| Encoder | ✅ 100% | `src/protocol/Encoder.js` |
| Decoder | ✅ 100% | `src/protocol/Decoder.js` |
| Agent class | ✅ 100% | `src/protocol/Agent.js` |
| VLM test suite | ✅ 100% | `tests/vlm-validation.test.js` |

### What's Missing

| Component | Specification | Implementation |
|-----------|--------------|----------------|
| VLM validation results | 100% | 0% (manual testing needed) |
| Smart contracts | 100% (pseudo) | 0% |
| zkTLS | 100% (design) | 0% |
| Arweave agent | 100% (spec) | 0% |
| x402 payments | 100% (spec) | 0% |
| Python SDK | 0% | 0% |
| Documentation site | 0% | 0% |

---

## Risk Matrix

### Critical Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| VLM unreliable at 32x32 | Protocol fails | Medium | Test early, have 64x64 fallback |
| No adoption | Wasted effort | High | Dogfood, integrate with popular tools |
| Security vulnerabilities | User harm | Medium | Professional audit, bug bounty |

### Medium Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| zkTLS too complex | Delays | Medium | Start with TLS-Notary |
| DAO governance overhead | Slow evolution | Medium | Tiered governance |
| Competition copies | Lost advantage | Medium | Move tocapu earlier |

---

## Decision Points

### Immediate (Phase 2)
1. **VLM minimum resolution:** 32x32 or higher?
2. **Cross-model consistency:** Require same interpretation across VLMs?

### Phase 3
1. **zkTLS approach:** TLS-Notary or pure SNARKs?
2. **Token economics:** Fixed supply or inflationary?
3. **Glyph library size:** Cap at 100, 1000, or unlimited?

### Phase 5
1. **Blockchain:** Ethereum L1, L2, or multi-chain?
2. **x402 pricing:** Fixed, dynamic, or auction?

---

## Success Metrics

### Phase 2
- [ ] VLM accuracy ≥95%
- [ ] 50+ glyphs
- [ ] 10+ test scenarios passing

### Phase 3
- [ ] Contracts deployed to testnet
- [ ] 10+ test proposals
- [ ] Zero critical vulnerabilities

### Phase 5
- [ ] Mainnet deployment
- [ ] 50+ agents
- [ ] $1K+ x402 payments

### Phase 6
- [ ] 100+ daily active agents
- [ ] 5+ platform integrations
- [ ] 1000+ GitHub stars

---

## How to Contribute

**Developers:**
- Check GitHub issues for current tasks
- Run `npm run vlm-test` and report results
- Submit PRs for Phase 2 features

**Researchers:**
- Help validate VLM reliability
- Test cross-model consistency
- Document failure modes

**Community:**
- Test the protocol
- Report bugs
- Create tutorials

---

**Current Phase:** 1.5 Complete, Phase 2 Starting 🔄

**Next Priority:** VLM validation (critical path)

**Honest Timeline:** 6+ months to production, not weeks

**Last Updated:** February 3, 2026

**Let's build together, realistically. 🤝**

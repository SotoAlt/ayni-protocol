# Ayni Protocol Demo Video Script

**Duration:** 2-3 minutes
**Goal:** Show end-to-end agent coordination with on-chain attestation

---

## Opening (15 seconds)

**Visual:** Logo + tagline

> "Ayni Protocol: The crypto-native coordination layer for AI agents."

**Visual:** Show the stack

```
x402     = Crypto-native payments
ERC-8004 = Crypto-native identity
AYNI     = Crypto-native coordination
```

> "Like x402 enables payments, Ayni enables verifiable agent coordination on Monad."

---

## The Problem (20 seconds)

**Visual:** Diagram of agents talking

> "AI agents are coordinating everywhere - but how do you know what they're doing?"

**Visual:** Show hidden coordination

> "Text logs are overwhelming. No audit trail. No verification."

**Visual:** Question mark

> "Can you prove Agent A actually sent this message to Agent B?"

---

## The Solution (30 seconds)

**Visual:** Ayni glyph encoding

> "Ayni encodes agent coordination into visual glyphs."

**Visual:** Show Q01, R01, E01, A01

> "Q01 means query. R01 means success. E01 means error. A01 means action."

**Visual:** On-chain hash

> "Every message is attested on Monad. Verifiable. Permanent."

**Visual:** Visual audit trail

> "Humans can SEE the coordination: Q01 → R01 → A01 → R01"

---

## Live Demo (60 seconds)

**Visual:** Terminal with multi-agent.ts running

> "Let's see it in action."

### Step 1: Alice queries Bob

**Visual:** Q01 glyph + animation

> "Alice sends Q01 to Bob - a query for user data."

**Visual:** Transaction hash

> "The message hash is stored on Monad. Verifiable proof."

### Step 2: Bob responds

**Visual:** R01 glyph + animation

> "Bob responds with R01 - success, 42 users found."

**Visual:** Chain of attestations

> "Both messages now have on-chain proof."

### Step 3: Delegation

**Visual:** A01 glyph to Carol

> "Alice delegates analysis to Carol with A01."

### Step 4: Complete flow

**Visual:** Full audit trail

> "Q01 → R01 → A01 → R01. Complete coordination visible."

**Visual:** Block explorer showing transactions

> "All verified on Monad. No trust required."

---

## Technical Highlights (30 seconds)

**Visual:** Code snippets

> "Fully open source. Anyone can run a node."

**Visual:** SDK usage

```javascript
const ayni = new AyniClient({ serverUrl: '...' });
const msg = ayni.query({ table: 'users' });
await ayni.send(msg, recipientAddress);
```

> "Simple SDK. Direct contract calls or server API."

**Visual:** MCP tools

> "MCP integration. Claude Skill ready."

**Visual:** x402 pricing

> "Pay with MON. 0.01 MON per attestation."

---

## Why This Matters (20 seconds)

**Visual:** Use cases

> "Enterprise audit trails. Multi-agent workflows. Agent marketplaces."

**Visual:** Monad logo

> "Built for Monad's speed and low costs."

**Visual:** Open source badge

> "Fully decentralized. No vendor lock-in."

---

## Closing (15 seconds)

**Visual:** GitHub + links

> "Ayni Protocol. The visual audit trail for AI agents."

**Visual:** Call to action

> "Star us on GitHub. Run your own node. Build the future of agent coordination."

**Visual:** Logo + Monad + Moltiverse badges

> "Built for Moltiverse Hackathon. Powered by Monad."

---

## B-Roll Suggestions

1. Glyph animations (Q01 arms up, R01 arms down, etc.)
2. Terminal showing demo running
3. Block explorer with transaction hashes
4. Code editor with SDK usage
5. Diagram of agent flow
6. Comparison: text logs vs visual glyphs

## Key Messages to Emphasize

1. **Visual** - Humans can see what agents are doing
2. **Verifiable** - On-chain proof, not trust
3. **Open** - Anyone can run a node
4. **Complementary** - Works with MCP/A2A, doesn't replace
5. **Crypto-native** - MON payments, Monad speed

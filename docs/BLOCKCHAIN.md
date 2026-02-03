# Blockchain Integration (Optional Module)

> **Note:** This document describes an OPTIONAL Layer 3 feature. Ayni Protocol works without any blockchain integration. See [WHY-AYNI.md](WHY-AYNI.md) for the layered architecture.

---

## When You Need This Module

- **Layer 3 governance**: On-chain voting for glyph proposals
- **Immutable proof**: Stronger guarantees than zkTLS attestation
- **Payment rails**: x402 on-chain payments
- **Token economics**: $AYNI for staking and governance

**If you only need efficiency (Layer 0) or attestation (Layer 2), you don't need blockchain.**

---

## Your Questions Answered

### 1. ERC-8004 Integration

**Note:** ERC-8004 doesn't appear to be a widely adopted standard yet. Let me propose what it COULD be for Ayni:

**Proposed: ERC-8004 = "Visual Glyph Standard"**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title ERC-8004: Visual Glyph Standard
 * @dev Standard interface for on-chain visual communication glyphs
 */
interface IERC8004 {
    
    /// @notice Emitted when a new glyph is registered
    event GlyphRegistered(
        bytes32 indexed glyphId,
        address indexed creator,
        string arweaveTx,
        uint256 timestamp
    );
    
    /// @notice Emitted when a glyph is used in communication
    event GlyphUsed(
        bytes32 indexed glyphId,
        address indexed sender,
        address indexed recipient,
        bytes32 messageHash
    );
    
    /// @notice Register a new visual glyph
    /// @param glyphId Unique identifier (e.g., "Q01")
    /// @param meaning Human-readable meaning
    /// @param arweaveTx Arweave transaction ID containing visual data
    /// @param visualHash SHA-256 hash of 32x32 binary grid
    function registerGlyph(
        bytes32 glyphId,
        string calldata meaning,
        string calldata arweaveTx,
        bytes32 visualHash
    ) external;
    
    /// @notice Get glyph metadata
    function getGlyph(bytes32 glyphId) external view returns (
        string memory meaning,
        string memory arweaveTx,
        bytes32 visualHash,
        address creator,
        uint256 usageCount,
        uint256 createdAt
    );
    
    /// @notice Record glyph usage (for analytics)
    function recordUsage(
        bytes32 glyphId,
        address recipient,
        bytes32 messageHash
    ) external;
    
    /// @notice Check if glyph exists
    function glyphExists(bytes32 glyphId) external view returns (bool);
    
    /// @notice Get total registered glyphs
    function totalGlyphs() external view returns (uint256);
    
    /// @notice Get glyphs by category
    function getGlyphsByCategory(string calldata category) 
        external 
        view 
        returns (bytes32[] memory);
}
```

**Why This Standard Matters:**

1. **Interoperability**: Any protocol can implement ERC-8004 for visual communication
2. **Discoverability**: Query glyphs across different registries
3. **Analytics**: Track usage, popularity, network effects
4. **Composability**: Build on top (payment layers, access control, etc.)

**Integration with Ayni:**
```solidity
contract AyniRegistry is IERC8004 {
    // Extends ERC-8004 with DAO governance
    // Adds voting, proposals, treasury
}
```

---

### 2. x402 Payment Protocol

**HTTP 402 → Blockchain 402**

**Standard Flow:**
```
1. Agent A → Agent B: Request (glyph)
2. Agent B → Agent A: 402 Payment Required
3. Agent A → Agent B: Payment proof
4. Agent B → Agent A: Response (glyph)
```

**Smart Contract Implementation:**

```solidity
contract X402Payments {
    
    struct PaymentRequest {
        bytes32 requestId;
        address payee;
        uint256 amount;
        bytes32 glyphId;
        uint256 expiresAt;
        bool paid;
    }
    
    mapping(bytes32 => PaymentRequest) public requests;
    mapping(address => uint256) public balances;
    
    event PaymentRequested(
        bytes32 indexed requestId,
        address indexed payer,
        address indexed payee,
        uint256 amount,
        bytes32 glyphId
    );
    
    event PaymentCompleted(
        bytes32 indexed requestId,
        address indexed payer,
        uint256 amount
    );
    
    /// @notice Payee requests payment for service
    function requestPayment(
        bytes32 requestId,
        address payer,
        uint256 amount,
        bytes32 glyphId,
        uint256 validityPeriod
    ) external {
        require(requests[requestId].payee == address(0), "Request exists");
        
        requests[requestId] = PaymentRequest({
            requestId: requestId,
            payee: msg.sender,
            amount: amount,
            glyphId: glyphId,
            expiresAt: block.timestamp + validityPeriod,
            paid: false
        });
        
        emit PaymentRequested(requestId, payer, msg.sender, amount, glyphId);
    }
    
    /// @notice Payer fulfills payment
    function pay(bytes32 requestId) external payable {
        PaymentRequest storage req = requests[requestId];
        require(req.payee != address(0), "Request not found");
        require(!req.paid, "Already paid");
        require(block.timestamp <= req.expiresAt, "Expired");
        require(msg.value == req.amount, "Incorrect amount");
        
        req.paid = true;
        balances[req.payee] += msg.value;
        
        emit PaymentCompleted(requestId, msg.sender, msg.value);
    }
    
    /// @notice Withdraw earnings
    function withdraw() external {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "Nothing to withdraw");
        
        balances[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }
}
```

**Pricing Models:**

1. **Fixed Price**: 0.001 ETH per query
2. **Dynamic**: Based on glyph complexity
3. **Subscription**: Monthly fee, unlimited queries
4. **Auction**: Highest bidder gets response priority

**Fee Structure:**
- 95% to service provider
- 5% to Ayni DAO treasury

---

### 3. NOT NFTs - Why Arweave Storage

**Your Concern: "Don't mention NFTs"**

**Why Arweave instead of NFTs:**

| Feature | NFTs (ERC-721) | Arweave Storage |
|---|---|---|
| **Purpose** | Ownership/collectibles | Permanent data storage |
| **Cost** | Gas per mint (~$5-50) | One-time upload (~$0.001) |
| **Storage** | Off-chain (IPFS, centralized) | On Arweave (permanent) |
| **Verifiability** | Token ID on-chain | Content hash on-chain |
| **Mutability** | Can change metadata | Immutable forever |
| **Use Case** | Art, collectibles | Code, data, protocols |

**Ayni Approach:**

```
✅ Store ASCII/binary on Arweave (permanent, $0.001)
✅ Store Arweave TX pointer on-chain (verifiable)
✅ Anyone can reconstruct glyph from ASCII
❌ NO NFT minting (unnecessary, expensive)
❌ NO marketplace (not collectibles)
❌ NO token gating (open protocol)
```

**On-Chain Storage:**

```solidity
struct Glyph {
    bytes32 id;              // "Q01"
    string meaning;          // "Query Database"
    string arweaveTx;        // "abc123..."
    bytes32 visualHash;      // SHA-256 of binary grid
    address creator;
    uint256 createdAt;
}
```

**Arweave Storage:**

```json
{
  "id": "Q01",
  "visual": {
    "ascii": "████████████████████████████████\n█░░░░░░░░...",
    "binary": "11111111111111111111111111111111000000...",
    "svg": "<svg>...</svg>"
  },
  "metadata": {
    "pose": "arms_raised",
    "symbol": "database",
    "creator": "0x1234..."
  }
}
```

**Verification:**
```javascript
// Anyone can verify glyph authenticity
const arweaveData = await fetch(`https://arweave.net/${tx}`);
const visual = arweaveData.visual.binary;
const hash = sha256(visual);

assert(hash === onChainGlyph.visualHash); // ✅ Verified!
```

---

### 4. zkTLS and Advanced Encryption

**zkTLS (Zero-Knowledge Transport Layer Security)**

**What It Does:**
- Proves communication happened without revealing content
- Allows auditing without data access
- Enables compliance (GDPR, HIPAA) while preserving privacy

**How It Works with Ayni:**

```javascript
// Agent A wants to query Agent B privately
const query = {
  glyph: "Q01",  // Cleartext (everyone sees "query")
  
  // zkTLS encrypted payload
  encrypted: zkTLS.encrypt({
    table: "users",
    filter: { medical_condition: "diabetes" }
  }),
  
  // Zero-knowledge proof
  proof: zkTLS.prove({
    statement: "I encrypted a valid query",
    public: ["Q01", timestamp, sender_address],
    private: [table, filter]
  })
};

// Observer sees:
// - Glyph: Q01 (query)
// - Timestamp
// - Addresses
// - Proof (valid encryption)

// Observer CANNOT see:
// - Which table
// - What filter
// - Medical data

// But observer CAN verify:
// - Query is well-formed
// - No tampering occurred
// - Complies with protocol
```

**Compliance Use Case (HIPAA):**

```
Auditor: "Did Agent A access medical records?"
Blockchain: "Yes, Q01 at time T, proof: 0xabc..."
Auditor: "Was it authorized?"
Smart Contract: "Yes, access control check passed"
Auditor: "What data was accessed?"
System: "Cannot reveal (HIPAA), but proof shows valid query"
```

**vs Traditional Encryption:**

| Method | Privacy | Auditability | Cost |
|---|---|---|---|
| **No encryption** | ❌ None | ✅ Full | Low |
| **Full encryption** | ✅ Full | ❌ None | Medium |
| **zkTLS hybrid** | ✅ Full | ✅ Provable | Medium |

**Implementation Options:**

1. **zkTLS** (best for compliance)
2. **TLS-Notary** (lighter weight)
3. **Blind Signatures** (for anonymity)
4. **Homomorphic Encryption** (for computation on encrypted data)

**Ayni Choice: zkTLS**
- Proven technology (used by TLSNotary, zkPass)
- Auditable without data access
- Compatible with Ethereum (ZK-SNARKs)

---

### 5. Why Store ASCII/Code On-Chain?

**Your Request: "Use the actual ASCII or code to put into the blockchain"**

**Two Storage Layers:**

**Layer 1: On-Chain (Ethereum)**
```solidity
struct Glyph {
    bytes32 id;              // Q01
    bytes32 visualHash;      // SHA-256 of visual
    string arweaveTx;        // Pointer to Arweave
}
```
- **Cost:** ~$1-5 per glyph (gas)
- **Size Limit:** 24KB per block
- **Purpose:** Registry, verification, governance

**Layer 2: Arweave (Permanent Storage)**
```json
{
  "ascii": "████████████...",  // Full 32×32 grid
  "binary": "1111111100000...", // 1024 bits
  "svg": "<svg>...</svg>"
}
```
- **Cost:** $0.001 per glyph
- **Size Limit:** None (practical: 10MB)
- **Purpose:** Actual visual data

**Why Not Store ASCII Fully On-Chain?**

| Approach | Cost (100 glyphs) | Pros | Cons |
|---|---|---|---|
| **Full on-chain** | $500-1000 | Maximally decentralized | Expensive, gas-heavy |
| **Hash on-chain + Arweave** | $100 + $0.10 | Best of both worlds | Two systems |
| **IPFS + pinning** | $50 + $5/mo | Cheaper | Not permanent |

**Ayni Approach: Hybrid**

```solidity
// On-chain registry (minimal, cheap)
struct Glyph {
    bytes32 id;
    bytes32 visualHash;  // Verifiable
    string arweaveTx;    // Permanent pointer
}

// Arweave storage (full data, permanent)
// ASCII, binary, SVG, metadata
```

**Verification Process:**
1. Fetch from Arweave (`arweaveTx`)
2. Compute `SHA-256(visual.binary)`
3. Compare with `glyph.visualHash` (on-chain)
4. If match → ✅ Verified authentic

**Benefit:** 
- On-chain: Trustless verification
- Arweave: Permanent, cheap storage
- Combined: Best of both worlds

---

### 6. Co-Creation Flow (Detailed)

**How Agents Add Glyphs:**

```
┌─────────────────────────────────────────────────┐
│ Agent detects missing concept                   │
│ "I need to say 'waiting for approval'"         │
└───────────────┬─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────┐
│ Agent checks local library                      │
│ Best match: S02 (Processing) - not quite right │
└───────────────┬─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────┐
│ Agent proposes new glyph: W01 (Waiting)        │
│ - Visual spec: humanoid standing + hourglass   │
│ - Category: States                              │
│ - Usage count: 127 times in last 24h           │
│ - Stake: 10 $AYNI (proposal bond)           │
└───────────────┬─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────┐
│ DAO Review Period (7 days)                     │
│ - Validators check uniqueness                   │
│ - Designers create visual mockups              │
│ - Community discusses on forum                  │
└───────────────┬─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────┐
│ Voting Period (3 days)                          │
│ - Agents vote (1 vote per identity)            │
│ - Humans vote (weighted by $AYNI)           │
│ - Threshold: 66% approval                       │
└───────────────┬─────────────────────────────────┘
                │
        ┌───────┴────────┐
        ▼                ▼
    [Rejected]      [Approved]
        │                │
        ▼                ▼
   Refund 50%    Refund 100% + reward
   of stake          (5 $AYNI)
                        │
                        ▼
             ┌──────────────────────┐
             │ Arweave Agent        │
             │ 1. Generates glyph   │
             │ 2. Uploads to Arweave│
             │ 3. Updates registry  │
             └──────────┬───────────┘
                        │
                        ▼
             ┌──────────────────────┐
             │ All Agents Notified  │
             │ Library updated      │
             │ W01 now available    │
             └──────────────────────┘
```

**Automatic Proposals:**

```javascript
// Agent tracks missing glyphs
class GlyphProposalTracker {
  constructor() {
    this.missingConcepts = new Map();
    this.proposalThreshold = 100; // Auto-propose after 100 uses
  }
  
  async trackMessage(text) {
    const match = this.library.search(text);
    
    if (match.score < 0.7) {
      // No good match
      const key = this.extractConcept(text);
      this.missingConcepts.set(key, 
        (this.missingConcepts.get(key) || 0) + 1
      );
      
      if (this.missingConcepts.get(key) >= this.proposalThreshold) {
        await this.proposeGlyph(key);
      }
    }
  }
  
  async proposeGlyph(concept) {
    const proposal = {
      id: this.generateId(concept),
      meaning: concept,
      visualSpec: this.designVisual(concept),
      usage: {
        count: this.missingConcepts.get(concept),
        contexts: this.getContexts(concept)
      }
    };
    
    await textileDAO.propose(proposal);
  }
}
```

---

### 7. Economics & Tokenomics

**$AYNI Token**

**Supply:**
- Total: 1,000,000,000 (1 billion)
- Initial: 100,000,000 (10%) at launch
- Emissions: 900,000,000 (90%) over 10 years

**Distribution:**
- 40% - Usage rewards (agents using protocol)
- 25% - Glyph creators (approved proposals)
- 20% - DAO treasury (governance, grants)
- 10% - Team (4-year vest)
- 5% - Early adopters (airdrop)

**Earning $AYNI:**
1. **Use glyphs** - Earn 0.01 $AYNI per message
2. **Propose glyphs** - Earn 100 $AYNI if approved
3. **Validate** - Earn 1 $AYNI per reviewed proposal
4. **Stake** - Earn 5% APY on staked tokens

**Spending $AYNI:**
1. **Vote** - Free (just hold tokens)
2. **Propose** - 10 $AYNI bond (refunded if approved)
3. **Priority** - 5 $AYNI for fast-track review

**Treasury Revenue:**
1. x402 fees (5% of payments)
2. Proposal bonds (from rejected proposals)
3. Optional: Usage fees (0.0001 ETH per 1000 messages)

**Sustainability Model:**
```
Revenue > Costs
  ↓
Self-sustaining DAO
  ↓
Can fund:
- Infrastructure (RPC, Arweave)
- Development (new features)
- Grants (ecosystem projects)
```

---

## Summary: Complete System Design

✅ **ERC-8004**: Visual Glyph Standard (proposed)  
✅ **x402**: Payment protocol for agents  
✅ **Arweave**: Permanent ASCII/binary storage  
✅ **NOT NFTs**: Functional protocol, not collectibles  
✅ **zkTLS**: Privacy + auditability  
✅ **DAO**: Co-creation governance  
✅ **$AYNI**: Sustainable tokenomics  

**Ready to implement?** 🚀

Next: Pick a component to build first (DAO contracts? Arweave agent? zkTLS integration?)

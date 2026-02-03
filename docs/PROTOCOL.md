# Ayni Protocol v2.0 - Visual Language for AI Agents

**Layered visual communication protocol with opt-in complexity**

---

## Vision

A **visual language** for AI agent communication that provides token efficiency at its core, with optional layers for human oversight, attestation, and governance. Use only what you need.

---

## Protocol Layers

Ayni is designed with opt-in complexity. Most users only need Layer 0.

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 3: DAO Governance (Optional)                          │
│   Agents propose new glyphs, community votes                │
│   Requires: Token stake ($AYNI)                             │
├─────────────────────────────────────────────────────────────┤
│ Layer 2: Attestation (Optional)                             │
│   Prove message origin and integrity                        │
│   Requires: zkTLS or wallet signature                       │
├─────────────────────────────────────────────────────────────┤
│ Layer 1: Human Participation                                │
│   Visual audit trail, shared vocabulary                     │
│   Requires: Glyph library knowledge                         │
├─────────────────────────────────────────────────────────────┤
│ Layer 0: Visual Efficiency (No Blockchain Required)         │
│   50-70% token savings, VLM-readable                        │
│   Requires: Nothing                                         │
└─────────────────────────────────────────────────────────────┘
```

| Layer | What It Does | When To Use |
|-------|--------------|-------------|
| 0 - Efficiency | Save tokens with glyph IDs | Always |
| 1 - Participation | Human-readable audit trail | Need oversight |
| 2 - Attestation | Prove authenticity | Trust required |
| 3 - DAO | Govern vocabulary evolution | Community building |

See [WHY-AYNI.md](WHY-AYNI.md) for detailed explanation of each layer.

---

## Core Principles

1. **Opt-In Complexity**: Use Layer 0 alone for pure efficiency, add higher layers only when needed
2. **No Blockchain Required**: Layers 0-1 work without crypto; Layer 2 attestation can use zkTLS (no blockchain)
3. **Co-Creation** (Layer 3): Agents propose new glyphs based on usage patterns
4. **Privacy-First**: zkTLS encryption for data, cleartext glyphs for coordination
5. **VLM-Native**: Vision models read glyphs directly as visual tokens
6. **Cultural Foundation**: Andean-inspired design (tocapu patterns)

---

## The 4 Foundation Glyphs

### Q01 - Query
**Visual:** Humanoid arms raised + database symbol  
**Meaning:** "I am requesting data"  
**Use:** Database queries, API requests, information retrieval

### R01 - Response
**Visual:** Humanoid offering + checkmark  
**Meaning:** "I am providing what was requested"  
**Use:** Successful responses, data delivery, confirmations

### E01 - Error
**Visual:** Humanoid distressed + X symbol  
**Meaning:** "Something went wrong"  
**Use:** Errors, failures, exceptions

### A01 - Action
**Visual:** Humanoid running  
**Meaning:** "I am executing a task"  
**Use:** Commands, execution, state changes

---

## Co-Creation Model

### How Agents Propose New Glyphs

**Scenario:** Agent encounters a concept not in the current library

```javascript
// Agent detects missing glyph
const message = "Waiting for approval from user";
const bestMatch = library.search(message); // No good match

// Agent proposes new glyph
await proposeGlyph({
  id: "W01",
  meaning: "Waiting for approval",
  visualSpec: {
    pose: "standing_still",
    symbol: "hourglass",
    location: "top-right"
  },
  usage: {
    count: 127,  // How many times encountered
    contexts: ["user-approval", "async-workflows", "pending-state"]
  },
  proposer: "0xAgentAddress..."
});
```

### Proposal Lifecycle

1. **Detection**: Agent encounters missing concept (frequency > threshold)
2. **Proposal**: Agent submits glyph spec to DAO
3. **Review**: Community reviews visual design + semantic clarity
4. **Vote**: DAO members vote (agents + humans)
5. **Generation**: If approved, glyph is generated and added to Arweave
6. **Distribution**: Updated library propagated to all agents

**Voting Power:**
- Agents: 1 vote per unique identity (Sybil-resistant via stake)
- Humans: Weighted by DAO token holdings
- Threshold: 66% approval required

---

## DAO Governance Structure

### Ayni DAO

**Purpose:** Govern the glyph library, protocol upgrades, treasury

**Roles:**
1. **Agents** - Propose glyphs, vote on additions, use the protocol
2. **Validators** - Review glyph proposals for clarity/uniqueness
3. **Designers** - Create visual variants, optimize for VLM readability
4. **Humans** - Oversee governance, break ties, handle edge cases

**Token:** $AYNI (governance token)
- Earned by: Contributing glyphs, validating proposals, protocol usage
- Used for: Voting, proposal bonds, treasury allocation

**Treasury:**
- x402 fees (% of payments)
- Glyph creation fees (spam prevention)
- Protocol usage fees (optional)

**Governance Mechanism:**
```
Proposal → 7-day review → Voting (3 days) → Execution
```

**Emergency Actions:**
- Pause protocol (security)
- Revoke malicious glyphs
- Upgrade encryption layer
- Requires 80% supermajority

---

## Arweave Storage (Not NFTs!)

### Why Arweave?

- **Permanent**: Pay once, store forever
- **Decentralized**: No single point of failure  
- **Verifiable**: Content-addressed (immutable hashes)
- **Cheap**: $0.001 per glyph (~300 bytes)

### What We Store

**Glyph Registry (on-chain):**
```json
{
  "id": "Q01",
  "meaning": "Query Database",
  "created": 1738419600,
  "proposer": "0x1234...",
  "votes": { "for": 1247, "against": 23 },
  "arweave_tx": "abc123...",
  "visual": {
    "ascii": "████████...",  // Full 32x32 grid
    "binary": "11111111...",  // 1024 bits
    "svg": "<svg>...</svg>",  // Optional vector
    "png_hash": "sha256:..."  // Reproducible render
  },
  "metadata": {
    "pose": "arms_raised",
    "symbol": "database",
    "category": "query",
    "tags": ["data", "retrieval", "database"]
  },
  "usage_stats": {
    "total_uses": 1284729,
    "unique_agents": 8472,
    "avg_tokens_saved": 4.2
  }
}
```

**Storage Cost:**
- Registry entry: ~300 bytes
- Cost: ~$0.001 per glyph
- 1000 glyphs: ~$1 (one-time)

### Arweave Agent

**Specialized agent that:**
1. Monitors DAO votes
2. Generates glyphs on approval
3. Uploads to Arweave
4. Updates on-chain registry pointer
5. Notifies all subscribed agents

**Trustless:** Anyone can verify glyph generation from spec

---

## zkTLS Encryption Layer

### Hybrid Privacy Model

**Public (Cleartext):**
- Glyph ID (Q01, R01, etc.)
- Timestamp
- Sender/recipient (if not anonymous)

**Private (Encrypted):**
- Data payload
- Query parameters
- Response contents
- User PII

### zkTLS Integration

**Why zkTLS?**
- Prove communication happened without revealing content
- Verify agent behavior without exposing data
- Audit trails for compliance (GDPR, HIPAA)

**Example: Private Query**

```javascript
// Agent A wants to query Agent B's database
const message = {
  glyph: "Q01",  // Cleartext: "this is a query"
  
  // zkTLS-encrypted data
  encrypted_payload: zkTLS.encrypt({
    table: "users",
    filter: { age: "> 25", location: "NYC" },
    requester_id: "alice@example.com"
  }),
  
  // Proof that encryption is valid
  proof: zkTLS.generateProof({
    statement: "I encrypted valid query parameters",
    public_inputs: ["Q01", timestamp],
    private_inputs: [table, filter]
  })
};

// Observer sees: "Someone queried something at time T"
// Only Agent B can decrypt: "Alice queried NYC users over 25"
// Proof verifies: Request is well-formed, no tampering
```

### Compliance Use Cases

1. **GDPR**: Prove data access without revealing PII
2. **HIPAA**: Audit healthcare queries without exposing PHI
3. **Financial**: Regulatory reporting without data leakage
4. **Multi-Party**: Coordination logs without business logic exposure

**Key Management:**
- Per-agent key pairs (secp256k1)
- Diffie-Hellman for shared secrets
- Key rotation every 90 days
- Hardware wallet support for agents

---

## x402 Payment Integration

### Payment Protocol

**x402: HTTP Status Code for "Payment Required"**

Traditional flow:
```
Client → Server: GET /resource
Server → Client: 402 Payment Required
Client → Server: POST /payment { proof }
Server → Client: 200 OK { resource }
```

**Ayni x402 Flow:**

```javascript
// Agent A requests service from Agent B
const request = {
  glyph: "Q01",
  data: { encrypted_query },
  payment: null  // First attempt
};

// Agent B responds: Payment required
const response = {
  glyph: "E02",  // New glyph: Payment Required
  data: {
    price: "0.001 ETH",
    payment_address: "0x5678...",
    valid_until: timestamp + 300  // 5 min
  }
};

// Agent A pays
const payment = await sendETH({
  to: "0x5678...",
  amount: "0.001 ETH",
  memo: "Q01:query_12345"
});

// Agent A retries with proof
const retry = {
  glyph: "Q01",
  data: { encrypted_query },
  payment: {
    tx_hash: "0xabc...",
    amount: "0.001 ETH",
    confirmations: 3
  }
};

// Agent B responds with data
const success = {
  glyph: "R01",
  data: { encrypted_results }
};
```

### Pricing Models

1. **Pay-per-query**: Fixed price per glyph type
2. **Subscription**: Monthly fee for unlimited queries
3. **Tiered**: Different rates based on data size/complexity
4. **Auction**: Dynamic pricing based on demand

### Payment Glyph Library

**New glyphs for payments:**
- **E02**: Payment Required
- **P01**: Payment Sent
- **P02**: Payment Confirmed
- **P03**: Refund Issued

---

## Testing: Words, Use Cases, Edge Cases

### Extended Vocabulary Test (100 Glyphs)

**Categories:**

1. **Queries (Q01-Q20)**
   - Q01: Query Database
   - Q02: Query API
   - Q03: Query File System
   - Q04: Query with Filter
   - Q05: Query with Join
   - Q06: Search Text
   - Q07: Search Vector
   - Q08: Aggregate Data
   - Q09: Request Permission
   - Q10: Request Status
   - ... (10 more)

2. **Responses (R01-R20)**
   - R01: Success
   - R02: Success with Data
   - R03: Empty Result
   - R04: Partial Success
   - R05: Cached Response
   - R06: Redirect
   - R07: Not Modified
   - R08: Accepted (Async)
   - R09: Created
   - R10: Deleted
   - ... (10 more)

3. **Errors (E01-E20)**
   - E01: General Error
   - E02: Payment Required
   - E03: Permission Denied
   - E04: Not Found
   - E05: Timeout
   - E06: Rate Limited
   - E07: Invalid Input
   - E08: Conflict
   - E09: Service Unavailable
   - E10: Encryption Failed
   - ... (10 more)

4. **Actions (A01-A20)**
   - A01: Execute
   - A02: Update
   - A03: Delete
   - A04: Create
   - A05: Retry
   - A06: Cancel
   - A07: Pause
   - A08: Resume
   - A09: Rollback
   - A10: Commit
   - ... (10 more)

5. **States (S01-S20)**
   - S01: Idle
   - S02: Processing
   - S03: Waiting
   - S04: Complete
   - S05: Failed
   - S06: Pending Approval
   - S07: Locked
   - S08: Unlocked
   - S09: Syncing
   - S10: Outdated
   - ... (10 more)

### Use Case Testing

**1. Multi-Agent Workflow (5 agents)**
```
Coordinator → Database: Q01 (query users)
Database → Coordinator: R02 (42 records)
Coordinator → Analyzer: A01 (analyze patterns)
Analyzer → Coordinator: S02 (processing...)
[3 min later]
Analyzer → Coordinator: R01 (complete)
Coordinator → Reporter: A04 (create report)
Reporter → Coordinator: S02 (generating...)
Reporter → Coordinator: R09 (created, ID: 123)
Coordinator → Email: A01 (send to user)
Email → Coordinator: R01 (sent)
```

**Token usage:**
- With glyphs: 20 tokens (10 messages × 2 tokens each)
- Without glyphs: 50+ tokens
- **Savings: 60%**

**2. IoT Sensor Network (100 sensors)**
```
Hub → All Sensors: Q10 (status request)
Sensors → Hub: R01 (ok) × 97
Sensors → Hub: E09 (offline) × 3
Hub → Offline Sensors: A05 (retry connection)
Offline Sensors → Hub: R01 (recovered) × 2
Offline Sensors → Hub: E05 (still timeout) × 1
Hub → Admin: E09 (sensor 47 down)
```

**Bandwidth savings:**
- 100 sensors × 4 messages each = 400 messages
- Glyph mode: 800 tokens
- Text mode: 1600+ tokens
- **Savings: 50%** + visual debugging

**3. Blockchain Payment Service**
```
Client → Service: Q01 (get price)
Service → Client: E02 (payment required: 0.001 ETH)
Client → Service: P01 (payment sent: tx_hash)
Service → Client: S03 (waiting confirmations...)
Service → Client: P02 (payment confirmed)
Service → Client: R02 (here's your data)
```

### Edge Cases

**1. Glyph Collision**
- Scenario: Two agents propose similar glyphs
- Solution: DAO reviews uniqueness, merges if duplicate
- Fallback: Namespace glyphs by proposer (Q01:alice vs Q01:bob)

**2. Encryption Key Loss**
- Scenario: Agent loses private key, can't decrypt old messages
- Solution: Key escrow with threshold signatures (3-of-5)
- Alternative: Accept data loss, re-request if needed

**3. Arweave Downtime**
- Scenario: Can't fetch glyph library
- Solution: Local cache with TTL, degraded mode using base 4 glyphs
- Recovery: Auto-sync when Arweave returns

**4. Payment Failure**
- Scenario: Transaction pending, agent needs response NOW
- Solution: Credit system for trusted agents, settle later
- Limit: Max 10 unpaid queries, then hard block

**5. Malicious Glyph**
- Scenario: Agent proposes offensive visual or misleading meaning
- Solution: DAO review + community reporting
- Action: Emergency removal (80% vote), proposer slashed

**6. VLM Misinterpretation**
- Scenario: Vision model confuses two similar glyphs
- Solution: Minimum visual distance threshold (Hamming distance > 100 bits)
- Testing: Automated similarity check before approval

**7. Rapid Library Growth**
- Scenario: Library grows to 10,000 glyphs, hard to navigate
- Solution: Hierarchical categories, search by tags
- Optimization: Lazy loading (only load relevant subset)

---

## Blockchain Integration (ERC Standards + x402)

### Smart Contract Architecture

**1. Glyph Registry Contract**
```solidity
contract AyniRegistry {
  struct Glyph {
    bytes32 id;          // "Q01"
    string meaning;      // "Query Database"
    string arweaveTx;    // Permanent storage pointer
    address proposer;
    uint256 votes_for;
    uint256 votes_against;
    bool approved;
    uint256 created_at;
  }
  
  mapping(bytes32 => Glyph) public glyphs;
  mapping(bytes32 => bool) public exists;
  
  event GlyphProposed(bytes32 indexed id, address proposer);
  event GlyphApproved(bytes32 indexed id);
  event GlyphUsed(bytes32 indexed id, address agent);
  
  function proposeGlyph(...) external;
  function vote(bytes32 id, bool support) external;
  function finalizeVote(bytes32 id) external;
  function recordUsage(bytes32 id) external;
}
```

**2. Payment Contract (x402)**
```solidity
contract AyniPayments {
  struct Payment {
    address payer;
    address payee;
    uint256 amount;
    bytes32 glyphId;
    string queryHash;  // For auditing
    uint256 timestamp;
  }
  
  mapping(bytes32 => Payment) public payments;
  
  event PaymentRequired(bytes32 indexed queryId, uint256 amount);
  event PaymentReceived(bytes32 indexed queryId, address payer);
  
  function requestPayment(bytes32 queryId, uint256 amount) external;
  function pay(bytes32 queryId) external payable;
  function refund(bytes32 queryId) external;
}
```

**3. DAO Governance Contract**
```solidity
contract AyniDAO {
  IERC20 public textileToken;
  IAyniRegistry public registry;
  
  struct Proposal {
    bytes32 glyphId;
    address proposer;
    uint256 startTime;
    uint256 endTime;
    uint256 forVotes;
    uint256 againstVotes;
    bool executed;
  }
  
  function propose(bytes32 glyphId, ...) external;
  function vote(uint256 proposalId, bool support) external;
  function execute(uint256 proposalId) external;
  function delegate(address delegatee) external;
}
```

### ERC Integration Points

**ERC-20 ($AYNI Token):**
- Governance voting
- Staking for Sybil resistance
- Payment currency (alternative to ETH)

**ERC-721 (Optional, for historical records):**
- NOT for glyphs themselves (use Arweave)
- FOR: Proof of proposal, voting records, milestone NFTs

**ERC-4337 (Account Abstraction):**
- Gas-less transactions for agents
- Sponsored queries (paymaster pattern)
- Batch operations (multiple glyphs in one tx)

**x402 Custom Standard:**
```
HTTP 402 Payment Required → Ethereum Payment Required
Standardized payment request/response flow
```

---

## Roadmap

### Phase 1: Foundation (Weeks 1-2) ✅
- [x] 4 base glyphs (Q01, R01, E01, A01)
- [x] Token measurements
- [x] VLM reading test
- [x] Basic encryption (XOR)

### Phase 2: Co-Creation (Weeks 3-4)
- [ ] Design 96 more glyphs (100 total)
- [ ] Build proposal system
- [ ] DAO governance contracts
- [ ] Arweave integration

### Phase 3: Privacy & Payments (Weeks 5-6)
- [ ] zkTLS encryption layer
- [ ] x402 payment protocol
- [ ] Smart contracts deployment
- [ ] Key management system

### Phase 4: Testing & Dogfooding (Weeks 7-8)
- [ ] OpenClaw skill integration
- [ ] Multi-agent workflow tests
- [ ] Edge case handling
- [ ] Performance benchmarks

### Phase 5: Public Launch (Week 9-10)
- [ ] DAO token distribution
- [ ] Public glyph library
- [ ] Developer SDK
- [ ] Documentation portal

### Phase 6: Ecosystem (Ongoing)
- [ ] Cross-platform adoption (AutoGPT, LangChain)
- [ ] Visual debugging tools
- [ ] Agent marketplace
- [ ] Community governance

---

## Success Metrics

**Adoption:**
- 1,000+ unique agents using protocol
- 100,000+ messages exchanged
- 100+ community-proposed glyphs

**Efficiency:**
- 50%+ average token savings
- <100ms glyph lookup latency
- 99.9%+ Arweave availability

**Governance:**
- 60%+ voter turnout on proposals
- <7 days average proposal time
- <1% malicious glyph proposals

**Economics:**
- $10,000+ in x402 payments processed
- $1,000+ DAO treasury
- Self-sustaining (fees cover operations)

---

## Open Questions

1. **ERC-8004 Specifics?**
   - Need to research this standard (if custom, let's define it)
   - Or map to existing ERC (ERC-20, ERC-4337, custom?)

2. **zkTLS vs Other Privacy Tech?**
   - zkTLS for transport
   - ZK-SNARKs for computation?
   - Homomorphic encryption too heavy?

3. **Arweave vs IPFS?**
   - Arweave = permanent (pay once)
   - IPFS = cheaper but need pinning
   - Hybrid approach?

4. **DAO Launch Strategy?**
   - Airdrop to early adopters?
   - Mint $AYNI via usage?
   - Quadratic voting?

5. **Agent Sybil Resistance?**
   - Stake requirement?
   - Proof of compute?
   - Web of trust?

---

## Next Steps

1. **Design full 100-glyph library** (categories, visual specs)
2. **Build DAO + Registry contracts** (Solidity)
3. **Integrate zkTLS** (research + prototype)
4. **Deploy to testnet** (Sepolia or Base)
5. **Create Arweave agent** (auto-upload on approval)
6. **Test with real LLMs** (inject library, measure)

---

*Last updated: 2026-02-01*
*Status: V2 Design - Ready for Implementation*

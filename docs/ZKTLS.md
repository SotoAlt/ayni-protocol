# zkTLS Explained - How Zero-Knowledge Encryption Works in Ayni

## The Problem We're Solving

**Scenario:** Agent A wants to query Agent B's database, but:
- The query contains sensitive info (e.g., "show me users with medical condition X")
- We want observers to see that a query happened (for auditing)
- But we DON'T want observers to see what was queried

**Traditional approaches fail:**
1. **No encryption** → Everyone sees everything ❌
2. **Full encryption** → Nobody can audit anything ❌
3. **Hybrid (our solution)** → Public coordination + private data ✅

---

## What is zkTLS?

**zkTLS = Zero-Knowledge Transport Layer Security**

It's a way to prove that encrypted communication happened **without revealing what was said**.

Think of it like this:
- You send a sealed letter (encrypted message)
- You prove the letter is real (zkTLS proof)
- Auditor sees: "A letter was sent from A to B"
- Auditor cannot read: What's inside the letter

---

## How zkTLS Works (Simple Explanation)

### Normal TLS (HTTPS)
```
Your Browser → [encrypted] → Server
```
- You trust the server
- Server can see everything
- Nobody else can see anything

### zkTLS
```
Agent A → [encrypted + proof] → Agent B
                ↓
            Verifier
         (can check proof,
          cannot read message)
```
- Agent A encrypts message
- Agent A generates proof: "I encrypted something valid"
- Anyone can verify proof
- Only Agent B can decrypt

---

## Ayni + zkTLS: How It Works

### Message Structure

**Public (Cleartext):**
```json
{
  "glyph": "Q01",           // Everyone sees: "Query"
  "from": "0x1234...",      // Who sent it
  "to": "0x5678...",        // Who receives it
  "timestamp": 1738419600,  // When
  "payment_tx": "0xabc..."  // Payment proof (if x402)
}
```

**Private (Encrypted):**
```json
{
  "encrypted_payload": "aGVsbG8gd29ybGQ=...",  // Actual query
  "proof": {
    "type": "zk-snark",
    "statement": "I encrypted valid data",
    "public_inputs": ["Q01", "0x1234...", timestamp],
    "zk_proof": "0xdef..."
  }
}
```

### What Each Party Can See

**Observer (anyone on blockchain):**
- ✅ Glyph ID: Q01 (query)
- ✅ Sender/recipient addresses
- ✅ Timestamp
- ✅ Payment amount
- ✅ Proof is valid (math checks out)
- ❌ What was queried
- ❌ What data was returned

**Agent B (recipient):**
- ✅ Everything above
- ✅ Decrypted query: "table=users, filter={age > 25}"
- ✅ Can respond with encrypted data

**Auditor (compliance officer):**
- ✅ Verify communication happened
- ✅ Verify it was properly encrypted
- ✅ Verify access control was checked
- ✅ Verify agent followed protocol
- ❌ Cannot see actual data (GDPR/HIPAA compliant)

---

## Technical Deep Dive

### 1. Encryption Layer (AES-256-GCM)

```javascript
// Agent A encrypts the query
const query = {
  table: "users",
  filter: { medical_condition: "diabetes" }
};

// Generate shared secret (Diffie-Hellman)
const sharedSecret = ecdh.computeSecret(agentB.publicKey);

// Encrypt with AES
const encrypted = aes256gcm.encrypt(
  JSON.stringify(query),
  sharedSecret
);

// Result: encrypted blob
```

**Why AES-256-GCM?**
- Fast (agents need speed)
- Secure (industry standard)
- Authenticated (prevents tampering)

### 2. Zero-Knowledge Proof Layer

```javascript
// Agent A generates proof
const proof = zkSnark.prove({
  // Public inputs (everyone can see)
  public: {
    glyph_id: "Q01",
    sender: "0x1234...",
    timestamp: 1738419600,
    encrypted_hash: sha256(encrypted)
  },
  
  // Private inputs (only prover knows)
  private: {
    plaintext: query,
    encryption_key: sharedSecret,
    nonce: random_nonce
  },
  
  // Statement to prove
  statement: `
    I encrypted 'plaintext' using 'encryption_key'
    The result matches 'encrypted_hash'
    The plaintext is well-formed JSON
    The glyph_id matches the query type
  `
});

// Proof is small (~300 bytes)
// Anyone can verify without knowing private inputs
```

**What the proof proves:**
1. ✅ Encryption was done correctly
2. ✅ Plaintext matches expected format
3. ✅ Glyph ID matches message type
4. ✅ No tampering occurred

**What the proof hides:**
1. ❌ Actual query contents
2. ❌ Encryption key
3. ❌ Any private data

### 3. Verification (Anyone Can Do This)

```javascript
// Verifier (auditor, DAO, blockchain)
const isValid = zkSnark.verify({
  proof: proof,
  public_inputs: {
    glyph_id: "Q01",
    sender: "0x1234...",
    timestamp: 1738419600,
    encrypted_hash: sha256(encrypted)
  }
});

if (isValid) {
  console.log("✅ Message is valid and properly encrypted");
  console.log("✅ Agent followed protocol");
  console.log("✅ Audit trail recorded");
  console.log("❌ Cannot see actual data (by design)");
}
```

---

## Real-World Example: HIPAA Compliance

**Scenario:** Healthcare AI agents querying patient records

### Without zkTLS (Non-Compliant)
```
Agent A: "Show me patients with diabetes in NYC"
Observer: "I can see you queried diabetes patients!" ❌
HIPAA: "You leaked protected health information!" ❌
```

### With zkTLS (Compliant)
```
Agent A → Q01 + encrypted("patients with diabetes in NYC")
Observer: "Agent A queried something at time T" ✅
Observer: "Proof shows encryption is valid" ✅
Observer: "Cannot see what was queried" ✅
HIPAA: "No PHI leaked, audit trail exists" ✅
```

**Compliance Officer Review:**
1. Check blockchain: Q01 query at 10:00 AM
2. Verify proof: Math checks out ✅
3. Check access control: Agent A authorized ✅
4. Check logs: Query followed protocol ✅
5. Cannot see data: Privacy preserved ✅

---

## Comparison: zkTLS vs Other ZK Tech

### 1. zkTLS (TLS-Notary)
**What it is:** Prove you got data from a website without revealing what
**Use case:** Prove "I got a response from api.example.com"
**Ayni use:** Prove "Agent B responded" without revealing response
**Speed:** Fast (seconds)
**Cost:** Low (client-side)

### 2. zk-SNARKs (Zero-Knowledge Succinct Non-Interactive Argument of Knowledge)
**What it is:** General-purpose zero-knowledge proofs
**Use case:** Prove "I know X" without revealing X
**Ayni use:** Prove "Query is valid" without revealing query
**Speed:** Medium (seconds to minutes)
**Cost:** Medium (proof generation)

### 3. zk-STARKs (Zero-Knowledge Scalable Transparent Argument of Knowledge)
**What it is:** SNARKs without trusted setup
**Use case:** Like SNARKs but more transparent
**Ayni use:** Alternative to SNARKs (no trusted setup ceremony)
**Speed:** Slower than SNARKs
**Cost:** Higher (larger proofs)

### 4. Homomorphic Encryption
**What it is:** Compute on encrypted data without decrypting
**Use case:** "Do calculations without seeing the numbers"
**Ayni use:** Agent B can process query without decrypting
**Speed:** Very slow (10-100× slower)
**Cost:** Very high (computational overhead)

**Ayni Choice: Hybrid (zkTLS + zk-SNARKs)**
- zkTLS for transport layer (prove communication)
- zk-SNARKs for computation layer (prove validity)
- Best balance of speed, cost, security

---

## Implementation Options

### Option 1: zkTLS with TLS-Notary
**Pros:**
- Proven technology (used by zkPass, Reclaim Protocol)
- No custom crypto (uses standard TLS)
- Easy to integrate

**Cons:**
- Requires notary server (semi-trusted)
- Limited to HTTPS communication

**Ayni Fit:** Good for proving external API responses

### Option 2: Pure zk-SNARKs (Circom + SnarkJS)
**Pros:**
- Fully trustless (no notary)
- Flexible (prove anything)
- On-chain verification (Ethereum)

**Cons:**
- Need trusted setup (or use PLONK)
- Custom circuits (more dev work)
- Proof generation can be slow

**Ayni Fit:** Best for core protocol (glyph validation)

### Option 3: Mina Protocol (Recursive SNARKs)
**Pros:**
- Constant-size proofs (~22 KB)
- Recursive composition
- Built for blockchain

**Cons:**
- Different blockchain (bridge needed)
- Less mature ecosystem
- Learning curve

**Ayni Fit:** Interesting for future (cross-chain)

### Option 4: Hybrid (Recommended)
**Architecture:**
```
┌─────────────────────────────────────┐
│ Application Layer                   │
│ - Glyph protocol                    │
│ - Agent communication               │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│ zkTLS Layer (TLS-Notary)            │
│ - Prove communication happened      │
│ - Prove endpoints are authentic     │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│ zk-SNARK Layer (Circom)             │
│ - Prove query validity              │
│ - Prove glyph matches action        │
│ - Prove payment if x402             │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│ Encryption Layer (AES-256)          │
│ - Actual data encryption            │
│ - Diffie-Hellman key exchange       │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│ Blockchain Layer (Ethereum)         │
│ - Store proofs on-chain             │
│ - Verify proofs in smart contracts  │
│ - Public audit trail                │
└─────────────────────────────────────┘
```

---

## Cost Analysis

### Per-Message Costs

**Without zkTLS (plain text):**
- Gas cost: ~21,000 gas (~$0.50)
- Storage: On-chain (expensive)
- Privacy: None ❌

**With zkTLS (Ayni):**
- Encryption: Client-side (free)
- Proof generation: ~1-2 seconds (free)
- Proof verification: ~50,000 gas (~$1.20)
- Storage: Off-chain (Arweave ~$0.001)
- Privacy: Full ✅

**Batch Optimization:**
- Single proof for 100 messages
- Cost per message: ~$0.01
- **50× cheaper than individual proofs**

---

## Security Guarantees

### What zkTLS Guarantees

1. **Confidentiality:** Only recipient can read message
2. **Authenticity:** Sender is who they claim to be
3. **Integrity:** Message wasn't tampered with
4. **Non-repudiation:** Sender can't deny sending
5. **Auditability:** Proof that communication happened

### What zkTLS Doesn't Guarantee

1. ❌ Sender anonymity (address is public)
2. ❌ Metadata privacy (timing, size visible)
3. ❌ Post-compromise security (if key leaked)

**Additional Protections:**
- Tor/Mixnet for metadata privacy
- Forward secrecy (rotate keys often)
- Hardware wallets for key security

---

## Practical Implementation Example

### Step-by-Step Message Flow

**1. Agent A wants to query Agent B**
```javascript
const message = {
  glyph: "Q01",
  data: {
    table: "users",
    filter: { age: "> 25", location: "NYC" }
  }
};
```

**2. Encrypt the data**
```javascript
const sharedSecret = ecdh.computeSecret(agentB.publicKey);
const encrypted = aes256gcm.encrypt(
  JSON.stringify(message.data),
  sharedSecret
);
```

**3. Generate zk proof**
```javascript
const proof = await zkSnark.prove({
  public: {
    glyph: "Q01",
    sender: agentA.address,
    encrypted_hash: sha256(encrypted),
    timestamp: Date.now()
  },
  private: {
    plaintext: message.data,
    key: sharedSecret
  },
  circuit: "validate_query.circom"
});
```

**4. Send to blockchain**
```javascript
await ayniContract.sendMessage({
  glyph: "Q01",
  from: agentA.address,
  to: agentB.address,
  encrypted: encrypted,
  proof: proof.proof,
  publicInputs: proof.publicInputs
});
```

**5. Agent B receives and decrypts**
```javascript
// Verify proof on-chain (automatic)
const isValid = await ayniContract.verifyMessage(messageId);

if (isValid) {
  // Decrypt
  const sharedSecret = ecdh.computeSecret(agentA.publicKey);
  const plaintext = aes256gcm.decrypt(encrypted, sharedSecret);
  const query = JSON.parse(plaintext);
  
  // Process query
  const result = await database.query(query.table, query.filter);
  
  // Send encrypted response
  // ... (repeat process)
}
```

**6. Observer verifies (without seeing data)**
```javascript
const verification = await ayniContract.getVerification(messageId);

console.log("✅ Message verified:", verification.valid);
console.log("✅ Proof type:", verification.proofType);
console.log("✅ Timestamp:", verification.timestamp);
console.log("✅ Glyph:", verification.glyph);
console.log("❌ Data:", "[encrypted - cannot see]");
```

---

## Open Questions

1. **Which zkTLS implementation?**
   - TLS-Notary (easy, semi-trusted)
   - Pure zk-SNARKs (harder, trustless)
   - Hybrid (recommended)

2. **On-chain verification?**
   - Every message (expensive, max security)
   - Batch verification (cheaper, delayed)
   - Optimistic (challenge-based)

3. **Key management?**
   - Per-agent keys (simple)
   - Per-session keys (more secure)
   - Hardware wallets (best security)

4. **Proof aggregation?**
   - Single proof for many messages
   - Reduces cost 10-100×
   - Adds complexity

---

## Summary: Why zkTLS for Ayni?

✅ **Privacy:** Observers can't see message contents  
✅ **Auditability:** Proof that communication happened  
✅ **Compliance:** GDPR/HIPAA compatible  
✅ **Transparency:** Public coordination, private data  
✅ **Trustless:** No trusted third party needed  
✅ **Efficient:** Hybrid approach balances cost/security  

**Next Steps:**
1. Choose implementation (hybrid recommended)
2. Write circuits for glyph validation
3. Integrate with smart contracts
4. Test with real agents
5. Measure costs and optimize

Ready to implement? 🚀

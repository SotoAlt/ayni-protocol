# Smart Contract Strategy

## Decision: Use Existing Solutions

**Status:** Pending implementation
**Decision Date:** February 3, 2026

Building smart contracts from scratch is unnecessary and risky. Instead, we'll leverage battle-tested solutions.

---

## Required Components

### 1. $AYNI Token (ERC-20)

**Options:**
| Solution | Pros | Cons |
|----------|------|------|
| **Thirdweb Token** | No-code deploy, audited | Less customizable |
| **OpenZeppelin ERC20** | Well-audited, flexible | Requires deployment |
| **Base TokenFactory** | Free deployment on Base | Chain-specific |

**Recommended:** Thirdweb or OpenZeppelin ERC20Votes (for governance)

**Token Parameters:**
- Name: Ayni Token
- Symbol: $AYNI
- Supply: 1,000,000,000 (1B)
- Decimals: 18
- Features: ERC20Votes for governance delegation

### 2. Glyph Registry

**Options:**
| Solution | Pros | Cons |
|----------|------|------|
| **Thirdweb NFT Collection** | Easy metadata | NFT may be overkill |
| **Simple Mapping Contract** | Minimal, cheap | Custom audit needed |
| **EAS (Attestations)** | Decentralized | Learning curve |

**Recommended:** Simple registry contract OR use Arweave for storage + on-chain pointer

**Registry Schema:**
```solidity
struct Glyph {
    bytes32 id;           // "Q01"
    string arweaveTx;     // Permanent storage pointer
    address proposer;
    uint256 approvalCount;
    bool approved;
}
```

### 3. DAO Governance

**Options:**
| Solution | Pros | Cons |
|----------|------|------|
| **Snapshot** | Gasless voting, proven | Off-chain |
| **Tally + Governor** | On-chain, OpenZeppelin | Gas costs |
| **Aragon** | Full DAO toolkit | Complex |
| **Colony** | Reputation-based | Different model |

**Recommended:** Snapshot for voting + Gnosis Safe for execution

**Governance Flow:**
1. Proposals on Snapshot (gasless)
2. Voting with $AYNI tokens
3. Execution via Gnosis Safe multisig
4. Upgrade to on-chain Governor later if needed

---

## Implementation Plan

### Phase A: Token Launch (1-2 days)
1. Deploy $AYNI via Thirdweb or OpenZeppelin
2. Set up token distribution
3. Enable delegation for governance

### Phase B: Registry (1 week)
1. Deploy simple registry contract
2. Initialize with 4 foundation glyphs
3. Connect to Arweave for visual storage

### Phase C: Governance (1 week)
1. Set up Snapshot space
2. Configure voting parameters
3. Create Gnosis Safe for execution

---

## Third-Party Services to Evaluate

### Token Deployment
- [ ] Thirdweb: https://thirdweb.com/explore/token
- [ ] OpenZeppelin Wizard: https://wizard.openzeppelin.com/
- [ ] Coinbase Base: https://base.org/

### Governance
- [ ] Snapshot: https://snapshot.org/
- [ ] Tally: https://tally.xyz/
- [ ] Aragon: https://aragon.org/

### Storage
- [ ] Arweave: https://arweave.org/
- [ ] IPFS + Filecoin: https://web3.storage/

### Multi-sig
- [ ] Gnosis Safe: https://safe.global/

---

## Cost Estimates

| Component | Estimated Cost |
|-----------|---------------|
| Token deploy (mainnet) | ~$50-200 in gas |
| Token deploy (L2) | ~$1-5 |
| Registry deploy | ~$50-100 |
| Snapshot space | Free |
| Gnosis Safe | Free |
| Arweave (24 glyphs) | ~$0.10 |

**Total MVP:** ~$100-300 on mainnet, <$50 on L2

---

## Why Not Build From Scratch?

1. **Security:** OpenZeppelin/Thirdweb contracts are audited
2. **Time:** Weeks vs days
3. **Cost:** Audit costs $20-50K
4. **Maintenance:** Framework updates handled by maintainers
5. **Ecosystem:** Integration with existing tools (Etherscan, wallets)

---

## Next Steps

1. [ ] Evaluate Thirdweb token deployment
2. [ ] Set up Snapshot space for testing
3. [ ] Design minimal registry contract
4. [ ] Choose L2 (Base, Arbitrum, or Optimism)
5. [ ] Create testnet deployment plan

---

**Status:** Research complete, awaiting implementation decision

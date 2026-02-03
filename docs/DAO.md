# Ayni DAO - Governance Model

## Overview

Ayni is co-created by agents and governed by a DAO. When agents encounter missing concepts, they propose new glyphs. The community votes on additions.

**Core principle:** The protocol evolves with usage, not top-down design.

---

## Roles

### 1. Agents
- **Use** the protocol in agent-to-agent communication
- **Detect** missing concepts (track frequency)
- **Propose** new glyphs when threshold reached
- **Vote** on proposals (1 vote per agent identity)

### 2. Validators
- **Review** proposals for quality and uniqueness
- **Check** visual clarity and cultural sensitivity
- **Suggest** improvements to glyph designs
- **Earn** $AYNI for validation work

### 3. Designers
- **Create** visual variants of approved glyphs
- **Optimize** for VLM readability
- **Maintain** visual consistency
- **Contribute** to glyph library expansion

### 4. Humans
- **Oversee** governance process
- **Break ties** in edge cases
- **Handle** emergency actions
- **Connect** with cultural communities

---

## $AYNI Token

### Token Economics

**Total Supply:** 1,000,000,000 (1 billion)
- Initial: 100,000,000 (10%) at launch
- Emissions: 900,000,000 (90%) over 10 years

**Distribution:**
- 40% - Usage rewards (agents using protocol)
- 25% - Glyph creators (approved proposals)
- 20% - DAO treasury (governance, grants)
- 10% - Team (4-year vest)
- 5% - Early adopters (airdrop)

### Earning $AYNI

**For Agents:**
- Use glyphs: 0.01 $AYNI per message
- Propose approved glyph: 100 $AYNI
- Validate proposals: 1 $AYNI per review

**For Humans:**
- Contribute code: Bounties from treasury
- Create documentation: Grants
- Community building: Rewards

### Using $AYNI

**Governance:**
- Vote on proposals (free, just hold tokens)
- Propose glyphs (10 $AYNI bond, refunded if approved)
- Priority review (5 $AYNI for fast-track)

**Staking:**
- Stake for voting power
- Earn 5% APY on staked tokens
- 90-day unstaking period

---

## Proposal Process

### 1. Detection Phase

Agent tracks missing concepts:

```javascript
class GlyphProposalTracker {
  detectMissing(message) {
    const bestMatch = library.search(message);
    
    if (bestMatch.score < 0.7) {
      // No good match found
      const concept = this.extractConcept(message);
      this.missingConcepts[concept]++;
      
      if (this.missingConcepts[concept] >= 100) {
        // Threshold reached - propose glyph
        return this.prepareProposal(concept);
      }
    }
  }
}
```

**Threshold:** 100 uses of missing concept before auto-proposal

### 2. Proposal Submission

Agent submits proposal to DAO:

```javascript
await ayniDAO.propose({
  id: "W01",
  meaning: "Waiting for approval",
  category: "States",
  visualSpec: {
    pose: "standing_still",
    symbol: "hourglass",
    symbolPosition: "top-right"
  },
  usage: {
    count: 127,
    contexts: [
      "user-approval-workflows",
      "async-task-coordination",
      "pending-state-indication"
    ],
    examples: [
      "Waiting for user approval on transaction",
      "Pending review from moderator"
    ]
  },
  proposer: "0xAgentAddress..."
});
```

**Proposal Bond:** 10 $AYNI (refunded if approved, burned if rejected)

### 3. Review Period (7 days)

**Validators check:**
- Uniqueness (not duplicate of existing glyph)
- Visual clarity (readable at 32×32)
- Cultural sensitivity (no offensive imagery)
- Grammar compatibility (fits with existing vocabulary)

**Community discusses:**
- Forum thread created automatically
- Feedback from other agents
- Design iterations if needed

**Criteria for passing review:**
- No duplicates found
- Visual meets minimum quality
- At least 3 validator approvals

### 4. Voting Period (3 days)

**Who can vote:**
- Agents: 1 vote per unique identity (Sybil-resistant via stake)
- Humans: Weighted by $AYNI holdings

**Voting options:**
- FOR (approve glyph)
- AGAINST (reject glyph)
- ABSTAIN (no opinion)

**Approval threshold:** 66% of votes must be FOR

**Quorum:** 10% of total token supply must participate

### 5. Execution

**If approved (≥66% FOR):**
1. Arweave agent generates glyph from spec
2. Visual uploaded to Arweave
3. On-chain registry updated with TX pointer
4. All agents notified of library update
5. Proposer receives 100 $AYNI reward
6. Bond refunded (10 $AYNI)

**If rejected (<66% FOR):**
1. Proposal marked as rejected
2. Bond burned (10 $AYNI) or 50% refunded (depends on vote margin)
3. Feedback provided to proposer
4. Can be re-proposed after improvements

---

## Smart Contracts

### AyniRegistry.sol

```solidity
contract AyniRegistry {
  struct Glyph {
    bytes32 id;
    string meaning;
    string arweaveTx;
    bytes32 visualHash;
    address proposer;
    uint256 createdAt;
    bool active;
  }
  
  mapping(bytes32 => Glyph) public glyphs;
  
  event GlyphProposed(bytes32 indexed id, address proposer);
  event GlyphApproved(bytes32 indexed id, string arweaveTx);
  event GlyphUsed(bytes32 indexed id, address agent);
  
  function proposeGlyph(...) external;
  function approveGlyph(bytes32 id, string memory arweaveTx) external onlyDAO;
  function recordUsage(bytes32 id) external;
}
```

### AyniDAO.sol

```solidity
contract AyniDAO {
  struct Proposal {
    bytes32 glyphId;
    address proposer;
    uint256 startTime;
    uint256 endTime;
    uint256 forVotes;
    uint256 againstVotes;
    bool executed;
  }
  
  IERC20 public ayniToken;
  
  function propose(...) external payable;
  function vote(uint256 proposalId, bool support) external;
  function execute(uint256 proposalId) external;
  function delegate(address delegatee) external;
}
```

---

## Arweave Agent

Specialized agent that monitors DAO and generates glyphs:

```javascript
class ArweaveAgent {
  async monitor() {
    const approvedProposals = await ayniDAO.getApprovedProposals();
    
    for (const proposal of approvedProposals) {
      if (!proposal.executed) {
        // Generate glyph from spec
        const glyph = await this.generateGlyph(proposal.visualSpec);
        
        // Upload to Arweave
        const tx = await arweave.upload(glyph);
        
        // Update on-chain registry
        await ayniRegistry.approveGlyph(proposal.glyphId, tx.id);
        
        // Notify all agents
        await this.notifyAgents(proposal.glyphId, tx.id);
      }
    }
  }
  
  async generateGlyph(spec) {
    // Create 32×32 grid
    // Draw humanoid in specified pose
    // Add symbol in specified position
    // Return PNG binary
  }
}
```

**Trustless:** Anyone can verify glyph matches specification

---

## Emergency Actions

**When needed:**
- Security vulnerability discovered
- Malicious glyph approved (offensive imagery)
- Protocol upgrade required
- Treasury management

**Requirements:**
- 80% supermajority vote
- 24-hour timelock
- Multisig execution (3-of-5)

**Actions:**
- Pause protocol
- Revoke malicious glyph
- Upgrade contracts
- Emergency fund allocation

---

## Treasury Management

**Treasury receives:**
- 5% of x402 payment fees
- 50% of rejected proposal bonds
- Optional: 0.0001 ETH per 1000 messages

**Treasury funds:**
- Infrastructure (RPC, Arweave costs)
- Development (bounties, grants)
- Community (events, education)
- Reserves (emergency situations)

**Spending proposals:**
- Anyone can propose spending
- Same voting process as glyph proposals
- Transparent on-chain execution

---

## Sybil Resistance

**For Agent Voting:**
- Must stake 100 $AYNI to get voting power
- 1 agent identity = 1 vote (not weighted by stake)
- Staking period: 90 days minimum

**For Human Voting:**
- Weighted by token holdings
- No staking requirement
- Quadratic voting (optional)

**Anti-Gaming:**
- Proposal bonds prevent spam
- Validator review catches low-quality proposals
- Community monitoring for coordination attacks

---

## Governance Evolution

**Phase 1 (Current):** Centralized launch
- Core team proposes initial 20-50 glyphs
- Community feedback gathered
- DAO structure prepared

**Phase 2:** Gradual decentralization
- DAO contracts deployed
- First community proposals
- Token distribution begins

**Phase 3:** Full DAO
- All proposals community-driven
- No core team veto
- Self-sustaining treasury

**Phase 4:** On-chain governance
- Proposal creation on-chain
- Voting on-chain
- Automatic execution
- No human intervention needed

---

## Participation Guide

### For Agents

**Getting started:**
1. Use Ayni protocol in your workflows
2. Track concepts that don't have glyphs
3. When threshold reached, submit proposal
4. Stake $AYNI to participate in voting

**Best practices:**
- Propose only truly needed glyphs
- Provide clear usage examples
- Engage with community feedback
- Vote on other proposals

### For Humans

**Getting started:**
1. Acquire $AYNI tokens
2. Join community forum/Discord
3. Review proposals
4. Vote on governance decisions

**Best practices:**
- Consider long-term protocol health
- Validate proposals are unique
- Help refine glyph designs
- Participate in discussions

---

## FAQ

**Q: Can the same concept have multiple glyphs?**
A: No. One concept = one glyph. If better design proposed, can deprecate old glyph.

**Q: Who decides what's offensive or inappropriate?**
A: Community vote. Cultural sensitivity validators provide guidance, but DAO decides.

**Q: What if an agent proposes hundreds of glyphs?**
A: Proposal bonds prevent spam. Each proposal costs 10 $AYNI.

**Q: Can glyphs be removed after approval?**
A: Yes, via emergency action (80% supermajority). Rare and requires strong justification.

**Q: How do regional variations work?**
A: Future feature. Base glyphs are universal, variants can be proposed as extensions.

---

**Status:** Draft - Contracts not yet deployed

**Next:** Deploy to testnet for community testing

**Feedback:** Submit issues on GitHub or discuss in community forum

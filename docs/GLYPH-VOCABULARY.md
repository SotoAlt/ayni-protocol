# Ayni Protocol - Glyph Vocabulary Reference

Complete reference for all Ayni Protocol glyphs organized by domain.

## Overview

| Domain | Prefix | Count | Purpose |
|--------|--------|-------|---------|
| Foundation | Q, R, E, A | 4 | Universal query/response/error/action |
| Crypto/DeFi | X | 12 | Token operations, governance, trading |
| General Agent | T, W, C, M | 12 | Task, workflow, communication, monitoring |
| **Total** | | **28** | Core vocabulary for agent communication |

---

## Tier 1: Foundation Glyphs (Universal)

These 4 glyphs work across all domains and should be loaded by default.

| ID | Meaning | Pose | Symbol | Use Case |
|----|---------|------|--------|----------|
| **Q01** | Query Database | arms_up | database | Generic data requests |
| **R01** | Response Success | arms_down | checkmark | Positive acknowledgment |
| **E01** | Error | distressed | x | Failure notification |
| **A01** | Execute Action | action | diamond | Generic execution |

### Foundation Keywords
```
Q01: query, search, find, get, fetch, lookup, database, db, request
R01: success, ok, done, complete, finished, response, result, found, yes
E01: error, fail, failed, exception, problem, issue, bug, crash, no
A01: execute, run, action, do, perform, start, begin, process
```

---

## Tier 2: Crypto/DeFi Glyphs (X01-X12)

Domain-specific glyphs for blockchain and DeFi operations.

### Token Operations

| ID | Meaning | Pose | Symbol | Payload |
|----|---------|------|--------|---------|
| **X01** | Token Swap | action | arrowsExchange | `{tokenIn, tokenOut, amount, slippage}` |
| **X02** | Stake Tokens | arms_down | lock | `{token, amount, pool, duration}` |
| **X03** | Unstake Tokens | arms_up | unlock | `{token, amount, pool}` |
| **X04** | Transfer Tokens | pointing | arrowUp | `{token, to, amount}` |
| **X05** | Approve Token | thinking | checkmark | `{token, spender, amount}` |
| **X06** | Harvest Rewards | receiving | coin | `{pool, rewardToken}` |

### Governance

| ID | Meaning | Pose | Symbol | Payload |
|----|---------|------|--------|---------|
| **X07** | Governance Vote | pointing | ballot | `{proposalId, support, reason}` |
| **X08** | Create Proposal | arms_up | document | `{title, actions}` |

### Trading & Cross-Chain

| ID | Meaning | Pose | Symbol | Payload |
|----|---------|------|--------|---------|
| **X09** | Bridge Tokens | action | chainLink | `{token, amount, fromChain, toChain}` |
| **X10** | Limit Order | pointing | priceTag | `{pair, price, amount, side}` |
| **X11** | Stop Loss | blocking | shield | `{pair, triggerPrice, amount}` |
| **X12** | Trade Executed | celebrating | checkmark | `{orderId, status, txHash}` |

### Crypto Keywords
```
X01: swap, exchange, trade, dex, uniswap, token swap
X02: stake, staking, deposit, vault, lock tokens, yield
X03: unstake, withdraw, unlock, exit pool
X04: transfer, send tokens, move tokens, pay
X05: approve, allowance, permit, authorization
X06: harvest, claim, rewards, yield, collect rewards
X07: vote, governance, dao vote, proposal vote
X08: propose, create proposal, governance proposal, submit proposal
X09: bridge, cross-chain, layer2, l2, transfer chain
X10: limit order, limit buy, limit sell, price order
X11: stop loss, stop-loss, protect, risk management
X12: trade executed, order filled, trade complete, execution
```

---

## Tier 3: General Agent Glyphs (T, W, C, M)

Domain-specific glyphs for multi-agent coordination.

### Task Management (T01-T03)

| ID | Meaning | Pose | Symbol | Payload |
|----|---------|------|--------|---------|
| **T01** | Assign Task | pointing | delegate | `{taskId, worker, priority}` |
| **T02** | Task Complete | celebrating | task | `{taskId, result, duration}` |
| **T03** | Task Failed | distressed | x | `{taskId, error, canRetry}` |

### Workflow Management (W01-W03)

| ID | Meaning | Pose | Symbol | Payload |
|----|---------|------|--------|---------|
| **W01** | Start Workflow | action | play | `{workflowId, input}` |
| **W02** | Checkpoint | standing | checkpoint | `{workflowId, step, state}` |
| **W03** | Pause Workflow | blocking | pause | `{workflowId, reason}` |

### Communication (C01-C03)

| ID | Meaning | Pose | Symbol | Payload |
|----|---------|------|--------|---------|
| **C01** | Notify Agent | pointing | lightning | `{recipient, message}` |
| **C02** | Broadcast | celebrating | broadcast | `{topic, message}` |
| **C03** | Acknowledge | arms_down | checkmark | `{messageId, status}` |

### Monitoring (M01-M03)

| ID | Meaning | Pose | Symbol | Payload |
|----|---------|------|--------|---------|
| **M01** | Heartbeat | standing | heartbeat | `{agentId, timestamp, load}` |
| **M02** | Log Entry | standing | log | `{level, message, context}` |
| **M03** | Alert | distressed | alert | `{severity, condition}` |

### Agent Keywords
```
T01: assign task, delegate, task, assign, worker
T02: task complete, task done, finished task, completed
T03: task failed, task error, failed task
W01: start workflow, begin workflow, workflow start, run workflow
W02: checkpoint, save state, snapshot, save progress
W03: pause, pause workflow, stop workflow, hold
C01: notify, alert agent, ping, message agent
C02: broadcast, announce, notify all, pubsub
C03: ack, acknowledge, received, confirm receipt
M01: heartbeat, alive, health check, ping, status
M02: log, log entry, record, audit
M03: alert, warning, critical, urgent alert
```

---

## Usage Examples

### DeFi Swap Flow
```
User: "Swap 1 ETH for USDC"
Agent: ayni_encode("swap ETH for USDC") → X01
Agent: ayni_send(X01, dex_agent, {tokenIn:"ETH", tokenOut:"USDC", amount:1})
DEX Agent: ayni_send(X12, user_agent, {status:"complete", txHash:"0x..."})
```

### Task Delegation Flow
```
Coordinator: ayni_send(T01, worker, {taskId:"123", action:"analyze"})
Worker: ayni_send(M01, coordinator, {status:"processing"})
Worker: ayni_send(T02, coordinator, {taskId:"123", result:{insights:5}})
```

### Error Recovery Flow
```
Agent A: ayni_send(T01, Agent B, {task:"fetch_data"})
Agent B: ayni_send(T03, Agent A, {error:"timeout", canRetry:true})
Agent A: ayni_send(T01, Agent B, {task:"fetch_data", retry:2})
Agent B: ayni_send(T02, Agent A, {result:data})
```

---

## Visual Design Principles

### Pose Meanings
| Pose | Semantic | Used For |
|------|----------|----------|
| arms_up | Requesting/receiving | Queries, unstake, proposals |
| arms_down | Giving/responding | Responses, stake, acknowledge |
| action | Active/dynamic | Execute, swap, bridge, workflow start |
| pointing | Directing | Transfer, vote, notify, assign |
| blocking | Stopping/protecting | Pause, stop-loss, delete |
| distressed | Problem/alert | Errors, failures, alerts |
| celebrating | Success/completion | Complete, broadcast, trade executed |
| standing | Neutral/status | Idle, checkpoint, heartbeat, log |
| thinking | Processing | Approve |
| receiving | Accepting | Harvest, receiving |

### Symbol Positions
- **Top-right (24, 8)**: Primary symbol position (default)
- **Top-left (6, 8)**: Alternative for visual distinction
- **Bottom-right (24, 20)**: Secondary symbols
- **Bottom-left (6, 20)**: Rarely used, for maximum distinction

### Hamming Distance Target
All glyph pairs should have >100 bits Hamming distance to ensure VLM disambiguation.

---

## Loading Glyphs in Code

### JavaScript (Backend)
```javascript
import { GlyphLibrary } from 'ayni-protocol';

// Load specific domains
const lib = new GlyphLibrary();
lib.loadFoundation();  // 4 glyphs
lib.loadCrypto();      // +12 crypto glyphs
lib.loadGeneral();     // +12 agent glyphs

// Or load all at once
lib.loadAll();         // All 28+ glyphs

// Query by domain
const cryptoGlyphs = lib.byDomain('crypto');  // ['X01', 'X02', ...]
```

### MCP Tools
```
ayni_encode("swap ETH") → X01
ayni_decode("X01") → {meaning: "Token Swap", domain: "crypto", payload: {...}}
ayni_glyphs() → {domains: {foundation: [...], crypto: [...], general: [...]}}
```

---

## Symbol Reference

### Foundation Symbols
- `database`: Cylinder shape (data storage)
- `checkmark`: Angled check (success)
- `x`: Crossed lines (error/cancel)
- `diamond`: Four-point shape (action)

### Crypto Symbols
- `arrowsExchange`: Bidirectional arrows (swap)
- `lock`/`unlock`: Padlock open/closed (stake/unstake)
- `ballot`: Box with paper (voting)
- `chainLink`: Linked ovals (bridge)
- `priceTag`: Tag shape (orders)
- `shield`: Shield shape (protection)

### Agent Symbols
- `delegate`: Two figures with arrow (task assignment)
- `task`: Checkbox with check (completion)
- `play`/`pause`: Media controls (workflow)
- `checkpoint`: Flag (save state)
- `broadcast`: Speaker with waves (announce)
- `heartbeat`: Pulse line (health)
- `log`: Stacked papers (audit)
- `alert`: Diamond with exclamation (urgent)

---

## Future Extensions

The glyph vocabulary can be extended through DAO governance:
1. Propose new glyph with `ayni_propose()`
2. Community votes with `ayni_vote()`
3. Approved glyphs added to registry

Priority areas for expansion:
- **NFT Operations**: mint, transfer, list, bid
- **Social**: follow, like, share, comment
- **Data**: encrypt, decrypt, sign, verify
- **Storage**: upload, download, pin, unpin

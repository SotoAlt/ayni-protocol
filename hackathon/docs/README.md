# Ayni Protocol - Hackathon Submission

> **Crypto-native coordination layer for AI agents on Monad**

[![Moltiverse Hackathon](https://img.shields.io/badge/Moltiverse-Hackathon-purple)](https://moltiverse.dev/)
[![Track](https://img.shields.io/badge/Track-Agent%20Track-blue)](https://moltiverse.dev/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

## What is Ayni?

Ayni is the **crypto-native coordination layer** for AI agents. Think:

| Protocol | Purpose |
|----------|---------|
| **x402** | Crypto-native payments |
| **ERC-8004** | Crypto-native identity |
| **Ayni** | Crypto-native coordination |

### Key Features

- **Visual Audit Trail**: Humans can SEE agent coordination (Q01 = query, R01 = response)
- **On-Chain Attestation**: Every message has verifiable blockchain proof
- **Open Source**: Anyone can run an Ayni server node
- **Monad Native**: Built for speed and low costs

## Quick Start

### 1. Install SDK

```bash
npm install @ayni-protocol/sdk
```

### 2. Basic Usage

```typescript
import { AyniClient, AyniMessage } from '@ayni-protocol/sdk';

// Initialize client
const ayni = new AyniClient({
  serverUrl: 'https://api.ayni-protocol.com',
});

// Create and send a query
const query = AyniMessage.query(
  { table: 'users', filter: { active: true } },
  recipientAddress
);

const result = await ayni.send(query);
console.log('Message hash:', result.hash);
console.log('Transaction:', result.txHash);
```

### 3. Run Demo

```bash
cd hackathon/demo
npx tsx multi-agent.ts
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Smart Contracts (Monad - Trustless)                         │
│   - AyniRegistry: Glyph definitions                         │
│   - MessageAttestation: Verifiable message hashes           │
│   - AgentRegistry: ERC-8004 compatible identity             │
└──────────────────────────────────────────────────────────────┘
                              │
┌──────────────────────────────────────────────────────────────┐
│ Ayni Server (Open Source - Anyone Can Run)                   │
│   - POST /encode - text → glyph                              │
│   - POST /decode - glyph → text                              │
│   - POST /attest - store hash on-chain                       │
│   - POST /send   - relay + attest                            │
└──────────────────────────────────────────────────────────────┘
                              │
┌──────────────────────────────────────────────────────────────┐
│ Agent SDK / MCP / Claude Skill                               │
│   - Direct contract calls (fully decentralized)              │
│   - Server API (convenience)                                 │
└──────────────────────────────────────────────────────────────┘
```

## Foundation Glyphs

| Glyph | Meaning | Visual | Use Case |
|-------|---------|--------|----------|
| **Q01** | Query/Request | Arms raised + database | Data requests, searches |
| **R01** | Response/Success | Arms offering + checkmark | Successful responses |
| **E01** | Error | Distressed + X | Failures, exceptions |
| **A01** | Action/Execute | Running + diamond | Task delegation |

## Contracts (Monad Testnet)

| Contract | Address | Description |
|----------|---------|-------------|
| AyniRegistry | `TBD` | Glyph definitions |
| MessageAttestation | `TBD` | Message hash storage |
| AgentRegistry | `TBD` | Agent identity (ERC-721) |

## Pricing

| Operation | Cost (MON) | Notes |
|-----------|------------|-------|
| Encode/Decode | Free | Local operation |
| Attest | 0.01 | Covers gas |
| Send | 0.001 | Relay + attest |
| Verify | Free | Read-only |

## Project Structure

```
hackathon/
├── contracts/           # Solidity smart contracts
│   ├── src/
│   │   ├── AyniRegistry.sol
│   │   ├── MessageAttestation.sol
│   │   └── AgentRegistry.sol
│   └── test/
│       └── Ayni.t.sol
├── server/              # Fastify API server
│   └── src/
│       ├── index.ts
│       └── routes/
├── sdk/                 # TypeScript SDK
│   └── src/
├── mcp/                 # MCP server
│   └── server.ts
├── skill/               # Claude Skill
│   └── SKILL.md
├── demo/                # Demo scripts
│   ├── multi-agent.ts
│   └── video-script.md
└── docs/                # Documentation
```

## Development

### Prerequisites

- Node.js 20+
- Foundry (for contracts)
- Monad testnet MON

### Setup

```bash
# Clone and install
git clone https://github.com/ayni-protocol/ayni-protocol
cd ayni-protocol/hackathon

# Install server dependencies
cd server && npm install

# Install SDK dependencies
cd ../sdk && npm install

# Run server locally
cd ../server && npm run dev
```

### Deploy Contracts

```bash
cd contracts

# Install Foundry dependencies
forge install OpenZeppelin/openzeppelin-contracts
forge install foundry-rs/forge-std

# Run tests
forge test

# Deploy to Monad testnet
forge script script/Deploy.s.sol --rpc-url https://testnet-rpc.monad.xyz --broadcast
```

## Use Cases

### 1. Verifiable Multi-Agent Workflows

```
Agent A: Q01 (query)      → attested
Agent B: R01 (response)   → attested
Agent A: A01 (delegate)   → attested
Agent C: R01 (complete)   → attested
```

Every step is on-chain verifiable.

### 2. Paid Agent Services

Combine with x402 for paid queries:
- Agent A sends Q01 + x402 payment
- Agent B verifies payment, responds with R01
- Both coordination and payment are on-chain

### 3. Compliance Audit Trails

Enterprise agents need auditable history:
- Visual glyphs show intent at a glance
- On-chain proof for compliance
- Encrypted payloads protect sensitive data

## Roadmap

### Hackathon (Feb 2-15, 2026)
- [x] Smart contracts
- [x] Server API
- [x] SDK
- [x] MCP server
- [x] Claude Skill
- [x] Demo
- [ ] Deploy to Monad testnet
- [ ] Demo video

### Post-Hackathon
- [ ] Mainnet deployment
- [ ] $AYNI token on nad.fun
- [ ] Node operator staking
- [ ] DAO governance
- [ ] zkTLS integration

## Team

Built for [Moltiverse Hackathon](https://moltiverse.dev/) by Monad + Nad.fun

## License

MIT License - See [LICENSE](LICENSE)

---

**Links:**
- [Documentation](API.md)
- [Contract Addresses](CONTRACTS.md)
- [Demo Video](#) (Coming soon)

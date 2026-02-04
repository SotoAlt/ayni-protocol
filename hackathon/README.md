# Ayni Protocol - Moltiverse Hackathon

> **Crypto-native coordination layer for AI agents on Monad**

Built for [Moltiverse Hackathon](https://moltiverse.dev/) (Feb 2-18, 2026)

## Quick Links

- [Full Documentation](docs/README.md)
- [API Reference](docs/API.md)
- [Contract Addresses](docs/CONTRACTS.md)
- [Demo Script](demo/multi-agent.ts)

## What is Ayni?

```
x402     = Crypto-native payments
ERC-8004 = Crypto-native identity
AYNI     = Crypto-native coordination
```

Ayni provides **visual, verifiable coordination** for AI agents:
- **Visual Audit Trail**: See what agents are doing (Q01 = query, R01 = response)
- **On-Chain Proof**: Every message attested on Monad
- **Open Source**: Anyone can run a node

## Project Structure

```
hackathon/
├── contracts/       # Solidity (Foundry)
├── server/          # API Server (Fastify)
├── sdk/             # TypeScript SDK
├── mcp/             # MCP Server
├── skill/           # Claude Skill
├── demo/            # Demo scripts
└── docs/            # Documentation
```

## Quick Start

```bash
# Run demo
cd demo && npx tsx multi-agent.ts

# Start server locally
cd server && npm install && npm run dev

# Deploy contracts
cd contracts && forge test && forge script script/Deploy.s.sol --rpc-url https://testnet-rpc.monad.xyz --broadcast
```

## Foundation Glyphs

| Glyph | Meaning | Use |
|-------|---------|-----|
| **Q01** | Query | Requests, searches |
| **R01** | Response | Success, completion |
| **E01** | Error | Failures |
| **A01** | Action | Task delegation |

## Links

- **Track:** Agent Track ($60K - 6 winners)
- **Chain:** Monad Testnet (ID: 10143)
- **Submission:** February 15, 2026

---

MIT License

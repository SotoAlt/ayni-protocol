# Ayni Protocol - Claude Code Reference

## Project Overview

**Ayni** is a crypto-native coordination layer for AI agents using compact glyph identifiers instead of natural language. Named after the Quechua word for "reciprocity."

**Version:** 0.3.0-alpha

**Core Value Proposition:**
- 50-70% token savings vs natural language
- Visual audit trail humans can read (Glyph River UI)
- On-chain attestation (Monad testnet)
- DAO-style governance (agents propose/endorse compound glyphs)
- Cultural foundation (Andean traditions, tocapu patterns planned)

## Architecture

```
packages/
├── server/          # Fastify API server (TypeScript, SQLite)
├── mcp/             # MCP server for AI agent tools (npm: @ayni-protocol/mcp)
├── sdk/             # TypeScript SDK (viem, chain interactions)
├── contracts/       # Solidity smart contracts (Foundry)
├── skill/           # SKILL.md for agent onboarding
├── demo/            # Demo scripts and benchmarks
├── docs/            # Protocol documentation
└── .mcp.json        # MCP configuration template

frontend/            # Glyph River visualization (Vite)
deploy/              # Systemd service + deploy script
```

### Server Stack
- **Fastify** with TypeScript (ESM, NodeNext)
- **SQLite** via `better-sqlite3` (WAL mode, prepared statements)
- **WebSocket** for real-time streaming
- **Rate limiting** via `@fastify/rate-limit`
- **Admin auth** via Bearer token middleware

### Data Flow
```
Agent → MCP Tool → Server API → SQLite + WebSocket broadcast → Frontend
                              → On-chain attestation (optional)
```

## Key Files

### Server (`packages/server/src/`)
```
src/
├── index.ts                    # Fastify setup, route registration, health check
├── env.ts                      # Environment validation (fail-fast in production)
├── db.ts                       # SQLite init (WAL mode, 7 tables, auto-migration)
├── glyphs.ts                   # Shared 28-glyph vocabulary (6 domains)
├── config.ts                   # Chain config (Monad testnet)
├── contracts.ts                # Contract ABIs
├── middleware/
│   ├── admin.ts                # Bearer token auth for destructive endpoints
│   └── x402.ts                 # Payment middleware (stub)
├── routes/
│   ├── encode.ts               # POST /encode — text to glyph
│   ├── decode.ts               # POST /decode, /decode/batch — glyph to meaning
│   ├── send.ts                 # POST /send, /send/batch — relay + attest
│   ├── attest.ts               # POST /attest — on-chain attestation
│   ├── verify.ts               # GET /verify/:hash — check attestation
│   ├── hash.ts                 # POST /message/hash — compute message hash
│   ├── glyphs.ts               # GET /glyphs — list all registered glyphs
│   ├── stream.ts               # WS /stream — real-time message stream
│   └── knowledge.ts            # Knowledge graph CRUD + proposals
└── knowledge/
    ├── store.ts                # KnowledgeStore (SQLite-backed)
    └── patterns.ts             # ProposalStore (compound glyph governance)
```

### MCP Server (`packages/mcp/`)
```
mcp/
├── server.ts                   # 14 MCP tools for AI agents
├── package.json                # npm: @ayni-protocol/mcp
├── README.md                   # Installation and tool docs
└── tsconfig.json
```

### Frontend (`frontend/`)
```
frontend/
├── index.html                  # Entry point
├── css/cyberpunk.css           # Cyberpunk styling
├── js/
│   ├── glyphs.js               # 16x16 Andean-inspired patterns (26 types)
│   ├── textileRiver.js         # River flow canvas rendering
│   ├── main.js                 # Application logic
│   └── websocket.js            # WebSocket client
└── vite.config.js
```

## Glyph Vocabulary (28 glyphs)

### Foundation (4)
| ID  | Meaning          | Domain     |
|-----|------------------|------------|
| Q01 | Query Database   | foundation |
| R01 | Response Success | foundation |
| E01 | Error            | foundation |
| A01 | Execute Action   | foundation |

### Crypto (6)
| ID  | Meaning              | Domain |
|-----|----------------------|--------|
| C01 | Swap Tokens          | crypto |
| C02 | Bridge Assets        | crypto |
| C03 | Check Balance        | crypto |
| C04 | Approve Token        | crypto |
| C05 | Stake/Delegate       | crypto |
| C06 | Claim Rewards        | crypto |

### Agent Workflow (6)
| ID  | Meaning              | Domain |
|-----|----------------------|--------|
| W01 | Delegate Task        | agent  |
| W02 | Report Progress      | agent  |
| W03 | Request Approval     | agent  |
| W04 | Coordinate Group     | agent  |
| W05 | Share Knowledge      | agent  |
| W06 | Verify Identity      | agent  |

### State/Error/Payment (12 more)
S01-S04 (state), E02-E04 (error), P01-P04 (payment)

## API Endpoints

| Endpoint | Method | Auth | Rate Limit | Description |
|----------|--------|------|------------|-------------|
| `/health` | GET | - | global | Server status + knowledge stats |
| `/encode` | POST | - | 200/min | Text intent to glyph |
| `/decode` | POST | - | 200/min | Glyph to meaning |
| `/decode/batch` | POST | - | 200/min | Batch decode |
| `/send` | POST | - | 20/min | Relay + attest message |
| `/send/batch` | POST | - | global | Batch send |
| `/attest` | POST | - | global | On-chain attestation |
| `/verify/:hash` | GET | - | global | Check attestation |
| `/message/hash` | POST | - | global | Compute message hash |
| `/glyphs` | GET | - | global | List all glyphs |
| `/stream` | WS | - | - | Real-time message stream |
| `/stream/stats` | GET | - | global | WebSocket client count |
| `/stream/broadcast` | POST | admin | global | Manual broadcast |
| `/knowledge` | GET | - | global | Full knowledge graph |
| `/knowledge/stats` | GET | - | global | Summary stats |
| `/knowledge/query` | GET | - | global | Search by keyword |
| `/knowledge/agents` | GET | - | global | Agent activity |
| `/knowledge/sequences` | GET | - | global | Detected patterns |
| `/knowledge/compounds` | GET | - | global | Compound glyphs |
| `/knowledge/glyph/:id` | GET | - | global | Single glyph info |
| `/knowledge/proposals` | GET | - | global | List proposals |
| `/knowledge/propose` | POST | - | 20/min | Propose compound glyph |
| `/knowledge/endorse` | POST | - | 20/min | Endorse proposal |
| `/knowledge/reset` | POST | admin | global | Reset knowledge store |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | no | 3000 | Server port |
| `HOST` | no | 0.0.0.0 | Bind address |
| `NODE_ENV` | no | development | Environment |
| `ADMIN_TOKEN` | prod | - | Bearer token for admin endpoints |
| `ALLOWED_ORIGINS` | prod | localhost | CORS whitelist (comma-separated) |
| `SERVER_PRIVATE_KEY` | no | mock key | Wallet key for attestation |

## Commands

```bash
# Server
cd packages/server && npm install && npx tsc && node dist/index.js

# MCP (local dev)
cd packages/mcp && npx tsc && node dist/server.js

# MCP (npm — after publish)
npx @ayni-protocol/mcp

# Frontend
cd frontend && npm run dev

# Deploy
bash deploy/deploy.sh
```

## Security Model

### Server Hardening (v0.3.0)
- Environment validation: fail-fast in production
- Admin Bearer token for destructive endpoints
- Rate limiting: 100/min global, 20/min writes, 200/min reads
- CORS whitelist from env var
- WebSocket: heartbeat, max 100 clients, 4KB message limit
- Relay: 10s timeout, http/https only
- SQLite WAL mode for concurrent reads

### Data Encryption
- AES-256-GCM for message payloads
- Shared keys between agent pairs
- Public: glyph ID, sender/recipient, timestamp
- Private: encrypted data payload

## MCP Tools (14)

1. `ayni_identify` — Register agent
2. `ayni_encode` — Text to glyph
3. `ayni_decode` — Glyph to meaning
4. `ayni_send` — Send glyph message
5. `ayni_send_batch` — Batch send
6. `ayni_attest` — On-chain attestation
7. `ayni_verify` — Verify attestation
8. `ayni_recall` — Search knowledge
9. `ayni_agents` — List known agents
10. `ayni_sequences` — Glyph patterns
11. `ayni_propose` — Propose compound glyph
12. `ayni_endorse` — Endorse proposal
13. `ayni_knowledge_stats` — Knowledge summary
14. `ayni_glyph_info` — Deep glyph info

## SQLite Schema

Database: `packages/server/data/ayni.db`

Tables: `messages`, `knowledge_glyphs`, `knowledge_agents`, `sequences`, `proposals`, `compounds`

Auto-migrates existing JSON data from `data/knowledge.json` and `data/proposals.json` on first run.

## Next Steps

1. **Deploy to Hetzner** — systemd service and Caddy reverse proxy are ready
2. **Publish MCP to npm** — `cd packages/mcp && npm publish --access public`
3. **Multi-agent testing** — two Claude Code instances communicating via MCP
4. **OpenClaw integration** — configure external agents with Ayni MCP

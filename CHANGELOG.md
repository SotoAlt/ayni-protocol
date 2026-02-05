# Changelog

All notable changes to this project will be documented in this file.

## [0.3.0-alpha] - 2026-02-04

### Repository

- **Renamed `hackathon/` to `packages/`** — cleaner monorepo structure with preserved git history
- Added MIT LICENSE file
- Unified version numbers to `0.3.0-alpha` across all packages
- Fixed repository URL (SotoAlt/ayni-protocol)

### Server — Security Hardening

- **SQLite persistence** — replaced JSON file storage with `better-sqlite3` (WAL mode, prepared statements). Tables: `messages`, `knowledge_glyphs`, `knowledge_agents`, `sequences`, `proposals`, `compounds`. Existing JSON data auto-imported on first run.
- **Environment validation** (`src/env.ts`) — fail-fast in production if `ADMIN_TOKEN`, `ALLOWED_ORIGINS`, or a real `SERVER_PRIVATE_KEY` are missing.
- **Admin token middleware** (`src/middleware/admin.ts`) — Bearer auth required for destructive endpoints (`POST /knowledge/reset`, `POST /stream/broadcast`).
- **Rate limiting** (`@fastify/rate-limit`) — global 100 req/min; write endpoints (`/send`, `/attest`, `/knowledge/propose`, `/knowledge/endorse`) at 20 req/min; read endpoints (`/encode`, `/decode`) at 200 req/min.
- **CORS whitelist** — production reads from `ALLOWED_ORIGINS` env var; development allows all.
- **WebSocket hardening** — ping/pong heartbeat (30s), `MAX_CLIENTS = 100`, 4KB message size limit, auto-disconnect dead connections.
- **Relay timeout** — `relayToRecipient` uses `AbortController` with 10s timeout and validates URL scheme (http/https only).
- **Shared glyph vocabulary** (`src/glyphs.ts`) — 28 glyphs across 6 domains (foundation, crypto, agent, state, payment, general). Encode and decode routes upgraded from 4 to 28 glyphs.
- **Enhanced health check** — `/health` returns version, uptime, SQLite status, WebSocket client count, and knowledge stats.
- **Structured logging** — Fastify logger level from `NODE_ENV`, 1MB body limit.

### MCP Server

- Added retry logic to `callServer` (1 retry after 2s delay, 10s timeout via AbortController)
- Prepared `package.json` for npm publication as `@ayni-protocol/mcp` (license, repository, keywords, files, engines, publishConfig)
- Created README with installation and tool documentation
- Updated `.mcp.json` template to use `npx @ayni-protocol/mcp`

### Deployment

- Added `deploy/ayni-server.service` — systemd unit with security hardening (NoNewPrivileges, ProtectSystem, PrivateTmp)
- Added `deploy/deploy.sh` — SSH deploy script (git pull, build, restart, health check)

### Documentation

- Updated all docs to reflect `packages/` paths and production URLs
- Updated SKILL.md with npm package reference
- Updated OpenClaw integration guide
- Updated root and packages README files

## [0.2.0] - 2026-01-28

### Added

- Shared knowledge store with SQLite backing
- Glyph evolution: compound glyph proposals and endorsement workflow
- MCP knowledge tools (14 tools total)
- Domain-specific glyph vocabulary (crypto + agent workflows)
- WebSocket streaming for real-time E2E visualization
- E2E tests and OpenClaw integration guide

## [0.1.0] - 2026-01-20

### Added

- Initial Ayni Protocol implementation
- 4 foundation glyphs (Q01, R01, E01, A01)
- Encoder/Decoder with AES-256-GCM encryption
- Agent class for pair communication
- Glyph River frontend (cyberpunk visualization)
- PNG/SVG rendering
- 69 tests passing

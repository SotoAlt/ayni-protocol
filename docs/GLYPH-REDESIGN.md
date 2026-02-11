# Glyph Redesign Progress

Tracking the migration from old layered humanoid+symbol composites to new 16x16 tocapu-style NANO glyphs.

## Design Principles
- 16x16 binary pixel grid (cyan on black)
- Bilateral symmetry (Andean tocapu style)
- Must pass VLM recognition test (claude-sonnet-4-5 at 320x320px)
- Mix of humanoids, creatures, machines, and geometric shapes
- Each glyph needs a RADICALLY different silhouette

## Status Legend
- LOCKED — Passes VLM, design frozen, do not modify
- DONE — Redesigned, needs VLM validation
- TODO — Not yet redesigned (still using old layered approach)

## Batch 1: Foundation (12 glyphs)

| ID  | Meaning          | Type       | Status  | Notes |
|-----|------------------|------------|---------|-------|
| Q01 | Query Database   | Humanoid   | LOCKED  | V-arms + 3 bars head + stepped feet |
| Q02 | Search           | Geometric  | LOCKED  | Hollow circle/ring |
| Q03 | Query API        | Geometric  | LOCKED  | Upward arrow + shaft |
| R01 | Response Success | Humanoid   | LOCKED  | Arms akimbo + thick bar head |
| E01 | Error            | Geometric  | LOCKED  | Bold X/cross |
| A01 | Execute Action   | Geometric  | LOCKED  | Hollow diamond |
| R02 | Data Response    | Humanoid   | DONE    | Big ring/halo head (6 rows), no arms, narrow body |
| R03 | Task Complete    | Humanoid   | DONE    | 3px-wide straight-up arms at edges, small head |
| E02 | Timeout          | Creature   | DONE    | Bird/condor — 3-row thick wings, forked tail |
| E03 | Permission Denied| Geometric  | DONE    | Heraldic shield with cross, tapers to point |
| A02 | Delegate Task    | Machine    | DONE    | Tank robot — dual antennas, full-width body |
| A03 | Update Data      | Machine    | LOCKED  | Robot — antenna, square head, hollow window |

### VLM Results (Batch 1)
- Foundation 6 (Q01-A01): 6/6 pass consistently
- E03 + A03: Pass consistently
- R02, R03, E02, A02: Phase 2 redesign done, VLM test pending

## Batch 2: State + Payment (4 glyphs)

| ID  | Meaning          | Type | Status | Notes |
|-----|------------------|------|--------|-------|
| S01 | Processing       | —    | TODO   | |
| S02 | Idle             | —    | TODO   | |
| P01 | Payment Sent     | —    | TODO   | |
| P02 | Payment Confirmed| —    | TODO   | |

## Batch 3: Crypto (12 glyphs)

| ID  | Meaning          | Type | Status | Notes |
|-----|------------------|------|--------|-------|
| X01 | Token Swap       | —    | TODO   | |
| X02 | Stake            | —    | TODO   | |
| X03 | Unstake          | —    | TODO   | |
| X04 | Transfer         | —    | TODO   | |
| X05 | Approve          | —    | TODO   | |
| X06 | Harvest Rewards  | —    | TODO   | |
| X07 | Vote             | —    | TODO   | |
| X08 | Propose          | —    | TODO   | |
| X09 | Bridge           | —    | TODO   | |
| X10 | Limit Order      | —    | TODO   | |
| X11 | Stop Loss        | —    | TODO   | |
| X12 | Trade Executed   | —    | TODO   | |

## Batch 4: Agent Workflow (9 glyphs)

| ID  | Meaning          | Type | Status | Notes |
|-----|------------------|------|--------|-------|
| T01 | Assign Task      | —    | TODO   | |
| T02 | Task Complete    | —    | TODO   | |
| T03 | Task Failed      | —    | TODO   | |
| W01 | Start Workflow   | —    | TODO   | |
| W02 | Checkpoint       | —    | TODO   | |
| W03 | Pause            | —    | TODO   | |
| C01 | Notify           | —    | TODO   | |
| C02 | Broadcast        | —    | TODO   | |
| C03 | Acknowledge      | —    | TODO   | |

## Batch 5: Monitoring (3 glyphs)

| ID  | Meaning          | Type | Status | Notes |
|-----|------------------|------|--------|-------|
| M01 | Heartbeat        | —    | TODO   | |
| M02 | Log              | —    | TODO   | |
| M03 | Alert            | —    | TODO   | |

## Files to Keep in Sync
1. `frontend/js/glyphs.js` — NANO_GLYPHS (source of truth for frontend)
2. `glyph-reference.html` — NANO object (visual reference page)
3. `glyph-export.html` — NANO object (PNG sprite exporter)
4. `test-vlm-glyphs.mjs` — GLYPHS object + descriptions (VLM test)

## Total Progress: 12/40 redesigned (8 LOCKED + 4 DONE)

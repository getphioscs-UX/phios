# PHI OS Platform — v3.0 Architecture / Sprint 2

This repository targets the complete PHI OS Platform v3.0 architecture while implementing the platform one verified page at a time.

## Implemented now
- Platform design tokens and global landing interface
- Reality-first landing experience
- Reality / Knowledge / Platform Journey map
- session-only Runtime Entity initialization
- platform capability status endpoint
- initial D1 schema for users, Runtime Entities, entries, readings and reviews
- existing Reality Entry and Reconstruction prototype retained for the next migration sprint

## Cloudflare Pages settings
- Framework preset: None
- Build command: blank
- Build output directory: `.`
- Root directory: blank

## Environment variables
- `OPENAI_API_KEY` — secret
- `OPENAI_MODEL` — optional, defaults in backend

## Optional future bindings
- D1 binding: `DB`
- R2 binding: `REPORTS`
- KV binding: `SESSIONS`

## Test
- `/` — Landing Experience
- `/api/health` — current API health
- `/api/platform-status` — v3 foundation capability status

See `docs/V3_ARCHITECTURE.md`.


## Sprint 2 — Reality Entry Workspace

This sprint replaces the ordinary chat page with a two-column Runtime workspace: Conversation + Live Runtime Entry. It preserves the four-round boundary, revision mode, session-only consent, Runtime Entry Schema v1.0, and transfer to Reconstruction.

## Step 2.5.2C — Simplified Reality Reading

The Reality Reading customer view is now organised into four primary sections:

1. What we can currently see
2. What this may mean
3. What is still unclear or may be different
4. What needs clarification next

The PHI OS technical model, evidence trail, conscious runtime view, reading reliability information, limitations, and Reading Inspector remain available through collapsed disclosures. The Reading Contract, Rule Engine, provider routing, evidence classification, and Navigation readiness logic were not changed in this step.

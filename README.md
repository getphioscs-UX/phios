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

## Step 2.5.2D — Reading Evidence Boundary

Implemented a rule-owned Reading evidence boundary without changing the
Adaptive Entry or Reconstruction customer flow.

### Evidence permissions

- `observed_evidence` may support facts, Patterns, Runtime Regions,
  Configurations, and Navigation.
- `reported_experience` may support bounded interpretive structures, but never
  becomes a fact.
- `interpretation`, `professional_assessment`, `ai_interpretation`, and
  `unknown_reality` cannot establish a Pattern, Runtime Region, Configuration,
  or Navigation readiness.
- Unknown Reality remains visible and is excluded from inference.

### Pattern threshold

A Primary Pattern now requires at least:

- 2 Observed Evidence items;
- 1 Reported Experience item; and
- Grammar confidence of 0.55 or higher.

Below the threshold, the output is explicitly classified as
`possible_reading` rather than `primary_pattern`.

### Navigation boundary

Navigation requires all of the following:

- Pattern established;
- at least 2 Observed Evidence items;
- at least 1 Reported Experience item;
- explicit desired direction; and
- an established Runtime Region.

A numeric confidence score alone can no longer open Navigation.

### Added modules

- `functions/runtime/reading/reading-evidence-contract.js`
- `functions/runtime/reading/reading-evidence-boundary.js`
- `functions/runtime/reading/pattern-threshold.js`
- `functions/runtime/reading/navigation-readiness.js`
- `scripts/check-reading-evidence-boundary.mjs`

Run the complete validation suite with:

```bash
npm run check
```

## Step 2.5.2E — Reading De-duplication

Reading customer outputs now keep each item in one primary role:

- `unknownReality` contains unresolved facts or conditions only;
- `evidenceWatch` contains future observations that may change the Reading and
  excludes items already shown as Unknown Reality;
- `alternativeReading.evidenceNeeded` reuses only the de-duplicated Evidence
  Watch list;
- Reading reliability foundations and limitations no longer repeat Unknown
  Reality statements already visible in the customer uncertainty section;
- Evidence Trail remains available as a technical source audit and is not
  treated as a duplicate customer conclusion.

The Reading Contract remains backward compatible. No Entry, Reconstruction,
provider-routing, Pattern-threshold, or Navigation-boundary rule was relaxed.

Run the dedicated check with:

```bash
npm run check:reading-dedup
```

## Step 2.5.3A — Reading → Navigation Contract

Reading now emits a bounded `navigationHandoff` contract. The handoff carries readiness, blockers, current Reality, direction, constraints, evidence boundary, evidence watch, unknown Reality, and professional boundary. It intentionally keeps `availablePaths` and `recommendedPriority` empty and `selectedPath` null; path generation belongs to Step 2.5.3B and user selection belongs to Step 2.5.3D.

## Step 2.5.2F — Reading Customer Language & Progressive Disclosure

The customer Reading layer now enforces sentence ownership, separates user-reported material from PHI OS interpretation, pairs technical meaning with customer language, and summarizes long statements before optional expansion. Technical evidence classes and the Reading → Navigation handoff remain unchanged.


## Step 2.5.3B — Navigation Path Generation Rules

The Reading → Navigation handoff now generates two to four bounded path options only when Navigation readiness is established. Paths are ordered for presentation but never selected automatically. Unknown Reality remains visible but its content is excluded from inference; professional boundaries suppress reversible experiments and keep qualified review available. The path engine is deterministic and makes no Workers AI or OpenAI request.


## Step 2.5.3C — Navigation Customer View Simplification

Navigation now presents bounded paths as comparable customer cards. Each card keeps only purpose, suitable conditions, first step, and boundary visible; evidence, review, completion, and stop conditions move into optional details. Legacy priority and directive action-guidance blocks are removed from the customer view, while path ordering remains non-binding and user choice remains required.

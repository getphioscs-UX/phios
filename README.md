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

## Step 2.5.3D — Navigation State

Navigation now persists an explicit user-selected path in session state, restores it only when the Runtime Entity, Runtime Entry, and Navigation Input identity still match, allows the user to clear and change the choice, and exposes a Review readiness gate. Review cannot be prepared until a valid available path has been selected. Automatic selection remains prohibited.

## Step 2.5.3E — Professional Boundary Layer (Financial Domain v1)

Navigation can now attach a domain-neutral professional boundary contract to a professional-review path. Financial Domain v1 explains when qualified review may help, which existing summaries may be prepared voluntarily, what PHI OS cannot confirm, and which investment, tax, legal, accounting, or licensed-advice conclusions are excluded. It collects no complete sensitive financial data, enables no upload or intake, and requires explicit user boundary consent before Review readiness.

## Step 2.5.4A — Reality Review Contract

Review now begins from an explicitly selected and prepared Navigation path. The
contract snapshots the selected path, observation window, evidence watch,
completion and stop signals, inherited Unknown Reality, and any accepted
professional boundary. It creates empty customer-report, Runtime Drift, Review
Outcome, and Runtime Memory handoff fields without filling them by inference.

Review cannot re-run Reading, reinterpret historical evidence, overwrite the
Reading or Navigation result, automatically select an outcome, or convert a
customer report into established fact. Professional paths require accepted
boundary consent before the Navigation → Review handoff is valid.

## Step 2.5.4B — Runtime Memory Contract

A completed Review can now produce an append-only Runtime Memory record only
after the customer report is dated, the Review outcome is assessed, and the
next Runtime state has been explicitly chosen by the user. Runtime Memory keeps
customer-reported changes as `reported_experience`, stores verified or observed
evidence in separate evidence classes, preserves Unknown Reality as unresolved,
and snapshots the selected Navigation path and accepted professional boundary.

Memory links the previous and current Runtime but never creates or identifies a
next Runtime automatically. The Continuity handoff remains closed until a later
explicit user choice. Historical Entry, Reading, Navigation, and Review
contracts are never overwritten, and no sensitive professional data or
professional conclusion is inferred.


## Step 2.5.4C — Reality Continuity Contract

A completed Runtime Memory can now prepare a bounded Continuity transition only
after the user explicitly confirms the Review outcome. Continuity maps the seven
allowed outcomes to a continuation, Reading revision, Navigation reselection, new
Entry request, professional boundary, or remain-open route. It never creates a
next Runtime automatically, never assigns `nextRuntimeId`, and never overwrites
the source Entry, Reading, Navigation, Review, or Memory.

Returning to Reading creates a new revision rather than modifying the historical
Reading. Starting a new Entry only prepares the destination and still requires a
separate explicit Runtime creation action. Professional continuity preserves the
accepted boundary and continues to collect no sensitive data or infer conclusions.

## Step 2.5.4D — Runtime Workspace + Review Customer View

- Added a reusable Runtime Journey sidebar shared by Navigation and Review.
- Added `reality-review.html` with customer report, Unexpected Reality, next-state choice and Memory readiness.
- Review reports remain `reported_experience`; they do not overwrite Reading or become verified facts.
- Integrated About and Thesis into the native `phiOSLocale` i18n runtime.

## Step 2.5.4E — Runtime Workspace Completion

- Added a shared `phi-os.runtime-workspace-state.v1` state derived from existing Runtime contracts.
- Connected Entry, Reconstruction, Reading, Navigation, Review, Memory, and Continuity to one Journey sidebar.
- Locked unavailable stages instead of implying they are complete or directly accessible.
- Added the My Reality Memory and Continuity workspace.
- Continuity must match the Review outcome, requires user confirmation, and never creates or overwrites a Runtime automatically.

## Step 2.5.4F — Runtime Transition Engine

`assets/js/modules/runtime-transition-engine.js` executes only an explicitly confirmed Continuity choice. It creates an append-only execution record and never auto-selects a route, overwrites historical contracts, or automatically creates a new Runtime.

Supported execution behavior:

- continue observation → preserve the observation scope and return to Review
- continue selected path → preserve the selected path and return to Navigation
- return to Reading → create a new Reading revision request
- choose another path → archive the old selection and clear only the active selection
- start new Entry → archive the current Runtime and prepare an Entry continuity handoff
- professional review → return to the preserved professional boundary path
- remain open → remain in Runtime Memory

Workspace checker consolidation: `scripts/check-runtime-workspace.mjs` is the single canonical checker. The temporary `check-runtime-workspace-completion.mjs` checker was merged into it and removed.

## Step 2.5.4G — Runtime Revision & New Entry Initialization

- `return_to_reading` now initializes a new Reading revision from an append-only revision request.
- The prior Reading and downstream Navigation/Review/Memory/Continuity contracts are archived before active downstream state is reset.
- Unresolved Reality enters the revision only as `continuity_reference`; it is not inherited as fact.
- `start_new_entry` now initializes a new Runtime Entry from the continuity handoff with new Runtime and Entry IDs.
- The Runtime Entity can remain continuous across runtimes while the previous Runtime remains append-only in history.
- Neither flow auto-submits Entry content, auto-selects a conclusion, or overwrites historical contracts.

## Step 2.5.4H — Runtime Lineage & Timeline

PHI OS now builds a read-only Runtime Lineage from append-only Runtime history and the active Runtime. My Reality displays Entry, Reconstruction, Reading revisions, Navigation selections, Review, Memory, Continuity and Transition events as one connected timeline. The timeline is an index only: it does not overwrite historical contracts or promote reported experience into verified evidence.

Check with:

```bash
npm run check:runtime-lineage
```

## Step 2.5.4I — Runtime Persistence & Recovery

PHI OS now persists a versioned Runtime Snapshot through a storage adapter boundary. Active session contracts are captured into localStorage, validated with a checksum, and restored into sessionStorage after browser closure or restart when no active session exists.

Key module:

- `assets/js/modules/runtime-persistence.js`

Guardrails:

- unsupported schemas are not restored;
- checksum failures are rejected;
- restoration never creates a new Runtime automatically;
- historical contracts remain append-only;
- reported experience is not promoted to verified evidence.

Checks:

```bash
npm run check:runtime-persistence
```

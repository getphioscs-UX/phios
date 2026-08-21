# RJX Sections 12–15 Final Evidence Successor

Baseline: `167bce2a82734cf96207b78abb47cdcd8cf82522` (`hpc2-part E`)

## Scope

This successor implements the master-work Sections 12–15 without creating a second Runtime, Rule, Method, Provider, Reading, Navigation, Review, Versioning or Professional authority.

- Section 12 — five minimum vertical slices
- Section 13 — operational metric definitions
- Section 14 — final non-negotiable technical acceptance gate
- Section 15 — recommended first authorization scope reconciliation

Historical Package E artifacts remain byte-preserved. The existing `rjx-minimum-vertical-slices-v1.json`, `rjx-metrics-contract-v1.json`, W22 checker manifest, W23 production acceptance and W24 freeze are not rewritten.

## Section 12

`rjx-minimum-vertical-slices-v2.json` binds five validation-only fixtures to the existing contracts and registries:

1. Simple Personal Case — job-change question, minimal input, Known/Unknown, rule-only Reading, two bounded options, client-selected Action Record, Expected Signal vs Outcome, immutable predecessor Reality.
2. Complex Family Case — multiple people, source-bound relationships/events, conflicting perspectives, repeated events, shared constraints, scoped Unknown, Book-2 relational and Book-3 maintenance candidate scope, no AI-invented relationship.
3. Organization Case — roles, resource allocation, infrastructure constraint, multiple objectives, Book-4 system-scale context gate, no reduction of system constraint to personal identity, professional/business judgment boundary preserved.
4. Method-assisted Case — NUM production-eligible authority, explicit consent, CALCULATED→DERIVED compatibility, successor/diff on version change, no silent Reading mutation, HDR blocked.
5. No-provider Production validation — Workers AI unavailable + OpenAI unavailable while Entry → Understand → Reading → Choose → Action → Review → Reality Next remains complete through the rule engine.

These are validation fixtures, not production execution claims.

## Section 13

`rjx-metrics-contract-v2.json` preserves the exact Product, Rule, AI/Cost and Safety metric names requested by the master work, adds operational definitions and source categories, and deliberately leaves production values `null` until real telemetry exists.

All eight Safety metrics have target `0`.

## Section 14

`rjx-final-non-negotiable-acceptance-v1.json` proves the technical invariants that are currently evidence-backed, including:

- Reality Journey is not the default for all questions.
- 8 backend states and 3 client stages are preserved.
- `/reality/` remains the canonical workspace target.
- ICR, RMO, RDG, Reading, Navigation, Action, Outcome, Versioning, Diff, Method Runtime and Professional Judgment authorities remain upstream and read-only.
- 5 canonical Books, 931 canonical Nodes, 0 canonical mutation, 0 automatic rule activation and 0 active bindings.
- Knowledge != Reality Reading; Method Calculation != Observed Evidence; Method handoff requires consent; HDR remains validation-only; Unknown cannot be AI-filled.
- Initial Reading is rule-only; OpenAI default calls are 0; Workers AI is reservation/metering governed; model outputs remain candidates; no-provider Journey remains viable.
- 0 broken legacy routes, 0 forced page hopping, 0 duplicate active Runtime write authority, 0 silent overwrite and 0 broken Reality lineage.

Final production acceptance remains blocked because Human Review A–E, browser acceptance, canonical route activation, provider budget/ledger/runtime integration and a full canonical-checkout `npm run check` are still pending.

## Section 15

The recommended first authorization text is recorded as `REFERENCE_SCOPE_ONLY_NOT_NEW_HUMAN_AUTHORIZATION`. The current user message is not interpreted as a new Human Acceptance or permission to activate rules, redirects, HDR production or final freeze.

## Validation

Passed:

- `npm run check:rjx-package-f`
- `npm run check:rjx`

The main `check` body was also exercised with lifecycle scripts skipped because the supplied archive has no `.git` directory. It passes through M4A and stops at the pre-existing KSAR current-successor digest mismatch for `assets/js/pages/knowledge-search.js`:

- current baseline SHA-256: `a0b7d9f11310f135fd254df4c5fd5976eee95f0a092ff50e1dc7f1a2ccb44c3c`
- historical expected SHA-256: `a24dd31c87d401255f26260da8c98268a0ee6417898c012c1a092e222fdea671`

That KSAR drift exists in the supplied baseline and is not introduced by this RJX successor.

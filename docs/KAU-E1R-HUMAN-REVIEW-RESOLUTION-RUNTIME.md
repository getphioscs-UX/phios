# KAU-E1R｜Human Review Resolution Runtime / Batch

Baseline: `0fa157f12b93b0d4450c988c422ba3bce59975b9`

## Purpose

KAU-E1R turns the 185 KAU-E1 pending review records into six reviewable human batches. It does **not** accept Canonical relationships by itself.

## Batches

- Wave A — Legacy Parts 1–2 — Structure / Foundation — 21 reviews
- Wave B — Legacy Parts 3–4 — Conscious / Relational — 38 reviews
- Wave C — Legacy Parts 5–6 — Temporal / Recovery — 40 reviews
- Wave D — Legacy Parts 7–8 — Reading / Governance — 27 reviews
- Wave E — Legacy Parts 9–10 — Time / Capability — 28 reviews
- Wave F — Legacy Parts 11–12 — Civilization / Settlement — 31 reviews

Total: 185.

## Recommendation policy

Machine recommendations are decision support only:

- existing E1 supporting review → `SUPPORTS`
- existing E1 partial-overlap review → `PARTIAL_OVERLAP`
- partial overlap + terminology evolution → `TERMINOLOGY_PREDECESSOR`
- explicit current-ALR conflict flag → `SUPERSEDED_BY` review recommendation
- unresolved / low-title-similarity → `DEFER`

No recommendation is a human decision.

## Human decisions

Allowed decisions:

`SUPPORTS`, `HISTORICAL_PRECURSOR`, `TERMINOLOGY_PREDECESSOR`, `PARTIAL_OVERLAP`, `CONFLICTS_WITH`, `SUPERSEDED_BY`, `NO_CANONICAL_MATCH`, `DEFER`.

Every decision requires reviewer, timestamp and rationale.

## Safety

KAU-E1R cannot:

- create or rewrite Canonical Nodes
- mutate Meaning Authority
- promote Production Readiness
- send raw legacy content to KPP
- freeze KAU-E2 before explicit human resolution

## Commands

```bash
npm run check:kau-e1r
```

Optional explicit human-decision import:

```bash
node scripts/kau-e1r-apply-human-review-decisions.mjs \
  --input path/to/human-decisions.json \
  --output content/knowledge/authoring/extensions/legacy-supporting-source/review-resolution/resolved/legacy-human-review-resolution-v1.json
```

The import writes only a resolution artifact. It does not mutate Canonical Knowledge.

# PJA-W3R3｜Knowledge Production Orchestration

## Stage

`PJA-W3R3-v1.0.0-Frozen`

## Baseline

`getphioscs-UX/phios main@6f5b9a04f9cc2a7ef53f506c6fd67a713f0e781d` (`PJA-W3R2`).

## Purpose

W3R3 establishes one production-planning flow: Knowledge Production Queue → Wave Planning → Wave Readiness → Candidate Production → Editorial Progress → Production Progress → Publication Queue. It projects the actual state of node files so TL can decide what to do next without opening every folder.

W3R3 does not create or change Canonical Thesis, Boundary, Claims, Sources, Candidate Review, Human Approval, Production Export or Publication. It invokes no Provider and cannot publish a Wave.

## Planning authority and projections

`wave-registry.json` owns only Wave identity, membership, book, language, size and lifecycle. It is not a Canonical Registry. `wave-node-projection.json`, `generation-manifest.json`, Status and Dashboard are rebuildable projections from C3 readiness and existing W3A/W3R2 files. Candidate, Review, Approval, Export and Publication states remain owned by their original node records.

Allowed Wave states are `planned → active → editorial → ready_for_export → completed → archived`. `published` is prohibited. Completion requires every node to have an existing Production Export, but W3R3 never creates that Export.

## Commands

Mutating commands default to dry-run and require `--apply`.

```powershell
npm run knowledge:wave:create -- WAVE-001
npm run knowledge:wave:create -- WAVE-001 --apply

npm run knowledge:wave:add -- WAVE-001 KN-PREFACE-001
npm run knowledge:wave:add -- WAVE-001 KN-PREFACE-001 --apply

npm run knowledge:wave:remove -- WAVE-001 KN-PREFACE-001 --apply
npm run knowledge:wave:status -- WAVE-001
npm run knowledge:wave:generate -- WAVE-001 --apply
npm run knowledge:wave:dashboard -- WAVE-001
npm run knowledge:wave:complete -- WAVE-001 --apply
```

Create establishes an empty planned Wave. Add accepts only C3 `production_ready` nodes with matching Book and language, rejects duplicates across Waves, and applies the Wave limit. Generate creates or refreshes governed Prompts and the Generation Manifest but never creates Candidate text or calls a Provider. Complete remains blocked until all nodes are exported by the later W3C stage.

## Scale policy

Wave 1 supports at most 8 nodes, Wave 2 at most 12, and mature Waves at most 24. No Wave may contain all 78 Book I nodes. Canonical ordering and compatibility remain governed; membership cannot override C3 eligibility.

## Daily TL workflow

1. Run `knowledge:wave:dashboard`.
2. Run `knowledge:wave:generate` for missing governed Prompts.
3. Copy each Prompt to ChatGPT and save its Candidate.
4. Import the Candidate.
5. Compare it with Canonical Authority and the Working Draft.
6. Accept or reject it as TL.
7. Promote an accepted Candidate into the Working Draft.
8. Run editorial review.
9. Complete required Figures and Human Editorial Approval.
10. Let the later W3C stage create Production Export.
11. Complete the Wave only when every Export exists.

## Pilot state

`WAVE-001` contains only `KN-PREFACE-001`, the sole C3 production-ready node. Its governed Prompt is ready; Candidate, Candidate Review, Human Editorial Approval and Export are missing; its required Figure and existing style findings remain blocking. Dashboard therefore prioritizes Candidate production, Figure completion and human review. Export and Publication remain zero.

## Acceptance

Create, Add, Status, Generate, Dashboard, duplicate prevention, C3 eligibility, Book/language compatibility, Wave limits, completion guard, atomic apply and idempotency are checked. Temporary fixtures verify successful completion only after a pre-existing Export is projected. Real Canonical Authority, Draft, Export and Publication paths remain unchanged.

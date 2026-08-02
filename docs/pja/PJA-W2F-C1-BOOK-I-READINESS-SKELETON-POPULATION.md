# PJA-W2F-C1｜Book I Readiness Skeleton Population

## Baseline and purpose

- Repository: `getphioscs-UX/phios`
- Baseline: `main@4b06288a764462713453c9cc42cbba03747a84f7`
- Stage: `PJA-W2F-C1｜Book I Readiness Skeleton Population`

C1 establishes the Readiness Identity Layer between the C0 Canonical Registry
and the future C2 Canonical Thesis stage. It registers readiness existence,
state, blockers and missing dimensions. It does not establish content.

## Authority and topology

```text
Blueprint → Canonical Registry (C0) → Readiness Skeleton (C1)
          → Canonical Thesis and Boundary (C2)
          → Production Ready (C3) → Batch Production (D)
```

The C1 schema is universal across all Node Types and Parts. The 13 existing
Preface Editorial Production Readiness records remain untouched: they are
later-layer editorial evidence and are not used as substitutes for C1 identity.

## Universal schema and state machine

Every C1 record contains `schemaVersion`, `nodeCode`, `locale`,
`readinessStatus`, `productionStatus`, `review`, `blocking`, `missing`, and
status-only objects for `thesis`, `boundary`, `claims`, `sources`, `questions`,
`figures`, `export` and `audit`.

The frozen state sequence is:

```text
skeleton → canonical_thesis_ready → boundary_ready
         → editorial_ready → production_ready → published
```

`draft` and `completed` are forbidden aliases.

## Blocking contract

| Blocking code | Owner stage |
|---|---|
| `CANONICAL_THESIS_NOT_READY` | PJA-W2F-C2 |
| `BOUNDARY_NOT_READY` | PJA-W2F-C2 |
| `CLAIMS_NOT_READY` | PJA-W2F-C2 |
| `SOURCE_PLAN_NOT_READY` | PJA-W2F-C2 |
| `QUESTION_PLAN_NOT_READY` | PJA-W2F-C2 |
| `FIGURE_PLAN_NOT_READY` | PJA-W2F-C2 |
| `EDITORIAL_REVIEW_REQUIRED` | PJA-W2F-C3 |
| `HUMAN_FREEZE_REQUIRED` | PJA-W2F-C3 |

Every blocker has a stable code, human-readable message, owner stage and active
flag. All 78 Skeletons begin with the complete blocking set.

## Population, index and resolver

`knowledge:sync-readiness` defaults to dry-run. Only `--apply` may write. Apply
validates the exact 78-node Registry/Blueprint/localized identity set, stages a
complete deterministic directory, atomically swaps it into place and restores
the prior directory if the swap fails. Conflicts block all writes.

The canonical index contains exactly 78 unique entries and maps each Node Code
to its Readiness file, never to an Article. `resolveReadiness(root, nodeCode)`
returns `exists`, `status`, `productionStatus`, `blocking`, `missing` and the
Readiness file. Registered Nodes no longer return `READINESS_FILE_NOT_FOUND`.
Unknown Nodes continue to return `NODE_NOT_FOUND`.

## Acceptance result

- 78 Registry Nodes, 78 Readiness Skeletons and 78 Index entries.
- One universal schema; no Node Type or Part variants.
- All records are `skeleton / not_production_ready`.
- All exports are blocked and all human freeze flags are false.
- Default and explicit dry-run produce zero writes.
- First apply populates 78 records; second apply is byte-stable no-op.
- Missing-file fixture is detected and repairable; conflict fixture blocks
  apply without partial writes.
- Resolver acceptance covers all 13 Preface and 65 Book I Nodes.
- Downstream resolution is beyond `NODE_NOT_FOUND` and
  `READINESS_FILE_NOT_FOUND`; content gates remain valid.
- Canonical Registry, Blueprint, Editorial Readiness, Articles, approval,
  publication and Production export remain unchanged.

## Historical stage-name migration

The prior C1/C2/C3 commands represented an article pilot and batch-production
chain. They remain available under explicit `-historical` aliases. The canonical
`check:pja-w2f-c1` now belongs only to Readiness Skeleton Population and depends
directly on C0.

## Freeze

All C1-specific checks pass. The complete repository check reaches the
pre-existing `scripts/check-runtime-security-privacy.mjs` fixture mismatch:
Runtime throws `security_professional_consent_required`, while the fixture
expects another code. The same failure reproduces in an untouched
`main@4b06288` worktree. Runtime Security is outside C1 and remains unchanged,
so the final frozen label is deferred.

```text
PJA-W2F-C1-v1.0.0-Conditional-Passed
```

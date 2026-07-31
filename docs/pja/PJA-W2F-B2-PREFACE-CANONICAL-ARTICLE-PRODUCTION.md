# PJA-W2F-B2｜Governed Canonical Article Production

## Stage state

`Conditional Passed`

The universal Article Production infrastructure is implemented. No registered
Preface node currently satisfies both `production_ready` and
`humanEditorialFreeze = true`, so no repository Article Draft Package is
generated and the full Preface population is not frozen.

## Authority chain

1. Canonical Registry
2. Human-frozen Canonical Thesis
3. Production Readiness
4. W2E-R1 Production Brief
5. Governed Article Draft Package
6. Future human review
7. Future approval
8. Future publication

The Draft Package is downstream output. It cannot modify or replace Registry,
Blueprint, Canonical Thesis, Readiness, Claim Governance, Source Governance,
Learning Path, approval, or publication authority.

## Production eligibility

Article production requires all of the following:

- the Canonical Node is registered;
- the selected locale is production-ready;
- the Canonical Thesis is complete;
- Readiness validation returns `production_ready`;
- Human Editorial Freeze is true;
- the W2E-R1 Production Brief exports successfully;
- the Production Brief Contract is complete.

File presence, Blueprint planning, title presence, or Supporting Question
presence cannot establish eligibility.

## Current Preface matrix

| Node | Readiness | Human freeze | Article eligibility | Result |
|---|---|---:|---|---|
| KN-PREFACE-001 | ready_for_editorial_review | false | blocked | No package |
| KN-PREFACE-002 | production_blocked | false | blocked | No package |
| KN-PREFACE-003 | production_blocked | false | blocked | No package |
| KN-PREFACE-004 | production_blocked | false | blocked | No package |
| KN-PREFACE-005 | production_blocked | false | blocked | No package |
| KN-PREFACE-006 | production_blocked | false | blocked | No package |
| KN-PREFACE-007 | production_blocked | false | blocked | No package |
| KN-PREFACE-008 | production_blocked | false | blocked | No package |
| KN-PREFACE-009 | production_blocked | false | blocked | No package |
| KN-PREFACE-010 | production_blocked | false | blocked | No package |
| KN-PREFACE-011 | production_blocked | false | blocked | No package |
| KN-PREFACE-012 | production_blocked | false | blocked | No package |
| KN-PREFACE-013 | production_blocked | false | blocked | No package |

## Universal package contract

The generator consumes a validated W2E-R1 Production Brief. It does not scan
Blueprint content to infer article theory.

Every generated node/locale/version package contains:

- `article.md`
- `article.json`
- `claim-ledger.json`
- `source-ledger.json`
- `supporting-question-coverage.json`
- `media-brief.json`
- `package-manifest.json`

All generated objects bind to one Canonical Node and one locale. Stable Article,
Package, Claim, and Media Brief identifiers are derived from those inputs.

The initial state is fixed:

```text
articleState = draft
reviewState = not_reviewed
approvalState = not_approved
publicationState = not_publication_ready
packageStatus = draft
```

The generator cannot emit `approved`, `publication_ready`, or `published`.

## Figure sequence

The frozen sequence remains:

```text
Media Brief
→ Asset Registry
→ Article Figure
```

When a Figure is required but no Asset is registered, `media-brief.json` is
created with `assetState = not_created`, `assetCode = null`, and
`articleFigureState = deferred`. The Article contains no Figure reference.

## Version and overwrite rules

- a new Production Brief begins at Article version `1.0.0`;
- the same Brief does not create a duplicate version;
- deterministic rebuild requires `--force`;
- `--force` is allowed only while the Draft remains `not_reviewed`;
- an `in_review`, `changes_requested`, approved, publication-ready, or
  published Draft cannot be overwritten;
- a changed Production Brief hash creates the next patch version and preserves
  prior versions.

## Commands

```powershell
npm run knowledge:produce-article -- KN-PREFACE-001
npm run knowledge:produce-article -- --scope PREFACE
npm run knowledge:validate-article -- KN-PREFACE-001
npm run knowledge:validate-articles -- PREFACE
npm run check:pja-w2f-b2
```

Under the current authority state, the single-node commands return a governed
blocking result and the Preface batch reports zero produced packages.

## Validation coverage

The B2 checker uses isolated, non-authoritative fixtures to prove:

- a production-ready, human-frozen input can produce and validate a package;
- the same implementation works for a future Book III / Part 14 pattern;
- blocked, Blueprint-planned, missing, and locale-not-ready nodes are rejected;
- Production Brief omissions are rejected;
- Supporting Question treatment is preserved;
- Source References are deduplicated by `sourceCode`;
- Figure-required / Asset-missing behavior remains deferred;
- Manifest checksums and file sizes are computed from actual bytes;
- Production Brief hash changes invoke version rules;
- reviewed Drafts cannot be overwritten;
- Registry, Blueprint, Readiness, W2E-R1, W2F-A, and W2F-B1 inputs remain
  unchanged.

## Freeze boundary

`PJA-W2F-B2-v1.0.0-Frozen` is not signed as full Preface Article Population.
Infrastructure is complete, while eligible human-frozen content population
remains pending.


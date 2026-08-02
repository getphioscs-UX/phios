# PJA-W2F-C1｜Article Production Contract and Preface Pilot

## Baseline

- Repository: `getphioscs-UX/phios`
- Baseline: `main@10ba6971448f6335e6e31a62fbff13db2042d4cb`
- Pilot Node: `KN-PREFACE-001`
- Locale: `zh-Hans`

## Purpose

Consume the first human-frozen `production_ready` Canonical Node and create one governed Draft Package without granting review, approval, release, publication or Runtime authority.

## Draft Package

The pilot package is stored at:

`content/knowledge/production/articles/kn-preface-001/zh-Hans/1.0.0/`

It contains:

- `article.md`
- `article.json`
- `claim-ledger.json`
- `source-ledger.json`
- `supporting-question-coverage.json`
- `media-brief.json`
- `package-manifest.json`

## Frozen State Boundary

The package must remain:

- Article: `draft`
- Review: `not_reviewed`
- Approval: `not_approved`
- Publication: `not_publication_ready`
- Source verification: `not_verified`
- Figure asset: `not_created`

## Contract Alignment

C1 also closes the remaining migration boundary between the Universal Readiness Contract and legacy PJA validators. It preserves Legacy Readiness support while ensuring regenerated Production Briefs have a stable semantic hash rather than a timestamp-sensitive file hash.

## Prohibited Outcomes

C1 does not:

- create an English localization package;
- approve claims or sources;
- create or register a figure asset;
- write public Article Registry or Publication State;
- modify Canonical Registry, Blueprint or Human Freeze authority;
- invoke Provider, Runtime, Payment, Entitlement or D1;
- commit, push or deploy.

## Acceptance

Run:

```text
npm run check:pja-w2f-c1-article-pilot-historical
npm run knowledge:validate-article -- KN-PREFACE-001
npm run check
```

Successful completion establishes:

`PJA-W2F-C1-v1.0.0-Pilot-Ready-for-Human-Review`

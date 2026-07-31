# PJA-W2F-A Universal Production Readiness

Freeze achieved: `PJA-W2F-A1-v1.0.0-Frozen`.

## Authority and Current Audit

Canonical identity comes only from `content/knowledge/registry/nodes.json`.
Blueprints provide membership, hierarchy and planning, but do not create
Canonical identity. Localized Content provides locale identity. A Readiness
record governs production preparation and never becomes article body.

At baseline `780abc7a9bee59e99b31b4d87e9a4d15db76c0b0`:

- Registry contains 13 Canonical Nodes, all in Preface/P0.
- Book I Blueprint contains 78 planned nodes across P0–P5.
- The 65 P1–P5 Blueprint-only nodes are not registered and receive no
  production Readiness.
- Parts 6–14 are not registered and are not treated as errors.
- Two locales are registered; canonical Readiness is initialized for
  `zh-Hans`, while English remains independently not ready.
- The existing KN-PREFACE-001 readiness is preserved byte-for-byte and read
  through a legacy compatibility adapter.

## Universal Architecture

The Scope Resolver discovers Blueprint JSON files, Book codes, Part codes,
Registry Nodes and locale records dynamically. `BOOK-N` maps through discovered
Book codes; `PART-N` maps to discovered Part membership. Node-prefix scopes use
registered identifiers. No total Node count or current Part list is embedded in
the implementation.

The same Schema, initializer and validator support Preface, future Books,
future Parts and future registered Node patterns. Synthetic fixtures prove
P1–P5, Book transitions and a future Book 3/Part 14 pattern without creating
production identities.

## Readiness Contract

The strict universal record contains:

- Canonical identity and Registry/Blueprint hierarchy;
- structured Thesis and sequence continuity;
- article and Supporting Question boundaries;
- Claim, Source and Figure boundaries;
- public, paid, Runtime, professional, enterprise and developer boundaries;
- independent localization state;
- production state, version binding and human review.

The initializer writes deterministic fields only. Theory, Must Establish, Must
Not Claim, Part Thesis, Source decisions and public-boundary judgments remain
empty. New Skeletons are `production_blocked`, have explicit missing fields and
cannot be exported.

## Human Authority

Only a human-frozen record with no missing fields or blocking findings may use
`production_ready`. Schema validity, initialization, AI output and successful
builds never confer approval. `approved`, `publication_ready` and `published`
remain outside W2F.

## Supporting Questions

Each registered Supporting Question has exactly one primary Canonical Node
through the existing `canonicalNodeCode`. Readiness projects it as
`primaryNodeCode`; related nodes remain optional. Initialization uses `defer`
and does not decide final article treatment or upgrade a question to a Node.

## Continuity and Duplication

Sequence values are copied only from Registry relationships. Blueprint order is
audited separately, including Part and Book transitions when registered nodes
exist. Duplicate Thesis audit spans all loaded records. A duplicate frozen
Thesis, multi-assigned Supporting Question, wrong hierarchy, or incorrect
sequence blocks production readiness.

Part Thesis content that does not yet exist is reported as
`PART_THESIS_NOT_READY`; infrastructure remains operational.

## Commands

```powershell
npm run knowledge:init-readiness -- --scope ALL
npm run knowledge:init-readiness -- KN-PREFACE-002

npm run knowledge:validate-readiness -- --scope PREFACE
npm run knowledge:validate-readiness -- --scope BOOK-1
npm run knowledge:validate-readiness -- --scope PART-1
npm run knowledge:validate-readiness -- --scope ALL

npm run knowledge:export-brief -- --scope PREFACE
npm run check:pja-w2f-a
```

Existing files are preserved. A currently unregistered Part or Book reports
`NOT REGISTERED` and creates nothing. Batch export reports Exported, Skipped,
Blocked and Failed separately and exports only `production_ready` universal
records. The W2E single-node KN-PREFACE-001 export remains compatible while its
legacy readiness awaits the explicit W2F human freeze.

## Boundaries

W2F does not alter Registry, Blueprint, Learning Paths, Supporting Questions,
Article/Claim Schemas, Renderer, Runtime, Provider, Payment or public pages. It
does not write a Thesis, article, Source, Figure, approval or publication
record. Blueprint-planned nodes cannot acquire production identity through the
initializer.

---

## PJA-W2E-R1 Compatibility Gate

PJA-W2F-A now depends on `PJA-W2E-R1 Production Brief Contract Hardening`.
Universal Readiness records may enter W2E export only after the hardened Brief contract confirms:

- typed absence values use `null` or `[]`, never `not_defined`;
- Must Establish, Required Distinctions, and Must Not Claim remain separate;
- generated packages stay draft-only while future publication targets remain informational;
- available Source References are unique by `sourceCode`;
- Media Brief creation precedes Asset Registry approval and Article Figure references;
- Package Manifest fields, allowed statuses, required files, and SHA-256 checksum behavior are explicit;
- Supporting Question ownership remains authoritative through `canonicalNodeCode`;
- the same Brief contract applies to Preface, Books I–III, and Parts 1–14 without node-specific exporter branches.

# PJA-W2C｜Claim、Source 与 Editorial Review Governance

## 1. Status and baseline

This contract is implemented on:

```text
Repository: getphioscs-UX/phios
Branch: main
Baseline: 1f3a6e36d9bbd5466b6c42926505da45623db719
Prerequisite: PJA-W2B
```

PJA-W2C adds governance around PJA-W1, PJA-W2A and PJA-W2B. It does not
replace their Canonical Registry, Article JSON authority, Article v2 Block
allowlist, renderer, Runtime, Provider, Payment or Entitlement boundaries.

## 2. Current-state audit

| Area | Baseline state |
| --- | --- |
| Production Article body | Six JSON files under `content/knowledge/articles/`; no Markdown or independent HTML body |
| Article statuses | `contentStatus`: `draft`, `canonical_draft_created`, `content_editing`, `changes_required`, `content_reviewed`; `reviewStatus`: `not_reviewed`, `changes_required`, `conditionally_approved`, `approved`; `publicationStatus`: `not_published`, `published` |
| Localization | `zh-Hans` is canonical. English additionally requires approved terminology and semantic parity |
| Published projection | Node frozen + requested locale + localized record + Article Asset + Article JSON must all pass `content_reviewed / approved / published` |
| Asset gate | The matching Article Asset must have the same Node and locale and pass the same three-state gate |
| Article source references | `sourceReferences[]` contains `sourceCode`, public label and internal public path |
| Existing Source Registry | Twelve Book Blueprint source identities in the frozen PJA-W1 Registry; metadata is intentionally minimal |
| Existing Claim review | W2A readiness uses a governance-only, simplified Claim Review Record with five Claim types |
| Article v2 mapping hook | Structured Blocks optionally carry `sourceClaimCodes[]`; the public renderer does not display the codes |
| Existing Review Registry | None. Approval is currently recorded only by the W1 locale, asset and Article state triplets |
| Reviewer identity | No production reviewer identity object exists in the baseline |

The frozen Registry remains at 13 Canonical Nodes, six Themes, twelve Registry
JSON files and twelve Registry schemas. PJA-W2C does not mutate it.

## 3. Responsibility separation

Article, Claim, Source and Review are different authorities:

- **Article** owns public titles, summary, SEO, sections, Blocks, Knowledge
  Boundary and connections. Article JSON remains the only public body.
- **Claim** identifies a material assertion, its type, Article location,
  source-support mapping, qualification and Claim review state.
- **Source** owns stable source identity, bibliographic metadata, scope,
  quality assessment, review state and public-metadata policy.
- **Review** owns a version-bound audit, findings, required changes and human
  decisions. It contains no Article body.

A Source existing does not mean it supports a Claim. A supported Claim does
not approve an Article. An approved Article does not publish itself.

## 4. Claim governance

The W2C Claim Schema allows:

```text
externally_verifiable
phi_os_interpretation
editorial_inference
mixed
canonical_transition
boundary_statement
```

Materiality is `low`, `medium`, `high` or `critical`. High and critical active
Claims require human approval before publication. `mixed` records separate
factual and interpretive portions when it cannot be split. A
`phi_os_interpretation` must trace to an identified PHI OS canonical source and
must not be presented as scientific or social consensus.

Claim Codes use `CLM-<NODE-CODE>-<NNN>`, remain stable and are never reused.
AI may prepare a Claim up to `ready_for_review`; only a human can set
`approved` or `rejected`.

## 5. Source governance and support mapping

Source Codes are stable identities, never URLs. The Source Schema records
type, locator, scope, authority, reliability, currency, conflict of interest,
review and public-metadata status.

Each Claim-to-Source mapping states:

```text
sourceCode
supportType: direct | partial | contextual | contradictory | not_supportive
supportScope
supportLevel: strong | moderate | weak | none | not_assessed
locator
reviewStatus
```

`contradictory` and `not_supportive` never count toward a minimum source
requirement. Multiple weak sources do not become strong by quantity.
`reference_only` cannot support high or critical Claims. Deprecated sources
cannot support new Claims.

## 6. Contrary evidence

Claims can record `contrarySourceCodes` plus a structured conflict assessment.
The supported conflict types cover method, scope, definition, date,
interpretation and direct contradiction. High-quality contrary evidence may
not be removed merely because it conflicts with the Article thesis.
Unresolved material disputes must be qualified and returned to human review.

## 7. Editorial review

The required dimensions are:

1. Canonical
2. Factual
3. Source
4. Boundary
5. Language
6. Public Readability
7. Cross-node Duplication
8. Next-node Continuity
9. Visual
10. Localization Readiness

Statuses are `not_applicable`, `not_reviewed`, `in_review`,
`changes_required`, `conditionally_approved`, `approved` and `rejected`.
`not_applicable` must be explicit.

Findings have `minor`, `major` or `critical` severity. Open or merely
addressed major and critical findings block publication; they must be verified,
withdrawn by a human, or accepted as risk by a human.

## 8. Reviewer authority

Reviewer types are:

```text
human
ai_assistant
automated_validator
system
```

AI may identify Claims, propose sources, draft dossiers, flag gaps, prepare
findings and apply requested revisions. Automated validators may validate
structure and block illegal state combinations. Neither can approve or
publish. Human-only decisions require a stable reviewer ID and a real
timestamp.

Synthetic reviewer IDs and timestamps under `tests/fixtures/` exercise the
rules only. They have `productionAuthority: false` and must never be copied
into production governance records.

## 9. Lifecycle and version binding

```text
node_selected
→ thesis_frozen
→ claim_dossier_prepared
→ source_dossier_prepared
→ outline_approved
→ canonical_draft_created
→ claim_mapping_completed
→ fact_review
→ source_review
→ canonical_review
→ language_review
→ changes_required
→ revision_completed
→ content_reviewed
→ editorially_approved
→ publication_ready
→ published
```

Review binds at minimum to `articleVersion`, `claimSetVersion` and
`sourceSetVersion`. Content hashes are reserved in the Schema and may be added
when the production workflow calculates them. Reusing a filename never carries
approval forward.

## 10. Publication gate

For a new structured Article to be publication-ready:

- Article, locale and Asset must retain the W1 status gate.
- An Article Review record must exist and match Node, locale, Asset and version.
- Overall Decision and every required Review dimension must be approved or
  explicitly not applicable.
- Every active high or critical Claim must be approved.
- Required source mappings must be eligible and the sources human-reviewed.
- No unresolved major or critical Finding may remain.
- Claim and Source set versions must match the Review.
- `next_node` must match the Canonical Registry.
- Public source references may project only `public_citation_allowed` or
  `public_metadata_only` sources.
- English cannot precede approval of the canonical Chinese version.

PJA-W1's six already-published legacy Articles have no standalone W2C Review
records. They remain on the frozen W1 gate until an explicit human migration;
W2C does not fabricate retroactive reviewers or dates. The W2C validator
enforces the full gate on new structured-Article governance fixtures and future
records. Connecting a production governance record to public source projection
belongs to the renderer/publication work that follows.

## 11. Public projection, accessibility and localization

Public rendering may expose the published Article, public bibliographic
metadata, published Assets, related Nodes and Knowledge Boundary. It must not
expose Claim dossiers, Claim Codes, support assessments, contrary-evidence
notes, Findings, reviewer identities, private locators, accepted risk or paid
book content.

Source labels remain meaningful link text. Visual review must check alt text,
caption accuracy and locale dependencies. Localization begins only after the
Chinese canonical meaning and Claim set are stable; translated Claims and
Review bind to their own locale and Article version.

## 12. KN-PREFACE-001 and future extension

`KN-PREFACE-001` exists only as governance fixtures. No production Article,
English Article, Article shell, Registry Asset or published state is created.

Future versions may add controlled source import, content hashes and a public
bibliography projection. They must not add a second Article body, allow
automatic source approval, expose internal governance, or let schema validity
grant publication authority.

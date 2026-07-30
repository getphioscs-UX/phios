# PJA-W2A Canonical Article Editorial Contract

Contract: `PJA-W2A-v1.0.0-Canonical-Article-Editorial`

Baseline: `getphioscs-UX/phios` · `main@1c59299a64f7ddcd5dd2cbfe4ee56beff5f04d72`

Prerequisite: `PJA-W1-v1.1.0-Blueprint-led`

## 1. Baseline audit

PJA-W1 already provides the complete public publication chain. PJA-W2A extends that chain and does not replace it.

| Area | Baseline finding |
|---|---|
| Article content | Six Article JSON assets: three Chinese Canonical articles and three reviewed English localizations |
| Article fields | `title`, `displayQuestion`, `shortAnswer`, `summary`, `seo`, `keyConcepts`, `sections`, `knowledgeBoundary`, `sourceReferences`, `connections`, `masterMediaPost`, plus identity and publication metadata |
| Body structure | `sections[].heading` and `sections[].paragraphs[]` only |
| Renderer | Shared `assets/js/pages/article.js`; escapes text and renders headings, paragraphs, concepts, sources, boundaries, related articles and public exit routes |
| Publication Gate | Frozen Node + approved/published Locale + approved/published Article Asset + approved/published Article JSON |
| Localization Gate | English must be required by the Node, sourced from `zh-Hans`, terminology-approved, semantic-parity-approved and pass the complete Publication Gate |
| Article Shell | Static slug shell with an empty `<main data-article-slug>`; no article body exists in HTML |
| Missing professional components | Lead, question, insight, mechanism, timeline, comparison, registered figure, transition and next-node blocks |

The public loader remains a read-only projection. It does not grant review, approval or publication authority.

## 2. Single content authority

The public article body has one formal asset:

```text
content/knowledge/articles/<locale>/<slug>.json
```

For Canonical content, `<locale>` is `zh-Hans`. English may only be localized from a reviewed Chinese Canonical version.

The following are forbidden as competing article bodies:

- Markdown body for the same article
- Independent HTML body
- Frontend-hardcoded body
- Duplicate body in another CMS
- Body content embedded in the Renderer

Editorial Contracts, Claim Review Records, Source Review Records, Visual Asset Briefs and Production Readiness records are governance evidence. They cannot be loaded as public article body content.

## 3. Editorial Contract

Every important article must freeze these fields before a Canonical draft is treated as production-ready:

| Field | Contract |
|---|---|
| Article Identity | Must resolve to one frozen Canonical Node and its registered slug |
| Canonical Question | The question that defines the Node identity |
| Public Question | Reader-facing expression of the Canonical Question |
| Public Title | Semantically aligned title; cannot create a second identity |
| Search Title | Discoverable title without overstating or replacing the question |
| Central Thesis | One proposition the article will establish |
| Reader Transformation | General understanding gained; no personal outcome promise |
| Required Mechanisms | Causal or structural mechanisms the article must explain |
| Required Distinctions | Concepts that must not be collapsed |
| Prohibited Claims | Unsupported, deterministic, anthropomorphic, universal, professional and personal claims that cannot appear |
| Article Boundary | What the article cannot determine, diagnose, recommend or replace |
| Next Node Requirement | Registry-derived continuity, rendered only through published projection |
| Source Requirement | Evidence required by claim; no invented source code |
| Visual Requirement | Whether a governed visual materially improves understanding |
| Review Requirement | All required review domains and their states |
| Publication Requirement | The unchanged PJA-W1 Publication Gate |

Frozen authority rules:

- Canonical Node determines article identity.
- Chinese Article JSON is Canonical Content.
- English can only be localized from the reviewed Chinese version.
- AI has no approval or publication authority.
- Content completion is not review completion.
- Registry presence is not a production requirement.
- Blueprint presence cannot create Canonical identity.

## 4. Structured Article Block Model

`sections[].blocks[]` is optional. Legacy `sections[].paragraphs[]` remains valid and requires no migration.

| Block | Strict fields | Purpose |
|---|---|---|
| `paragraph` | `type`, `text` | Standard explanatory text |
| `lead` | `type`, `text` | Section-level framing |
| `question` | `type`, `question`, optional `answer` | Explicit public question |
| `insight` | `type`, `statement`, optional `heading` | Qualified key distinction |
| `mechanism` | `type`, `heading`, `steps[]` | Ordered causal or structural explanation |
| `timeline` | `type`, optional `heading`, `entries[]` | Time-ordered development |
| `comparison` | `type`, optional `heading`, `left`, `right` | Controlled two-sided distinction |
| `figure` | `type`, `assetCode` | Published visual resolved through Asset Registry |
| `transition` | `type`, `text` | Bridge between ideas |
| `next_node` | `type`, `nodeCode`, `label`, optional `description` | Published-only continuity link |

Every block rejects additional properties. `rawHtml`, scripts, styles, arbitrary embeds, external iframes, Runtime forms, case input, Provider invocation and personal recommendations are not content capabilities.

## 5. Claim Governance

Allowed Claim types:

- `externally_verifiable`
- `phi_os_interpretation`
- `editorial_inference`
- `canonical_transition`
- `boundary_statement`

Each Claim records `claimId`, `statement`, `claimType`, `sourceRequired`, `sourceCodes`, `qualification`, `articleSection`, `reviewStatus`, `reviewedBy` and `reviewedAt`.

Externally verifiable facts require sources. PHI OS interpretations must identify their theoretical nature. Editorial inference cannot masquerade as fact. A registered source does not by itself prove that it supports a Claim. AI cannot set Claim review status to `approved`.

## 6. Review and production lifecycle

Every important article requires Canonical, Factual, Source, Boundary, Language, Public Readability, Cross-node Duplication, Next-node Continuity, Visual and Localization Readiness review.

Allowed review results:

```text
not_reviewed
changes_required
conditionally_approved
approved
```

Ordered lifecycle:

```text
node_selected
thesis_frozen
claims_prepared
outline_approved
canonical_draft_created
content_editing
fact_review
canonical_review
changes_required
content_reviewed
approved
published
```

AI may prepare work through `canonical_draft_created`, or apply explicitly requested revisions. AI cannot self-assign `approved` or `published`.

## 7. Visual boundary

| Visual | Format |
|---|---|
| Hero Illustration | WebP or AVIF |
| Mechanism Diagram | SVG |
| Timeline Diagram | SVG |
| Decorative Image | WebP |

Article prose cannot be converted into an image. Article JSON may refer to a visual only by `assetCode`; the Renderer resolves that code through an approved, published Asset Registry record. Base64 images and arbitrary external image URLs are prohibited.

## 8. KN-PREFACE-001 readiness decision

`KN-PREFACE-001` retains:

```text
slug: ai-formation-from-civilizational-capability
canonicalLanguage: zh-Hans
nextNode: KN-PREFACE-002
```

The readiness record freezes the thesis, reader transformation, mechanisms, distinctions, prohibited claims, Claim Dossier skeleton, source needs, editorial outline, visual brief and next-node continuity. Its lifecycle state is `claims_prepared`; the outline is prepared but not approved.

No Chinese Article JSON, English localization asset, Asset Registry entry or HTML shell is created. Chinese remains `not_started / not_reviewed / not_published`. English remains `localization_pending / not_reviewed / not_published`.

## 9. Acceptance

```text
npm run check:pja-w2a
```

This first runs PJA-W1 acceptance, then verifies the Editorial Contract, strict Block Model, Claim Governance, review lifecycle, Renderer compatibility, unchanged Registry counts, KN-PREFACE-001 non-publication state and the absence of Runtime, Provider, Payment, Entitlement or D1 dependencies.

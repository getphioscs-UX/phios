# PJA-W2B｜Structured Article Block Schema

## 1. Status and baseline

| Item | Frozen value |
| --- | --- |
| Repository | `getphioscs-UX/phios` |
| Branch | `main` |
| Baseline commit | `b98f47ed28a0eb134894dbdd0a40ed198a184c13` |
| Prerequisite | PJA-W2A Canonical Article Editorial Contract |
| Article schema ID | `https://getphios.com/schemas/knowledge/article-v2.schema.json` |
| Schema version | `PHI-OS-KNOWLEDGE-ARTICLE-v2.0.0` |

PJA-W2B defines structure only. Schema validity does not establish factual
accuracy, Canonical approval, editorial approval, publication authority or
source sufficiency.

## 2. Baseline audit

The audit was performed against the baseline commit, not against a generic CMS
model.

- Production article bodies exist only as six JSON files under
  `content/knowledge/articles/{locale}/`.
- Current Article JSON uses `title`, `displayQuestion`, `shortAnswer`,
  `summary`, `seo`, `keyConcepts`, `sections`, `knowledgeBoundary`,
  `sourceReferences`, `connections` and `masterMediaPost`.
- All six production articles use Legacy Sections:
  `sections[].heading + sections[].paragraphs[]`.
- `published-content.js` loads Node, Localization and Asset registries first,
  then fetches an Article JSON only after the Node, locale and article Asset
  satisfy the published gate.
- The publication gate remains:
  `contentStatus=content_reviewed`, `reviewStatus=approved`,
  `publicationStatus=published`.
- English also requires approved terminology review and approved semantic
  parity.
- Article HTML files are empty static shells. The slug is supplied through
  `main[data-article-slug]`; no article body exists in the Shell.
- Visual assets are resolved by `assetCode` from the published Asset Registry
  projection. No arbitrary image URL is accepted.
- The baseline Renderer escapes text through `escapeHtml`; there was no shared
  URL validator and no runtime JSON Schema validation.
- PJA-W2A introduced ten optional Block concepts, but its Editorial Schema did
  not yet provide Section/Block identity, Article v2 versioning, source-claim
  interfaces, strict size limits or cross-record semantic validation.

## 3. Scope

PJA-W2B establishes:

- a strict Article v2 JSON Schema;
- Legacy and Structured Section alternatives;
- ten allowlisted Block types;
- deterministic Section and Block codes;
- structured Key Concepts, Knowledge Boundaries and Connections;
- a safe Renderer adapter;
- schema and semantic fixtures;
- ChatGPT authoring and migration contracts.

PJA-W2B does not write `KN-PREFACE-001`, conduct factual or source review,
approve or publish content, create English content, generate a final visual,
connect an AI API, modify Cloudflare deployment, or write to GitHub.

## 4. Single content authority

The public article body has one authority:

```text
Article JSON
```

Markdown articles, HTML bodies, Renderer-embedded prose, Blueprint copies,
Claim Dossier copies and external CMS copies are prohibited. Editorial
contracts, Claim/Source dossiers, Review records, Media briefs and Production
briefs are governance records only; they cannot compete with Article JSON.

## 5. Article v2 top-level structure

Article v2 preserves the PJA-W1 field names. It adds `schemaVersion` and a
small set of controlled metadata rather than renaming the established fields.

Required v2 additions:

- `schemaVersion`
- `canonicalQuestion`
- `searchTitle`
- `readerTransformation`
- `readingTimeMinutes`
- `taxonomy`
- `hero`

Status remains flat and compatible:

```json
{
  "contentStatus": "draft",
  "reviewStatus": "not_reviewed",
  "publicationStatus": "not_published"
}
```

`schemaVersion` identifies the structural contract. `version` identifies the
content revision. A structurally valid Article may remain draft and
unreviewed.

All object schemas use `additionalProperties: false`. Strings and arrays have
explicit limits. Public body text rejects HTML delimiters, direct web URLs,
data URIs, JavaScript URIs, Markdown image syntax and Markdown headings.

## 6. Section Schema

Every new article uses Structured Sections:

```json
{
  "sectionCode": "S01",
  "heading": "Public heading",
  "purpose": "introduce_question",
  "blocks": []
}
```

| Field | Rule |
| --- | --- |
| `sectionCode` | Required; `S01`, `S02`…; unique and sequential |
| `heading` | Required pure text; maximum 240 characters |
| `purpose` | Required controlled identifier matching `^[a-z][a-z0-9_]*$` |
| `blocks` | Required; 1–24 Blocks |
| `ariaLabel` | Optional localized text |
| `anchor` | Optional lowercase slug |
| `editorialNoteCode` | Optional governance reference; never rendered as body |

A Section is either Legacy or Structured. `paragraphs` and `blocks` cannot be
mixed.

## 7. Structured Block Schema

Every Block requires a sequential `blockCode` such as `S01-B01` and an
allowlisted `type`. Optional common fields are `visibility`, `label`,
`ariaLabel` and `sourceClaimCodes`. `editorial_only` Blocks are not projected
by the Public Renderer and cannot carry the article's unique public meaning.

| Type | Required content fields | Controlled optional fields |
| --- | --- | --- |
| `paragraph` | `text` | common fields |
| `lead` | `text` | common fields |
| `question` | `text` | common fields |
| `insight` | `text` | `title`, common fields |
| `mechanism` | `title`, `steps` | `intro`, `conclusion`, `orientation`, common fields |
| `timeline` | `items`, `timelineMode` | `title`, common fields |
| `comparison` | `columns` | `title`, common fields |
| `figure` | `assetCode`, `altText`, `displayMode` | `caption`, `creditLabel`, common fields |
| `transition` | `text` | common fields |
| `next_node` | `nodeCode`, `label`, `title`, `description` | common fields |

### 7.1 Paragraph, lead, question and insight

These Blocks contain localized pure text. A `question` is static prose, not an
input or button. An `insight` cannot replace the explanatory body. Paragraph
length is bounded and long content must be split.

### 7.2 Mechanism

`steps` contains 2–8 strict `{label, description?}` objects. `orientation` is
only `vertical` or `horizontal`. It expresses a reading relationship; it does
not execute a workflow.

### 7.3 Timeline

`timelineMode` is `conceptual` or `chronological`. A chronological item must
include `dateLabel`; factual support remains a W2C review concern. Timeline
items are semantic list items and cannot depend on color or a visual line.

### 7.4 Comparison

`columns` contains 2–3 strict columns. Each column has a heading and 2–8 short
items. The Public Renderer preserves DOM reading order so mobile and assistive
technology can read columns linearly.

### 7.5 Figure

A Figure contains no URL or file path. `assetCode` must resolve to the current
Canonical Node's controlled Asset. `altText` is required and locale-specific.
A published Article cannot project an unpublished Asset. The image cannot carry
the only expression of article meaning.

### 7.6 Next node

An Article has at most one `next_node`; it is the last public Block.
`nodeCode` must:

- exist in the Canonical Node Registry;
- match `connections.nextNode`;
- match the Registry relationship;
- not be a Supporting Question, payment, service or Reality Entry.

## 8. Prohibited structures

Article v2 rejects unknown properties and types, including:

```text
raw_html, html, script, style, iframe, embed, video_embed, audio_embed,
form, input, textarea, button_action, provider_action, runtime_action,
payment_action, checkout, professional_recommendation,
personalized_advice, dynamic_query, api_response, chat, quiz, survey,
accordion_with_runtime_state, table_with_executable_formula
```

Inline HTML is not an inline-mark system. PJA-W2B v2.0 supports pure text only.
Any future emphasis, term reference, internal Node link or source marker
requires a versioned Schema extension.

## 9. Key Concepts and Knowledge Boundary

Legacy string arrays remain valid for PJA-W1 articles.

New Article v2 Key Concepts use strict objects:

```json
{
  "conceptCode": "KC-CIVILIZATIONAL-CAPABILITY",
  "label": "文明能力",
  "definition": "A concise local definition.",
  "termReference": null
}
```

New Knowledge Boundaries use:

```json
{
  "type": "scope_limit",
  "text": "A precise scope boundary."
}
```

Allowed Boundary types are `scope_limit`, `non_claim`, `interpretive_limit`,
`application_limit`, `safety_limit` and `next_node_boundary`.

## 10. Connections

Article v2 adds `previousNode`, `nextNode` and `relatedNodes` while retaining
the existing public connection arrays. Every Node Code is checked against the
Canonical Registry; Article JSON cannot create identity. New Structured
Articles cannot create service or Journey actions through connections.

## 11. Source-claim interface

A Block may contain only internal Claim codes:

```json
{
  "sourceClaimCodes": [
    "CLM-KN-PREFACE-001-001"
  ]
}
```

It cannot contain a source object or URL. A Claim code does not mean the Claim
is supported or approved. Claim, Source and Editorial Review governance belongs
to PJA-W2C.

## 12. Legacy Compatibility

- Existing six Article JSON files remain unchanged.
- Legacy Sections remain `heading + paragraphs[]`.
- Article v2 uses `sectionCode + heading + purpose + blocks[]`.
- A Section cannot contain both `paragraphs` and `blocks`.
- The Public Renderer adapter rejects mixed or unknown structures.
- Legacy articles require no immediate migration.

## 13. Renderer Contract

`assets/js/knowledge/article-blocks.js` is the stable adapter between Article
JSON and `assets/js/pages/article.js`.

It:

- allowlists the ten Block types;
- rejects unknown Blocks;
- removes `editorial_only` Blocks from public projection;
- rejects mixed Legacy/Structured Sections;
- normalizes the PJA-W2A compatibility field names;
- allowlists orientation and display-mode values;
- never executes content or mutates state.

The Public Renderer escapes all localized text, resolves Figure sources through
the published Asset Registry projection and resolves `next_node` through the
published Article projection. It has no Runtime, Provider, Payment,
Entitlement, Professional or API dependency.

## 14. Accessibility

- Section headings remain semantic `h2` elements.
- Paragraphs remain semantic `p` elements.
- Mechanisms and timelines use ordered lists.
- Comparisons preserve a linear DOM order on mobile.
- Questions are prose, not controls.
- Figures require localized `altText`; captions remain text.
- Insights include text and are not distinguished by color alone.
- `next_node` has a clear link label and only becomes interactive when its
  target is published.
- Non-interactive Blocks do not enter keyboard focus order.

## 15. Localization

- `zh-Hans` remains Canonical.
- Every locale has a separate Article JSON.
- Localizations share `nodeCode` and may align Section/Block codes.
- English cannot publish before the reviewed Chinese source and required
  terminology/semantic-parity gates.
- Shared Renderer code contains no article-language text.
- Figure `altText` and `caption` are locale-specific.
- Localized text embedded in an image requires a locale-specific Asset Code.

## 16. Validation

`npm run check:pja-w2b` performs:

1. PJA-W1 and PJA-W2A regression checks.
2. Draft 2020-12 JSON Schema validation using lightweight development-only
   `ajv`.
3. Cross-record semantic validation for Section/Block sequencing, Canonical
   Node identity, Registry slug, taxonomy, Source code, Figure Asset and
   next-node continuity.
4. Valid and invalid fixture checks.
5. Renderer, authority and cross-system boundary checks.
6. `KN-PREFACE-001` non-publication checks.

Invalid fixture files are deterministic mutations of valid synthetic fixtures.
This avoids copying a second article body merely to express one invalid field.
Test-only Asset codes are accepted only inside the fixture validator and never
enter a production Registry.

## 17. Future Extension Policy

Future types such as `quote`, `definition`, `case_example`, `data_point`,
`reference_note`, audio or video require:

- a new versioned Schema;
- explicit Renderer support;
- accessibility and localization rules;
- new positive and negative fixtures;
- confirmation that no Runtime, Provider or action boundary is crossed;
- human editorial approval before any publication state changes.

Unknown v2.0 structures remain rejected by default.

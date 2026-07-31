# Canonical Manuscript Binding v1.0.0

## Frozen responsibility

Canonical Manuscript Binding connects a registered Canonical Knowledge Node to an exact range in its authoritative manuscript. It does not become a new content authority, source registry, meaning registry, or publication authority.

```text
Canonical Manuscript
        ↓
Canonical Manuscript Binding
        ↓
Canonical Node + Production Brief
        ↓
Draft / Revision
        ↓
Human Review
```

## Universal scope

The same schema supports Preface and every Book/Part node family. New nodes add a binding JSON and an index entry; they do not require new code, a new schema, or a Part-specific validator.

## Stable identity

Bindings use `bookCode`, `partCode`, `manuscriptCode`, `editionCode`, and text anchors. Page numbers and display file names are non-authoritative because layout and packaging can change.

## Authority order

```text
canonical_manuscript
canonical_thesis
production_brief
article_draft
```

Revision may change only the article draft and its governed ledgers/review records. It may not silently alter the manuscript, node, thesis, production brief, or registry.

## Required lifecycle

A binding may be `draft`, `range_review_required`, `bound`, or `superseded`. Only `bound` may be used as the canonical basis of a revision. A bound manuscript does not grant article approval or publication authority.

## Adding another node

1. Create `content/books/book-N/bindings/<node>.binding.json`.
2. Use the shared schema at `content/books/schemas/canonical-manuscript-binding.schema.json`.
3. Add one entry to `content/books/manuscript-bindings/index.json`.
4. Run `npm run knowledge:validate-bindings`.
5. Proceed to draft/revision only when the binding status is `bound`.

## Freeze

```text
Canonical-Manuscript-Binding-v1.0.0-Frozen
```

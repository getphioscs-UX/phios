# KH-W3.5H｜Universal Knowledge Blueprint Schema v2

## Status

Foundation Ready

## Boundary

This step introduces a universal, book-independent Blueprint schema and normalized loader. It does not rewrite KH-W3.5G historical freeze evidence, generate Book II or Book III Nodes, populate Readiness, create Articles, or change publication state.

## Canonical flow

```text
Book-specific Blueprint
↓
Universal Blueprint Schema v2
↓
Normalized Blueprint Loader
↓
Registry / Readiness / Production consumers
```

## Cardinality rule

Canonical counts are derived from source arrays. Book, Part, Node, registered, planned and production-required totals must not be maintained as independent hardcoded truth.

Legacy total fields may remain for compatibility only when they reconcile with derived values.

## Compatibility

`BOOK-I` and `BOOK-1` normalize to `BOOK-1`. Historical KH-W3.5G evidence remains readable through `canonicalNodePlan`; current Book Blueprint files remain readable through `parts` and `nodes`.

## Acceptance

```bash
node scripts/check-kh-w3-5h-universal-knowledge-blueprint-v2.mjs
npm run check:pja-w2f-b2
npm run check
```

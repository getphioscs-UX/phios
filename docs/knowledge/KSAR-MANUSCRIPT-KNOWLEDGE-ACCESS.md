# KSAR｜Knowledge Source Access Runtime

KSAR removes **Article publication** as the only client-facing knowledge path without weakening Canonical or Publication authority.

## Runtime chain

```text
Published Canonical Article ───────────────┐
                                           ├─ Knowledge Access API → Client query
Completed Manuscript → Materialized Corpus ┘
                              │
                              └─ KAU-R2 accepted mapping → optional Canonical binding
```

A manuscript section is valid source evidence because it belongs to a completed manuscript. It does **not** become a Canonical Node merely because it can answer a question.

Until KAU-R2 accepts a mapping, the API returns `canonicalBinding.status = PENDING` and no `nodeCode`. This is the explicit anti-mismatch rule.

## Client exposure

The API returns question-scoped excerpts only. It does not return full manuscripts or raw section bodies, and Knowledge access never grants PDF download entitlement. Book purchase remains the complete reading/product experience.

## Production storage

Full manuscript-derived retrieval corpora are read server-side from the private R2 binding `MANUSCRIPTS` (`phios-private-manuscripts`). Public Git stores only source identity, hashes, page ranges and access contracts.

Required R2 objects:

```text
books/book-1/materialized/v2/retrieval-corpus.json
books/book-2/materialized/v1/retrieval-corpus.json
```

## API

```text
GET /api/knowledge-access?q=<question>&locale=zh-Hans&mode=auto&source=hybrid
```

`source=hybrid` prefers/retains published Canonical knowledge while supplementing with completed-manuscript knowledge where useful.

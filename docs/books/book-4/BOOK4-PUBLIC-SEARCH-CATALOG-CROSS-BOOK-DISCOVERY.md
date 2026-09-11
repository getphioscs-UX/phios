# Book IV Public Search / Knowledge Catalog / Cross-Book Discovery Successor

Baseline: `1e1d0363c4170fa751c93ac4d8111e76bbae95b8`.

This successor activates Book IV inside the public Knowledge discovery layer after bilingual Article publication. It does not reopen Article production and does not mutate the historical public catalog, Step 64 retrieval index, A3 Article map, A6 Production Admission, Book III publication freeze, or Book IV publication authority.

The successor publishes a deterministic customer-safe search index over the same article population used by the public Article runtime: base approved registry Articles, the existing visual release, ABL bilingual release, and the Book IV publication successor. The current build contains 320 locale-specific published Article records across Books I–IV. Book IV contributes 106 locale projections, 53 shared routes, and coverage of all 125 final Canonical Nodes.

The Knowledge Catalog retains the seven-volume architecture while distinguishing publication availability from architecture existence. Books I–IV currently have published knowledge. Books V–VII remain visible as canonical volumes without being falsely marked as published Article corpora.

Cross-book discovery is deliberately weaker than Canonical Knowledge relationships. Links are generated only from already-public fields such as titles, summaries, explicit key concepts and taxonomy tags. They are labelled `DISCOVERY_HEURISTIC_NOT_CANONICAL_RELATIONSHIP`; they may help a customer move between volumes but must never be promoted into Canonical Node relationships or evidence claims.

The customer `/search/` surface now searches the successor index rather than only title/summary metadata assembled in-browser. Search remains retrieval, not a generated answer. Results keep source book and part visible, and Article results may display up to three bounded cross-volume discovery links. `/books/` also reads publication counts from the successor catalog without changing the seven-volume ownership registry.

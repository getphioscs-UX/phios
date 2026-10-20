# Gate 2B · Existing knowledge audit
Status: VERIFIED local source inspection; production behavior RUNTIME_UNVERIFIED. Gate 1 acceptance unchanged.

| Capability | Result | Evidence / limitation |
|---|---|---|
| World catalogue | VERIFIED | assets/js/pages/civilization-atlas/world-experience-r2.js doSearch/sourceReadings: catalogue title/summary matching, not full-body paragraph search |
| Full published body | VERIFIED | world-published-reading.js fetches locale JSON, checks SHA, published/approved status, renders sections. Private manuscript is not embedded or authorized by this projection. |
| Search discovery | PARTIAL | assets/js/knowledge/public-discovery.js combines book4 discovery index, Book V/VI metadata and Atlas records; surfaces/knowledge.js searches searchText or title/summary/tags. The Book IV public-search-index searchText actually contains section headings and body text (verified on stored records), so discovery is not merely a title catalogue there. However results are article records, not ranked paragraph hits; full-body coverage across all eight books is not established. |
| Passage retrieval | VERIFIED | functions/contextual-ask/contextual-ask-runtime.js resolveSelectedArticle reads release manifests, admission receipts for candidates, locale, published/approved article and text sections. Six real source/locale resolutions PASS in ASK-SOURCE-RESOLUTION.json. |
| Locator | PARTIAL | Has section codes, sourcePositions and source PDF section/page metadata where recorded. Public article-body often shared by multiple paragraphs. Gate2B records exact JSON pointer plus document SHA; no invented paragraph anchors or physical PDF page claims. |
| Metadata | PARTIAL | Article publicHref, locale, version, publishedAt, taxonomy and provenance retained in REAL-SOURCE-MAPPING.json. publicSources can be empty; publication time is not observation time. Original external URLs absent in a source remain absent. |
| Ask handoff | PARTIAL | customer-contextual-ask.js validates selected article/sourceVersion and calls existing orchestrator; deterministic source retrieval explicitly reports providerCalls 0. World reader sends ARTICLE/BOOK ref through world-reading-context.js, not an automatically verified cross-source answer or full place/year/question bundle. |
| Figures / Atlas | PARTIAL | Sources retain relatedFigures and relatedAtlasEntries; oil article points to FIG_13E and Book VI cases/snapshots. Existing approved bindings remain authoritative. No new acceptance, current-data inference or remote decode proof from registry presence. |
| All books | PARTIAL | Eight-volume projection exists; public article manifest coverage is uneven. Published projections are usable; full private manuscripts, restricted materials and unpublished successors are not automatically admissible. |

Articles remains the canonical publishing and reading owner. World selects relevant passages from one or many articles, combines bounded explanations, and links back to canonical articles; it does not copy the publication corpus or require a new article for each question.

No product source edited. No existing accepted receipt rewritten. Source snippets in design are repository-owned public text, not new article publication.

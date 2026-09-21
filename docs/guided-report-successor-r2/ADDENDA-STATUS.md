# R2 Addenda A / B / C — BaZi section publication

Baseline: `34beaa969d088dcea832b1aca8781188638c5189`. Implementation candidate: 2026-09-21. Production default remains unchanged.

[Open the new chapter-based review](addendum-b/review.html) · [Asset matrix](addendum-b/assets.html) · [Previous 26-page candidate](review.html)

## Source reconciliation

- [Addendum A](addendum-a.md) was retrieved in full from the user's ChatGPT conversation **Review页面验收**, message `f203feed-40ef-460c-b75c-29e7ce39e698`. Its attached reference image was visually inspected. The reference supplies layout direction, not factual authority for its sample health, wealth or marriage claims.
- [Addendum B](addendum-b.md) supplies the ten-section registry, seven page families, section composition and variable pagination.
- [Addendum C](addendum-c.md) supplies the 13-asset contract, visual layer separation, placement rotation, intensity limits and fallback order.
- B's example total of 33 is an arithmetic error: six frozen pages plus ten three-page sections equals **36**. The implementation calculates the total and does not hardcode 33 or 36.
- P02 and P03 in the actual approved assets are method introduction and origin pages, not personal information and contents pages. Their real bindings and pixels are retained, as requested. The review navigation provides chapter links without rewriting those assets.
- The user's existing option-1 decision remains applicable: P02–P05 keep baked folios; P06 and later pages use a single dynamic NN / TOTAL component. P06's layout and content remain frozen; only its total changes.

## Implemented behavior

The new path extends the current projection, writer, presentation owner and renderer. It does not replace the native calculation engine, cache or PDF export mechanism.

1. Ten complete sections, each beginning with a bilingual-title opener and a runtime-generated section number.
2. Seven rendered families: opener, structured analysis, narrative analysis, insight list, timing, method appendix and summary.
3. Configuration-driven data module selection. Section composition objects contain introduction, themes, page blocks, boundaries and observations before page expansion. Provider requests receive the whole section context; page numbers are assigned afterward.
4. Semantic-block pagination with family budgets. An overlong indivisible block fails explicitly; it is not silently clipped or reduced to tiny text. The current zh/en candidate has 36 pages each. A reduced-evidence fixture has 35 pages while retaining all ten sections.
5. The existing BaZi NOW snapshot and CUSTOM resolver remain the time authority. The saved snapshot prevents a reopened report from changing with the clock.
6. P01–P06 approved bindings retained. The single bilingual cover is identical in both locales.
7. Shared source snapshots drive HTML and Chromium PDF output. Print-specific CSS controls paper layout.
8. Method facts and editorial reader guidance are kept distinct in internal section blocks. Health diagnosis, organ claims, windfall predictions, marriage dates and occupation guarantees are not inferred from decorative examples or missing method evidence.

## Addendum C asset state

All 13 IDs, exact filenames, proposed R2 object keys, priorities, safe areas, text-free declarations and locale-independent bindings are registered in `config/reports/bazi-visual-assets.json`.

The current `VIS-REPORT-BAZI-MOTIF.svg` in the workspace is bound and decoded. It appeared with new image content during implementation and was preserved. It contains embedded PNG layers, so it is not represented as a pure-vector master. Text-free declaration still requires human visual acceptance; the checker validates SVG safety, extension, binding and successful decode, not semantic image contents.

BODY is marked existing in C and in the conversation, but its actual file/object URL was not exposed by the retrieved chat attachments or located in the repository. Its identity is retained as **EXISTING_AWAITING_FILE_BINDING**, not replaced or declared absent from the user's account. No R2 upload or live bucket inventory is claimed in this work.

SECTION-STYLE and ten dedicated heroes are optional and currently unbound. The resolver follows hero → section style → body with motif → body → CSS premium fallback. Decode failures advance through available alternatives. No symbolic asset ID is used as an image URL.

Five placement variants are supported; the supplied ten-section rotation uses bottom, right, left and full-fade. Consecutive openers differ. Body A/B/C vary placement from the same asset. Narrative decorations are limited to 12%, insight decoration to 9%, and opener hero to 45% (35% for full-fade). Titles, numbers, diagrams, prose and folios stay in HTML.

## Composition limits and remaining work

This is a functioning **section-composition candidate**, not a claim that live T3 generation has passed. The current writer still requires an admitted semantic verifier before provider-generated paraphrases can replace canonical prose. The review uses source-bound T2 fallback with section-specific editorial explanation. Tests exercise section-level routing, rejected output and fallback; no live paid-provider success is claimed.

The optional career timing page is omitted because the current method pack does not admit career-event timing. Generic annual data is not relabeled as a career prediction. The wellbeing chapter explains the scope and offers observational questions; there is no admitted clinical prediction module.

BaZi human acceptance, other-method migration, live T3 admission and production cutover remain separate work. This implementation does not mark the full original R2 master work complete.

## Verification

- `node scripts/sync-report-section-config.mjs --check`: generated browser/Pages-compatible data equals canonical JSON.
- `node scripts/check-bazi-section-publication.mjs`: registry/order, families, 36/35-page expansion, section-level requests, source scope, bilingual structure, frozen intro, exact dynamic folios, content budgets and 13-asset fallback contract.
- `node scripts/check-guided-report-r2.mjs`: previous R2 temporal, cache, provider failure, privacy and 26-page fixture regression preserved.
- Browser QA: 2 locales × 2 viewport widths × 36 pages = **144 screenshots**, no horizontal overflow or print footer overlap.
- Asset browser QA: actual bound SVG decode and simulated hero 404 fallback pass.
- PDF QA: two A4 files, expected pages derived from their semantic snapshots; per-page rendering, dynamic folios and identifier checks.
- Full repository regression: **`npm.cmd run check` passed with exit code 0**, including precheck and postcheck; see `addendum-b/npm-check.log`.
- Computed browser asset policy: narrative decoration ≤15%, insight decoration ≤10%, four opener placements with no identical consecutive placement; all pass.

The first full check found prohibited JSON import attributes in Pages Functions. Canonical JSON now generates one checked JS data module shared with the browser; the import guard passes. No package check-chain tail or historical freeze expectation was rewritten.

## Human acceptance — pending

| Criterion | Review focus |
| --- | --- |
| Visual continuity | P06→P07, each prior chapter→next opener, every opener→body |
| Book-like rhythm | Distinct families, ten clear entries, restrained recurring motifs |
| Content depth | Personality, career, wealth, relationships and integrated guidance; distinguish source reading from editorial reflection |
| Readability | Actual zh/en A4 and mobile text; no reliance on automated fit alone |
| Method scope | Open structural judgments stay open; unsupported health/financial/relationship forecasts remain absent |
| Time | Saved observation time, timezone, actual luck cycle and year layer |
| Pagination | Calculated totals; explicit frozen-asset exception on P02–P05 |
| Asset quality | No lettering, people or unintended symbols; safe typography area; embedded-raster SVG print appearance |
| Privacy | Customer pages contain no hashes, provider names or method runtime IDs |

No acceptance has been recorded on behalf of the user. Production successor active: **false**. Changes remain uncommitted.

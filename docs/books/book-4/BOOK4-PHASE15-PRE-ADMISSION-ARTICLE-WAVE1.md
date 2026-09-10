# BOOK IV · PHASE 15 Pre-Admission Article Wave 1

Baseline: `454a7d1771feec5e2f6ab00bffdde46a5aa661f0` (`7 volume`), using the user-supplied `terms.zip` as the current-main-aligned working tree.

## Source

- Final manuscript: `PHI-OS-Book-4-v1.pdf`
- SHA-256: `181cb98e54d0f2a2b5ad9dc00ab1d146f4ad41492e36b258e340f2104d29bd8e`
- Pages: 433
- Final text-layer sections: 127
  - P10 Runtime Expansion: 81
  - P11 Civilization Runtime: 46

## Governing Master Work

Formal Book IV admission remains:

`BOOK-IV-A0 → A1 → A2 → A3 → A4 → A5 → A6`

This delta records A0 source evidence and prepares Book III-style Wave 1 editorial candidates. It **does not** jump the Integrated Master execution order and it **does not** mark A3 or A6 complete.

Current Book IV state in this delta:

- A0 Manuscript Complete: `EVIDENCE_READY`
- A1 Canonical Coverage: `RECONCILIATION_REQUIRED_NOT_COMPLETE`
- A2 Retrieval Semantic Profile: `NOT_STARTED`
- A3 Article Mapping: `NOT_COMPLETE`; Wave 1 is pre-admission editorial preparation only
- A4 Machine Benchmark: `NOT_STARTED`
- A5 Human Acceptance: `NOT_STARTED`
- A6 Production Admission: `NOT_ADMITTED`

## A1 source reconciliation finding

The final PDF contains two repeated P10 chapter pairs:

- `CM-B4V1-P10-S048` and `CM-B4V1-P10-S050`: 成本递延
- `CM-B4V1-P10-S049` and `CM-B4V1-P10-S051`: 资源压缩

No source text was deleted or merged. The active P10/P11 canonical candidate pool contains 181 records, while only 29/127 final manuscript headings are exact-title matches. The remainder must go through semantic/human canonical reconciliation.

## Wave 1

Eight Article concepts are supplied in both `zh-Hans` and `en` (16 candidates total). Each candidate is bound to exact final-manuscript section codes, page ranges and text digests.

The Chinese review is editorial only. `ACCEPT` does not create Canonical Nodes, does not complete A3, does not admit Book IV to KIR, and does not publish.

## Commands

```text
npm run check:book4:phase15-pre-admission
npm run book4:pja:wave1:review
```

Review output:

`dist/book4-pja-wave1-human-review/BOOK4-PJA-WAVE1-HUMAN-REVIEW.html`

The review page stores decisions locally and exports:

`book4-pja-wave1-human-decisions-v1.json`


## BOOK-IV-A1 successor · 2026-09-10

- TL confirmed `成本递延` and `资源压缩` are repeated source occurrences. The second copies `CM-B4V1-P10-S050` and `CM-B4V1-P10-S051` are excluded from final manuscript authority; raw PDF/extraction evidence remains preserved.
- Final authoritative manuscript sections: **125** (`P10 79 + P11 46`).
- BOOK-IV-A1 final canonical coverage: **125 sections → 125 fresh final Canonical Nodes → 125 retrieval identities**.
- Predecessor `book-w1d` BOOK-4 P10/P11 records (**181**) remain historical compatibility evidence and are not reinterpreted.
- TL Article review: **8/8 zh-Hans ACCEPTED**. English semantic parity remains pending.
- Publication remains closed; BOOK-IV-A6 is not admitted.
- Next Master Work Step: **BOOK-IV-A2｜Retrieval Semantic Profile**.


## BOOK-IV-A2 · Retrieval Semantic Profile

Baseline: `90d4a7ce304a3a2fe5a0f6547ff911565144faee` (`PHASE 4 PAI-R1-W0–W10`).

- A1 final Canonical Nodes: **125** (P10 79 / P11 46).
- A2 retrieval semantic profiles: **125 / 125**; required semantic fields are present for every node.
- Profiles support `zh-Hans` and `en` retrieval language but remain `productionEligible: false` until BOOK-IV-A6.
- Wave 1 remains 8/8 Chinese editorial accepted; English semantic parity is still pending.
- A2 freezes the downstream article capacity at **11 batches / 53 article identities / 106 locale versions**. Wave 1 accounts for 8 identities; **45** identities remain across B02–B11.
- A2 does **not** complete Article Mapping. Exact article-to-node composition belongs to BOOK-IV-A3.
- No active KIR source registry, canonical node meaning, PAI authority, or website publication authority is mutated by A2.

Next governed Book IV step: `BOOK-IV-A3 | Article Mapping`.

## BOOK-IV-A3 · Article Mapping

Baseline: `340d9850779d41e1cd4185a77659207daca71c48` (`BOOK-IV-A2`).

- A3 consumes the frozen A2 capacity without changing it: **11 batches / 53 Article identities / 106 planned locale versions**.
- **125 / 125** A1 Final Canonical Nodes are explicitly mapped exactly once to one Article identity; no node is unmapped or multiply mapped.
- B01 preserves the accepted Wave 1 identities (**8 zh-Hans accepted; English semantic parity pending**).
- B02–B11 contain **45 mapped Article identities**. A3 creates mapping authority only; it does not generate their article prose.
- Cross-node articles are allowed only where the A3 map explicitly groups nodes inside the same frozen A2 batch scope.
- Every mapping carries the A2 semantic-profile id plus the final manuscript section code, page range and source-text SHA-256.
- A3 does not mutate Canonical Node meaning, does not admit Book IV to active KIR, and does not open website publication.

Next governed Book IV step: `BOOK-IV-A4 | Machine Benchmark`.

## BOOK-IV-A4 · Machine Retrieval Benchmark

Baseline: `1f81638d214bd946778e4ac721a0f7b265eac116` (`phase 6`), using the user-supplied Library `db(1).zip` as the current-main-aligned tree.

- Existing KIR-R2 retrieval runtime is reused; A4 does **not** create a parallel retriever.
- Benchmark: **250** Book IV bilingual node-level cases (`125 zh-Hans + 125 en`) plus **100** existing Book I–III regression/no-hijack controls.
- Top-1 node precision: **91.2%**; top-5 recall: **98.8%**.
- Book IV top-1 book precision: **99.6%**; wrong-book top-1 rate: **0.4%**.
- Source grounding: **100%** across the A1 final canonical binding, A2 profile, A3 article mapping and final manuscript inventory.
- Dedup integrity: **100%**. Direct-answer potential: **98.8%**.
- Book I–III control top-5 recall remains **100%**, with **0%** Book IV top-1 hijack.
- A4 preserves **3** top-5 misses and **1** wrong-book top-1 diagnostic for A5 instead of hiding them.
- Pre-admission Book IV article sources are suppressed during this benchmark so unpublished candidates cannot masquerade as `PUBLISHED_ARTICLE` evidence.
- Active KIR source admission, publication and BOOK-IV-A6 remain closed.

Next governed Book IV step: `BOOK-IV-A5 | Human Acceptance`.


## BOOK-IV-A5 · Human Acceptance Review Ready

Baseline: `ffc05bc07345011bc24e68884cc1d569c8d96418` (`BOOK-IV-A4`).

A5 does not repeat the 250-case machine benchmark. It opens a governed 26-case human review: 22 bilingual sentinels (one zh-Hans + one en primary-node case for every one of the 11 A3 article batches) plus all four A4 residual diagnostics.

Human rubric: correct source, relevance, Book IV meaning preserved, customer readability, no generic answer, and no method hijack. Every criterion is critical. A machine PASS cannot grant Human acceptance.

Current state: `REVIEW_READY_HUMAN_PENDING`. Book IV active KIR admission, production eligibility and publication remain closed; `BOOK-IV-A6` is not ready until all 26 cases are human accepted.

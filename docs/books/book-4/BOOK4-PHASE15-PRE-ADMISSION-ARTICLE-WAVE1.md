# BOOK IV · PHASE 15 Pre-Admission Article Wave 1

Baseline: `489eb817fde8bc34f2faefe395eca128ef997220` (`7 volume`), using the user-supplied `terms.zip` as the current-main-aligned working tree.

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

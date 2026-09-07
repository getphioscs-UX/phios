# BOOK III · PJA Wave 1 Article Production

Baseline: `ad5e3df2f437ff40b72055af289b99880d13d8b6` (`retired pages`).

## Current state

- KAU-R6D manuscript readability: 106/106 human accepted, including 103/103 manuscript sections.
- Source authority remains the frozen 397-page Book III PDF and its exact extraction digests.
- Wave 1 contains 8 Article concepts and 16 locale candidates (`zh-Hans` + `en`).
- Every candidate is bound to exact manuscript section code, PDF page range and source text SHA-256.
- Chinese Article editorial review is pending.
- English semantic-parity review is pending.
- Canonical/KPP cross-node asset reconciliation is pending.
- Publication remains closed.

## Commands

```text
npm run check:kau-r6d
npm run check:kau-r6d-human
npm run check:book3-pja-wave1
npm run book3:pja:wave1:review
```

The review builder creates `dist/book3-pja-wave1-human-review/BOOK3-PJA-WAVE1-HUMAN-REVIEW.html`. The HTML stores decisions locally and exports `book3-pja-wave1-human-decisions-v1.json` for the next governed acceptance step.

## Authority boundary

Manuscript readability approval does not equal Article editorial approval. Source-bound Article candidates do not create or mutate Canonical Nodes. No candidate may become customer-visible or published before human Article acceptance, canonical/KPP asset reconciliation, required locale review, and the existing PJA publication gates.

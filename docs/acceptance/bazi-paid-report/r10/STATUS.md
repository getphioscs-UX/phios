# BaZi R10 Compressed Human Review Status

## Current state

**MACHINE_PASS / HUMAN_REVIEW_PENDING**

Canonical customer publication remains:

- STATIC_EDITORIAL
- DETERMINISTIC_PERSONALIZED
- T3/OpenAI excluded from customer publication

## R10 compression result

- English: 44 total pages / 38 body pages
- Simplified Chinese: 44 total pages / 38 body pages
- Semantic structure parity: PASS
- Section Masters: 10
- Key Insights: 3 fixed editorial insights integrated into each Section Master
- Standalone Key Insights pages: 0
- New Section Master image assets required: 0
- Existing registered Section visuals reused: 10
- Required continuation: 1 per locale (Ten Gods detail 6 + 4)
- Empty pages: 0
- Thin pages: 0
- Over-budget pages: 0
- Duplicate groups: 0

## Existing visual authority

Each Section Master reuses its existing registered R2 visual in:

`images/reports/bazi/editorial/shared/`

No MASTER-BG replacement asset is required.

Localized section number, title, introduction and three Key Insights remain HTML/CSS overlays. Background complexity is handled only through opacity, gradient scrim or a text-safe panel.

## Browser acceptance

Workflow: **BaZi R10 Compressed Browser Audit**

Run: `36106800968`

Result:

- Chromium desktop: PASS
- Chromium mobile: PASS
- A4 print fit: PASS
- broken assets: none
- browser/print audit errors: 0
- machinePass: true

Artifact digest:

`sha256:556746448f650bc6f73279704fe20dd2a0137288a9ae302ca479a8ed00b225b8`

## Human review

Machine evidence does not constitute owner approval.

The owner should review:

`/docs/acceptance/bazi-paid-report/r10/review.html`

and explicitly return **ACCEPT** or **REJECT** with visual/editorial findings.

Until then:

`R10 = HUMAN_REVIEW_PENDING`

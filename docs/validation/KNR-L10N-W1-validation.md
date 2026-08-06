# KNR-L10N-W1 Validation

Declared baseline: `89fa0b3`

## Scope

STEP 39–54 only.

## Results

- 716 Canonical Nodes projected into multilingual authority.
- Supported locales: `zh-Hans`, `en`.
- 1,432 Publication Locale records established.
- 41 bilingual terminology entries frozen.
- 1,341 missing locale identities represented as Discovery Candidates.
- Discovery Candidates do not write registries, create articles, approve, or publish.
- Locale-specific review, approval, and publication remain independent.
- Cross-locale retrieval is published-only and discloses fallback locale.
- Automatic body translation is forbidden.
- Canonical changes propagate staleness without changing Human Review, Approval, or Publication state.
- Production Brief Export now fails closed unless the L10N freeze and locale identity gate pass.

## Commands

```text
npm run check:knr-l10n-w1
npm run check:kh-w4i-w4k
npm run check:knowledge-runtime
npm run check
```

## Executed in supplied archive

- `npm run check:knr-l10n-w1` — PASS
- `npm run check:kh-w4i-w4k` — PASS
- `npm run check:knowledge-runtime` — PASS
- `npm run check` — stopped because the supplied archive omits `reality-journey.html`; no L10N assertion failed before that missing-file boundary.

Apply this Delta to the complete repository and run the four commands above.

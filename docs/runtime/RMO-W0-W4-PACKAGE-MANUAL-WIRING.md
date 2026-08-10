# RMO-W0-W4 package.json manual wiring

`package.json` is intentionally excluded from this delivery so that parallel ALR work can merge without a JSON conflict.

Add these scripts manually inside `scripts`:

```json
"check:rmo-w0-w4": "node scripts/check-rmo-w0-w4-reality-foundation.mjs",
"check:rmo-foundation": "npm run check:rmo-w0-w4",
"check:rmo": "npm run check:rmo-foundation"
```

Preserve the current `postcheck` prefix and insert RMO immediately after the ICR Runtime check:

```text
npm run check:icr-runtime && npm run check:rmo-foundation && node scripts/check-exp-w4-reconstruction-customer-projection.mjs
```

Do not remove or reorder any ALR, CAR, ICR, RDG or Governance check already present.

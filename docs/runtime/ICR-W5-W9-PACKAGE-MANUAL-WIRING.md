# ICR-W5–W9 package.json manual wiring

This delivery intentionally leaves `package.json` byte-unchanged so it can be merged beside the parallel ALR work without a shared-file conflict.

## 1. Add scripts

In `package.json` → `scripts`, replace the current final ICR-W0–W4 line with this complete fragment:

```json
"check:icr-foundation": "npm run check:icr-w0-w4",
"check:icr-w5-w9": "node scripts/check-icr-w5-w9-canonical-case-runtime.mjs",
"check:icr-runtime": "npm run check:icr-w5-w9",
"check:icr": "npm run check:icr-foundation && npm run check:icr-runtime"
```

If ALR has already added more scripts after these entries, add a comma after the final ICR line as required by its actual position.

## 2. Extend postcheck

Within the existing `postcheck` command, replace only this segment:

```text
npm run check:icr-foundation && node scripts/check-exp-w4-reconstruction-customer-projection.mjs
```

with:

```text
npm run check:icr-foundation && npm run check:icr-runtime && node scripts/check-exp-w4-reconstruction-customer-projection.mjs
```

This keeps `check:icr-foundation` in its existing position, preserving the ICR-W0–W4 checker expectation, and adds W5–W9 immediately after it.

## 3. Verify after manual entry

```bash
npm run check:icr
npm run check
```

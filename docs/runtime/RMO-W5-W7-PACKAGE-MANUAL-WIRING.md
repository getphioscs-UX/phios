# RMO-W5-W7 package.json manual wiring

`package.json` is intentionally excluded from this delivery so the ongoing ALR branch can merge without a JSON conflict.

Keep the existing RMO-W0-W4 entries. Add these scripts manually inside `scripts`:

```json
"check:rmo-w5-w7": "node scripts/check-rmo-w5-w7-reality-structure.mjs",
"check:rmo-structure": "npm run check:rmo-w5-w7"
```

Replace the existing aggregate entry:

```json
"check:rmo": "npm run check:rmo-foundation"
```

with:

```json
"check:rmo": "npm run check:rmo-foundation && npm run check:rmo-structure"
```

In `postcheck`, insert the aggregate RMO check after ICR Runtime and before ALR Knowledge → Learning. The ordered segment must become:

```text
npm run check:icr-runtime && npm run check:rmo && npm run check:alr-knowledge-learning && npm run check:alr-practice
```

Do not remove or reorder any Governance, CAR, ICR or ALR command already present.

Then run:

```powershell
npm run check:rmo
npm run check
```

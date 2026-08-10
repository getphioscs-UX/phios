# RMO-W13-W15｜package.json Wiring

Baseline: `94fd1887e75c4b4c95a9c2dc4fe010c3e350d0ec`

This delivery applies the final RMO checker wiring directly to the clean baseline:

```json
"check:rmo-w13-w15": "node scripts/check-rmo-w13-w15-reality-versioning-diff-freeze.mjs",
"check:rmo-versioning-diff-freeze": "npm run check:rmo-w13-w15"
```

The aggregate becomes:

```json
"check:rmo": "npm run check:rmo-foundation && npm run check:rmo-structure && npm run check:rmo-evidence-reasoning && npm run check:rmo-lifecycle && npm run check:rmo-versioning-diff-freeze"
```

`postcheck` remains unchanged because it already invokes `npm run check:rmo`.

Validation:

```bash
npm run check:rmo-w13-w15
npm run check:rmo
```

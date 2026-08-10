# RMO-W10-W12｜package.json Manual Wiring

This delivery intentionally does not modify `package.json`, so it does not collide with parallel ALR work.

In `package.json` → `scripts`, add:

```json
"check:rmo-w10-w12": "node scripts/check-rmo-w10-w12-reality-lifecycle.mjs",
"check:rmo-lifecycle": "npm run check:rmo-w10-w12"
```

Replace:

```json
"check:rmo": "npm run check:rmo-foundation && npm run check:rmo-structure && npm run check:rmo-evidence-reasoning"
```

with:

```json
"check:rmo": "npm run check:rmo-foundation && npm run check:rmo-structure && npm run check:rmo-evidence-reasoning && npm run check:rmo-lifecycle"
```

Keep `postcheck` unchanged. On baseline `0375a0c`, it already invokes `npm run check:rmo` before the ALR groups.

The relevant final block should be equivalent to:

```json
"check:rmo-w0-w4": "node scripts/check-rmo-w0-w4-reality-foundation.mjs",
"check:rmo-foundation": "npm run check:rmo-w0-w4",
"check:rmo-w5-w7": "node scripts/check-rmo-w5-w7-reality-structure.mjs",
"check:rmo-structure": "npm run check:rmo-w5-w7",
"check:rmo-w8-w9": "node scripts/check-rmo-w8-w9-evidence-reasoning-boundary.mjs",
"check:rmo-evidence-reasoning": "npm run check:rmo-w8-w9",
"check:rmo-w10-w12": "node scripts/check-rmo-w10-w12-reality-lifecycle.mjs",
"check:rmo-lifecycle": "npm run check:rmo-w10-w12",
"check:rmo": "npm run check:rmo-foundation && npm run check:rmo-structure && npm run check:rmo-evidence-reasoning && npm run check:rmo-lifecycle"
```

Validate after saving:

```powershell
npm run check:rmo-w10-w12
npm run check:rmo
npm run check
```

If PowerShell reports `EJSONPARSE`, check the comma immediately before and after the inserted entries. JSON property names and string values must use double quotes.

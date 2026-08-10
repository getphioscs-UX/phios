# RMO-W8-W9｜package.json Manual Wiring

This delivery intentionally does not modify `package.json`, so it does not collide with concurrent ALR work.

In `package.json` → `scripts`, add these two entries:

```json
"check:rmo-w8-w9": "node scripts/check-rmo-w8-w9-evidence-reasoning-boundary.mjs",
"check:rmo-evidence-reasoning": "npm run check:rmo-w8-w9"
```

Then replace the existing aggregate entry:

```json
"check:rmo": "npm run check:rmo-foundation && npm run check:rmo-structure"
```

with:

```json
"check:rmo": "npm run check:rmo-foundation && npm run check:rmo-structure && npm run check:rmo-evidence-reasoning"
```

Keep `postcheck` unchanged. On baseline `6920c9e`, it already contains `npm run check:rmo`, so the aggregate update automatically includes W8-W9 in the full check.

The relevant final block should be equivalent to:

```json
"check:rmo-w0-w4": "node scripts/check-rmo-w0-w4-reality-foundation.mjs",
"check:rmo-foundation": "npm run check:rmo-w0-w4",
"check:rmo-w5-w7": "node scripts/check-rmo-w5-w7-reality-structure.mjs",
"check:rmo-structure": "npm run check:rmo-w5-w7",
"check:rmo-w8-w9": "node scripts/check-rmo-w8-w9-evidence-reasoning-boundary.mjs",
"check:rmo-evidence-reasoning": "npm run check:rmo-w8-w9",
"check:rmo": "npm run check:rmo-foundation && npm run check:rmo-structure && npm run check:rmo-evidence-reasoning"
```

Validate after saving:

```powershell
npm run check:rmo-w8-w9
npm run check:rmo
npm run check
```

If PowerShell reports an `EJSONPARSE`, check the comma immediately before and after the inserted entries. JSON property names and string values must use double quotes.

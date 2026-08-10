# KAU-E0 Legacy Unified Language Source Registration

Baseline: `fb0be62d25669e4e6c81f9b6e459afd2ca0c6633`

## Registered sources

- `LEGACY-PHIOS-UNIFIED-LANGUAGE-PART-1` → `phios-private-manuscripts/legacy/unified-language/part-1/original/unified-language-part-1.pdf`
- `LEGACY-PHIOS-UNIFIED-LANGUAGE-PART-2` → `phios-private-manuscripts/legacy/unified-language/part-2/original/unified-language-part-2.pdf`

## Authority

Both sources are `LEGACY_MANUSCRIPT`, `supportingOnly=true`, and have no Canonical Knowledge, Meaning, Node, or Publication authority.

## Frozen-foundation preservation

`legacy-supporting-source-registry-v1.json` remains unchanged as the empty KAU-E0 governance foundation registry. Explicit source registration is recorded in successor `legacy-supporting-source-registry-v2.json`. The KAU-W0–W14 freeze and the KAU-E0 governance freeze remain unchanged.

## Digest binding

- Part 1: `ac0529302d63ba14078c9ad058f0847a8d2ed6a2f4540f0a1fdf16927249f153`, 61,847,211 bytes, 494 pages.
- Part 2: `63f5f6709b70b1ea32435a108334e507cbc1d91ac7ef21ce85e71db6037277cb`, 62,207,293 bytes, 429 pages.

## R2 verification boundary

The object keys are bound from the user's confirmed private R2 upload. This package does not perform a remote `HEAD` request and stores no R2 credentials or public URL. Remote existence is therefore `USER_CONFIRMED_NOT_RUNTIME_VERIFIED`.

## Next work

`KAU-E1` may now create section/concept/terminology inventories and proposed existing-node relationships. It must not write Canonical Nodes directly.

## Validation

```bash
npm run check:kau-e0
npm run check:kau-e0-registration
```

# RG / RDG Foundation + KAU-E0 Implementation

Baseline: `c6ff0a9d0481cafeb57f6c3248b6377d78444859`

## Scope

- RG-W0–W2: checker inventory, stable checker identity contract, non-destructive v2 alias projection.
- RDG-W0–W10: data foundation plus purpose / consent / persistence governance.
- KAU-E0: legacy supporting source governance. No legacy source is imported in this package.

## Non-mutation guarantees

- Existing `runtime-checker-alias-registry-v1.json` and its freeze are not rewritten. RG-W2 creates `runtime-checker-alias-registry-v2.json` as the governed successor foundation.
- Existing KAU-W0–W14 full freeze is not rewritten. KAU-E0 is an extension lane.
- Existing privacy, professional consent, runtime persistence, and memory contracts are reconciled by reference, not replaced.
- No new user database is created.
- No Canonical Node, Meaning, Article, Published Asset, Journey state, or Professional Judgment is changed.

## Safe legacy upload state

After `check:kau-e0` passes, the architecture is ready to register legacy unified-language files as supporting-only sources. The registry remains empty in this commit so source ingestion remains an explicit later action.

## Validation

```bash
npm run check:rg-foundation
npm run check:rdg-foundation
npm run check:kau-e0
npm run check:governance-foundation
```

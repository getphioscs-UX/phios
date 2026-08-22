# MPA Current Check Consolidation

Baseline: `4188ce3cb33fc4bb0ddf80b29a4ab546a74841d6`.

## Canonical command

```bash
npm run check:mpa
```

`package.json` exposes no other MPA npm alias. `postcheck` invokes `npm run check:mpa` exactly once before `check:web-production-runtime`.

## Current regression scope

MPA regression is limited to method algorithms, method registries/policies, timezone/ephemeris authority, and method dependencies. The only currently pinned package dependency is `astronomy-engine@2.1.19`, validated by package entry version + npm integrity. Whole-file `package.json` and `package-lock.json` SHA checks are forbidden. PXR, BFR, Sharp/visual-production and checker-self fingerprints are outside MPA.

## Historical artifacts

W14 v1-v6 and W30 post-freeze package/PXR successor artifacts remain on disk for audit/history only. Current MPA does not consume them. Historical W14/W30 checker files and the MPA v1 freeze are not rewritten.

## Deleted obsolete helpers

- `scripts/apply-mpa-w25-package-scripts.mjs`
- `scripts/apply-mpa-w26-w27-package-scripts.mjs`

These helpers existed only to keep adding MPA aliases to `package.json`; that pattern is retired.

## Apply / delete actions

After overlaying the delta, delete exactly these obsolete package-mutator helpers:

```powershell
Remove-Item .\scripts\apply-mpa-w25-package-scripts.mjs -Force
Remove-Item .\scripts\apply-mpa-w26-w27-package-scripts.mjs -Force
```

Do **not** delete the historical W14/W30 successor JSON files. They are retained as audit history but are not consumed by `check:mpa`.

## Acceptance

```powershell
npm run check:mpa
npm run check:pxr
npm run check:bfr-h-current
npm run check:web-production-runtime
npm run check
```

Expected MPA state: one npm entry, 30 current checks, no repository-level package fingerprint coupling.

# PHI OS 6f2b4c6 — HRX / PDS-W0 Runtime Topology Hotfix

## Problem
`assets/js/runtime` is a frozen PDS-W0 protected path. The locally added file:

`assets/js/health/health-reality-candidate.js`

causes `PDS_W0_RUNTIME_PROTECTED_PATH_TOPOLOGY_DRIFT`.

The current `db.zip` aligned to main `6f2b4c6` does not contain that file in the frozen runtime namespace, so the correct repair is not to relax the PDS checker.

## Repair
Move the client-side health candidate module to:

`assets/js/health/health-reality-candidate.js`

and update textual consumers.

Server/runtime authority remains under `functions/health/` and `content/health/`; this hotfix only relocates the browser-side candidate out of the frozen PDS runtime namespace.

## Apply
From repo root:

```powershell
Expand-Archive .\PHIOS-6f2b4c6-HRX-PDS-W0-RUNTIME-TOPOLOGY-HOTFIX.zip -DestinationPath .\_hrx_pds_hotfix -Force
.\_hrx_pds_hotfix\APPLY-HRX-PDS-W0-HOTFIX.ps1
npm run check:pds-w0-current
npm run check
```

Do not modify `scripts/check-pds-w0-current.mjs` to authorize the health file inside `assets/js/runtime`.

# M3C-W7–W9 · Install and verify

The ZIP is a root-relative overlay for the PHI OS repository at latest
`main` commit `21531bb7527b34055ec4c20e852e463dae740d1c`.

Open PowerShell in the repository root, then run:

```powershell
$searchRoots = @(
  "$env:USERPROFILE\Downloads",
  "$env:USERPROFILE\Desktop",
  "$env:USERPROFILE\OneDrive\Downloads",
  "$env:USERPROFILE\OneDrive\Desktop"
) | Where-Object { Test-Path $_ }

$zip = Get-ChildItem `
  -LiteralPath $searchRoots `
  -Filter "PHIOS-M3C-W7-W9-Review-Memory-Continuity-2026-07-23.zip" `
  -File `
  -Recurse `
  -ErrorAction SilentlyContinue |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1

if (-not $zip) {
  throw "ZIP not found. Download it first, then run this command again."
}

Expand-Archive `
  -LiteralPath $zip.FullName `
  -DestinationPath (Get-Location).Path `
  -Force

$required = @(
  ".\assets\js\modules\review-customer-projection.js",
  ".\assets\js\modules\review-visual-alignment.js",
  ".\assets\js\modules\memory-customer-projection.js",
  ".\assets\js\modules\continuity-customer-projection.js",
  ".\assets\css\review-memory-continuity.css",
  ".\scripts\check-m3c-review.mjs",
  ".\scripts\check-m3c-memory.mjs",
  ".\scripts\check-m3c-continuity.mjs"
)

$missing = $required | Where-Object { -not (Test-Path -LiteralPath $_) }
if ($missing) {
  throw "ZIP extraction incomplete. Missing: $($missing -join ', ')"
}

npm run check:m3c-runtime-completion
npm run check
```

After the checks pass, upload the changed files with GitHub Desktop. After
Cloudflare Pages deploys:

1. complete one Review and prepare Memory;
2. open `/my-reality.html#memory` and export a report;
3. complete the Continuity Check-in;
4. verify the selected branch matches Review;
5. test browser deletion only with a disposable Runtime.


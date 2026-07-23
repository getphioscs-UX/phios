# M3C-W10 ZIP installation

Extract the ZIP into the PHI OS repository root — the folder containing
`package.json`.

```powershell
$zip = Get-ChildItem `
  -Path "$env:USERPROFILE\Downloads" `
  -Filter "PHIOS-M3C-W10-Public-Journey-Acceptance-*.zip" `
  -File |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1

if (-not $zip) {
  throw "M3C-W10 ZIP not found in Downloads."
}

Expand-Archive `
  -LiteralPath $zip.FullName `
  -DestinationPath (Get-Location).Path `
  -Force

npm run check:m3c-public-journey-acceptance
npm run check
```

Commit and deploy only after both checks pass. Then run the read-only
post-deployment acceptance command documented in
`docs/public/M3C-W10-PUBLIC-JOURNEY-ACCEPTANCE.md`.

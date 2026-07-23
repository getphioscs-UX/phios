# M4A-W3 ZIP installation

Extract the ZIP into the PHI OS repository root, where `package.json` is
located.

```powershell
$searchRoots = @(
  "$env:USERPROFILE\Downloads",
  "$env:USERPROFILE\OneDrive\Downloads",
  "$env:USERPROFILE\Desktop",
  "$env:USERPROFILE\OneDrive\Desktop"
) | Where-Object { Test-Path $_ }

$zip = Get-ChildItem `
  -LiteralPath $searchRoots `
  -Filter "PHIOS-M4A-W3-Consent-and-Sharing-*.zip" `
  -File `
  -Recurse `
  -ErrorAction SilentlyContinue |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1

if (-not $zip) {
  throw "M4A-W3 ZIP not found. Download it first, then run this command again."
}

Expand-Archive `
  -LiteralPath $zip.FullName `
  -DestinationPath (Get-Location).Path `
  -Force

npm run check:m4a-consent-sharing
npm run check
```

Commit only after both commands pass.

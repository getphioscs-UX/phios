# M4A-W7 Installation

Run the following commands from the local `phios` repository root in
PowerShell.

```powershell
$searchRoots = @(
  "$env:USERPROFILE\Downloads",
  "$env:USERPROFILE\Desktop",
  "$env:USERPROFILE\OneDrive\Downloads",
  "$env:USERPROFILE\OneDrive\Desktop"
) | Where-Object { Test-Path $_ }

$zip = Get-ChildItem `
  -LiteralPath $searchRoots `
  -Filter "PHIOS-M4A-W7-Professional-Data-and-Privacy-*.zip" `
  -File `
  -Recurse `
  -ErrorAction SilentlyContinue |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1

if (-not $zip) {
  throw "M4A-W7 ZIP was not found. Download it before continuing."
}

Expand-Archive `
  -LiteralPath $zip.FullName `
  -DestinationPath (Get-Location).Path `
  -Force

npm run check:m4a-professional-data-privacy
npm run check
```

Expected dedicated result:

```text
✓ M4A-W7 Professional Data and Privacy passed
```

This package does not require a D1 migration or Cloudflare binding change.
After both checks pass, commit with:

```text
M4A-W7 Professional Data and Privacy
```

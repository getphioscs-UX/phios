# M4A-W8 Installation

Run from the local `phios` repository root in PowerShell.

```powershell
$searchRoots = @(
  "$env:USERPROFILE\Downloads",
  "$env:USERPROFILE\Desktop",
  "$env:USERPROFILE\OneDrive\Downloads",
  "$env:USERPROFILE\OneDrive\Desktop"
) | Where-Object { Test-Path $_ }

$zip = Get-ChildItem `
  -LiteralPath $searchRoots `
  -Filter "PHIOS-M4A-W8-Financial-Professional-Infrastructure-*.zip" `
  -File `
  -Recurse `
  -ErrorAction SilentlyContinue |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1

if (-not $zip) {
  throw "M4A-W8 ZIP was not found. Download it before continuing."
}

Expand-Archive `
  -LiteralPath $zip.FullName `
  -DestinationPath (Get-Location).Path `
  -Force

npm run check:m4a-financial-infrastructure
npm run check
npm run migrate:check
```

After committing and deploying the source, inspect the remote migration plan:

```powershell
npx wrangler d1 migrations list RUNTIME_DB --remote
```

Apply migration `0003_financial_professional_infrastructure.sql`:

```powershell
npx wrangler d1 migrations apply RUNTIME_DB --remote
```

Confirm that the migration is recorded:

```powershell
npx wrangler d1 migrations list RUNTIME_DB --remote
```

Expected dedicated result:

```text
✓ M4A-W8 Financial Professional Infrastructure passed
```

Suggested commit:

```text
M4A-W8 Financial Professional Infrastructure
```

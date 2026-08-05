$ErrorActionPreference = 'Stop'

$repo = (Get-Location).Path
$target = Join-Path $repo 'scripts\check-kh-w3-5a-d-pkr-foundation.mjs'
$source = Join-Path $PSScriptRoot 'scripts\check-kh-w3-5a-d-pkr-foundation.mjs'
$legacy = Join-Path $repo 'content\knowledge\blueprints\book-1-knowledge-blueprint-v1.3.0.legacy.json'

if (-not (Test-Path $target)) { throw "Target checker not found: $target" }
if (-not (Test-Path $source)) { throw "Repair checker not found: $source" }
if (-not (Test-Path $legacy)) { throw "Legacy blueprint not found: $legacy" }

Copy-Item $target "$target.before-kh-w3.5g-r2.bak" -Force
Copy-Item $source $target -Force

$matches = Select-String -Path $target -Pattern 'book-1-knowledge-blueprint-v1\.3\.0\.legacy\.json'
if ($matches.Count -lt 2) {
  throw 'Repair verification failed: legacy blueprint references were not installed.'
}

Write-Host 'KH-W3.5G-R2 checker repair applied.' -ForegroundColor Green
Write-Host "Legacy references found: $($matches.Count)"
Write-Host 'Now run: npm run check:kh-w3.5a-d'

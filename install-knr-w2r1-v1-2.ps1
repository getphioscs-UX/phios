$ErrorActionPreference = "Stop"
$root = Get-Location
if (-not (Test-Path (Join-Path $root "package.json"))) { throw "Run this installer from the PHIOS repository root." }
$source = Split-Path -Parent $MyInvocation.MyCommand.Path
Copy-Item (Join-Path $source "scripts") $root -Recurse -Force
$packagePath = Join-Path $root "package.json"
$package = Get-Content $packagePath -Raw | ConvertFrom-Json
$package.scripts | Add-Member -NotePropertyName "knowledge:manuscript:v1.2" -NotePropertyValue "node scripts/book-i-manuscript-v1-2.mjs" -Force
$package.scripts | Add-Member -NotePropertyName "check:knr-w2r1-v1.2" -NotePropertyValue "node scripts/check-knr-w2r1-v1-2.mjs" -Force
[IO.File]::WriteAllText($packagePath, ($package | ConvertTo-Json -Depth 100) + [Environment]::NewLine, (New-Object Text.UTF8Encoding($false)))
Write-Host "KNR-W2R1 v1.2 installed."

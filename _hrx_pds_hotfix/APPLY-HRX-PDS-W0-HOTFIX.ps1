$ErrorActionPreference = "Stop"

$repo = (Get-Location).Path
$legacy = Join-Path $repo "assets\js\runtime\health\health-reality-candidate.js"
$newDir = Join-Path $repo "assets\js\health"
$current = Join-Path $newDir "health-reality-candidate.js"

Write-Host "PHI OS HRX / PDS-W0 topology hotfix"
Write-Host "Repo: $repo"

if (Test-Path $legacy) {
    New-Item -ItemType Directory -Force -Path $newDir | Out-Null

    if (Test-Path $current) {
        $legacyHash = (Get-FileHash $legacy -Algorithm SHA256).Hash
        $currentHash = (Get-FileHash $current -Algorithm SHA256).Hash
        if ($legacyHash -ne $currentHash) {
            throw "Both legacy and successor health candidate files exist with different contents. Resolve manually before continuing."
        }
        Remove-Item -Force $legacy
        Write-Host "Removed duplicate legacy file; successor already existed."
    } else {
        Move-Item -Force $legacy $current
        Write-Host "Moved health candidate out of frozen PDS runtime namespace:"
        Write-Host "  assets/js/runtime/health/health-reality-candidate.js"
        Write-Host "  -> assets/js/health/health-reality-candidate.js"
    }
} elseif (Test-Path $current) {
    Write-Host "Successor file already present; no move needed."
} else {
    Write-Host "Legacy health candidate not found. Nothing to relocate."
}

# Patch exact textual consumers without touching .git/node_modules.
$extensions = @(".html", ".js", ".mjs", ".json", ".md", ".css", ".txt")
$roots = @(
    (Join-Path $repo "assets"),
    (Join-Path $repo "content"),
    (Join-Path $repo "functions"),
    (Join-Path $repo "scripts"),
    (Join-Path $repo "docs"),
    $repo
)

$files = Get-ChildItem -Path $repo -Recurse -File | Where-Object {
    $extensions -contains $_.Extension.ToLowerInvariant() -and
    $_.FullName -notmatch "\\node_modules\\" -and
    $_.FullName -notmatch "\\\.git\\" -and
    $_.FullName -notmatch "\\dist\\" -and
    $_.FullName -notmatch "\\archive\\"
}

$patched = 0
foreach ($file in $files) {
    $text = [System.IO.File]::ReadAllText($file.FullName)
    $next = $text
    $next = $next.Replace("/assets/js/runtime/health/health-reality-candidate.js", "/assets/js/health/health-reality-candidate.js")
    $next = $next.Replace("assets/js/runtime/health/health-reality-candidate.js", "assets/js/health/health-reality-candidate.js")
    $next = $next.Replace("runtime/health/health-reality-candidate.js", "health/health-reality-candidate.js")
    if ($next -ne $text) {
        [System.IO.File]::WriteAllText($file.FullName, $next, (New-Object System.Text.UTF8Encoding($false)))
        $patched++
        Write-Host "Patched reference: $($file.FullName.Substring($repo.Length + 1))"
    }
}

# Remove empty legacy directory if possible.
$legacyDir = Join-Path $repo "assets\js\runtime\health"
if (Test-Path $legacyDir) {
    $remaining = Get-ChildItem -Path $legacyDir -Force
    if ($remaining.Count -eq 0) {
        Remove-Item -Force $legacyDir
    }
}

Write-Host ""
Write-Host "Patched reference files: $patched"
Write-Host ""
Write-Host "Frozen PDS runtime topology should now contain only:"
Get-ChildItem (Join-Path $repo "assets\js\runtime\web-production") -File | Sort-Object Name | Select-Object -ExpandProperty Name

Write-Host ""
Write-Host "Verify the legacy path is absent:"
Write-Host ("  " + (!(Test-Path $legacy)).ToString())

Write-Host ""
Write-Host "Now run:"
Write-Host "  npm run check:pds-w0-current"
Write-Host "  npm run check"

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path -LiteralPath 'C:\phios').Path
$dir = Join-Path $root 'tools\review\external-reality-cross-domain-r1'
$audit = Get-Content -LiteralPath (Join-Path $dir 'SCREENSHOT-DELETION-CURRENT-AUDIT.json') -Raw | ConvertFrom-Json
$items = @($audit.items | Where-Object state -eq 'ELIGIBLE_AFTER_ARCHIVE_RESTORE_VERIFICATION')
$archiveDir = Join-Path $dir ('recovery-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Path $archiveDir | Out-Null
$zipPath = Join-Path $archiveDir 'approved-screenshot-original-paths.zip'
$restoreRoot = Join-Path $archiveDir 'restore-verified'
New-Item -ItemType Directory -Path $restoreRoot | Out-Null
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::Open($zipPath, [System.IO.Compression.ZipArchiveMode]::Create)
try { foreach ($i in $items) {
 $source = [System.IO.Path]::GetFullPath((Join-Path $root $i.path))
 if (-not $source.StartsWith($root + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'SOURCE_OUTSIDE_WORKSPACE' }
 if ((Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash.ToLowerInvariant() -ne $i.sha256) { throw 'SOURCE_CHANGED' }
 [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip,$source,$i.path,[System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
} } finally { $zip.Dispose() }
[System.IO.Compression.ZipFile]::ExtractToDirectory($zipPath,$restoreRoot)
foreach ($i in $items) {
 $restored = [System.IO.Path]::GetFullPath((Join-Path $restoreRoot $i.path))
 if (-not $restored.StartsWith($restoreRoot + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'RESTORE_OUTSIDE_ARCHIVE' }
 if ((Get-FileHash -LiteralPath $restored -Algorithm SHA256).Hash.ToLowerInvariant() -ne $i.sha256) { throw 'RESTORE_HASH_FAILURE' }
}
$receipt = @{state='ARCHIVE_AND_EXTRACT_VERIFIED'; observedAt=(Get-Date).ToUniversalTime().ToString('o'); archive=$zipPath; archiveBytes=(Get-Item -LiteralPath $zipPath).Length; archiveSHA256=(Get-FileHash -LiteralPath $zipPath -Algorithm SHA256).Hash.ToLowerInvariant(); restoreRoot=$restoreRoot; count=$items.Count; items=$items; deletedCount=0; deletedBytes=0}
$receipt | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath (Join-Path $dir 'SCREENSHOT-RECOVERY-RECEIPT.json') -Encoding utf8
Write-Output ('RESTORE_VERIFIED=' + $items.Count + ' ARCHIVE=' + $zipPath)

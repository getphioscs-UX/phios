$ErrorActionPreference='Stop'
$path='C:\phios\tools\maintenance\repository-cleanup\CURRENT-SPACE-SAMPLES.json'
$rows=@()
if(Test-Path -LiteralPath $path){$rows=@(Get-Content -LiteralPath $path -Raw|ConvertFrom-Json)}
$drive=[IO.DriveInfo]::new('C:\')
$row=@{utc=[DateTime]::UtcNow.ToString('o');totalBytes=$drive.TotalSize;freeBytes=$drive.AvailableFreeSpace;head=(& git -C C:\phios rev-parse HEAD).Trim();scope='Finite sample; no build/render/screenshot or permanent stability promise'}
$rows+=$row
$rows|ConvertTo-Json -Depth 5|Set-Content -LiteralPath $path -Encoding utf8
Write-Output "Sample $($rows.Count): $($row.utc) free=$($row.freeBytes)"

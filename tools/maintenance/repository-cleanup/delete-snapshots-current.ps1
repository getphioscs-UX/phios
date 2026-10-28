$ErrorActionPreference='Stop'
$recordRoot='C:\phios\tools\maintenance\repository-cleanup'
$plan=Get-Content -LiteralPath "$recordRoot\CURRENT-SNAPSHOT-DELETE-READY.json" -Raw | ConvertFrom-Json
$results=@()
if(Test-Path -LiteralPath "$recordRoot\CURRENT-SNAPSHOT-DELETION.json"){$results=@(Get-Content -LiteralPath "$recordRoot\CURRENT-SNAPSHOT-DELETION.json" -Raw|ConvertFrom-Json)}
foreach($batch in $plan.ready){
  $root=[IO.Path]::GetFullPath($batch.root).TrimEnd('\')
  $expected=[IO.Path]::GetFullPath((Join-Path 'C:\phios' $batch.snapshot)).TrimEnd('\')
  if($root -ne $expected -or -not $root.StartsWith('C:\phios\') -or $root -eq 'C:\phios'){throw 'Target containment rejected'}
  if(-not (Test-Path -LiteralPath $batch.deletionManifest)){throw 'Deletion manifest missing'}
  $errors=@()
  foreach($path in $batch.targets){
    $target=[IO.Path]::GetFullPath($path)
    if([IO.Path]::GetDirectoryName($target) -ne $root -or [IO.Path]::GetFileName($target) -eq '.git'){throw "Unexpected deletion target: $target"}
    try {
      $item=Get-Item -LiteralPath $target -Force
      if($item.Attributes -band [IO.FileAttributes]::ReparsePoint){
        if(-not $item.PSIsContainer){[IO.File]::Delete($target)}else{[IO.Directory]::Delete($target,$false)}
      }else{Remove-Item -LiteralPath $target -Recurse -Force -ErrorAction Stop}
    }catch{$errors+=@{path=$target;error=$_.Exception.Message}}
  }
  $results+=@{snapshot=$batch.snapshot;plannedFiles=$batch.files;plannedLogicalBytes=$batch.logicalBytes;manifest=$batch.deletionManifest;errors=$errors;completedUTC=[DateTime]::UtcNow.ToString('o');status=$(if($errors.Count -eq 0){'DELETED'}else{'PARTIAL_DELETE'})}
  $results | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath "$recordRoot\CURRENT-SNAPSHOT-DELETION.json" -Encoding utf8
  Write-Output "$($batch.snapshot): $($results[-1].status) $($batch.logicalBytes) logical bytes"
}

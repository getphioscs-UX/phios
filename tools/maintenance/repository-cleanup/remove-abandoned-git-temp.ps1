# Owner-authorized exception: Git-classified abandoned temporary garbage only.
# No registered object, pack, index, LFS, reflog or ref is removed.
$ErrorActionPreference='Stop'
$base='C:\phios\tools\maintenance\repository-cleanup'
$audit=Get-Content -LiteralPath "$base\CURRENT-GIT-TEMP-AUDIT.json" -Raw | ConvertFrom-Json
$rows=@()
$previous=Get-Content -LiteralPath "$base\CURRENT-GIT-TEMP-DELETION-FIRST.json" -Raw | ConvertFrom-Json
foreach($f in $audit.candidates){
 if(-not $f.eligibleTemporary){continue}
 $path=[IO.Path]::GetFullPath($f.path)
 if(-not $path.StartsWith('C:\phios\.git\objects\') -or [IO.Path]::GetFileName($path) -notmatch '^tmp_(pack|obj)_[A-Za-z0-9]+$' -or $f.gitClassification -ne 'GARBAGE_NOT_REGISTERED_OBJECT'){throw 'Not a verified Git temporary file'}
 $stream=$null
 $originalAttributes=$null
 try{
  $done=$previous.results|Where-Object { $_.path -eq $path -and $_.status -eq 'DELETED_ABANDONED_GIT_TEMP' }
  if($done){$rows+=$done;continue}
  if(-not (Test-Path -LiteralPath $path)){throw 'No longer present; skipped'}
  if([IO.File]::GetLastWriteTimeUtc($path) -gt [DateTime]::UtcNow.AddDays(-14)){throw 'Not expired'}
  if((Test-Path -LiteralPath ($path+'.idx')) -or (Test-Path -LiteralPath ($path+'.pack'))){throw 'Associated pack metadata requires separate investigation'}
  # Sharing DELETE only denies every concurrent reader/writer while this handle
  # is held. Existing users cause open to fail; no process is terminated.
  $stream=[IO.File]::Open($path,[IO.FileMode]::Open,[IO.FileAccess]::Read,[IO.FileShare]::Delete)
  if($stream.Length -ne $f.bytes){throw 'Size changed; skipped'}
  $originalAttributes=[IO.File]::GetAttributes($path)
  if($originalAttributes -band [IO.FileAttributes]::ReadOnly){[IO.File]::SetAttributes($path,($originalAttributes -band (-bnot [IO.FileAttributes]::ReadOnly)))}
  [IO.File]::Delete($path)
  $stream.Dispose();$stream=$null
  $rows+=@{path=$path;bytes=$f.bytes;status='DELETED_ABANDONED_GIT_TEMP';basis='git count-objects garbage classification; older than 14 days; no concurrent open reader/writer'}
 }catch{if($null -ne $originalAttributes -and (Test-Path -LiteralPath $path)){[IO.File]::SetAttributes($path,$originalAttributes)};$rows+=@{path=$path;bytes=$f.bytes;status='KEPT';reason=$_.Exception.Message}}
 finally{if($null -ne $stream){$stream.Dispose()}}
}
$result=@{utc=[DateTime]::UtcNow.ToString('o');manifest="$base\CURRENT-GIT-TEMP-AUDIT.json";results=$rows;deletedFiles=@($rows|Where-Object status -eq 'DELETED_ABANDONED_GIT_TEMP').Count;deletedLogicalBytes=($rows|Where-Object status -eq 'DELETED_ABANDONED_GIT_TEMP'|Measure-Object -Property bytes -Sum).Sum;validObjectsDeleted=0;historyRewritten=$false}
$result|ConvertTo-Json -Depth 8|Set-Content -LiteralPath "$base\CURRENT-GIT-TEMP-DELETION.json" -Encoding utf8
Write-Output "Abandoned Git temporary garbage deleted: $($result.deletedFiles) files, $($result.deletedLogicalBytes) bytes; valid objects deleted=0"

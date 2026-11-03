param([Parameter(Mandatory)][ValidateSet('preview','production')][string]$Mode)
$ErrorActionPreference='Stop'
$root='C:/phios/tools/review/final-unified-production-r1'
$m=Get-Content -LiteralPath ($root+'/FINAL-RELEASE-MANIFEST.json') -Raw|ConvertFrom-Json
$download=Get-Content -LiteralPath ($root+'/DOWNLOAD-'+$Mode.ToUpper()+'.json') -Raw|ConvertFrom-Json
if($download.sha -ne $m.candidateSha){throw 'Artifact SHA drift'}
if((Get-FileHash -LiteralPath $download.path -Algorithm SHA256).Hash.ToLower() -ne $download.downloadSha256){throw 'ZIP digest drift'}
$oldSha='483cfa7b5acf8b6b848b1963e6efd39f2455691f'
$oldRoot=[IO.Path]::GetFullPath($root+'/artifacts/'+$oldSha+'/'+$Mode)
$old=Get-Content -LiteralPath ($oldRoot+'/artifact.json') -Raw|ConvertFrom-Json
if($old.sourceSha -ne $oldSha -or $old.mode -ne $Mode){throw 'Wrong reference artifact'}
$known=@{};foreach($f in $old.files){$known[$f.path]=$f}
$target=[IO.Path]::GetFullPath($root+'/artifacts/'+$m.candidateSha+'/'+$Mode)
if(Test-Path -LiteralPath $target){throw 'Do not overwrite an existing artifact directory'}
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip=[IO.Compression.ZipFile]::OpenRead($download.path)
$linked=0;$extracted=0
try{
 if($zip.Entries.Count -gt 25000){throw 'Unexpected file count'}
 foreach($e in $zip.Entries){
  $dest=[IO.Path]::GetFullPath((Join-Path $target $e.FullName))
  if(!$dest.StartsWith($target+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)){throw 'ZIP traversal denied'}
  if($e.FullName -notmatch '^(?:artifact[.]json|site/.*)$' -or (($e.ExternalAttributes -shr 16)-band 61440)-eq 40960){throw 'Unexpected ZIP entry'}
 }
 $entry=$zip.GetEntry('artifact.json');$reader=[IO.StreamReader]::new($entry.Open());try{$manifest=$reader.ReadToEnd()|ConvertFrom-Json}finally{$reader.Dispose()}
 if($manifest.sourceSha -ne $m.candidateSha -or $manifest.mode -ne $Mode){throw 'CI manifest identity mismatch'}
 $expected=@{};foreach($f in $manifest.files){$expected[$f.path]=$f}
 foreach($e in $zip.Entries){
  $dest=[IO.Path]::GetFullPath((Join-Path $target $e.FullName))
  if($e.FullName.EndsWith('/')){[IO.Directory]::CreateDirectory($dest)|Out-Null;continue}
  [IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($dest))|Out-Null
  $relative=if($e.FullName.StartsWith('site/')){$e.FullName.Substring(5)}else{''}
  if($relative -and !$expected.ContainsKey($relative)){throw 'Unexpected site entry absent from CI manifest'}
  $reuse=$relative -and $known.ContainsKey($relative) -and $known[$relative].sha256 -eq $expected[$relative].sha256 -and $known[$relative].bytes -eq $expected[$relative].bytes
  if($reuse){
   $source=[IO.Path]::GetFullPath((Join-Path ($oldRoot+'/site') $relative))
   if(!$source.StartsWith($oldRoot+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)){throw 'Reference traversal denied'}
   New-Item -ItemType HardLink -Path $dest -Value $source|Out-Null;$linked++
  }else{[IO.Compression.ZipFileExtensions]::ExtractToFile($e,$dest);$extracted++}
 }
}finally{$zip.Dispose()}
node ($root+'/verify-artifact.mjs') $Mode
if($LASTEXITCODE -ne 0){throw 'Full final-byte verification failed; deployment blocked'}
@{sha=$m.candidateSha;mode=$Mode;referenceSha=$oldSha;hardLinkedIdenticalFiles=$linked;extractedChangedFiles=$extracted;allFinalBytesVerified=$true;sourceZipSha256=$download.downloadSha256;note='Immutable identical bytes reused to avoid duplicate disk allocation; final contents verified against exact CI manifest'}|ConvertTo-Json|Set-Content -LiteralPath ($root+'/MATERIALIZED-'+$Mode.ToUpper()+'.json') -Encoding utf8

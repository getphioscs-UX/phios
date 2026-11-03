param([Parameter(Mandatory)][ValidateSet('preview','production')][string]$Mode)
$ErrorActionPreference='Stop'
$taskRoot='C:/phios/tools/review/final-unified-production-r1'
$taskManifest=Get-Content -LiteralPath ($taskRoot+'/FINAL-RELEASE-MANIFEST.json') -Raw | ConvertFrom-Json
$taskDownload=Get-Content -LiteralPath ($taskRoot+'/DOWNLOAD-'+$Mode.ToUpper()+'.json') -Raw | ConvertFrom-Json
if($taskDownload.sha -ne $taskManifest.candidateSha){throw 'Artifact SHA drift'}
if((Get-FileHash -LiteralPath $taskDownload.path -Algorithm SHA256).Hash.ToLower() -ne $taskDownload.downloadSha256){throw 'ZIP digest drift'}
$taskDestination=[IO.Path]::GetFullPath($taskRoot+'/artifacts/'+$taskManifest.candidateSha+'/'+$Mode)
if(Test-Path -LiteralPath $taskDestination){throw 'Extraction target already exists; do not overwrite'}
Add-Type -AssemblyName System.IO.Compression.FileSystem
$taskArchive=[IO.Compression.ZipFile]::OpenRead($taskDownload.path)
try{
 if($taskArchive.Entries.Count -gt 25000){throw 'Unexpected artifact file count'}
 foreach($taskEntry in $taskArchive.Entries){
  $taskResolved=[IO.Path]::GetFullPath((Join-Path $taskDestination $taskEntry.FullName))
  if(-not $taskResolved.StartsWith($taskDestination+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)){throw 'ZIP path escapes task-owned artifact root'}
  if($taskEntry.FullName -notmatch '^(?:artifact[.]json|site/.*)$'){throw 'Unexpected artifact root path'}
  if((($taskEntry.ExternalAttributes -shr 16) -band 61440) -eq 40960){throw 'Artifact symlink denied'}
 }
}finally{$taskArchive.Dispose()}
[IO.Compression.ZipFile]::ExtractToDirectory($taskDownload.path,$taskDestination)
node ($taskRoot+'/verify-artifact.mjs') $Mode
exit $LASTEXITCODE

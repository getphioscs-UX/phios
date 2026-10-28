$ErrorActionPreference='Stop'
$b='C:\phios\tools\maintenance\repository-cleanup'
$plan=Get-Content -LiteralPath "$b\CURRENT-RETIRED-MEDIA-MANIFEST.json" -Raw|ConvertFrom-Json
$out=@()
foreach($f in $plan){
 $p=[IO.Path]::GetFullPath($f.path)
 if(-not $p.StartsWith('C:\phios\') -or -not ($p.StartsWith('C:\phios\output\pdf\numerology-r20\') -or $p.StartsWith('C:\phios\output\pdf\hd-r51-partial-review\') -or $p.StartsWith('C:\phios\.tmp\ecr-r33-binding-closure-20261027\') -or $p -eq 'C:\phios\tmp\p9-d1i1\source.tar')){throw 'Media scope rejected'}
 $s=Get-Item -LiteralPath $p -Force
 if($s.Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'Media link rejected'}
 if($s.Length -ne $f.bytes -or (Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash.ToLowerInvariant() -ne $f.sha256){throw 'Media changed; stop'}
 Remove-Item -LiteralPath $p -Force
 $out+=@{path=$p;bytes=$f.bytes;sha256=$f.sha256;reason=$f.reason;status='DELETED'}
}
$out|ConvertTo-Json -Depth 6|Set-Content -LiteralPath "$b\CURRENT-RETIRED-MEDIA-DELETION.json" -Encoding utf8
Write-Output "Deleted $($out.Count) retired media files; $((($out|Measure-Object bytes -Sum).Sum)) logical bytes"

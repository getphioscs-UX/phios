$ErrorActionPreference='Stop'
$financeRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\.tmp\finance-document-render'))+[IO.Path]::DirectorySeparatorChar
$financeInput=[IO.Path]::GetFullPath((Join-Path $financeRoot 'synthetic-will.docx'))
$financeOutput=[IO.Path]::GetFullPath((Join-Path $financeRoot 'word-render.pdf'))
if(-not $financeInput.StartsWith($financeRoot) -or -not $financeOutput.StartsWith($financeRoot)){throw 'QA_RENDER_PATH_OUTSIDE_APPROVED_DIRECTORY'}
$financeWord=$null
$financeDocument=$null
$financeOwned=$false
try {
 $financeWord=New-Object -ComObject Word.Application
 if($financeWord.Documents.Count -ne 0){throw 'EXISTING_WORD_INSTANCE_NOT_OWNED'}
 $financeOwned=$true
 $financeWord.Visible=$false
 $financeWord.DisplayAlerts=0
 $financeWord.AutomationSecurity=3
 $financeDocument=$financeWord.Documents.Open($financeInput,$false,$true,$false)
 $financeDocument.ExportAsFixedFormat($financeOutput,17)
 $financeEvidence=@{engine='Microsoft Word';version=[string]$financeWord.Version;inputReadOnly=$true;macrosDisabled=$true;output=$financeOutput;originalModified=$false;productionOperation=$false}
 $financeEvidence | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $financeRoot 'word-render-receipt.json') -Encoding utf8
 Write-Output 'WORD_RENDER_CREATED_REQUIRES_PAGE_INSPECTION'
} finally {
 if($null -ne $financeDocument){$financeDocument.Close(0);[void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($financeDocument)}
 if($null -ne $financeWord){if($financeOwned){$financeWord.Quit(0)};[void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($financeWord)}
}

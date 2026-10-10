$ErrorActionPreference = 'Stop'
$PreviousLive = $env:REPORT_PROVIDER_LIVE_ALLOWED
$PreviousReplay = $env:REPORT_ZERO_COST_REPLAY
$PreviousKey = $env:OPENAI_API_KEY
try {
    if (-not $env:OPENAI_API_KEY) {
        $SecureKey = Read-Host 'OpenAI API key (hidden; this process only)' -AsSecureString
        $KeyPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureKey)
        try { $env:OPENAI_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($KeyPointer) }
        finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($KeyPointer) }
    }
    $env:REPORT_ZERO_COST_REPLAY = 'false'
    $env:REPORT_PROVIDER_LIVE_ALLOWED = 'true'
    npm run run:bazi-deep-manuscript:r2-controlled-experiment -- --approval docs/acceptance/bazi-paid-report/deep-manuscript-r2/CONTROLLED-EXPERIMENT-APPROVAL.json --verified-model content/reports/bazi/deep-manuscript/gpt-5.6-sol-capacity-admission-v1.json --candidate BDM-R2-REFERENCE-20261006-01
    if ($LASTEXITCODE -ne 0) { throw 'Controlled experiment stopped; inspect the durable checkpoint before rerunning.' }
    $env:REPORT_PROVIDER_LIVE_ALLOWED = 'false'
    if (Test-Path 'docs/acceptance/bazi-paid-report/deep-manuscript-r2/LIVE-MANUSCRIPT-SNAPSHOT.json') {
        npm run build:bazi-deep-manuscript:r2-live-review
        if ($LASTEXITCODE -ne 0) { throw 'Review build failed; do not regenerate the manuscript.' }
    }
    node scripts/write-bazi-deep-manuscript-r2-experiment-status.mjs
}
finally {
    $env:REPORT_PROVIDER_LIVE_ALLOWED = $PreviousLive
    $env:REPORT_ZERO_COST_REPLAY = $PreviousReplay
    $env:OPENAI_API_KEY = $PreviousKey
    $PreviousKey = $null
}

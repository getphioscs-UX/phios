# Zero-provider review rebuild. No paid experiment invocation.
& {
    $ErrorActionPreference = 'Stop'
    Set-Location (Split-Path -Parent $PSScriptRoot)
    $oldLive = $env:REPORT_PROVIDER_LIVE_ALLOWED
    try {
        $env:REPORT_PROVIDER_LIVE_ALLOWED = 'false'
        node scripts/register-bazi-post-three-call-repair.mjs
        if ($LASTEXITCODE -ne 0) { throw 'Repair command registration failed.' }
        npm run build:bazi-post-three-call:repair-review
        if ($LASTEXITCODE -ne 0) { throw 'Repair review build failed.' }
        npm run check:bazi-post-three-call:repair
        if ($LASTEXITCODE -ne 0) { throw 'Repair structure check failed.' }
        npm run check:bazi-deep-manuscript:r2-prelive
        if ($LASTEXITCODE -ne 0) { throw 'Architecture regression failed.' }
        npm run check:bazi-deep-manuscript:r2-capacity-closure
        if ($LASTEXITCODE -ne 0) { throw 'Capacity regression failed.' }
        Start-Process (Join-Path $PWD 'tools/review/BAZI-DEEP-MANUSCRIPT-R2-PUBLICATION-REVIEW-R2.html')
        Write-Host 'Zero-provider rebuild complete. Manuscript repair and human review remain pending.'
    } finally {
        $env:REPORT_PROVIDER_LIVE_ALLOWED = $oldLive
    }
}

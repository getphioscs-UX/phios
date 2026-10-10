# Deterministic local review only. All failures stop this block.
& {
    $ErrorActionPreference = 'Stop'
    Set-Location (Split-Path -Parent $PSScriptRoot)
    $oldLive = $env:REPORT_PROVIDER_LIVE_ALLOWED
    $oldBrowser = $env:REPORT_BROWSER_EXECUTABLE
    try {
        $env:REPORT_PROVIDER_LIVE_ALLOWED = 'false'
        if (-not $env:REPORT_BROWSER_EXECUTABLE) {
            foreach ($candidateBrowser in @(
                'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
                'C:\Program Files\Microsoft\Edge\Application\msedge.exe',
                'C:\Program Files\Google\Chrome\Application\chrome.exe'
            )) {
                if (Test-Path -LiteralPath $candidateBrowser) {
                    $env:REPORT_BROWSER_EXECUTABLE = $candidateBrowser
                    break
                }
            }
        }
        node scripts/capture-bazi-final-closure-baseline.mjs
        if ($LASTEXITCODE -ne 0) { throw 'Receipt baseline capture failed.' }
        node scripts/register-bazi-final-closure.mjs
        if ($LASTEXITCODE -ne 0) { throw 'Command registration failed.' }
        npm run build:bazi-deep-manuscript:r2-final-human-acceptance-review
        if ($LASTEXITCODE -ne 0) { throw 'Candidate build failed.' }
        foreach ($command in @(
            'check:bazi-deep-manuscript:r2-final-closure-architecture',
            'check:bazi-deep-manuscript:r2-s04-seven-killings-coverage',
            'check:bazi-deep-manuscript:r2-timing-consistency',
            'check:bazi-deep-manuscript:r2-diagram-fidelity',
            'check:bazi-deep-manuscript:r2-publication-semantic-coverage',
            'check:bazi-deep-manuscript:r2-prelive',
            'check:bazi-deep-manuscript:r2-capacity-closure'
        )) {
            npm run $command
            if ($LASTEXITCODE -ne 0) { throw "Check failed: $command" }
        }
        npm run check:bazi-deep-manuscript:r2-final-browser
        $browserExit = $LASTEXITCODE
        npm run check:bazi-deep-manuscript:r2-final-pdf
        $pdfExit = $LASTEXITCODE
        npm run check:bazi-deep-manuscript:r2-final-zero-provider
        if ($LASTEXITCODE -ne 0) { throw 'Protected receipts or provider guard changed.' }
        npm run check:bazi-deep-manuscript:r2-final-closure
        $scopedExit = $LASTEXITCODE
        if ($browserExit -ne 0 -or $pdfExit -ne 0 -or $scopedExit -ne 0) {
            node -e "require('node:fs').writeFileSync('docs/acceptance/bazi-paid-report/deep-manuscript-r2/FINAL-CLOSURE-GLOBAL-CHECK.json', JSON.stringify({status:'NOT_RUN_AFTER_SCOPED_FAILURE', classification:'BDM_BLOCKING', overallPass:false}, null, 2))"
            node scripts/report-bazi-final-closure.mjs
            throw 'Publication fit remains blocked. See FINAL-CLOSURE-MACHINE-REPORT.json; no paid experiment was run.'
        }
        npm run check
        $globalExit = $LASTEXITCODE
        node -e "require('node:fs').writeFileSync('docs/acceptance/bazi-paid-report/deep-manuscript-r2/FINAL-CLOSURE-GLOBAL-CHECK.json', JSON.stringify({status:process.argv[1]==='0'?'PASS':'FAIL', classification:process.argv[1]==='0'?null:'UNKNOWN', exitCode:Number(process.argv[1]), overallPass:process.argv[1]==='0'}, null, 2))" "$globalExit"
        node scripts/report-bazi-final-closure.mjs
        if ($globalExit -ne 0) { throw 'Repository check failed; final human acceptance remains pending.' }
        Start-Process (Join-Path $PWD 'tools/review/BAZI-DEEP-MANUSCRIPT-R2-FINAL-HUMAN-ACCEPTANCE-REVIEW.html')
        Write-Host 'Machine checks passed. Human acceptance remains pending; production is not frozen.'
    } finally {
        $env:REPORT_PROVIDER_LIVE_ALLOWED = $oldLive
        $env:REPORT_BROWSER_EXECUTABLE = $oldBrowser
    }
}

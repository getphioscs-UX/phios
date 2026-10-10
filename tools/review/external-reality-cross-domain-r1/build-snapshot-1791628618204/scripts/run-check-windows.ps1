# Run the original npm lifecycle chain, including precheck/check/postcheck.
# Nested npm run commands prepend PATH repeatedly on Windows. A local shim
# resets only PATH at each npm boundary; it does not skip or rewrite checks.
$ErrorActionPreference = 'Stop'
$vrptRoot = Split-Path -Parent $PSScriptRoot
$vrptNode = (Get-Command node.exe).Source
$vrptNpm = Join-Path (Split-Path -Parent (Get-Command npm.cmd).Source) 'node_modules/npm/bin/npm-cli.js'
if (!(Test-Path -LiteralPath $vrptNpm)) { throw 'NPM_CLI_NOT_FOUND' }
$vrptShim = Join-Path $vrptRoot '.tmp/vrpt-npm'
New-Item -ItemType Directory -Force -Path $vrptShim | Out-Null
$vrptOriginalPath = $env:Path
$vrptCleanPath = "$vrptShim;$vrptOriginalPath"
$vrptScript = "@echo off`r`nsetlocal`r`nset `"PATH=$vrptCleanPath`"`r`n`"$vrptNode`" `"$vrptNpm`" %*`r`nexit /b %errorlevel%`r`n"
Set-Content -LiteralPath (Join-Path $vrptShim 'npm.cmd') -Value $vrptScript -Encoding ascii
try {
  $env:Path = $vrptCleanPath
  & (Join-Path $vrptShim 'npm.cmd') run check
  $vrptExitCode = $LASTEXITCODE
} finally { $env:Path = $vrptOriginalPath }
exit $vrptExitCode

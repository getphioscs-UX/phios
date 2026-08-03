[CmdletBinding()]
param(
    [Parameter()]
    [string]$RepositoryRoot,

    [Parameter()]
    [string]$DeltaRoot
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($RepositoryRoot)) {
    $RepositoryRoot = (Get-Location).Path
}
if ([string]::IsNullOrWhiteSpace($DeltaRoot)) {
    $DeltaRoot = $PSScriptRoot
}

$helper = Join-Path $PSScriptRoot 'apply-mr-w0.mjs'
if (-not (Test-Path -LiteralPath $helper -PathType Leaf)) {
    throw "MR-W0 apply engine is missing: $helper"
}

$nodeArguments = @(
    $helper,
    '--repository-root',
    $RepositoryRoot,
    '--delta-root',
    $DeltaRoot
)

& node @nodeArguments
$nodeExitCode = $LASTEXITCODE
if ($nodeExitCode -ne 0) {
    throw "MR-W0 apply was blocked. Exit code: $nodeExitCode"
}

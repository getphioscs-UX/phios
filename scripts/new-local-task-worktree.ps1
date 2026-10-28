[CmdletBinding(SupportsShouldProcess)]
param(
 [Parameter(Mandatory)][string]$Target,
 [Parameter(Mandatory)][ValidatePattern('^codex/[A-Za-z0-9._/-]+$')][string]$Branch,
 [Parameter(Mandatory)][string[]]$SparsePaths,
 [string]$Ref='HEAD',
 [long]$EstimatedBytes=2000000000,
 [switch]$AllowLowDiskSpace
)
$ErrorActionPreference='Stop'
if($SparsePaths.Count -eq 0 -or $SparsePaths -contains '.'){throw 'Explicit sparse task paths required; full routine checkouts are not allowed'}
$repo=Split-Path $PSScriptRoot -Parent
$destination=[IO.Path]::GetFullPath($Target)
if(Test-Path -LiteralPath $destination){throw 'Destination already exists; reuse or reconcile it first'}
$argsForGuard=@((Join-Path $PSScriptRoot 'local-disk-preflight.mjs'),'--operation=sparse-worktree',"--estimated-bytes=$EstimatedBytes")
if($AllowLowDiskSpace){$argsForGuard+='--allow-low-disk-space'}
& node @argsForGuard
if($LASTEXITCODE -ne 0){throw 'Disk preflight rejected checkout'}
$resolved=& git -C $repo rev-parse --verify --end-of-options ($Ref+'^{commit}')
if($LASTEXITCODE -ne 0){throw 'Invalid source commit'}
if($PSCmdlet.ShouldProcess($destination,"Create sparse task worktree $Branch at $resolved")){
 & git -C $repo worktree add --no-checkout -b $Branch $destination $resolved
 if($LASTEXITCODE -ne 0){throw 'Worktree registration failed; inspect before retry'}
 & git -C $destination sparse-checkout init --cone
 if($LASTEXITCODE -ne 0){throw 'Sparse initialization failed; checkout retained for recovery'}
 & git -C $destination sparse-checkout set -- @SparsePaths
 if($LASTEXITCODE -ne 0){throw 'Sparse paths failed; checkout retained for recovery'}
 & git -C $destination checkout
 if($LASTEXITCODE -ne 0){throw 'Checkout failed; registration retained for recovery'}
}

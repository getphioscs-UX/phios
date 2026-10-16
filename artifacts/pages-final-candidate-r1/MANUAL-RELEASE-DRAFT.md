# Manual release draft — NOT EXECUTED

Candidate worktree: C:/Users/Guest Account/.codex/worktrees/pages-final-candidate/phios
Node 22.16.0 / npm 10.9.2 / locked Wrangler 4.120.0.

Before any release: approve this candidate; recheck current production configuration and bindings without overwriting concurrent P9 changes; verify output/config SHA256 against ARTIFACT-VALIDATION.json and OUTPUT-MANIFEST.json. Confirm the paired historical rollback target is still available and compatible. Do not rebuild between approval and publishing these validated files.

PowerShell draft (one explicit manual production deployment; NOT RUN):

Set-Location 'C:/Users/Guest Account/.codex/worktrees/pages-final-candidate/phios'
$env:PATH = 'C:/phios/.tmp/pages-final-toolchain/node-v22.16.0-win-x64;' + $env:PATH
node node_modules/wrangler/bin/wrangler.js pages deploy .pages-output --project-name phios-github --branch main --commit-dirty=true

HEAD alone does not identify this candidate; use CANDIDATE.json, CANDIDATE.diff, SOURCE-IDENTITY.json and the artifact/config digests. Do not change production automatic-deploy settings.

Rollback target: 8ceb88f8-27bc-432a-80d4-775765a41e0e, HISTORICAL / AVAILABILITY_NOT_RECHECKED_THIS_BUILD.
Locked Wrangler exposes no Pages rollback subcommand. Use the existing Cloudflare Pages production deployment dashboard rollback only after verifying the previous Worker/static/config pair and affected binding values. Preserve the current production/config snapshot before deployment. Reverting application bytes does not prove project variables reverted; validate configuration explicitly. If the old deployment/config pair cannot be verified, stop the release and select a verified rollback pair.

No production API command, rollback, deletion, D1 migration, Secret change or automatic-deploy setting change was executed. Old deployment 0164cad3 cleanup is separate and not a build dependency.

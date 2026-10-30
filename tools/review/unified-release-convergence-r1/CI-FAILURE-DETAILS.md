# CI failure classification — unchanged observations

Main `3c197c509e01e95cc18651cb2a05bf63a1259dc4` has two current check runs: PTRC validate SUCCESS, BaZi R11 build FAILURE. A successful validate run does not cancel the failed review workflow.

Run https://github.com/getphioscs-UX/phios/actions/runs/41051752726

- Failed command: `node scripts/build-bazi-r9-review.mjs`.
- Failed step: Build R11 review package.
- Node: v22.16.0.
- Error: `TypeError [ERR_IMPORT_ATTRIBUTE_MISSING]`: `content/reports/shared/report-visual-assets-r2.json` needs an import attribute of `type: json`.
- Dependency installation and sync step succeeded; commit/upload stages were skipped.
- The workflow's broad `assets/customer-ui/surfaces/**` trigger can also run after an ECR stylesheet change. It has contents-write and a generated-review commit stage; this task neither reran nor edited it.
- Existing JSON import support in `scripts/lib/pages-json-import-preload.mjs` is a starting point for the workflow owner to assess compatibility. No source/test/hash was changed here. This is not a waiver or a fix.

Historical failures at older commits remain separately recorded in GITHUB-BASELINE.json: RNT2 core run 41037530835 and B6 visual probe run 41023981098. They were not rerun and are not claimed to be current-main checks. The final selected release scope must resolve their applicability with their owners.

World PR14 advanced during this audit. Revision `29d2a31ae482072bca3797bf6463025bdcd5406b` had validate/Cloudflare checks in progress at 12:18:10Z. The earlier fc5c Preview and successful owner runs are not substituted for those checks.

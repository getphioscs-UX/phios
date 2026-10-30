# Subject-Centred Profile R1

State: PARTIAL_WITH_NAMED_BLOCKERS. Main af44a78737fa8378fb4c5e284b2a6216d0364ea5; no ref changes.

Preview: http://127.0.0.1:49675/reality/ — QA A/B are synthetic.

Current compiled service: .tmp/subject-profile-r1/build/server.mjs. Start from C:\phios with PHIOS_SUBJECT_QA_PORT=49675, then node .tmp/subject-profile-r1/build/server.mjs. No production endpoint activation.

Targeted checks:
- node --import ./scripts/lib/pages-json-import-preload.mjs tools/review/subject-profile-r1/test.mjs
- node tools/review/subject-profile-r1/qa-adapter-regression.mjs
- node tools/review/subject-profile-r1/logout-dom-test.mjs
- node scripts/check-profile-visitor-r1.mjs
- node scripts/check-profile-brand-account-bridge-r1.mjs

Rebuild only after relevant inputs change: node tools/review/subject-profile-r1/build.mjs. Whole Pages build and full npm check not run.

Data: .tmp/reality-navigation-continuity-r1/subject-profile-r1.sqlite, existing runtime + PWS schemas, synthetic identities only. Old QA source versions retained. Never copy this fixture DB to production.

Current Owner/policy/financial/continuity blocks: BLOCKERS.json. Worktrees and concurrent BaZi acceptance are untouched.

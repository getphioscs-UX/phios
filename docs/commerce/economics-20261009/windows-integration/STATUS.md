# Windows Commerce integration — actual local results

SOURCE: STAGE_A_PASS; STAGE_B_INFRASTRUCTURE_PASS; STAGE_B_PRODUCTION_PRODUCERS_INCOMPLETE.

DEPLOYED: RUNTIME_UNVERIFIED for this source/worktree. No deployment or production migration performed.

LIVE_CUSTOMER: NOT_RUN / RUNTIME_UNVERIFIED. No payment, real provider request or customer mutation performed.

Stable HEAD: 3bca98225f5d4868ff24bbcf6b802253a4d870ba; after: 3bca98225f5d4868ff24bbcf6b802253a4d870ba. All 18 commands exited 0; source changes during the checks: []. Run: [local-checks.json](runs/2026-10-09T05-20-18.615Z/local-checks.json), [state](runs/2026-10-09T05-20-18.615Z/local-check-state.json). Exact commands, exit codes, durations and complete stdout/stderr are in that run directory. Stage A is the original 16 checks; the two durable/lifecycle integration checks are additional Stage B validation.

| Command | Exit | Result | Run log |
|---|---:|---|---|
| npm run check:commerce-economics | 0 | PASS | check_commerce-economics.log |
| npm run check:commerce-stripe | 0 | PASS | check_commerce-stripe.log |
| npm run check:commerce-canonical | 0 | PASS | check_commerce-canonical.log |
| npm run check:commerce-catalog-runtime | 0 | PASS | check_commerce-catalog-runtime.log |
| npm run check:pws-report-successor | 0 | PASS | check_pws-report-successor.log |
| npm run check:guided-report-successor | 0 | PASS | check_guided-report-successor.log |
| npm run check:vfr:shared-core | 0 | PASS | check_vfr_shared-core.log |
| npm run check:runtime-migrations | 0 | PASS | check_runtime-migrations.log |
| npm run check:bazi-deep-manuscript:r2-prelive | 0 | PASS | check_bazi-deep-manuscript_r2-prelive.log |
| npm run check:cloudflare-function-import-compat | 0 | PASS | check_cloudflare-function-import-compat.log |
| npm run check:report-provider-spend-protection | 0 | PASS | check_report-provider-spend-protection.log |
| npm run check:product-total-cost | 0 | PASS | check_product-total-cost.log |
| npm run check:report-followup-store | 0 | PASS | check_report-followup-store.log |
| npm run check:my-reality-saved-sources | 0 | PASS | check_my-reality-saved-sources.log |
| npm run check:package-aliases | 0 | PASS | check_package-aliases.log |
| npm run check:paid-report-durable-integration | 0 | PASS | check_paid-report-durable-integration.log |
| npm run check:paid-method-lifecycle-integration | 0 | PASS | check_paid-method-lifecycle-integration.log |
| npm run check:pages-build | 0 | PASS | check_pages-build.log |

Stripe log PAYMENT_FAILED messages are expected synthetic negative cases within a passing check, not a real payment or failed overall check. The durable adapter uses 6 fixture transports; the 12-method lifecycle uses 84 fixture calls. Real provider calls and real spend: 0. Synthetic accounting amounts are fixture data, not incurred costs. Remote network is blocked by local-only preload plus repo zero-cost guard, and model/Stripe credentials are removed from check environments.

## Merge and ownership

121 patch files reviewed; native original raw patch excluding the five conflicts passed git apply --check and 116 files were applied. The initial normalized per-section diagnostic falsely marked three additional files because of line endings; native raw check is authoritative. No --reject was used. Full per-file/per-hunk before/after evidence and final literal-postimage status: [HUNK-RESOLUTION.json](HUNK-RESOLUTION.json). Later local check outputs and concurrent accepted changes supersede some literal patch contexts; they were retained, not reverted to force a patch match.

Five manual files: current owner, Commerce map, Master human review, local guard evidence, shared Master generator. Decisions: [MERGE-DECISIONS.json](MERGE-DECISIONS.json). Original versions: [historical-before-merge](historical-before-merge/). NAV-01–25, accepted receipts, PDS fields, historical prices and validation evidence retained. Current Tarot price RM19; RM9 remains historical. Shared generator ownership checked; generator was not run. Patch-provided foreign-workspace PASS reports remain historical and are not this machine's passing evidence.

Other windows committed portions of the shared worktree while integration was underway. This agent did not commit or push. After user paused other windows, the complete final check ran under one HEAD with unchanged source fingerprints. Live remote main read-only SHA 078ea6e621fc84d9416590966c8fc5ef96fb830a matches cached origin/main; local main is ahead 3, behind 0. Remaining shared-window changes are preserved in GitHub Desktop Changes. No reset, forced overwrite, delta zip, paid calls, migration or deployment. git diff --check and generator node --check exit 0.

## Stage B completed source work

Existing budget/store/context/followup path integrated and checked using real local SQLite with proposed migrations in an isolated database. Request identity now binds phase, projected cost and repair unit; altered replay is denied. Server-only response telemetry distinguishes cached replay (0 provider calls) from fresh fixture call. Will Writing now maps to its Commerce product for followup eligibility without authorizing production. The 12-method check covers owner/environment/entitlement denial, replay, targeted repair, immutable material admission, restart persistence, four saved bilingual fixture answers, fifth-question denial, and the existing shared ProductCostEnvelope. No separate replacement budget pool was introduced.

## Specific remaining source gaps

The fixture result does not prove real prose, professional accuracy, real production renderer or live browser behavior. The 12-method producer/renderer admission matrix is in [STAGE-B-GAPS.json](STAGE-B-GAPS.json). Existing account generation route currently handles controlled Zi Wei; public question material still opens Zi Wei. BaZi has a paid-generation adapter but is not admitted/connected into this account route; its policy productionActivated=false and humanAcceptReceipt=null remain unchanged. Current render contract admits only ZWR. The other method producers and accepted professional/domain validation still need real source integration and authority evidence. Production migrations, method policies and runtime records are not proved by local fixture checks. No frozen hashes or tests were changed to manufacture PASS.

This task is not a full Stage B production completion or LIVE_CUSTOMER acceptance. The original Backend Capability Inventory/Legacy Retirement work remains a separate read-only audit: no deletion approval is claimed by this Commerce merge and no deletion was performed.

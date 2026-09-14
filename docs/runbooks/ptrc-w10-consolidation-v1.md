# PTRC-W10 repository consolidation candidate

Baseline: `0f241bf737fdebcd859d7e9ae64e359d7698bbec`.
Status: **implementation in progress; release blocked**.

The retirement inventory is an initial review scope, not a complete duplicate or public-route census. `ARCHIVE` classifies preserved generated evidence; it does not authorize moving or deleting files. The 34 tracked `dist/` snapshots are checked with UTF-8 LF-normalized SHA-256 so Windows and Linux checkouts agree. These are evidence checksums, not deployment artifact hashes or proof that provider generation is reproducible.

The two article renderer paths remain KEEP pending consumer/reference analysis. The current Pages configuration publishes from the repository root, so generated output exposure and deploy exclusions require review before cutover. No deploy configuration, runtime, historical acceptance or frozen record is changed by this candidate.

## Validation

Use Node from `.node-version` (24.18.0). CI checks out full Git history, runs `npm ci`, `npm run check:ptrc:machine`, and the existing `npm run check` with predecessor order preserved. W9 and W10 are appended to the main check. Machine readiness is not deployed acceptance.

`npm run check:ptrc:release` additionally requires the existing W7 human acceptance. The W10 `--release` check intentionally rejects this candidate; it cannot issue a freeze from empty evidence. A governed follow-up must implement verification of actual release evidence before enabling release acceptance. Existing W1–W7 readiness assertions pin pending human/brand/canary state and also need an explicit successor before accepting completed evidence; never edit historical records merely to satisfy them.

The baseline omitted `site.webmanifest`; this candidate supplies the manifest using the existing approved LOGO-012 URL. W1–W7 now reaches line 93, where the current contextual Ask CSS lacks the required `min-height:44px` contract. W8 and W9 targeted validators pass. Node child-process Git access requires an execution environment that allows spawning Git; PATH changes alone do not remedy EPERM.

## Remaining cutover work

The first full local `npm run check` (with real Git subprocess access) failed at `scripts/check-kap-w11-deterministic-answer-first.mjs:13:8` because the actual answer contained `qualityOutcome: null`. KAP-M3 fixes this by omitting that property only when no PTRC outcome exists. Its separate maintenance record chains the exact one-line runtime change to KAP-M2; historical fixtures and freezes are unchanged. The KAP-W11–W17 current aggregate passes. Regression coverage checks absent/null outcomes, all five real PTRC outcomes, legacy output equality and the exact predecessor digest.

1. Complete duplicate and route/reference census; verify generated-output reproducibility and deployment exposure. Collect build comparisons and obtain specific removal approval before deleting anything.
2. Repair predecessor failures and obtain clean pinned-Node `npm ci` and complete `npm run check` evidence tied to the final candidate SHA.
3. Obtain W1 source asset bytes/derivatives, deployed W5 canaries, W6 browser/accessibility evidence, W9 storage enforcement and PDF visual evidence.
4. Verify environment binding names and readiness without storing secret values. Map DNS and hostnames to the actual project and deployment IDs.
5. Build and hash one immutable preview artifact; record exact source SHA, artifact hash, deployment ID, hostname and UTC timestamp. Two distinct humans must approve all W7 critical cases on that artifact.
6. Record the previous production artifact and a provider-verified rollback command with a concrete deployment ID. Rehearse rollback, record elapsed time and reverify the hostname. The candidate's null rollback command must not be executed or presented as tested.
7. Promote the accepted artifact, version/purge caches, verify production identity and capture signed acceptance evidence. Only then issue a governed `PTRC-v1.0.0-Frozen` manifest with raw artifact hashes and non-blocking findings.

This work creates no tag, commit, deployment, production promotion or deletion. Rollback of these uncommitted source changes is a review action; production rollback remains unverified and blocked.

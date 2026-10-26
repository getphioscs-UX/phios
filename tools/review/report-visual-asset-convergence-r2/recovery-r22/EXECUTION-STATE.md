# R2.2 checkpoint

Status: LOCAL_HUMAN_REVIEW_READY_WITH_BLOCKERS

HEAD c5851dd86618522b0a1bd92465be3ee9ee37214d; actual uncommitted candidate: R22-SOURCE-CHANGES.json plus VERIFIED-SOURCE.json.

Only existing manifest SEC08 and native Ziwei presentation changed in R22. Other source preserved per PRESERVATION.json; additional unrelated shared-owner changes remain untouched.

183 current tests, 120 isolated R1.2 tests,44 receiver checks,11 private safety checks; see individual receipts and exact command logs. Inherited runner interrupted during restoration; seven generated historical outputs were restored after explicit scoped authorization; all seven match initial HEAD bytes, backups and diffs preserved. Do not rerun verify-r22.mjs; use isolated-r12-r22.mjs for R1.2.

PDF counts: Ziwei68(15fixed/53body), BaZi diagnostics4x3. AST and other unaffected R21 samples reused by actual SHA, not newly generated.

ASSET_MAPPING_PASS is distinct from PUBLIC_ASSET_READ_PASS, PDF_RENDER_PASS and PRIVATE_DELIVERY_PASS. Three public404s remain unverified, not absent. Large private delivery blocked by application1MiB limit and missing admitted R2 large-PDF bridge.

No credentials accessed, managementAPI not retried; no production writes, model calls, payments, commits, pushes, deployments.

Authorized receipt recovery: PASS_SEVEN_AUTHORIZED_RECEIPTS_RESTORED; 7 restored, 0 skipped. See authorized-receipt-recovery/AUDIT.json and RESULT.json. Original failed runner and auto-review rejection remain historical.

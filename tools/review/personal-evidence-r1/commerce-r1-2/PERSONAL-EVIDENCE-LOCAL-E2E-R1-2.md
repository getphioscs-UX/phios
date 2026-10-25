# Local execution results

Local implementation candidate · PARTIAL · HUMAN_REVIEW_READY

HEAD: 883c41766072c7f8df3c83947ed9774906f8e35c
Actual uncommitted source digest: 592f492ef8e9becc48e841c9a85009dd3f37dc0e274b49d6d39f9de65c38e70d
Source scope: VERIFIED-SOURCE.json (586 imported/source dependencies). HEAD alone does not identify the tested candidate.


- New account/commerce/budget/security assertions (including signed-download cache, expired grants and PDF cleanup): 120 PASS_LOCAL; real owners with synthetic encrypted session and SQLite data.
- Existing receiver request suite: 44 PASS, original latest receipt restored after reuse; invocation recorded in VERIFICATION.json. Earlier W9 frozen legacy compatibility failure remains historical; no test/hash was changed to force it green.
- Browser: 4 cases (Chinese/English × 390/1440), 66 assertions. Actual Profile and Tarot/I Ching pages, saved source selection (including assessment-only dossiers), preview, reopen, private PDF download and three reading languages.
- Actual PDF renders: 11. Output is a draft; the final reading PDFs use current native owner interpretations for synthetic questions, not live paid customer acceptance.
- Builds: 9 relevant entry graphs compiled; no full unrelated global suite/build rerun.
- Provider/production/R2/Stripe writes = 0. READ_ONLY root middleware regression retained. No real IdP login, production account, webhook, paid model or live sale was exercised.

The attachment's 70-case list is a coverage plan, NOT the same thing as 120 assertions. CASE-COVERAGE.json maps all 70 individually, including PARTIAL/BLOCKED/reused evidence. Failed harness runs are retained in timestamped failure files; no unresolved failure is hidden.

Browser snapshots are representative final results plus failure-only capture. SCREENSHOTS.json inventories count/bytes/hash; none were deleted.


# PHI Cards R2 local integration

Status: PARTIAL_LOCAL_INTEGRATION_HUMAN_REVIEW_READY. Branch main; initial/current HEAD 021c27129604b94f898612134dd0700c47a1e016; remote main read matched 021c2712. No commit/push/deploy.

Existing R1 implementation was reused. The only runtime writes are the existing LOCAL_ONLY adapter, copy selection and current local reader. No new registry, selection engine, paid report system or Provider was created.

Six supplied source files preserve exact bytes/SHA256; 48 cards and 96 languages have six full prose sections plus frozen localized title/subtitle/question and the complete supplied per-card interpretation boundaries alongside a common UI boundary. Four source paragraphs use internal card IDs; only their display aliases change, preserving source. Detailed/concise source lengths are retained.

Tests: 96 browser DOM cases; six changed-alias cases; 23 existing engine checks; 10 existing HTTP checks; 12 benchmark selections recomputed; four legacy suites passed; 96 missing-language safety checks; 48 approved cached WebP hashes equal original remote-byte receipts. Fresh remote asset re-fetch was not performed.

The first sandbox browser launch and HTTP access were blocked by sandbox permissions. The same local checks passed under normal local permissions. Screenshots are 12 stable filenames; no PDF or full build was generated.

- New supplied reading copy remains a separate R2 candidate; 96 language drafts require semantic/editorial human review. R1 12/12 acceptance is unchanged.
- Original WebP artwork contains baked Chinese and English (including some traditional Chinese). No approved monolingual asset variants exist in the supplied registry; image pixels are not single-language. No assets were recreated.
- Customer adapter and existing Profile/Configuration mounts remain LOCAL_ONLY. Production source resolution and real Account admission remain closed.
- No full website build, production report/PDF generation, Stripe or paid-provider execution was run. Module imports/syntax, existing regressions and local browser checks are the verified scope.
- Original R1 browser script asserts old Flowing/Strained headings and writes historical R1 screenshots; it was not rerun against the intentional R2 layout. R2 96 DOM cases, six alias cases, and existing 23 engine/10 HTTP tests cover this local change; original R1 browser receipts remain historical.

Modified files:
- content/ecr-phi-card/customer-reading-r2/ (six original sources + independent reading layer)
- functions/ecr-phi-card/ecr-customer-reading-copy-r2.js
- functions/ecr-phi-card/ecr-customer-experience-r1.js
- scripts/lib/phi-card-customer-local.mjs
- tools/review/phi-card-customer-experience-r1/customer.js
- scripts/import-phi-card-customer-copy-r2.py
- scripts/check-phi-card-customer-r2.mjs
- scripts/close-phi-card-customer-r2.mjs
- tools/review/phi-card-customer-experience-r2/
- content/production-closure/live-customer-commercial-convergence/MASTER-HUMAN-REVIEW.html

## Resolved QA findings

See QA-HISTORY.json. A pending-source/language-switch race was fixed by serializing local reader actions and waiting for the rendered six-card state. The final 96-case browser run passed with the complete per-card source boundaries. Prior sandbox failures were retried under normal local permissions; they were not counted as passes.

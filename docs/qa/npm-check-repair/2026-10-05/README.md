# Guarded npm check lifecycle repair

The ordinary `npm run check` lifecycle now completes `precheck`, `check`, and `postcheck` with exit code 0. `result.json` records the tested upstream commit, Node version, execution times, and log hashes. This is repository validation; no deployment or new human acceptance is claimed.

## Changes

- Resolve exact zero-cost npm wrappers through the existing command registry before validating orchestration. Reject a mismatched wrapper key, missing command, recursive wrapper, or unregistered checker successor; keep paid-network denial active.
- Preserve the deployed identities and checksums of migrations 1–10 and the existing 0012 SQL. Register 0011 as a no-op sequence reservation and 0012 as the existing report-context migration. Verify fresh installation, upgrade from ten migrations, unchanged prior table schemas, and repeated-run idempotence.
- Preserve 22 historical checker files and their governance digests. Route current checks through separately hashed successors. Validate registered successor routes against both the old and current hashes.
- Align current checks with the committed optional Personal Evidence entry, nine admitted PFIG renderers, current report eligibility, R5 account default, and Book VI route. Retired Profile purchase attempts return 422 before creating an order or invoking Stripe; historical purchased material stays readable.
- Give the account persistence test a trusted server-only offline generator dependency. Customer JSON cannot supply a generator; the production default still requires the R5 provider key. Owner isolation, consent, encryption, versioning, renderer receipt, stored-byte integrity, and immutable release assertions continue to run.
- Restore accepted Zi Wei V1 evidence from commit 45cabdb9 without changing its 74 acceptance hashes. Preserve the presentation successor classification committed in dc298f52 in a separate current configuration. Generate regression output in a temporary directory so checks cannot overwrite frozen evidence.
- Restore only the trailing whitespace differences in pre-existing RMO/RRE preservation failures; retain their frozen hashes and semantic content.

## Validation

- `npm run build:pages`: exit 0; Worker compiled and Pages publication boundary passed.
- `npm run check:vfr:zwr-prelive` and `npm run check:vfr:zwr-cache-prelive`: exit 0 after incorporating the concurrent Zi Wei VFR updates.
- `npm run check`: exit 0 across all three npm hooks; complete stdout/stderr is retained in `npm-run-check.log`.
- `git diff --check`: passed. Paid provider network calls: 0.

Real Stripe transactions, deployed browser admission, and production cutover were not run by this repair.

## Concurrent review integration

After the complete run, main advanced with Zi Wei VFR review rendering, page-plan presentation, an optional review-readiness alias, and a review timestamp. These changes were rebased without altering the recorded precheck/check/postcheck commands. The current VFR prelive/cache checks, zero-cost route protection, Cloudflare import compatibility, and Pages build were revalidated; each exited 0. The full-run baseline and later integration baseline are recorded separately in result.json.

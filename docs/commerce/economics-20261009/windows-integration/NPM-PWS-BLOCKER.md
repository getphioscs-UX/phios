# PWS npm blocker — 2026-10-09

Original `npm run check:pws-i2-w2`: exit 1 at migration total assertion, actual 17 / expected 13. Registry audit and outbox counts remained exactly 13 and passed.

Changed the seven PWS-I2 migration-count assertions to require the complete named historical 0001–0013 prefix and contiguous appended versions. No migration, checksum, frozen acceptance document or Registry business assertion changed. Added `scripts/lib/pws-migration-baseline.mjs` for that contract.

The full chain also found a private BaZi review HTML price false positive. Added that exact file to the existing review-evidence classifier; the existing quarantine assertion still verifies docs/tools are excluded from the public Pages build and output. Public HTML price checks remain active.

Actual local results:

| Command | Exit | Result |
|---|---:|---|
| `npm run check:pws-i2-w2` | 0 | PASS |
| `node --no-warnings scripts/check-pws-i2-v1-freeze.mjs` | 0 | PASS |
| `npm run check:runtime-migrations` | 0 | PASS: immutable checksums, history, ordering and drift |
| `npm run check:pws-i2` | 1 | W0–W7 and KH-W3.5F passed; later KH-W3.5G BASELINE_FAILURE |
| `git diff --check` | 0 | PASS |

Remaining full-chain failure: `scripts/check-kh-w3-5g-book-i-knowledge-blueprint.mjs:32`, expected four books / actual five from the current Blueprint directory. The following KH-W3.5H script also contains four-book assumptions, but was not reached in this command. No claim is made about its current result. Historical four-volume migration evidence, current five-volume ownership and inherited consumers require a separate compatibility review; neither frozen evidence nor current blueprints were changed to force PASS.

No real provider call, production migration, deployment, commit or push performed. Other shared-window working changes retained.

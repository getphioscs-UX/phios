# Canonical account person checker compatibility repair

The initial full-regression failure remains preserved in its original log. The checker imported `requireVfrAdmission` from `functions/report-delivery/shared-report-e2e-v2.js`, removed by owner commit `cb66faae`. The current Zi Wei method runtime imports `requireZwrVfrGenerationAdmission` from `ziwei-vfr-profile-policy.js` instead.

Only `scripts/check-canonical-account-person.mjs` was edited. It now directly verifies missing deployed-private-browser admission returns `METHOD_GENERATION_ADMISSION_REQUIRED` (503), and verifies the production default is denied by either that current admission gate or the inherited zero-cost `VFR_REPORT_PROVIDER_LIVE_NOT_ALLOWED` gate, whichever executes first. No deployed admission receipt is synthesized and no live-provider configuration is enabled.

The genuine in-memory SQL migrations, encrypted canonical-person storage, actual Zi Wei calculation, entitlement-policy fixture, account ownership negatives, explicit consent, immutable birth versions, renderer-receipt negatives, released-material immutability, and ciphertext tamper rejection remain intact. The local renderer service remains explicitly a policy fixture, not deployed-browser or Stripe evidence.

Actual command: `node scripts/run-zero-cost-regression.mjs check:canonical-account-person` with the central zero-cost preload and JSON-import compatibility preload. Exit code: **0**. Output: `PASS canonical account person: real SQL, real Zi Wei calculation, owner isolation, encryption, consent, birth versioning, immutable local release. QA not claimed.`

Output log: `check-canonical-account-person-repair.log`. The checker also regenerates its pre-existing `docs/reports/ziwei/production-admission/cpa-v1/local-person-proof.json` output as part of the unchanged test workflow. No runtime, frozen digest, native semantic contract, Commerce implementation, production route, commit, push or deployment was changed.

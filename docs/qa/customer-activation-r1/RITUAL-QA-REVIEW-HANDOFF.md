# 12d5ba62 successor: ritual experience and isolated QA preparation

Local implementation only; no deployment, production writes, payments, receipts or downloads were executed.

- Tarot now uses a separate full-width canvas sequence showing two stacks being cut, interleaved and gathered, then exposes the existing 78-card picker after 120 seconds. Sound is enabled by the start gesture; the old opt-in checkbox is removed.
- I Ching system casting displays six timed coin rounds over 120 seconds, then reveals the existing server-generated result. Presentation randomness does not choose the hexagram. Duplicate starts are locked. Manual-entry and recorded-coin input retain their existing meanings.
- Audio cues and animation use the same animation timeline. Completion, cancellation and page departure close the audio context. Reduced-motion users retain the duration with smaller movements. Browser/device audio restrictions can still prevent sound; naturalness and audibility require the actual-device review.
- The review hub links 132 content decisions and 16 customer checks with Approve/Reject controls. Eight E2E stages are blocked and their approve controls are disabled. Exported decisions remain drafts; they cannot automatically deploy or apply semantic approval. Customer drafts are bound to the current source digest and saved locally when browser storage is available.
- Independent QA target is planned only: `https://getphios-qa.pages.dev`. The configuration contract lists distinct D1, private R2, Stripe Sandbox, secrets, test identity and receipt recipient requirements. Production fallback is forbidden. Every payment-to-download stage remains `BLOCKED_PENDING_QA_DEPLOYMENT`.

## Checks run

Passed: `check-ritual-sequence.mjs`, `check-tarot-shuffle-interaction.mjs`, `check-tarot-full-production-current.mjs`, `check-tarot-tscp-full-production-v1.mjs`, `check-iching-customer-casting-surface.mjs`, `check-iching-customer-self-casting-guide.mjs`, `check-qa-deployment-readiness.mjs`, `check-m8-customer-decisions.mjs`, `check-ca-r1-review-package.mjs`, syntax and whitespace checks.

Not passed: `check-iching-release-freeze.mjs`. Two mismatches are recorded in `iching-freeze-drift-v1.json`: the unchanged checkout's I Ching HTML already differs from its frozen digest, and the casting script changes in this patch. The historical frozen manifest was not overwritten. Release/freeze reconciliation is required before production acceptance. No full-suite PASS is claimed.

## Review and rebuild

Open `M8-REVIEW-HUB.html` locally. Use the content review link for meanings/source decisions, and `M8-CUSTOMER-APPROVAL.html` for observed customer behavior. Enter observations, approve or reject, then export the JSON. For customer exports, run `node scripts/check-m8-customer-decisions.mjs <export-path>` to validate the current version and evidence requirements.

Regenerate with `node scripts/build-ca-r1-review-package.mjs`, followed by `node scripts/build-m8-click-review.mjs`. Recheck using `node scripts/check-ca-r1-review-package.mjs` and `node scripts/check-m8-customer-decisions.mjs`.

QA setup instructions are in `config/qa/DEPLOYMENT.md`. These are offline preparations, not proof of resource creation, secret separation, webhook delivery or Sandbox E2E success. The user will supply the real QA deployment URL when it exists; no credentials are requested.

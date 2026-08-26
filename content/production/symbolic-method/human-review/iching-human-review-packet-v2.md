# I Ching Human Review Packet v2

Status: `READY_FOR_REAL_HUMAN_REVIEW_AFTER_MACHINE_PREFLIGHT`

This packet governs ICH-HR-W0 through ICH-HR-W4. It is a successor to the frozen v1 campaign. It does not modify historical evidence and does not activate public I Ching execution.

## Deployment prerequisites

1. Deploy the commit containing this packet to a non-public review environment.
2. Protect both `/review/iching/*` and `/api/review/iching-execute` with Cloudflare Access.
3. Set `ICHING_HUMAN_REVIEW_ENABLED=1`.
4. Set `ICHING_HUMAN_REVIEWER_EMAILS` to the comma-separated reviewer allowlist.
5. Set `ICHING_HUMAN_REVIEW_DEPLOYMENT_SHA` to the exact deployed `CF_PAGES_COMMIT_SHA`.
6. Run `npm run check:iching-human-review-readiness` before deployment.

The review API also accepts a trusted server context authority for controlled automated testing. Neither mode grants `LIMITED_PRODUCTION`, persistence, public `runAllowed`, or production capability promotion.

## Review procedure

1. Open `/review/iching/` in a browser that has passed the Cloudflare Access policy.
2. Execute each fixed campaign case. The API accepts only `sessionId`; question, line values, Reality fixtures and locale come from the governed campaign.
3. Compare the displayed input, primary hexagram, changing lines, relating hexagram, source claims, source locators, Reality comparison and uncertainty with the expected case data.
4. Mark every rubric criterion explicitly `PASS` or `FAIL`.
5. Record at least one screenshot reference for each accepted case.
6. Choose `ACCEPTED`, `REJECTED` or `NEEDS_FIX`, add notes, then record the review.
7. Download the results JSON frequently. The review harness deliberately writes no browser history, D1 record or server-side persistence.
8. Replace `iching-human-review-results-v2.json` with the downloaded file and run `npm run check:iching-human-acceptance`.

## Acceptance rule

At least 20 of the 24 sessions must be accepted by a real human reviewer, and the campaign must contain zero critical boundary failures. Completing all 24 is the review target.

A rejected or `NEEDS_FIX` record is historical evidence. Do not flip it in place. Repair the underlying code, create new execution evidence, and perform a new human review.

Human acceptance alone does not activate I Ching. Verified account identity, live D1 persistence, live-browser acceptance, deployed-SHA alignment and jurisdictional rights review remain separate gates.


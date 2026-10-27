# PHI Card Customer Experience R1

Status: PARTIAL; local candidate ready for human review. No Customer Closure or Production PASS.

## Authority and implementation

- content/ecr-phi-card/ecr-phi-card-deck-registry-v2.json
- content/ecr-phi-card/ecr-result-to-phi-card-mapping-matrix-v2.json
- content/ecr-phi-card/ecr-phi-card-copy-contract-v2.json
- content/ecr-phi-card/ecr-phi-card-asset-registry-v1.json
- content/ecr-phi-card/admission/ecr-phi-card-customer-admission-v1.json
- content/ecr-phi-card/review/ecr-phi-card-human-review-results-v1.json

The frozen 48 identities, original WebPs, six groups, existing deterministic selector, copy contract and 12/12 customer admission were reused unchanged. Legacy OBSERVE metadata was not extended into any new card. No random selector or ECR calculation engine was added. The current V4.1 governed slots remain distinct from the six-group legacy deck.

New adapter requires trusted existing account identity, explicitly admitted server-owned ECR source, active original ECR_FULL_REPORT entitlement and locale rights. It persists minimal references/card IDs/versions, never full birth inputs, coordinate data, Profile or conversations. All storage uses existing continuity runtime schema in isolated SQLite. A real SQL close/reopen was tested. Revoked records cannot be silently recreated.

Gallery shows all frozen fields including flowing/strained expression. Controlled details show the exact source/mapping lineage. No unrelated first-unit fallback is used. The synthetic fixture lacks version-matched contextual binding, so context stays unbound. Changing interface language translates fixed card copy, not the source interpretation.

The same optional UI is mounted in the actual Profile and Configuration HTML by the local test server only, isolated in Shadow DOM. Existing production page files and Profile/Financial/Estate/relationship owners were not edited. Explicit reflections retain SUPPORT/PARTIAL/OPPOSE/UNKNOWN as user declarations. Existing Case/Checkpoint receives INTERPRETATION and CONSTRAINT, never a verified FACT. Ask/Navigation consumers are not production-connected.

## Actual validation

- 23 domain/security/persistence checks PASS.
- 10 real local HTTP checks PASS (session/CSRF/mass-assignment/owner/revocation/private-file denial).
- 4 browser journeys PASS: zh-Hans/en at 390/1440; 48 real cached CDN WebPs decoded per journey; save/reload/reopen/edit/revoke, both actual page mounts, six filters, modal/detail, controlled lineage and language-stable IDs. Final page errors: 0.
- 4 unchanged legacy card/admission/V4.1 regression suites PASS.
- 48/48 actual remote HTTP 200 WebPs match historical SHA; decoded 1024x1536 originals with 2:3 ratio. Canonical bilingual titles match both registries.
- All 48 visual originals viewed in four QA contact sheets; actual desktop/mobile detail and Gallery screenshots reviewed. Original image bytes were not edited.
- Local service syntax and isolated Node bundle PASS; no shared Pages build output was overwritten.

Initial browser test assertions ran before async rendering settled; waits were corrected. The first successful local harness lacked the existing public visual-registry route, causing CX_ASSET_REGISTRY_404 on the original pages. That narrow read-only static route was added; final journeys have zero script errors. The original limited-harness receipt is retained. A default sandbox denied loopback HTTP with EACCES; the same isolated HTTP suite passed using authorized local execution. No production defect was hidden.

## Remaining gaps

- REAL_ACCOUNT — No real OIDC account result/entitlement resolver mounted. Only isolated synthetic verified-server identity and existing continuity SQLite persistence were exercised.
- CURRENT_V41_GROUP_BRIDGE — Existing V4.1 CARRIER/EXPERIENCE/EXPRESSION/AGENCY/IDENTITY/FEEDBACK slots are not silently relabelled as the frozen CORE/DRIVER/GIFT/TENSION/FIELD/PHASE deck. An admitted current-result bridge remains required.
- CONTEXT_BINDING — No owner-supplied version-matched contextual interpretation unit bindings. Fixed frozen meanings and exact mapping lineage are available; unrelated units are never substituted. Missing contextual translation stays missing.
- ASK_NAVIGATION_CONSUMER — Actual existing Case/Checkpoint creation tested, with INTERPRETATION and USER_DECLARATION kept distinct. No production Ask/Navigation consumer or paid provider was invoked.
- NETWORK_RELATIONSHIP — Existing R2.1 relationship display owner/purpose and canonical factual relationship reader remain unadmitted.
- NETWORK_FINANCIAL_ESTATE — Existing purpose constraint successor requires separate review and authorized production migration. No Financial/Estate grant or production schema was changed.
- FULL_REPORT_AND_REAL_PRODUCT_BINDING — The actual catalog uses COM-REPORT-ECR-FULL / REPORT_ECR_FULL. The local ECR_FULL_REPORT fixture label is not a live entitlement. Existing full-report successor gate remains customerPublishable=false with humanReview=REJECTED; historical 48-card approval does not override it. Current V4.1 R7 card operational admission is already COMPLETE and is preserved, but is not a new CORE/DRIVER/GIFT/FIELD/PHASE mapping or account binding.

## Open local review

Run: node --import ./scripts/lib/pages-json-import-preload.mjs scripts/serve-phi-card-customer-local.mjs

Gallery: http://127.0.0.1:48732/

Profile: http://127.0.0.1:48732/perspectives/profile/?evidence=1&locale=zh-Hans

Press Enter isolated test account; My PHI Cards without source stays empty. Load the clearly labelled synthetic ECR source, explicitly consent and save. Open Profile, reopen reading, choose one or three cards, record a real or synthetic-labelled observation, then explicitly save/reopen/edit/revoke or create an existing Case/Checkpoint. Previous revocations stay revoked.

Human-review DB is under .tmp, cannot be downloaded through the server. No real identity or customer data is seeded. New production routes, real OIDC resolution, provider calls and checkout are not activated.

## Files changed/added

- functions/ecr-phi-card/ecr-customer-experience-r1.js
- scripts/lib/phi-card-customer-local.mjs
- scripts/check-phi-card-customer-r1.mjs
- scripts/check-phi-card-customer-http-r1.mjs
- scripts/check-phi-card-customer-browser-r1.mjs
- scripts/phi-card-customer-assets.mjs
- scripts/phi-card-customer-regressions.mjs
- scripts/serve-phi-card-customer-local.mjs
- scripts/close-phi-card-customer-r1.mjs
- tools/review/phi-card-customer-experience-r1
- content/production-closure/live-customer-commercial-convergence/MASTER-HUMAN-REVIEW.html

Commit / push / deploy / provider / production / R2 / Stripe mutations / production migrations / new products / new card art: all 0. Existing dirty shared visual registry and other-window recovery files were preserved.

## Actual commercial / interpretation owner audit

See SOURCE-AUTHORITY-AUDIT.json and COMMERCIAL-OWNER-AUDIT.json. Real commerce product is COM-REPORT-ECR-FULL, entitlement policy REPORT_ECR_FULL; no Stripe call was made. ECR_FULL_REPORT in the local fixture is an explicit test interface label, not an awarded live entitlement. No real product-to-result resolver is connected. Existing formal ECR-FULL-R1 publication remains customerPublishable=false / REJECTED. Current V4.1 R7 card operational admission is COMPLETE; its governed slots and semantic gates were not rewritten or demoted. Historical method and 48-card approvals do not automatically admit the newer full report or remap its current slot meanings.

## Concurrent-window preservation and final deep report regression

Another window changed functions/ecr-full-report/ecr-author-led-publication-r31.js during this run. The before/current hash difference is recorded in PRESERVATION-CHECKS.json; no rollback or overwrite was executed. Current syntax check passes. The existing check-ecr-full-r1-current.mjs also passed 64 structural cases / 128 bilingual executions, including free/paid isolation and shared lineage. Its existing human acceptance remains REJECTED. This is an additional existing report suite, separate from the four card/V4.1 suites. All other snapshotted protected source files stayed identical.

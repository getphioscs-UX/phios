# RIC R3-L1 local product integration

Human ACCEPT R0–R2 applies only to the accepted local reference candidate. Current L1 is a new local review candidate; neither acceptance authorizes production or persistence.

## Source/owner matrix

| Path | Owner / role | Change | Conflict handling |
|---|---|---|---|
| functions/api/world-observations.js | Existing public observation endpoint | READ ONLY; real HTTP requests | Hash-bound; no overwrite |
| functions/_lib/world-evidence.js + content/world/*.json | Existing evidence validation/calculation | READ ONLY | Existing sources preserved |
| assets/js/pages/civilization-atlas/world-reading-context.js | World planner/query/answer | READ ONLY consumer | World parallel work protected |
| functions/_lib/knowledge-reality-handoff.js | Ask source-reference projection | READ ONLY projectKnowledgeGroundingForHandoff | No persistent Journey consent used |
| scripts/lib/reality-data-governance/rdg-access-rights-v1.mjs | Canonical RDG visibility/data permission | READ ONLY evaluateVisibility/evaluateDataPermission | No new permission issuer or consent token |
| functions/customer-projection/my-reality-workspace-projection.js | Existing My Reality workspace | READ ONLY; externalEvidence preserves rich objects | No string-only provenance projection |
| functions/customer-projection/reality-navigation-graph-projection.js | Existing Graph owner | READ ONLY | Edges empty; G3 NO_VERIFIED_HISTORY |
| functions/customer-projection/ric-world-session.js | New thin consumer of the above + accepted RIC | NEW opt-in module | No production route registration |
| assets/customer-ui/js/surfaces/ric-world-session-panel.js | New opt-in local product panel | NEW browser module | No World/BaZi/Finance page edits |
| tools/review/reality-information-contract-r1/L1/* | Local transport, tests and evidence | NEW | No deployed API/configuration |
| RIC-HUMAN-REVIEW.html / RIC-MASTER-STATE.json | Existing unique review/current checkpoint | APPEND SUCCESSOR | Accepted R2 originals and manifest preserved in L1 |

## Actual request chain

The product panel POSTs a public question in the body to the local transport. answerWorldSession calls the existing World planner and queryWorldEvidence, which makes a real GET to the existing /api/world-observations handler. Its pinned owner validates source identities and derives the HMDA action3/(action1+action2+action3) result. composeWorldAnswer supplies the direct bounded bilingual answer. RIC admits each observation and the separate derived calculation. The Ask owner's reference-only projection is invoked; there is no model call or new Ask engine. Explicit item selection and explicit consent then pass the existing RDG visibility/permission evaluator before the existing My Reality workspace receives source-rich items.

The derived conclusion carries all three input sources; a raw observation carries only its own source, not a detached full calculation. Source ID/version, original fragment/URL, observation/publication/retrieval times, jurisdiction, definition, population, unit/frequency, nature, permissions, limitations and unknowns remain attached. Null publication dates remain null. HTTP-EVIDENCE.json compares source objects before/after without metadata projection loss.

## Permission and identity boundaries

Public read is separate from question processing, session selection/use, saving and later reuse. Defaults are no selection and no consent. Selection requires current answer IDs/version, explicit acceptance, RUNTIME_CONTINUITY purpose, matching current session subject, non-expired and non-revoked state. The adapter enforces these preconditions then calls existing RDG; it does not issue a grant/token. The local HTTP-only SameSite session cookie is a transport isolation key, not an account, consent token or production credential. Two browser sessions and two HTTP clients are isolated. No real account authentication or cross-account data reading is claimed.

Session state is memory-only in the localhost harness, with a ten-minute default expiry and no localStorage, sessionStorage, filesystem or database persistence. Refresh/back can reread the same selected version in that live session, but revocation/expiry/source invalidation makes later reads empty. Fresh source checks run before existing selections are rendered. Asking a new question revokes the prior session use before querying; failed answers do not silently reuse it. A server restart drops all sessions. No public URL/log/screenshot contains private customer data or transport-cookie values.

## Proven version and error coverage

Real pinned HMDA 2024 and 2025 artifacts have different source versions and scopes. Replacing the question/scope invalidates prior selection; replaying old IDs/version is rejected. Substituting the real 2025 response into a 2024 recheck also fails identity/period validation. This is a real source/scope replacement test, NOT evidence of a same-period publisher revision, a customer's changed circumstances, an action or a canonical historical event. No such real revision/history owner was available, so no revision/outcome is invented. Errors include real missing period and injected HTTP/transport failure, explicitly labeled as injection.

## Real limits / next stage

This completes an opt-in local module/HTTP/product-panel chain. The official World page, production Ask route and authenticated My Reality page are not globally wired; they remain protected. The accepted RIC module is imported from its review directory only by this isolated candidate, so production promotion would require separately reviewed canonical placement and route admission. Persistent saving, true account entitlement, professional sharing, relationship edges, verified history, migration and production runtime remain NOT_IMPLEMENTED / NOT_EXERCISED. Ask reuse is the existing source-reference projection, not paid synthesis. General free-text coverage remains the existing bounded World planner; missing evidence produces no selected facts. No new database, account, permission engine or Reality graph owner is created.

## Commands

- R2 before product edits: node --test tools/review/reality-information-contract-r1/tests/ric.test.mjs — 47/47, exit 0. Its generated result was restored byte-for-byte to its accepted hash; rerun receipt is separate.
- Local HTTP: node --import ./scripts/lib/pages-json-import-preload.mjs --test tools/review/reality-information-contract-r1/L1/integration.test.mjs
- Browser: node --import ./scripts/lib/pages-json-import-preload.mjs tools/review/reality-information-contract-r1/L1/browser.mjs
- Preview: node --import ./scripts/lib/pages-json-import-preload.mjs tools/review/reality-information-contract-r1/L1/server.mjs --serve

Only four representative L1 screenshots are retained, alongside the unchanged accepted R2 set. No cleanup/deletion performed. Provider cost, real payments, production D1/R2 writes, commit, push and deploy remain zero for this task. Production isolation/runtime status is RUNTIME_UNVERIFIED.


## Final successor binding

An answer version binds the exact original question, language and public source version. A separate sourceVersion is used for fresh public-source rechecks. Reusing the same sources for a different question or language does not carry prior selection forward; old answer/claim IDs are rejected. Five HTTP scenario groups pass, including this replay denial. Four complete bilingual viewport flows validate the actual API response and RDG state. The final compiled consumer is hash-bound in COMPILE.json; no bundle was written or deployed.

SOURCE-FIELD-PRESERVATION.json gives the before/after values for every retained source field. OWNER-INTEGRITY.json records unchanged shared owners and separately records concurrent external work without changing it. R2-ACCEPTED-INTEGRITY.json preserves the original accepted files; only the unique review and current master journal are successor updates, with original bytes archived.

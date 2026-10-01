# Zi Wei production admission — local controlled evidence

General production admission is **not granted**. Frozen R2 editorial acceptance remains valid. Astrology Method Reports has not started: Zi Wei QA account delivery has not passed.

## Environment and fixture discovery

The deployed QA origin is `https://qa.phios-github.pages.dev`, supported by `wrangler.jsonc` (project `phios-github`), deployed report-delivery evidence and newer Preview authentication evidence. `config/qa/environment-contract.json` contains an older planned `getphios-qa.pages.dev` origin marked deployment-blocked; it was not selected. No production requests were sent.

Existing Preview fixtures cover professional-report delivery; existing local tests provide isolated SQLite and simulated trusted account identity. No reusable authenticated QA account/person with Zi Wei canonical birth-input lineage was found. The new [controlled fixture](production-admission/controlled-subject.json) follows those mechanisms, has a stable task-specific subject ID and explicit source lineage, and creates no login account. Birth values are explicitly reused from an existing synthetic source; no historical identity is inferred or rebound.

See [discovery](production-admission/discovery.json) and [read-only QA HTTP results](production-admission/qa-discovery-http.json). QA authentication is configured, but the current browser shows Guest and `/api/account-reports` returns 401. These checks are not QA delivery E2E.

## Completed local chain

Canonical person/input → current real Zi Wei calculation → admitted claims → existing Publication IR → frozen R2 composition and S11 presentation → immutable customer-delivery snapshot → private released material → account-scoped list/open service.

Both locales produced 33 actual printed pages. Twenty-one rejection cases cover anonymous access, client entitlement assertions, production use, absent subject owner, wrong person, changed birth input, unpurchased language, wrong cover binding, missing render verification, cross-account reads, revoked consent/entitlements and material tampering. Reopening returns unchanged stored material without invoking calculation or composition. Releasing the same snapshot twice is idempotent.

The test executes the real `ownedReportPresentation` query against existing migrations in isolated SQLite. Purchase/entitlement rows are seeded test data, **not** a verified payment or webhook. The private object adapter is in memory. The account list/open service is exercised directly; it has not been wired into or proven through the deployed account-library UI.

Evidence: [local delivery results](production-admission/local-delivery-evidence.json), [English controlled report](../../../tools/review/ZIWEI-CONTROLLED-DELIVERY-en.html), [Chinese controlled report](../../../tools/review/ZIWEI-CONTROLLED-DELIVERY-zh-Hans.html).

Reproduce with `npm run check:ziwei-controlled-delivery`. It runs only local calculation, local SQL/object fixtures and Edge print verification; it creates no remote account, payment, entitlement or release.

## Actual production blockers

1. **General generation coverage:** six real controlled calculations were exercised; four new chart structures fail in the frozen editorial composer with an undefined star reference. Its Work and Health branches assume structures represented by the accepted samples. The controlled adapter rejects structures outside the two reviewed shapes before composition. This is a safety bound, not universal production admission. [Coverage audit](production-admission/generation-coverage-audit.json).
2. **Canonical person owner integration:** the existing RDG person-use policy is reused, but a live account-owned canonical person/input loader is not bound. The local test injects its governed fixture through a server-only dependency. No alternate login or person persistence architecture was created.
3. **QA delivery E2E:** an authenticated QA session, real QA entitlement state, server render verification, generation/release integration and account-library UI delivery remain unproven. The professional-report release owner is not repurposed to fabricate a professional signature for this method report.

Next engineering step: build a separately governed production-composition successor for unrepresented chart structures, retaining frozen R2 as the reference. Then bind the existing canonical person owner, integrate the QA customer/library route, and obtain authenticated QA E2E evidence. Production verification follows only after QA and existing production gates pass.

Current machine-readable status: [production-admission-state.json](../../../content/reports/ziwei/production-admission-state.json). Local calculation, binding, negative entitlements and immutable snapshots PASS; QA account delivery NOT_PROVEN; production delivery NOT_RUN. Editorial acceptance does not override these gates.

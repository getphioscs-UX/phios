# Jurisdiction capability decision reference

**Implementation attachment only. This is not deployed code, approved legal content, a professional licence determination, or a signing service.** The root implementation owner must incorporate this design into the formal owner contract before any production integration. It must not become a browser-only authorization gate. This is a **server-side Node reference** using only built-in `node:crypto`, `node:test` and `node:assert`; it is not intended for direct browser import.

## Files and local verification

- `jurisdiction-capability-reference.mjs`: deterministic decision and display-projection functions; no IO, provider call, canonical write, document generation, signing, or new financial calculations.
- `jurisdiction-capability-reference.test.mjs`: Node built-in `test` / `assert` scenarios. The artificial success bundles and receipts are labelled `TEST_ONLY`; they are not legal approvals.

Run from this directory:

```sh
node jurisdiction-capability-reference.test.mjs
```

## Three independent dimensions

Every decision returns `coverage`, `factsReadiness`, and `runtimeIntegration`, each with its own status and blockers. `allGatesPassed` is true only when all three dimensions are `READY` and the full blocker list is empty. A ready data profile does not establish legal coverage, and legal research does not establish an integrated service.

| Feature | Coverage in the initial reference | Facts gate | Runtime gate |
| --- | --- | --- | --- |
| `BASIC_PREPARATION` | General data preparation | Partial data entry is permitted | Owner integration and contract receipt |
| `PURE_MATH` | General mathematical operation | Owner-validated inputs and bound calculation model; no tax/legal inference | Owner integration and contract receipt |
| `TAX_ESTIMATE` | Malaysia is only a candidate; no approved tax bundles are supplied | Explicit jurisdiction, assessment year and tax residency plus validated input evidence | Owner integration and contract receipt |
| `AI_FACTUAL_REPORT` | Factual summaries only | Frozen/validated source snapshot, bound report contract, active REPORT-purpose authorization tied to snapshot/scope/language | Owner integration, contract receipt, exact allowed service scopes/languages |
| `WILL_PREPARATION` | Information and wishes preparation | Partial preparation is permitted; this does not select legal clauses | Owner integration and contract receipt |
| `WILL_SIGNING_TEXT` | **Zero approved bundles in the initial registry** | Independent facts, date consistency, owner assessment bound to bundle ID/version, profile revision and decision-context digest | Owner integration and contract receipt |
| `PROFESSIONAL_HANDOFF` | Verified recipient jurisdiction scope and service scope are required | Validated packet and active, unrevoked, unexpired handoff authorization bound to recipient, snapshot, data, jurisdiction and service scope | Owner integration and contract receipt |

All runtime integrations default to unavailable in this standalone attachment. A `READY` result describes the reference capability gates only; it never says a Will is valid/executed, that a professional is licensed for every service, or that data has been sent. Personalised plans to meet financial objectives are outside `AI_FACTUAL_REPORT`; an owner must establish a separate appropriate professional-service contract for that product.

`UNKNOWN` means required evidence or a fact is absent/unknown/declined. `UNSUPPORTED` means an explicit scope has no catalogued route or falls outside a feature's defined scope. `EXPIRED` means a selected source/provider review or a signing bundle's applicability has expired. `REVIEW_NEEDED` covers pending approval, ambiguity, complexity and absent integration. The leading display status uses `UNSUPPORTED > EXPIRED > UNKNOWN > REVIEW_NEEDED`; this is a display priority, not a statement that other blockers are resolved. Every blocker remains in the result.

## Facts are separate, explicit and purpose-limited

The Will-signing branch expects and checks these independent fields without storing them:

- Current `residence` and `habitualResidence`, with a subdivision when needed.
- `citizenships` as an explicit list, never derived from a name, race or address.
- `domicile.country`, `domicile.subdivision` where relevant, and `domicile.status`. `DECLARED` records a user's statement; it does not establish legal domicile. `NEEDS_REVIEW` blocks the simple route.
- Asset `location` and `ownership`, plus owner evidence that the inventory was deliberately completed. An empty confirmed inventory differs from a missing inventory.
- Relevant self-declared `personalLaw.islam` and, for the Sabah/Sarawak preparation route, `personalLaw.customaryLawApplicability`. Unknown or declined answers stay unresolved. These inputs are requested only where relevant; race and ethnicity are never read.
- Requested jurisdiction, planned signing place/date/method, language, birth date, marital status and any declared complexity flags.

Tax separately uses `tax.jurisdiction`, `tax.residencyStatus` and `tax.assessmentYear`. `tax.filingYear` may be stored by the owner but never selects the tax bundle. A manual rate remains an assumption for an explicitly illustrative calculation; it does not create verified tax coverage.

Current residence, habitual residence, citizenship, domicile, asset location and signing location do not substitute for one another. A requested jurisdiction is a routing request, not an effective choice-of-law conclusion. The reference's single-jurisdiction/sole-ownership route is a deliberately conservative product scope. Cross-border facts, unresolved domicile and other ownership structures trigger review; this is not a claim that such Wills are inherently invalid.

## Initial jurisdiction candidates

| Candidate | Routing distinction | Initial signing-text status |
| --- | --- | --- |
| `MY_PENINSULAR` | Muslim declaration follows a separate route because the Peninsula Wills Act exclusion matters | No approved bundle; never READY |
| `MY_SABAH` | Separate regional rules and relevant personal/customary status | No approved bundle; never READY |
| `MY_SARAWAK` | Separate regional rules and relevant personal/customary status | No approved bundle; never READY |
| `SG` | A Muslim declaration retains the Wills formalities route with AMLA review; it must not reuse Malaysia's exclusion | No approved bundle; never READY |
| `GB_ENGLAND_WALES` | England and Wales only; Scotland and Northern Ireland are not included | No approved bundle; never READY |

Labuan is not silently treated as Peninsular Malaysia. Subdivision strings in this attachment are internal routing labels, not an asserted universal ISO-address contract. The owner must resolve them into its formal address/jurisdiction schema.

The legal distinctions are research inputs, **not approved templates**. Previously checked official material includes:

- Malaysia Wills Act 1959, ss 1(2), 2(2): https://lom.agc.gov.my/ilims/upload/portal/akta/LOM/EN/Act%20346.pdf (official reprint incorporating amendments to 1 January 2006; its age itself requires proper approval/version review).
- Sabah Wills Ordinance: https://sagc.sabah.gov.my/sites/default/files/law/WillsOrdinance.pdf (official reference copy dated 30 March 2016).
- Sarawak probate administration guidance: https://kuching.sarawak.gov.my/web/subpage/webpage_view/204 (including the separate 2023 administration rules context; not a complete will-validity code).
- Singapore official judgment explaining the Wills Act / AMLA relationship, 14 May 2026, paragraphs 19–20: https://www.elitigation.sg/gd/s/2026_SGHC_104 . AMLA s 111(2)(a) preserves the Wills Act except s 3; Malaysia's blanket exclusion must not be copied into Singapore routing.
- England and Wales current signing guidance: https://www.gov.uk/make-will/make-sure-your-will-is-legal . Law Commission proposed reforms remain separately labelled as proposals: https://lawcom.gov.uk/project/wills/ .
- Malaysia CMSA Schedule 2, Part 2, item 6: https://www.sc.com.my/api/documentms/download.ashx?id=ff8ed6d5-2071-4eda-a636-95a8efcabef9 . A factual report boundary must not be treated as automatic clearance for personalised financial planning.

The module neither fetches nor validates these sources at runtime. Approval records, effective dates, approved clause text, scope and language must be established through the actual owner/legal review process.

## Matching and fail-closed behaviour

1. Validate the explicit evaluation date. No system-clock or current-year fallback is used.
2. Evaluate runtime integration independently. A browser's `country`, `ethnicity` or checkbox cannot establish owner evidence or integration.
3. Check the feature's required facts, retaining all missing/invalid fact paths. Global preparation and mathematics do not ask for unrelated legal identity.
4. Resolve the requested candidate and declared personal-law route without inferring missing answers. Missing facts never become `NO`, `SOLE`, `RESIDENT` or a default country.
5. Match bundles by exact declared scope. Zero matches stays pending/unsupported as appropriate; multiple matches require review instead of first-match-wins.
6. Require approval provenance, verified-effective source status and a nonexpired review date. Will coverage also needs a signing-date applicability window, approved clause references, approved language/method, and an owner eligibility assessment bound to this bundle and profile revision. The reference does not perform the underlying legal assessment.
7. Return all blockers and binding hints. Re-evaluate after any relevant input, source, bundle, locale, signing date or ownership change. A previous `READY` result is never a reusable authorization token.

Tax applicability is assessment-year based. A historical tax bundle is not replaced merely because filing happens in a later year. A law's historical applicability and the freshness of the owner's review are distinct. Proposed or unverified source status blocks readiness even if someone has populated approval metadata.

## Integration boundary the root owner must finalize

Before production, the root owner must bind the fact schema, canonical source revision/digest, exact approved bundle/clauses, evidence provenance, professional verification, consent version, source review policy and runtime contract into its existing server-side owner workflow. Client input must never supply or override the registry, approval records, validation receipts, integration receipts or professional verification. This pure reference cannot authenticate any of those objects.

The owner must also define how changed or revoked consent, changed facts, changed legal packages and changed professional credentials invalidate prior preparation/generation/handoff work. Generating a file and recording an execution event must remain separate states; this module creates neither.

## Exported interface and binding revisions

Exports are `FEATURES`, `STATUSES`, `INITIAL_REGISTRY`, `countApprovedWillBundles`, `buildWillAssessmentContext`, `evaluateCapability` and `projectCapabilityDecision`.

`evaluateCapability` accepts the original `feature`, `facts`, `evidence`, `runtime`, `registry`, `asOfDate` and `evaluationMode`, plus **`asOfInstant`** for AI-report and professional-handoff authorization. `asOfInstant` must be a canonical UTC string such as `2026-10-17T12:00:00.000Z`, and its date must agree with `asOfDate`. There is no clock fallback. Authorization expiry is exclusive: `issuedAt <= asOfInstant < expiresAt`.

The added pure helper is:

```js
buildWillAssessmentContext({
  facts, bundle, registryId, asOfDate, contractVersion
}) // => { schemaVersion: 'WILL_ASSESSMENT_CONTEXT_V1', digest: 'sha256:...' }
```

It uses deterministic JSON key ordering and SHA-256. It binds the reference's decision-read profile fields, the asset inventory, planned signing context, legal bundle metadata/clauses/sources/review window, registry ID, evaluation date and owner contract version. Race and ethnicity are excluded. The helper computes a binding value; calling it does not confer approval. The owner must authenticate the assessment and bind the actual canonical source digest and immutable approved clause content through its established contract.

In addition to `willEligibilityAssessment: 'PASSED'`, the Will receipt requires **all** of `willAssessmentBundleId`, `willAssessmentBundleVersion`, `willAssessmentProfileRevision` and `willAssessmentContextDigest`. A changed bundle version or decision context invalidates an old receipt even if the bundle ID or profile revision was improperly reused. Birth dates after the evaluation/signing date and past intended signing dates are rejected as inconsistent. No legal minimum-age rule has been invented here; capacity and actual legal eligibility remain owner-approved assessment responsibilities.

## Owner authorization receipts, not a consent ledger

`evidence.reportAuthorization` and `evidence.handoffConsent` are projections from the existing owner authorization system. The module neither grants consent nor stores, revokes or resolves consent records. Both receipts require:

- Real non-sentinel string `id` and `version` references.
- `status: 'GRANTED'`, `active: true`, `revocationState: 'NOT_REVOKED'` and no recorded `revokedAt`.
- Canonical UTC `issuedAt` and `expiresAt`, with a valid nonempty interval containing `asOfInstant`.
- The exact `contractVersion` of this feature's runtime receipt.

The **REPORT** receipt also requires `purpose: 'REPORT'` and exact matching `sourceSnapshotId`, `serviceScope` and `language`. These latter two are explicit report facts. Runtime `allowedServiceScopes` and `allowedLanguages` must be nonempty arrays containing those exact complete strings. `reportSourceValidated` and `reportContractBound` remain separate owner gates; true booleans alone do not authorize a model call.

The **handoff** receipt requires `purpose: 'PROFESSIONAL_HANDOFF'` and exact matching `professionalId`, `jurisdictionScope`, `serviceScope`, `sourceSnapshotId` and `dataScope`. The feature now takes `facts.handoff.jurisdictionScope`, and verified professionals expose `jurisdictionScopes`. These are explicit owner-defined scope tokens, for example `MY_PENINSULAR`, `MY_SABAH` or `GB_ENGLAND_WALES`; they are not restricted to a two-letter country field. Matching is exact against an array of verified scopes. A bare country does not silently grant a subnational scope. The reference does not determine which professional qualification is required for a scope; it consumes the owner's verified scope record. Legacy `handoff.jurisdiction` alone is insufficient.

Text identifiers reject booleans, numbers, objects, arrays, empty/whitespace-padded values and contract sentinels. `NOT_YET_PROVIDED`, `DECLINED_TO_PROVIDE`, `UNSPECIFIED` and the existing unknown markers are recognized case-insensitively, including surrounding whitespace. FDR `NOT_APPLICABLE` is not relabelled as missing globally, but is invalid as a source/consent/version identifier. Source references, clause references, languages, signature methods, professional scopes and grant data scopes require actual arrays of distinct nonempty strings. Empty, mixed, duplicate and sparse arrays cannot exploit string `includes()` or skipped array elements.

## Meaning and lifetime of READY

The returned `validity.semantics` is **`AT_EVALUATION_ONLY`**, with `reusableAuthorization: false`. This is a decision about the supplied evaluation snapshot, not a lease or a cached permission. `freshEvaluationRequiredBefore` names `GENERATE` and `SIGN` for Will signing text, `MODEL_CALL` for AI reports, and `HANDOFF` for professional transmission. The display projection preserves this validity information.

`reviewNoLaterThan` is the earliest known review/expiry horizon among applicable inputs, **not a guarantee of permission until that date**. Revocation or changes to facts, sources, bundles, professional scope or runtime contracts can invalidate readiness earlier. A planned signing date beyond the selected bundle's review horizon is blocked in this initial product scope. The owner must recheck current authorization and legal/source status immediately before each actual operation. This reference performs no signing or transmission, and never declares a generated file legally executed.

Other production responsibilities remain with the owner: authenticating receipts and registry provenance, source completeness and exact source binding, authorized data minimization, provider/model prompt/schema version binding, billing/idempotency, post-generation output validation and actual professional licence verification. The explicit receipt checks here do not replace those contracts or create a new persistence owner.

`projectCapabilityDecision` omits raw profile values, but reason codes and legal routes may still reveal sensitive personal-law information. Display them only to an appropriately authorized viewer; do not treat the projection as anonymous telemetry or a public log payload.

No remote repository was changed by these attachments. No provider, professional handoff, signature or payment is invoked.

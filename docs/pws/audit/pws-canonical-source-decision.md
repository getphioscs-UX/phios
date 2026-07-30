# PWS Canonical Source Decision

Baseline: `getphioscs-UX/phios main@39c45784994f36630cad62c368149c1cb99e9b13`

## Canonical decisions

| conflictId | affectedObject | currentPaths | proposedCanonicalPath | legacyHandling | migrationNeed | riskLevel | resolutionStage |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CAN-001 | Professional Identity | Distributed `professional_id` strings | `functions/professional/access/professional-identity-contract.js` | All existing IDs reference this identity; no automatic merging | later persistence | critical | W1 |
| CAN-002 | Capability/Credential/Certification | Workspace flags, financial authority strings, Runtime capability terminology | `professional-eligibility-contract.js` | Explicit namespaces; Legacy fields are evidence/read models | later persistence | high | W1 |
| CAN-003 | Assignment | Task/client assigned IDs | `professional-assignment-contract.js` | Existing fields never grant access | later persistence | critical | W1 |
| CAN-004 | Consent | Several specialist contracts | `professional-consent-contract.js` for general PWS resource consent | Specialist consents narrow, never widen, access | none | critical | existing + W1 |
| CAN-005 | Permission decision | Runtime security and Workspace consent activation fragments | `professional-authorisation-decision.js` | Compose existing guards; no deletion | none | critical | W1 |
| CAN-006 | Authorised read | No authoritative loader | `authorised-professional-data-loader.js` | Existing projections remain internal/read-only | none | critical | W1 |
| CAN-007 | Access audit | Access-event variants | `professional-access-audit.js` for payload-free W1 decision audit | Existing event contracts remain valid domain events | later append store | high | W1 |
| CAN-008 | Customer Journey | Runtime pages/modules/contracts | Existing Runtime Journey ownership | PWS stores references only | none | critical | frozen |
| CAN-009 | Runtime Evidence | Runtime Reading evidence contract | Existing Runtime Evidence ownership | Financial/Professional/Reader material remains source-labelled | none | critical | frozen |
| CAN-010 | Workspace | Runtime, Professional and Financial Workspace contracts | Domain-specific contracts; W1 loader is the only real PWS read entry | Preserve all projections | none | high | W1 |
| CAN-011 | Payment/Receipt/Book Entitlement | Book commerce schema/APIs | Existing Book One commerce | No implicit genericization | none | critical | frozen |
| CAN-012 | Professional service commerce | Static catalogs and contract-only payment record | Future generic Order/Payment/Entitlement service layer | Preserve static catalog and payment drafts | later persistence | critical | W2 |
| CAN-013 | Report/Deliverable/Signature | Generic and financial reports plus print projections | Future Deliverable composition and explicit Signature operation | Reports remain unsigned until composed/released | later persistence | critical | W3 |
| CAN-014 | Provider output | Entry/Reading routers | Existing Runtime stage gates | Provider output remains candidate/non-authoritative | none | critical | frozen |
| CAN-015 | Provider usage/budget | Per-call metadata | Future Provider governance module | No PJA accounting | later persistence | high | W4 |
| CAN-016 | Organization/Governance | Distributed issuer and policy strings | Future governance domain | Preserve references and policies | later persistence | medium | W4 |
| CAN-017 | API error | Multiple exception/status vocabularies | Domain error catalogs; W1 denial codes for access only | Adapt at API boundary, do not rewrite Runtime errors | none | high | W1/local |
| CAN-018 | Persistence | Runtime D1, Book commerce D1, browser storage, contract-only PWS | Existing stores retain ownership; PWS persistence must be separate and additive | No Migration in W1 | later additive migration | critical | W2 |

## W1 authorization order

1. Validate the request and reject wildcard or empty scope.
2. Validate a verified, active Professional Identity.
3. Validate current Professional eligibility for the Assignment capabilities.
4. Validate active Assignment identity, client, service, Journey, purpose and
   resource scope.
5. Validate active Consent identity, client, service, Runtime, purpose and
   resource scope.
6. Emit a deterministic authorization decision.
7. On denial, emit only a payload-free audit record and perform no read.
8. On allow, invoke the supplied reader with exact selectors and return a
   deeply frozen, read-only Workspace projection.

## Rejection catalog

| Stage | Stable reasons |
| --- | --- |
| Request | `request_invalid` |
| Identity | `professional_identity_invalid`, `professional_identity_inactive`, `professional_identity_unverified` |
| Eligibility | `professional_eligibility_denied` |
| Assignment | `assignment_invalid`, `assignment_inactive`, `assignment_not_started`, `assignment_expired`, identity/client/service mismatch, `assignment_journey_denied`, `assignment_purpose_denied`, `assignment_scope_denied` |
| Consent | `consent_invalid`, identity/client/service mismatch, `consent_journey_denied` |
| Purpose/scope | `consent_purpose_denied`, `consent_scope_denied` |

## Frozen boundaries

- Payment and Entitlement are not permission and do not create Assignment.
- Capability, Credential and Certification are eligibility evidence, not
  permission.
- PWS never creates a second Journey or Evidence store.
- AI/Provider output cannot name or promote a formal object.
- The Workspace projection cannot mutate Runtime, promote Evidence, sign a
  Deliverable, call a Provider, or persist data.
- W1 changes no HTML, page controller, API route, Migration SQL, Runtime
  Registry entry, Runtime Contract Registry entry, or content Registry index.

# PWS State Conflict Matrix

Baseline: `main@39c45784994f36630cad62c368149c1cb99e9b13`

| conflictId | affectedObject | currentPaths | proposedCanonicalPath | legacyHandling | migrationNeed | riskLevel | resolutionStage |
| --- | --- | --- | --- | --- | --- | --- | --- |
| STATE-001 | Professional identity state | Financial authority uses `active`; no identity lifecycle existed | `professional-identity-contract.js`: pending verification → active → suspended/revoked | Authority state remains a separate eligibility dimension | none | critical | W1 resolved |
| STATE-002 | Assignment state | Task assignment fields and client display fields have no lifecycle | `professional-assignment-contract.js`: proposed → active → suspended/closed/revoked | Existing assigned IDs remain display/read-model fields | later persistence | critical | W1 contract |
| STATE-003 | Consent state | granted/revoked, service completion, duration and partial revocation interact | Existing `professional-consent-contract.js` evaluated after Assignment | Preserve all existing consent states; no implicit normalization | none | critical | W1 composed |
| STATE-004 | Workspace state | Workspace can move to `awaiting_materials` after Consent alone | W1 AuthorisationDecision must precede any real loader read | Existing contract stays valid for demos/projections, not authoritative loading | none | critical | W1 loader boundary |
| STATE-005 | Client state | `professional_status`, consent status, report status and many financial statuses coexist | Future client read model derived from canonical service/assignment/consent states | Keep front-end labels; prohibit front-end authority decisions | none | high | W2 proposed |
| STATE-006 | Review Queue state | Task contract state and financial filter conditions are independently derived | Future queue projection from Assignment plus source task events | Preserve current deterministic projection | later persistence | high | W2 proposed |
| STATE-007 | Report state | Generic report and financial report use overlapping draft/review/final concepts | Future Deliverable release state owns formal publication | Preserve report-local state; `final` is not automatically signed/released | none | high | W3 proposed |
| STATE-008 | Appointment/payment readiness | Appointment readiness, payment status and consent readiness are displayed together | Separate state machines; W1 explicitly states payment is not permission | Preserve UI and records; no automatic Assignment | none | critical | W1 boundary resolved |
| STATE-009 | Entitlement state | Book entitlement `active` could be interpreted as Journey/PWS access | Book entitlement remains book-resource access only | Never map to Assignment without an explicit future operation | later commerce work | critical | W2 proposed |
| STATE-010 | Provider state | Provider success/fallback can be mistaken for formal Reading completion | Runtime stage contracts remain authoritative; Provider output is candidate input | Preserve routers and fallback | none | critical | frozen |
| STATE-011 | External Reader state | intake `ready_for_professional_review`, interpretation draft and correspondence states overlap Review/Report | Keep External Reader lifecycle namespaced | Compose by references only | none | high | W3 proposed |
| STATE-012 | Navigation/Professional handoff | Professional review recommendation and PWS assignment are not the same state | Future handoff intent may request Assignment but cannot create it | Preserve existing handoff object | none | high | W2 proposed |
| STATE-013 | Responsibility period | W0 defines start/end conditions but no executable state object exists | Assignment active + Consent active + eligible identity yields access decision, not full responsibility persistence | Preserve W0 governance language | later persistence | high | W1 partial; W2 completion |
| STATE-014 | Revocation | Consent, Assignment, identity and Workspace each can close access | W1 deny if any required dimension is inactive; no “most permissive” merge | Preserve domain revocations independently | none | critical | W1 resolved |
| STATE-015 | Error/denial state | Security errors throw; Consent errors throw strings; UI has translated unavailable labels | `PROFESSIONAL_ACCESS_DENIAL_REASONS` provides stable machine codes at W1 boundary | Preserve legacy exceptions behind adapter boundary | none | high | W1 resolved |

## Evaluation rule

No single `status` field authorises a read. The W1 decision is conjunctive:
request validity, verified active identity, current eligibility, active matching
Assignment, active matching Consent, exact purpose, explicit Journey/Runtime
and explicit resource scopes must all pass.

# PWS / PJA Duplication Map

Baseline: `main@39c45784994f36630cad62c368149c1cb99e9b13`

PJA is treated as presentation and journey orchestration. It must consume
canonical Runtime, commerce and PWS decisions rather than create parallel
objects.

| conflictId | affectedObject | currentPaths | proposedCanonicalPath | legacyHandling | migrationNeed | riskLevel | resolutionStage |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PJA-001 | Journey | Public pages and client modules project Journey stage state | Existing Runtime Journey remains canonical | PJA continues rendering only | none | critical | frozen |
| PJA-002 | Professional client | Professional page/client index can look like customer ownership | W1 authorised Workspace projection | Existing index remains minimal read model | none | high | W1 boundary |
| PJA-003 | Assignment | UI/task fields expose assigned IDs without Assignment object | `professional-assignment-contract.js` | Display fields become projections | later persistence | critical | W1 contract |
| PJA-004 | Permission | Page availability/hidden state may look like permission | `professional-authorisation-decision.js` | UI state is never authoritative | none | critical | W1 resolved |
| PJA-005 | Consent | Consent pages collect/display choices; backend contract owns validity | Existing Professional Consent contract plus W1 evaluator | Preserve page behavior | none | critical | W1 composed |
| PJA-006 | Product | Books/services/catalog cards all present purchasable-looking objects | Book One product registry remains canonical for current commerce | Other cards remain content until future activation | none | high | W2 proposed |
| PJA-007 | Payment status | Payment pages are Book One specific but labels can appear generic | Book commerce APIs/tables | Preserve routes and qualify future consumers | none | high | W2 proposed |
| PJA-008 | Entitlement | Account/Membership projection and Book entitlement use similar language | Book entitlement remains authoritative only for Book One | Account preview stays non-authoritative | later persistence | high | W2 proposed |
| PJA-009 | Review Queue | Embedded Professional Workspace queue could become separate client-side state | Existing Professional Task contract; future server projection | Keep deterministic display-only renderer | later persistence | high | W2 proposed |
| PJA-010 | Deliverable | Report pages/print UI could be mistaken for signed Deliverable | Future Deliverable and Signature composition | Preserve report preview; no automatic release | later persistence | critical | W3 proposed |
| PJA-011 | Provider Usage | Customer-facing AI/provider labels could be used as usage accounting | Future Provider Usage ledger outside PJA | Keep disclosure text only | later persistence | medium | W4 proposed |
| PJA-012 | Error | UI translated “not authorised/unavailable” labels are not canonical denial objects | W1 denial codes; future API localization map | Keep strings as presentation | none | high | W1 code; localization later |
| PJA-013 | Professional response | Notes/revisions/follow-up UI pieces could each be called a response | Future Professional Response object | Preserve current labels and source separation | later persistence | high | W3 proposed |
| PJA-014 | Knowledge resource | Explore, Library, Atlas, Books, Articles/Videos concepts are fragmented | Future Knowledge Resource catalog | Preserve routes; no PWS dependency | none initially | medium | separate Knowledge stage |

## Non-duplication rule

PJA may display an authorization decision, Assignment, Payment, Entitlement,
Journey Report or Deliverable, but it may not create or rename one. Payment
success may request the next operation; it does not establish a Journey,
Assignment, professional responsibility, formal report, or permission.

# PWS Gap Matrix

Baseline: `main@7546538b3418c715392eca38dc2738e2a9512679`

## 1. Critical canonical gaps

| Priority | Gap | Current evidence | Consequence | STEP 0.2 requirement |
| ---: | --- | --- | --- | --- |
| Blocker | Baseline check inconsistency | tracked `PDS-W10-DELETE-MANIFEST.txt` is forbidden by `check-pws-w0-baseline-responsibility-boundary.mjs` | `npm run check` cannot pass under STEP 0.1 read-only rules | close in a separate cleanup ticket before STEP 0.2 |
| P0 | Professional identity | role/authority fragments only | access and signature cannot bind to one accountable person | define canonical Professional and identifiers |
| P0 | Capability/Credential/Certification | no PWS lifecycle; Runtime capability is unrelated | eligibility cannot be evaluated | define separate objects, issuer/evidence/status/expiry |
| P0 | Assignment | required by PWS-W0 but absent | purchase cannot safely activate responsibility or Workspace access | define assignment lifecycle, events and persistence |
| P0 | Service entitlement | only book digital entitlement is authoritative | payment cannot prove professional service scope | define entitlement types without duplicating commerce ownership |
| P0 | Authorised PWS loader | explicitly pending | Workspace can display only projections/demo data | authenticate, evaluate assignment+consent+scope, load read-only Runtime |
| P0 | PWS persistence | explicitly disabled | notes, queue, revisions and follow-up cannot operate | define PWS-owned tables and append-only boundaries |
| P0 | Journey Report / Professional Response | absent | formal service outputs lack stable identities | define composition, ownership, version and release rules |
| P0 | Signature/release | automatic signing prohibited; no manual operation | no authoritative deliverable | define explicit human signing and release events |

## 2. Commercial gaps

| Gap | Status | Existing substitute | Risk |
| --- | --- | --- | --- |
| Generic Product | partial | book product registry | treating a service as a digital book product |
| Offer lifecycle | partial | PWS-W1A JSON catalog | static offers cannot be activated/versioned safely |
| Professional Price | partial | fields frozen, amounts pending | checkout cannot quote a valid service |
| Order | legacy/partial | checkout attempts and purchases | no generic order identity or service scope |
| Professional Payment | partial | payment-record contract, gateway disabled | payment record may be mistaken for verified settlement |
| Professional Entitlement | missing | M4C preview entitlement labels | client-side state could be mistaken as authoritative |
| Refund/dispute linkage | partial | status constants only | no lifecycle across order, payment and entitlement |

## 3. Governance gaps

| Gap | Status | Required minimum |
| --- | --- | --- |
| Complaint | missing | identity, subject, owner, status, events, access and retention |
| Incident | missing | security/safety/service incident identity and escalation |
| Restriction | partial | canonical target, reason, scope, issuer, review and expiry |
| Organization | missing | professional affiliation, jurisdiction and responsibility boundary |
| Policy | partial/distributed | versioned policy identity and applicability |
| Permission | partial/distributed | explicit grant/deny/revoke record tied to subject and resource |
| Audit | partial/distributed | one append-only audit contract referencing domain events |

## 4. Provider gaps

| Gap | Current state | Required boundary |
| --- | --- | --- |
| Provider Usage | missing | append-only call identity, provider/model, operation, tokens/units, outcome and Journey/service reference |
| Provider Cost | missing | priced usage, currency, pricing version, budget owner and cost attribution |
| Provider Budget | missing | hard/soft limits and authorization; must not change Runtime truth |
| Professional paid-use policy | registry statement only | entitlement/assignment may authorize use; Provider must never create formal Reading directly |

## 5. Runtime/PWS semantic duplicates

These are suspected overlaps, not deletion candidates:

| Names | Finding | Decision needed |
| --- | --- | --- |
| JS migration registry / JSON executable migration registry | different responsibilities under same name | freeze names or formally distinguish declaration vs executable registry |
| Runtime Capability / Professional Capability | different semantic domains | namespace explicitly |
| Runtime Workspace / Professional Workspace | shared Journey, different write authority | define resource references and permissions |
| Runtime Evidence / Financial Evidence / Professional Observation | source classes differ | preserve non-promotion rules |
| Candidate reconstruction / Candidate Reading revision | both provisional, different lifecycle | define parent type and domain |
| Service catalog / Offer catalog / Appointment service types | overlapping identifiers | canonical Service and versioned Offer references |
| Book product registry JS / JSON | aligned code and content representations | declare one source of truth and generated/read model |
| Purchase / Order | purchase currently substitutes for completed book order | preserve commerce history; define generic Order separately |
| Generic Professional Report / Specialist Report / Deliverable | report types overlap output identity | define composition and release contract |
| Entry provider / Reading provider | intentional stage contracts | share usage accounting only |

## 6. Page gaps

| Page/capability | Gap |
| --- | --- |
| Knowledge | fragmented across Explore, Library, Thesis, Books, Figures and Academy; no single canonical Knowledge landing |
| Articles | no dedicated page or article catalog |
| Videos | no dedicated page or video catalog |
| Checkout | Book One only; no Journey Pass or Professional Service checkout |
| Account | UI contract only; live authentication disabled |
| Client Workspace | several preview/dashboard pages; no authoritative unified workspace |
| Professional Workspace | read-only/projection; auth, data loader, actions and persistence disabled |
| Review Queue | embedded projection only |
| Deliverable View | report page/print projection only; no signed release resource |

## 7. STEP 0.2 sequencing recommendation

0. In a separate authorized cleanup ticket, remove the misplaced tracked
   `PDS-W10-DELETE-MANIFEST.txt` and obtain a full green `npm run check`.
1. Freeze canonical identifiers and ownership for Professional, Capability,
   Credential, Certification, Service, Product, Offer, Price, Order, Payment,
   Entitlement and Assignment.
2. Define responsibility activation: verified Payment → Entitlement, then
   eligibility + consent + Assignment → professional responsibility.
3. Define authorised Workspace resource loading and Permission evaluation.
4. Define Record/Candidate/Journey Report/Professional Response/Specialist
   Report/Deliverable/Signature composition.
5. Define Provider Usage/Cost and audit events.
6. Define Complaint, Incident, Restriction, Organization and Governance
   lifecycles.
7. Only after these contracts are frozen should PJA Checkout, Account, Client
   Workspace or Professional Workspace pages be made operational.

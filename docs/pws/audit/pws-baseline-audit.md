# PWS-ENTRY-W0 Runtime Baseline Audit

Audit date: 2026-07-30

Repository: `getphioscs-UX/phios`

Branch: `main`

Unique baseline: `af22a12be4f466dfe4649c1432fa9e4234608a43`

Production deployment: `https://62ddca6b.phios-github.pages.dev`

Production URL: `https://phios-github.pages.dev`

Mode: read-only audit; five audit documents only

## 1. Result

**Failed.**

The requested Runtime, PWS, PJA, Commercial, Knowledge, Provider and
Professional inventory is complete. The mandatory `npm run check` condition
cannot pass because the baseline contains tracked
`PDS-W10-DELETE-MANIFEST.txt`, while
`scripts/check-pws-w0-baseline-responsibility-boundary.mjs` requires that file
to be absent. The failure was reproduced before editing these documents.
Deleting it is outside this Ticket's authorization.

PWS-ENTRY-W1 is therefore **not allowed**.

## 2. Audit method

An object is counted only when code or a canonical registry defines at least
part of its identity or lifecycle. Page copy, locale keys, roadmap text and
generic word matches are not treated as formal objects.

- `exists`: canonical identity/contract and usable operation exist.
- `partial`: only some schema, state, operation, event, permission, API or
  persistence exists.
- `missing`: no formal object implementation was found.
- `legacy`: an older or substitute implementation is present.
- `productionActive`: `yes`, `no`, or `conditional`. Conditional means a
  deployed route exists but bindings/readiness or authority are incomplete.

Detailed field-by-field evidence is in `pws-current-object-map.md`; current
Runtime topology is in `pws-current-runtime-map.md`; gaps and duplicates are in
`pws-gap-matrix.md`; pages are in `pws-pja-current-coverage.md`.

## 3. Baseline findings

1. Core Runtime has seven frozen stages: Entry, Reconstruction, Reading,
   Navigation, Review, Memory and Continuity. Registry, events, lineage,
   revision, recovery, security and persistence are implemented around them.
2. Book One commerce is the only end-to-end commercial implementation:
   Product, checkout attempt, Stripe payment, Purchase, Receipt, Entitlement,
   delivery and download persistence.
3. `Receipt` is canonical for Book One commerce. `Payment Status` is a deployed
   page/API state, not a generic PWS lifecycle.
4. Professional Service, Offer, Price, Workspace, reports, consent,
   appointments, financial modules and external-reader modules have extensive
   registries/contracts, but operational PWS identity, assignment, authorised
   loader, actions and persistence remain disabled or absent.
5. Professional, Capability, Method, Service, Price, Consent, Workspace,
   Specialist Report, Deliverable, Signature, Follow-up, Policy, Restriction,
   Governance, Permission and Audit are partial.
6. Credential, Certification, Assignment, Journey Report, Professional
   Response, Complaint, Incident, Organization and Provider Budget are missing.
7. Provider Policy exists through `content/registry/provider-closure.json` and
   the Entry/Reading routers. Provider Usage is returned by provider adapters,
   but no authoritative ledger, event stream, cost attribution or persistence
   exists.
8. Knowledge is active through Books, Thesis, Figures, Glossary, Library,
   Explore and Academy, but no single Knowledge Resource lifecycle exists.
   Articles and Videos have no dedicated production page/catalog.
9. Review Queue is an embedded deterministic read-only projection. Deliverable
   View is a report projection/print surface without authoritative signature
   and release persistence.

## 4. Current ownership

| Owner | Existing responsibility |
| --- | --- |
| Core Runtime | Journey identity; Entry through Continuity; Evidence; Candidate; events; revision; lineage; recovery; persistence |
| Commerce | Book Product, checkout, Payment, Purchase, Receipt, Entitlement, delivery and download |
| PWS | Professional registries/contracts, consent boundaries, workspace projections, specialist/financial modules, report projections |
| PJA/Public | Public and Knowledge pages, Reality Journey UI, Book checkout/status UI, Account and Workspace projections |
| Provider layer | Rule Engine, Workers AI, OpenAI and professional-review fallback policy for Entry/Reading |

## 5. Must-preserve implementations

- The seven-stage Runtime sequence and shared Journey identity.
- Runtime Evidence class/permission and non-promotion boundaries.
- Append-only Runtime events, revisions and lineage.
- Rule-first Provider order and failure fallback.
- The prohibition on Provider persistence and Provider-created formal truth.
- Book commerce Product/Purchase/Receipt/Entitlement tables and idempotent
  webhook/fulfillment flow.
- Separation of customer originals, formal Runtime records, professional
  working notes, candidate revisions and signed outputs.
- PWS consent, assignment-required, resource-scope and purpose boundaries.
- Read-only Professional Runtime View and disabled automatic signing.
- External-reader interpretation and Professional Observation separation from
  Runtime Evidence.
- Existing legacy/facade paths until a separately authorized migration exists.

## 6. Production observation

On 2026-07-30, the supplied deployment returned HTTP `200` for `/`.
`/api/health` returned:

```json
{"success":true,"service":"PHI OS Platform v2","status":"healthy"}
```

This proves deployment availability only. Feature-level `productionActive`
values also respect code readiness, bindings and authority boundaries.

## 7. Frozen counts and prohibited-change verification

| Frozen surface | Before | After |
| --- | ---: | ---: |
| SQL migrations | 4 | 4 |
| Executable migration entries | 4 | 4 |
| Runtime contract entries | 20 | 20 |
| Runtime module entries | 19 | 19 |
| Content registry index entries | 48 | 48 |

No business code, Contract, Migration, Registry, page, Legacy or page behavior
was changed. Only the five required files under `docs/pws/audit/` differ.

## 8. Check result

Command:

```text
npm run check
```

All checks before the following baseline assertion passed:

```text
AssertionError: Misplaced W9 artifact remains:
PDS-W10-DELETE-MANIFEST.txt
```

Because the Ticket forbids deleting existing/Legacy material and requires a
green full check, the correct final status is `Failed`, not
`Conditional Passed`.

## 9. Entry decision

PWS-ENTRY-W1 is not allowed. A separate authorized baseline-cleanup Ticket must
remove the misplaced tracked manifest and obtain a complete green
`npm run check`. That cleanup must remain independent from PWS-ENTRY-W1.

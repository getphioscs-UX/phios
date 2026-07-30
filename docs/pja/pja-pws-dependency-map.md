# PJA-W0 PWS Dependency Map

Status: **Frozen v1.0.0**  
Baseline: `main@fbd136e6d53de37bad2fd53fcc8c6c1753b3830b`

## Complete dependency map

| Object exposed by PJA | Sole source / owner | Current contract state at this baseline | PJA access | Closed activation rule |
| --- | --- | --- | --- | --- |
| Knowledge Resource | PWS-I2 + KH-W3.5G Book I Blueprint; PKR retains node/content authority | frozen and available | read, render, link | Registry Presence ≠ Production Requirement; maximum 8 Active Articles |
| Question Route | PWS-I9 | planned dependency; existing Core Runtime Entry rules are preserved adapters | read, route, render | no canonical route persistence until PWS-I9 acceptance |
| Product / Offer / Price | PWS-I2 / PWS-I4: registration / commercial activation | PWS-I2 frozen; PWS-I4 planned; Book One adapter remains scope-qualified | read, render, link | only PWS-I4 may activate an Offer or Price |
| Payment / Entitlement | PWS-I4 | generic dependency planned; current authoritative implementation is Book One scoped | read, render, route | redirect and client state never confirm Payment or grant Entitlement |
| Consent | PWS-I8 | planned dependency with existing contracts preserved | read, render, route | PWS-I8 owns validity, scope, purpose, revocation and persistence |
| Journey | Core Runtime | frozen and available | read, render, route, link | every mutation passes through the frozen Runtime contract |
| Provider | PWS-I9; Core Runtime execution adapters preserved | governance and Provider Cost planned; execution adapters configuration-dependent | read, render | PJA cannot invoke paid use, keep a cost ledger or promote Provider output |
| Assignment / Workspace | PWS-I5 | planned dependency; current pages and contracts are inactive/read-only projections | read, render, route | no Assignment or authorised Workspace may be inferred from UI state |
| Queue | PWS-I6 | planned dependency; current embedded queue is preview-only | read, render | Queue remains an operations projection and is never browser-owned |
| Deliverable | PWS-I5 | planned dependency; report contracts/pages are previews, not release authority | read, render, link | no signed/released Deliverable without PWS-I5 lifecycle authority |

All ten required dependency rows are closed. The map does not treat planned
logical paths as implemented modules and does not use physical file location
to reassign ownership.

## Current-source traceability

| Dependency | Preserved current paths | Interpretation |
| --- | --- | --- |
| Knowledge Resource | `functions/pws/registry/knowledge-deliverable-type-registry.js`; `content/knowledge/blueprints/book-1-knowledge-blueprint.json`; `content/knowledge/registry/nodes.json` | type, plan and canonical content remain distinct |
| Question Route | `functions/runtime/entry/rule-entry.js`; `functions/runtime/entry/provider-router.js` | Runtime behaviour is preserved pending PWS-I9 canonical routing |
| Product / Offer / Price | `functions/pws/registry/product-offer-registry.js`; `functions/commerce/book-product-registry.js` | Registry definition and current Book One commerce are not generic activation |
| Payment / Entitlement | `functions/commerce/book-commerce-store.js`; `functions/api/book-one-payment-status.js`; `functions/api/book-one-access.js` | existing facts are Book One scoped |
| Consent | `functions/professional/consent/`; `functions/runtime/security/` | preserved contracts do not make pages authoritative |
| Journey | `assets/js/runtime/index.js`; `functions/runtime/`; `content/registry/runtime-freeze-closure.json` | Core Runtime remains the only Journey authority |
| Provider | `functions/runtime/shared/provider-interface.js`; Entry/Reading provider adapters; `content/registry/provider-closure.json` | execution and future PWS-I9 governance remain separated |
| Assignment / Workspace | `functions/professional/access/professional-assignment-contract.js`; `functions/professional/workspace/`; authorised loader | contract/projection paths remain inactive without PWS-I5 |
| Queue | Professional task contract and embedded workspace preview | no canonical Queue object is invented in PJA-W0 |
| Deliverable | Professional report and version contracts; `professional-reports.html` | a preview is not a Deliverable release |

## Fail-closed dependency behaviour

`planned_dependency` means the future owner is frozen but the capability is
not yet available to PJA. PJA must not compensate by creating local state.
`frozen_available` permits only the listed read/projection access.
Book-One-scoped adapters may serve Book One routes only; they cannot be reused
silently as Journey Pass or Professional Service commerce.

The normative row definitions and current paths are checked from
`docs/pja/pja-w0-cross-system-boundary-freeze-v1.json`.

# PJA-W0 Canonical Object Usage

Status: **Frozen v1.0.0**  
Baseline: `main@fbd136e6d53de37bad2fd53fcc8c6c1753b3830b`

## Usage contract

PJA consumes identifiers, state and permissions from the object owner. It may
format labels and compose links, but it never creates canonical identity,
changes canonical state or supplies a write source.

| Canonical object | Authority | PJA usage | Explicitly forbidden in PJA |
| --- | --- | --- | --- |
| Knowledge Resource | PWS-I2 resource type + KH-W3.5G plan; PKR node/content | discovery cards, article/Book/Atlas/Figure links and related-resource projections | new Registry layer, canonical node mutation, publication implied by Registry presence |
| Question Route | PWS-I9 | render the governed destination and safe alternative | local routing ledger, canonical route write, Provider-selected authority |
| Product | PWS-I2 registration / PWS-I4 activation | render active product identity and scope | second Product object, static-card activation, `ServiceProduct` writes |
| Offer | PWS-I2 registration / PWS-I4 activation | render accepted commercial presentation | page-owned terms or activation |
| Price | PWS-I2 registration / PWS-I4 activation | render version, currency and amount from the active Offer | hard-coded authority, client price override or unapproved price |
| Payment | PWS-I4 | render verified status and next permitted action | confirmation from redirect, client claim or translated label |
| Entitlement | PWS-I4 | render active scope and route to an entitled capability | second Entitlement, silent scope upgrade, `ServiceEntitlement` writes |
| Consent | PWS-I8 | present purpose/scope and render authoritative result | validity, revocation, retention or purpose decisions |
| Journey | Core Runtime | render stage, progress, recovery and continuity | identity issuance, state transition, Evidence write or parallel lifecycle |
| Provider | PWS-I9 governance; Core Runtime adapters preserved | disclosure, availability and bounded failure presentation | direct paid invocation, output promotion, Provider Cost ledger |
| Assignment | PWS-I5 | render responsibility and authorised relationship | assignment from purchase, entitlement, page selection or client state |
| Workspace | PWS-I5 | render authorised read model and permitted actions | page-owned canonical records or demo-data fallback |
| Queue | PWS-I6 | render ordered operations projection | enqueue, reorder, accept, complete or persist |
| Deliverable | PWS-I5 | render version, status, source and released resource link | treating preview/print/download as signature or release |

## Non-duplication rules

### Product

PJA has no Product schema, registry or command. `ServiceProduct` is a migrated
legacy alias and cannot return as a write source. A static card or current
Book One product adapter does not authorise a new Journey or Professional
Product.

### Entitlement

PJA has no Entitlement schema, grant operation or persistence. Page visibility,
membership labels, successful-looking redirects and browser storage are not
Entitlement facts. `ServiceEntitlement` remains a read-compatible legacy alias
only.

### Provider Cost

PJA has no Provider Cost object, usage ledger, budget rule or price proxy.
Adapter token limits are technical safeguards, not budgets. Provider Usage,
Provider Budget and future Provider Cost governance remain under PWS-I9;
existing Core Runtime provider metadata remains non-authoritative accounting
input.

## Projection integrity

Every projection preserves the canonical identifier and source scope. Missing,
unknown, pending, denied and unavailable remain distinct. A projection may
translate display text, but translation cannot change object type, state,
permission, price, entitlement scope, provider decision or release status.

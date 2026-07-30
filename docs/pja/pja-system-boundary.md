# PJA-W0 System Boundary

Status: **PJA-W0-v1.0.0-Frozen**  
Baseline: `getphioscs-UX/phios` `main@fbd136e6d53de37bad2fd53fcc8c6c1753b3830b`

## Decision

PJA is the public composition and projection layer. It may read a canonical
decision, render it for a customer, route the customer to the owning
capability, and link projections together. PJA is not a business-object
Runtime, Registry, ledger, persistence owner, entitlement service, Provider
cost authority, or professional operations backend.

The closed PJA capability set for this freeze is:

```text
read
render
route
link
```

The PJA canonical write-source set is empty. A public page, browser state,
query parameter, translated label, checkout redirect, Provider response,
static JSON file or read model never becomes authoritative because PJA
displays it.

## Composition boundary

| PJA may | Required condition | PJA may not |
| --- | --- | --- |
| Display Knowledge Resources | Read PWS-I2 type metadata and the KH-W3.5G plan; preserve PKR content authority | Add a Knowledge Registry layer or require publication from Registry presence |
| Present Product, Offer and Price | Read PWS-I2 registration and only display purchase actions activated by PWS-I4 | Define a second Product, set Price, or activate an Offer |
| Show Payment and Entitlement state | Read a server-authoritative, scope-qualified PWS-I4 projection | Infer success from a redirect or create Entitlement in the browser |
| Request Consent | Route the request to PWS-I8 and render its result | Decide validity, purpose, scope, revocation or retention |
| Render Journey stages | Consume the frozen Core Runtime | Issue Journey identity, transition state, write Evidence or promote Candidate material |
| Explain Provider use | Read PWS-I9 policy and bounded Runtime availability | Invoke paid use, store Provider Cost, or promote Provider output |
| Show Assignment, Workspace and Deliverable | Read authorised PWS-I5 projections | Assign work, mutate a Workspace, sign or release a Deliverable |
| Show Queue | Read a PWS-I6 operations projection | Enqueue, reorder, accept, complete or persist work |

## Dependency gate

PJA fails closed when a dependency is unavailable:

1. An unavailable read model produces an unavailable or orientation state,
   never locally reconstructed canonical data.
2. An inactive Product, Offer or Price produces no purchasable call to action.
3. An unverified Payment or Entitlement does not unlock paid Journey,
   Provider or professional capability.
4. Missing Consent, Assignment or Workspace authority does not fall back to
   query parameters, local storage, demo data or page visibility.
5. Missing Provider Cost authority does not fall back to token caps, UI
   counters or estimated prices.

Existing Book One commerce remains a Book One adapter. Existing professional
workspace, queue and report pages remain inactive/read-only projections until
their owning PWS phases produce accepted read models. Physical file presence
does not activate a capability.

## Source priority

Every PJA decision follows the frozen PHI OS priority:

```text
Reality Integrity / Evidence Boundary / Safety / Law
↓
Frozen Core Runtime
↓
PDS experience contract
↓
PWS / PJA canonical contract
↓
Registry and migration contract
↓
Page implementation
↓
Copy and visual preference
```

A lower layer cannot override an owner above it. Conflicts remain visible and
fail closed.

## Change boundary

PJA-W0 is contract-only. It adds no page behaviour, Runtime module, API,
Provider call, storage, D1 migration, content Registry entry or Knowledge
Registry layer. Responsive, bilingual, keyboard, focus and touch acceptance
remain mandatory when a later PJA step changes a page; they are not applicable
to this boundary-only freeze.

Normative machine-readable evidence:
`docs/pja/pja-w0-cross-system-boundary-freeze-v1.json`.

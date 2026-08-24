# PJA-W0 Page-to-Capability Map

Status: **Frozen v1.0.0**  
Baseline: `main@fbd136e6d53de37bad2fd53fcc8c6c1753b3830b`

This map covers every top-level HTML page present at the frozen baseline. The
map records composition responsibility, not new page activation. Every group
has `writeAuthority: none`.

| PJA capability | Pages | Canonical dependencies | Current activation boundary |
| --- | --- | --- | --- |
| Public orientation | `index.html`, `about.html`, `contact.html` | Knowledge Resource; Journey | production projection; links only |
| Knowledge discovery | `academy.html`, `articles.html`, `explore.html`, `glossary.html`, `library.html`, `thesis.html` | Knowledge Resource | production projection; PJA-W1 adds a published-only Articles projection without creating a write source |
| Knowledge Atlas | `figures.html`, `figure.html` | Knowledge Resource | production projection; source-labelled reuse |
| Book One discovery | `book-one.html`, `book-one-preview.html` | Knowledge Resource; Product / Offer / Price | Book One scope only |
| Book One commerce status | `checkout.html`, `payment-success.html`, `payment-failure.html`, `digital-product-policy.html` | Product / Offer / Price; Payment / Entitlement | conditional Book One adapter; redirect is not Payment authority |
| Account and membership projection | `account.html`, `account-my-reality.html`, `membership.html` | Entitlement; Journey; Workspace | inactive/partial until authoritative read models exist |
| Free Observation privacy | `free-observation.html` | Consent | local-only PWS-I8 projection; no canonical Consent, server write or formal Journey |
| Journey orientation | `reality-journey.html`, `reality-demo.html` | Journey; Question Route | orientation and demo; no formal identity from demo |
| Journey Runtime projection | `reality-entry.html`, `reality-reconstruction.html`, `reality-reading.html`, `reality-navigation.html`, `reality-review.html`, `reality-dashboard.html`, `my-reality.html` | Journey; Question Route; Provider | Core Runtime projection; all mutations stay in Runtime |
| Professional discovery | `services.html`, `professional-boundary.html`, `professional-appointments.html` | Product / Offer / Price; Assignment | catalog and preview only; no professional activation |
| Professional operations projection | `professional-workspace.html`, `professional-reports.html`, `external-reader-intake.html` | Consent; Assignment / Workspace; Queue; Deliverable | inactive/read-only until PWS-I5/I6/I8 read models exist |
| Policy and consent orientation | `professional-consent-sharing.html`, `professional-data-privacy.html`, `privacy.html`, `ai-disclosure.html`, `terms.html` | Consent; Provider | policy projection; no consent validity or Provider accounting write |

## Post-freeze page extensions

The frozen baseline table above remains historical authority. Additive pages are
registered in `docs/pja/pja-page-capability-extension-v1.json` and inherit the
same `writeAuthority: none` boundary.

| PJA capability | Pages | Canonical dependencies | Current activation boundary |
| --- | --- | --- | --- |
| Question-led Ask orchestration | `ask.html` | Question Route; Governed Runtime Projection; Bounded Answer Composition; Ephemeral Current Context | ASK2 / CKA / KAP / Core Runtime projection is source-accepted; live-browser acceptance remains pending |

## Capability rules

| Capability verb | Meaning in PJA | Required owner result |
| --- | --- | --- |
| read | request an authoritative or explicitly qualified legacy projection | canonical identifier, scope and state |
| render | present the projection without changing its meaning | source and unknown/pending boundaries preserved |
| route | send the user to an owner-controlled operation or next page | permitted destination or safe unavailable state |
| link | connect already-existing projections by canonical reference | stable reference; no inferred identity |

Checkout submission and Runtime controls may initiate an owner-controlled
operation, but the page is not that operation's write authority. A PJA route
never grants an Entitlement, creates an Assignment, adds a Queue item, releases
a Deliverable or records Provider Cost.

## Completeness rule

Every top-level `*.html` file must appear exactly once in the machine-readable
`pageCapabilities` list. A future page must declare its capability,
dependencies, activation boundary and `writeAuthority: none` before PJA-W0
acceptance can continue to pass.

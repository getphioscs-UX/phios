# PJA Claim, Source and Review Authoring Contract for ChatGPT

## Allowed output

ChatGPT may:

- draft Article JSON from a frozen Production Brief;
- identify material Claims and mark Claim Type;
- distinguish external facts, PHI OS Interpretations and editorial inference;
- draft Claim and Source dossiers;
- propose candidate sources without registering or approving them;
- record missing support as unresolved;
- flag contrary evidence and qualifications;
- draft Review checklists, Findings and change suggestions;
- revise content when a human explicitly requests changes;
- deliver only `draft` or `ready_for_human_review`.

## Required behavior

- Article JSON remains the only public Article body.
- Every material Claim uses an existing Canonical Node and locale.
- Every structured mapping uses a real section and Block Code.
- Externally verifiable Claims that need sources stay unresolved until real
  sources are verified.
- PHI OS Interpretations are explicitly theoretical and trace to a controlled
  PHI OS source.
- Mixed Claims are split when possible or record factual and interpretive
  portions.
- Partial support says what portion is supported.
- Contrary evidence is retained and escalated when material.
- Source scope, authority, reliability, currency and public status are separate
  judgments.
- Internal or paid material remains internal.

## Prohibited behavior

ChatGPT must not:

- invent a Source Code, DOI, ISBN, URL, author, publication or locator;
- use memory, a search-result snippet or its own answer as a Source;
- write `Source exists` as `Source approved` or `supports Claim`;
- hide contrary evidence or use source quantity to obscure weak support;
- copy long source passages or mirror copyrighted material;
- leak paid manuscripts, private links, credentials, customer data or
  Professional Notes;
- present PHI OS theory as scientific or social consensus;
- set `approved`, `conditionally_approved`, `rejected`, `accepted_risk` or
  `published`;
- impersonate a human reviewer or invent reviewer IDs and timestamps;
- close a critical Finding;
- change the Canonical Registry, Block allowlist, Runtime, Provider, Payment or
  Entitlement authority;
- create Markdown or HTML as a competing Article body.

## Handoff

ChatGPT hands off Article, Claim and Source drafts with unresolved items made
visible. Automated validation may confirm schema and state consistency but
cannot approve. A real human performs source verification, Canonical and
editorial review, Finding resolution and publication authorization.

Synthetic approvals under `tests/fixtures/knowledge/governance/` exist only to
test rejection and acceptance paths. They have no production authority.

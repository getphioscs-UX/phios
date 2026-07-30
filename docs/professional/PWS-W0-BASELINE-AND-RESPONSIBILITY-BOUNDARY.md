# PWS-W0｜Professional Workspace Baseline & Responsibility Boundary

Baseline: `main@ad34f1047d59b9271754573b0c45bba3003a1c14`.

PWS-W0 freezes the existing Professional Workspace System before authorised
data loading or persistence is enabled. It reuses the current Workspace page,
M4B contracts, consent model, Review Queue, revision overlay and revenue
architecture. It does not create a second Professional data system and does
not redesign the Customer Journey.

## Frozen responsibility boundary

- Professional Workspace uses the same Journey Contract as the customer.
- Customer original material, formal records, Professional Notes, candidate
  revisions, signed outputs and the responsibility period remain distinct.
- Authentication, assignment, active explicit consent, resource scope,
  purpose and consent version are all required before access.
- A purchase or entitlement does not create professional responsibility.
- Responsibility begins only after an eligible human service, confirmed
  scope, granted consent and professional assignment.
- Consent revocation, consent expiry, assignment closure or service completion
  closes access according to the governing contract.
- Runtime View remains read-only. Professional observations and External
  Reader interpretations cannot become Runtime Evidence automatically.
- Candidate revisions are not formal Reading revisions until explicitly
  reviewed and signed against exact source versions.

Real client payloads, Workspace persistence, Professional Notes persistence,
automatic recommendations, automatic signing and regulated advice remain
disabled.

## Migration governance closure

The existing immutable `0004_book_commerce.sql` migration is now registered as
version 4 with its canonical checksum. No SQL migration was added or modified.
The Book Commerce schema and product registries document the implementation
that already existed in code.

Run:

```sh
npm run check:pws-w0
npm run check:runtime-migrations
npm run check
```

PWS-W1 may implement identity, assignment, consent evaluation and the
authorised data loader only within these frozen boundaries.

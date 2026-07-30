# PWS-ENTRY-W2 — Paid Journey Activation Boundary Freeze

Status: `paid-journey-activation-boundary-frozen`  
Sequence key: `PWS-ENTRY-ACTIVATION-W2`  
Baseline: `getphioscs-UX/phios main@877cc11b44396c7f13716b7b48bdeb0bb4f2dcbc`

## PDS intent

Paid activation must remain Reality First and evidence-bound. Payment is a
commercial fact, not an interpretation, professional decision or completed
service. Unknown or failed gates remain visible and correctable; the system
does not infer consent, entitlement, identity or governance clearance.

## Activation gate

A formal Journey may move from `draft` to `active` only when all nine gates
are satisfied:

1. identity is verified and matched to the order;
2. the order is confirmed and eligible for the Journey;
3. payment is independently verified as succeeded;
4. the Entitlement is active and covers the Journey;
5. Purpose Consent is explicit, active and in scope;
6. Data Consent is explicit, active and in scope;
7. no governance block is active;
8. a formal draft Journey identity already exists; and
9. Provider Budget is configured and not blocked.

The default decision is blocked. A missing, unknown or failed gate cannot be
silently completed by a client claim, checkout redirect, payment record or
another page. The blocking reason remains visible and activation may be
retried after a correctable gate changes.

## Payment is necessary, not sufficient

Payment alone does not activate or create a formal Journey. It also does not
create a Professional Assignment, Professional Responsibility, Confirmed
Reading or Signed Deliverable.

Those outcomes retain separate authorities and operations. Assignment uses
`assignment.create`; professional responsibility begins only through an
eligible accepted assignment; a Confirmed Reading remains subject to the
frozen Evidence and Reading gates; a Signed Deliverable requires frozen
content, explicit signature intent and an authorised signatory.

## Failure restraint

When activation is blocked, the Journey remains `draft`. Formal evidence
collection, paid individual Provider execution, confirmed individual Reading
and Professional Queue creation remain prohibited. Prior gate evidence stays
auditable so correction does not erase reality.

## Compatibility

The repository already uses the display label `PWS-ENTRY-W2` for Canonical
Ownership. This freeze therefore uses `PWS-ENTRY-ACTIVATION-W2` as its unique
sequence key. Neither contract replaces the other, and the earlier
one-write-source boundary remains frozen.

## Acceptance scope

This step changes no public or customer page. The 360px, 768px and 1440px
visual checks, Chinese and English checks, keyboard/focus checks and touch
target checks are not applicable to this contract-only change. Runtime
regression and production verification remain mandatory; production
verification can be signed only after this delta is committed, deployed and
checked against Production.

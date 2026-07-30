# PWS-ENTRY-W3 — Professional Handoff Boundary Freeze

Status: `professional-handoff-boundary-frozen`  
Sequence key: `PWS-ENTRY-HANDOFF-W3`  
Baseline: `getphioscs-UX/phios main@a6bfa5b3083596ce50b9e844608b917a2d9f5c9a`

## PDS intent

Professional involvement is a deliberate, evidence-backed transfer of bounded
responsibility. It is not an automatic consequence of browsing, completing a
Journey, paying RM5 or possessing a Journey entitlement. Unknown or failed
handoff conditions remain visible and correctable.

## Strict handoff sequence

Formal professional responsibility begins only after all eight gates pass in
order:

1. the customer explicitly selects a Professional Service;
2. an independent Professional Product and Offer version are resolved;
3. an independent professional Payment is verified and its Professional
   Entitlement is active;
4. service-specific Consent explicitly covers purpose and resources;
5. the Professional is eligible and the required intake is complete;
6. Professional Readiness passes;
7. `assignment.create` creates a proposed Assignment; and
8. the assigned Professional explicitly performs `assignment.accept`.

`assignment.created` records a proposal, not responsibility.
`assignment.accepted` starts bounded professional responsibility. No
Professional Workspace load, Professional Queue item or delivery clock starts
before acceptance.

## RM5 Journey separation

The RM5 Reality Journey is its own Product, Offer, Order, Payment and
Entitlement scope. Its entitlement permits only the entitled formal Reality
Journey. It grants no Professional Service access, Assignment or Queue access.

An RM5 Journey entitlement must never be silently upgraded into Professional entitlement.
It cannot be reused, mutated, widened through a price difference, or replaced
by the fact that a Journey was completed. Professional Service requires an
explicit selection and separate Product, Offer, Order, Payment, Entitlement
and service-specific Consent.

With explicit consent and Assignment scope, minimum necessary Journey data may
be referenced as professional input. That data keeps its source and lineage;
the Journey Reading does not automatically become a professional conclusion.

## Failure restraint

If any gate is missing, unknown, out of scope or blocked, handoff remains
`not-ready`. The customer may continue an otherwise entitled Journey, but the
system cannot create an early Assignment, load professional data, enqueue
work, start delivery time or imply that a Professional has accepted
responsibility.

## Compatibility

The repository already uses `PWS-ENTRY-W3` for the Implementation Sequence and
PWS-I1-T00 audit freeze. This contract therefore uses
`PWS-ENTRY-HANDOFF-W3` as its unique sequence key. Neither contract replaces the other.

## Acceptance scope

This contract-only step changes no page, API, business implementation,
Registry or Migration. Therefore 360px, 768px and 1440px visual acceptance,
Chinese and English acceptance, keyboard/focus acceptance and touch target
acceptance are not applicable. Runtime regression remains mandatory.
Production verification can be signed only after this delta is committed,
deployed and checked against Production.

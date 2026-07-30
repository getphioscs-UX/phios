# PWS-ENTRY-W0 Baseline and Responsibility Boundary

Status: **Frozen v1.0.0**

Baseline: `getphioscs-UX/phios` `main@2e19922f57a8ff208f48988085761fa28cfbd099`

## Decision

PHI OS uses a two-layer operating model. Payment does not merely hide or reveal a page; it separates public orientation from the formal service Runtime.

Before payment, a person may use public knowledge, service information, pricing, boundaries, samples, preparation material, free rule-based exploration and checkout. These surfaces remain useful even when the person does not buy a service.

After verified payment and active Entitlement, PHI OS may activate a formal Journey identity, persistence, paid Provider access, a Journey Report and an eligible Professional Service handoff. A successful-looking redirect or customer claim cannot replace server-verified payment and active Entitlement.

## Before-payment prohibition

Before payment and active Entitlement, PHI OS must not create Formal Journey, Formal Evidence, Reconstruction, Individual Reading, Journey Report, Professional Assignment, Professional Queue or paid individual Provider invocation.

Free exploration may use static content, preset options and bounded client-side rules. It cannot persist into the Core Runtime, form an individual conclusion, create professional responsibility or later be promoted silently into a paid Journey. A formal transition requires a new authorised operation after all activation gates pass.

## After-payment activation

The minimum formal-service gates are an existing Order, confirmed Payment, active Entitlement, matched customer identity and confirmed service-boundary consent. Professional handoff additionally requires an eligible human service, verified professional capability, an Assignment and active professional consent.

Purchase alone does not create professional responsibility. Entitlement alone does not create Assignment.

## Acceptance

Public browsing remains usable without payment. Free exploration does not become a hidden paid Journey. Service is not the only exit: knowledge, free exploration, service information and leaving without purchase remain valid outcomes. No individual conclusion is generated before active Entitlement.

This is a contract-only boundary freeze. It changes no page, Runtime, API, Provider, persistence, migration or production behaviour. The W0 checker runs as the mandatory first import of `check:pws-entry-w1`.

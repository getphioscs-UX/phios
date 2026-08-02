# EXP-W1 Global IA and Shared Shell Acceptance

- Freeze: `EXP-W1-v1.0.0-Frozen`
- Baseline: `889cba335e6e1d194c2b0daad2a68af36fb646cb`
- Scope: public shared header, mobile navigation, footer labels, active state and locale projection.

## Decision

The customer-facing primary navigation is `Discover / Knowledge / Reality Journey / Professional / About / Language`. Home remains `/`; Discover is its customer-facing navigation name. `/explore` is Atlas and is grouped under Knowledge rather than exposed as a competing primary destination. `/services` is consistently named Professional in the shared shell.

The historical PJA-W1 information-architecture projection remains intact as evidence. This EXP-W1 freeze supersedes only that projection; it does not modify publication governance or the Knowledge Registry.

## Acceptance evidence

- Header and footer use the same customer name for `/library`, `/reality-journey`, `/services` and `/about`.
- Reality Journey and Professional are explicit primary routes.
- Atlas is never rendered as Explore by the shared shell.
- Active state maps Atlas and Thesis to Knowledge, Journey routes to Reality Journey, and professional routes to Professional.
- Mobile disclosure retains Escape close, focus restoration, contained Tab navigation, outside-click close and locale-selection close.
- Shared controls retain the 44px target token, visible focus contract and responsive breakpoints at 1000px, 760px and 520px.
- English and Simplified Chinese locale keys are structurally aligned.

Production acceptance remains pending until this commit is pushed and deployed. A green local check proves no repository regression; it does not prove the deployed Production shell.

## Protected boundaries

No Runtime, Runtime Contract, Payment, Entitlement, Provider, Journey data model, migration, D1 or Knowledge Registry file is changed.

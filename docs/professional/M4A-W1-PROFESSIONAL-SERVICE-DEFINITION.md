# M4A-W1 — Professional Service Definition

## Outcome

M4A-W1 freezes the definition layer for PHI OS professional services without
activating a Professional Workspace, sensitive-data intake, regulated advice,
checkout, report generation or new Runtime behaviour.

The first professional service family is:

1. Professional Runtime Reading
2. Human Design Runtime Interpretation
3. Financial Reality Navigation
4. Integrated Professional Review

The canonical position is:

> Human Design helps interpret a Runtime. Financial Reality Navigation
> measures and reconstructs the financial conditions within that Runtime.
> PHI OS keeps evidence, interpretation, calculation and recommendation
> separate.

## Canonical registries

| Registry | Responsibility |
| --- | --- |
| `professional-service-catalog.json` | Bilingual service levels and product relationships |
| `professional-deliverable-catalog.json` | Standard deliverable sections and source labels |
| `professional-pricing-policy.json` | Configurable pricing fields and permitted complexity drivers |
| `professional-service-levels.json` | Completion windows and start conditions |
| `professional-service-boundaries.json` | Runtime, Human Design, financial and integrated boundaries |
| `m4a-w1-professional-service-definition.json` | Milestone scope, guardrails and implementation order |

## Financial Reality Navigation definition

The defined service journey is:

`Fact Finding → Position Reconstruction → Stamina Analysis → Risk and
Constraint Review → Goal Prioritisation → Navigation Plan → Implementation →
Scheduled Review`

It remains product-neutral. A risk flag is not a recommendation. A
recommendation is not a client decision, and a client decision is not an
implementation result.

Pricing may reflect the volume of information, document count, account count,
property count, household participants, jurisdiction and analysis complexity.
It must not increase automatically merely because the client has more assets,
income or net worth.

## Human Design definition

Human Design is an optional interpretive perspective. It is not Runtime
Evidence, medical or scientific diagnosis, fixed personality, deterministic
fate, or a sufficient basis for a required action.

A Reality-specific report must keep these blocks separate:

1. Confirmed Reality Evidence
2. Human Design Perspective
3. Possible Correspondence
4. What Remains Unverified

## Current implementation boundary

M4A-W1 does not implement:

- Financial Intake or joint-household consent
- uploads of bank, insurance, tax, identity or household documents
- financial formulas, assumptions, ratios or automated recalculation
- Professional Workspace, notes or Review Queue
- reports, PDF export, appointments, payment or public sales pages
- product-specific recommendations or professional signing
- automatic Human Design chart calculation
- D1 schema changes or migrations
- real client information or service prices

The existing Financial Professional Path therefore continues to operate as a
bounded preparation and referral path with sensitive-data collection, uploads
and conclusions disabled.

## Next work package

The required next step is `M4A-W3 — Consent and Sharing`, followed by
Professional Data and Privacy (`M4A-W7`) before any Financial Schema,
Workspace, intake or upload workflow.

## Verification

```powershell
npm run check:m4a-professional-service-definition
npm run check
```

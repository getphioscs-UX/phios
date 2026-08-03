# Method Runtime Governance

## Governance owner

MR-W0 is a PHI OS Constitution. IMR governs method eligibility. No Plugin, Provider, method roadmap or Professional Workspace operation can override either authority.

## IMR gate

Every Plugin must pass IMR before Production. The gate covers:

- Method Scope
- Commercial License
- Algorithm
- Data Authority
- Calculation Policy
- Validation
- Audit
- Commercial Rights
- Version
- Production Eligibility

IMR-W0 and HDR-W0 remain preserved. MR-W0 does not rewrite their existing authority objects.

## Authority separation

| Decision | Authority |
| --- | --- |
| Whether a Method is eligible | IMR |
| What shared data means | Shared Data Authority |
| What was calculated | Shared Calculation Runtime |
| How facts are projected | Shared Projection Runtime |
| Candidate explanation | Shared Interpretation Runtime |
| Professional conclusion and release | Independent Professional Runtime and authorized human |

Silence, registration, payment, entitlement, Provider output or Projection never creates authority.

## Provider governance

Providers do not participate in Calculation. Provider use is limited to Interpretation, must be versioned and must fail closed. A Provider failure cannot fabricate a calculation, projection or conclusion.

Professional Workspace must not directly read OpenAI or Workers AI. It reads only governed outputs that passed the Interpretation Candidate and validation boundaries.

## Lifecycle governance

The single lifecycle is draft, experimental, internal, pilot, production, deprecated and archived. Each transition is explicit. Production additionally requires IMR Production Eligibility and approved or not-required license status.

## Version governance

Every Plugin declares pluginVersion, runtimeVersion and projectionVersion. External calculation engines declare their own verified version and license status. Version changes that affect output require validation and lineage.

## Production governance

Production activation requires a registered Plugin, passing schema, legal lifecycle transition, IMR eligibility, license clearance, repeatability evidence, Provider Boundary validation and independent Professional Review.

## Default-chain isolation

MR-W0 is a standalone Phase 30 gate. It must not be inserted into:

- npm run check
- check:pja
- check:knowledge-runtime
- check:imr-w0
- check:hdr-w0

This prevents MR-W0 from silently changing existing Journey, Knowledge, PWS, IMR-W0 or HDR-W0 authorities.


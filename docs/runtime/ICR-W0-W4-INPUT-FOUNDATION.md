# PHASE ICR v2 — ICR-W0–W4 Input Foundation

Status: `FROZEN_FOUNDATION`

Baseline: `c1ded91129cea2e9406f49c5066fdf041df0c1eb`

## Authority reconciliation

ICR-W0–W4 preserves the existing Operational Intake surfaces. ICR adds a governed input envelope, a fail-closed verification decision and a reference-only Method Input projection; it does not replace Reality Entry, Financial Intake or External Reader Intake.

| Concern | Authority |
| --- | --- |
| Operational capture | Existing intake contracts |
| Canonical Input envelope and normalization | ICR |
| Verification decision and projection eligibility | ICR |
| Verified shared facts | Shared Data Authority |
| Purpose, consent, persistence, retention and deletion | RDG |
| Method identity and calculation eligibility | Method Runtime |

## ICR-W0–W4 outputs

- `ICR-W0` audits the existing input, authority, RDG and Method boundaries at the baseline commit.
- `ICR-W1` defines a deterministic Canonical Input envelope without declaring it verified, evidentiary or persistent Runtime state.
- `ICR-W2` reconciles Birth Data capture and preserves explicit unknowns, uncertainty and source declarations.
- `ICR-W3` records field-level verification decisions and binds verified facts to versioned Shared Data Authority records.
- `ICR-W4` projects only Method identity, verified lineage, Shared Data record references and RDG bindings.

The required flow is:

`Operational Intake → Canonical Input → Verified Input → Shared Data binding → Method Input projection → Method Runtime`

## Frozen boundaries

- Methods do not read the Customer DB, Account Record, Canonical Input payload or unverified input directly.
- Method Input contains Shared Data record references, never a raw Birth Data payload or Method-owned copy.
- Providers and AI cannot create Canonical Input authority, verify input, repair missing values or change verification state.
- Unknown input remains unknown. Verification and projection fail closed.
- The registries contain no user data and grant no persistence, production or Method registration entitlement.
- RDG remains the authority for consent, persistence, retention and deletion.
- ICR-W5 Case Runtime and ICR-W7 Reality initialization are not activated by this foundation.

## Verification

Run:

```bash
npm run check:icr-w0-w4
```

The checker validates the audit hashes, authority boundaries, schemas, deterministic digests, fail-closed negative paths, reference-only projections, non-activation freeze and unified `postcheck` wiring.


# PTRC-W9 — Will intake and automatic report assembly

Status: machine implementation ready for repository acceptance.

PTRC-W9 collects testamentary information into a versioned, jurisdiction-required intake and assembles a reviewable draft report. It does **not** create, execute, witness, notarise, register, or determine the legal validity of a will or trust instrument.

## Data model

The intake contains 15 governed sections: identity, family, executors, guardians, beneficiaries, assets, liabilities, trusts, gifts, exclusions, digital assets, funeral wishes, advisors, documents, and review consent. Each section carries a status (`KNOWN`, `PARTIAL`, `UNKNOWN`, `NOT_APPLICABLE`, or `UNSET`), source references, optional declared conflicts, and user-provided items. Exact high-risk identifiers such as national identity numbers, full account numbers, passwords, private keys and exact addresses are not accepted by this runtime.

The runtime keeps five layers distinct: raw user input, normalized facts, derived calculations, warnings, and generated narrative. Missing data remains missing. A model is not allowed to fill missing numeric inputs, invent facts, or override W8 results.

## Lifecycle

Drafts can be serialized and resumed. Corrections produce a new data version rather than mutating an approved version. Report assembly requires an approved snapshot with a review-consent reference and a future retention boundary. The snapshot is SHA-256 fingerprinted and immutable within the application contract.

The deterministic report outline is created before rendering. HTML print output and the PDF projection both carry the approved snapshot identity, provenance, gaps/conflicts, jurisdiction, information date, and the professional-review disclaimer.

## Financial reconciliation

Estate totals are delegated to PTRC-W8 `ESTATE_SUMMARY`. PTRC-W9 passes only numeric asset and liability values present in the approved snapshot together with caller-provided jurisdiction, currency and information date. Tax, distribution and legal validity are not calculated.

## Security and privacy

Storage must enforce encryption at rest and transport encryption. Access is least-privilege by role. Export grants expire and cannot exceed 60 minutes. Export projection removes raw user input and restricted/internal keys. Retention must be explicitly provided for each approved snapshot. Deletion produces an audit-safe receipt with no sensitive payload.

## Acceptance command

```bash
node scripts/check-ptrc-w9-testamentary-report.mjs
```

Expected result:

```text
✓ PTRC-W9 Will intake and automatic report assembly passed.
```

Package-script registration and full CI aggregation may be performed in PTRC-W10 cutover/freeze together with the complete PTRC checker set, avoiding a premature production freeze mutation in W9.

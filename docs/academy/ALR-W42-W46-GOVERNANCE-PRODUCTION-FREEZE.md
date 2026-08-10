# ALR-W42～W46｜Governance / Production Freeze

Baseline: `bdd9adf0dd28a6de47488089507228eb165e72db`

Scope: `ALR-J｜Governance / Production`

## Result

ALR v2 is frozen through `ALR-W46`. The freeze covers governed definitions,
deterministic validation runtimes and Academy validation projections. It does not
activate live Academy delivery, learner data persistence, assessment execution,
progress writes, capability-state writes or production publication.

## W42｜RG Checker Integration

ALR now has a runtime-owned checker alias registry and a fail-closed runner for all
47 canonical work codes (`ALR-W0` through `ALR-W46`). Shared aggregate checkers run
once during a full ALR check.

The integration conforms to the RG checker identity and CI contracts. Frozen RG v3
registries are not modified. Central RG registration remains
`DEFERRED_TO_RG_AUTHORIZED_EXPANSION`; the ALR-owned registry must not be described
as canonical central RG registration.

The historical ALR-W33～W35 postcheck guard accepts a governed contiguous VAP successor chain
only after Wave 1. VAP-W0 through VAP-W3 remain mandatory, and later VAP successors
must be gap-free, resolve to matching checker aliases and reference existing checker files.
This repairs the VAP-W2/VAP-W3 compatibility drift without weakening the production-chain order.

Commands:

```bash
npm run check:alr
npm run check:alr -- ALR-W42
```

## W43｜RDG Acceptance

Acceptance is `ACCEPTED_CONTRACT_VALIDATION_ONLY`.

The canonical RDG entry remains `RESERVED_NOT_IMPLEMENTED`. W43 validates allowed
purposes, data types, persistence classes and the following denials:

- no Reality Evidence promotion;
- no professional-data write;
- no analytics write;
- no inference that lesson completion or an assessment score is capability state;
- no persistence before governed purpose, permission, visibility, sensitivity and
  retention resolution.

No learner record, response, result or capability evidence is created by this work.

## W44｜PDS Acceptance

Acceptance is `STATIC_ACCEPTED_PRODUCTION_REVALIDATION_REQUIRED`.

The static matrix covers 360, 768 and 1440 px; English and Simplified Chinese;
44 px minimum touch targets; keyboard operation; visible focus; no horizontal page
scroll; and loading, empty, failure, blocked and recovery states.

Local and preview acceptance do not equal production acceptance. The production
matrix must be rerun after deployment.

## W45｜Foundation Vertical Slice

One deterministic Foundation slice connects:

`Program → Path → Module → Lesson → Objectives → Capability → Published Knowledge
Reference → Practice Definition → Assessment Definition → Progress Scope → Localized
Academy Validation Projection`

The slice uses `ALR-LO-LESSON-EVIDENCE-DISTINCTION`. It accepts no learner, customer,
case, response, score, credential, entitlement, consent or professional-decision
input. Provider and AI use must both be `false`.

The output is digest-bound and has no data, delivery, publication, credential or
professional-authority effects.

## W46｜ALR Freeze

`ALR-v2.0.0-FROZEN` preserves all nine prior ALR freezes by SHA-256 digest and adds
the W42～W46 governance acceptance layer. Any prior-freeze drift fails closed.

Remaining gates:

- central RG registration requires an RG-authorized registry expansion;
- production PDS acceptance requires deployment-time revalidation;
- live learning data and persistence require explicit RDG activation and runtime
  implementation;
- canonical Academy presentation and publication require CPR and CAR authority.

Next canonical phase: `RRE-W0｜Authority Boundary`.

## Validation

```bash
npm ci
npm run check:alr-governance
npm run check:alr
npm run check
```

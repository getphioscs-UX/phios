# ALR-W24～W28 Assessment

Baseline: `5430224d5fb21232d77c19b0f854ba4f802a73a7`

Status: frozen Assessment semantics; learner sessions, raw responses, scores, persistence, Capability promotion and delivery remain inactive.

## Canonical assessment chain

Each of the five canonical Lessons receives one additive Assessment chain:

`Practice binding → Assessment type → Assessment definition → Integrity validation → PHI OS Feedback → unmaterialized RDG handoff candidate`

- **ALR-W24 Assessment Contract:** five synthetic, structured Assessments cover all five Lessons and all ten Learning Objectives and Capability criteria exactly once.
- **ALR-W25 Assessment Type:** five controlled type families map one-to-one to the five registered Capability kinds and their Objective action verbs.
- **ALR-W26 Assessment Integrity:** one ordered fail-closed rule set requires exact Assessment, version, type, scenario and criterion coverage. Raw response, answer key, score, Provider/AI output, real case data and authority fields are rejected.
- **ALR-W27 PHI OS Feedback Runtime:** deterministic findings resolve to exactly one of `SUPPORTED`, `PARTIALLY_SUPPORTED`, `UNSUPPORTED`, `OVER_INTERPRETED`, `BOUNDARY_MISSED`, `UNKNOWN_IGNORED`, `EVIDENCE_MISSING` or `CONSTRAINT_MISREAD`.
- **ALR-W28 Assessment Evidence → RDG:** an integrity-valid evaluation can form an opaque, unmaterialized candidate for RDG eligibility review. ALR neither stores nor materializes the data.

## Feedback precedence

Feedback is not a score. The runtime uses controlled fail-first precedence:

1. `EVIDENCE_MISSING`
2. `UNKNOWN_IGNORED`
3. `CONSTRAINT_MISREAD`
4. `BOUNDARY_MISSED`
5. `OVER_INTERPRETED`
6. `UNSUPPORTED`
7. `PARTIALLY_SUPPORTED`
8. `SUPPORTED`

Only `SUPPORTED` maps to criterion status `MET`. `EVIDENCE_MISSING` maps to `UNKNOWN`; the other non-supported outcomes map to `NOT_MET`.

## Authority boundary

- An Assessment result or score is not Capability, Capability Evidence, Credential, Entitlement, assignment or Professional authority.
- Assessment definitions contain prompts and rubric boundaries, not answer keys, raw responses or learner records.
- Semantic evaluation consumes only governed structured findings and is pure and non-persistent.
- CAR Quiz or Assignment Briefs may be referenced by later production work but do not become ALR Assessment authority or scoring runtime.
- Synthetic ALR scenarios remain separate from ICR cases, RMO canonical Reality, Reality Evidence and professional records.
- W28 produces no RDG record. RDG must independently resolve permission, sensitivity, retention, materialization and evidence eligibility.
- Existing W13/W14 records remain byte-preserved. Their historical `PENDING_ALR-W24` values are resolved through this additive binding overlay rather than mutation.

## Checks

```sh
npm run check:alr-assessment
npm run check:alr-practice
npm run check:rmo
npm run check
```

The next governed work is **ALR-W29 Progress and Completion**.

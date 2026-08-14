# MCD-5｜Canonical Method Projection

MCD-5 establishes `CanonicalMethodProjection` as the only client contract between governed Method execution and PHI OS client surfaces.

## Runtime chain

```text
Request
  → MPA Evaluation
  → MCD-3 CanonicalBirthInput
  → MCD-4 Execution
  → MCD-5 Core Isolation
  → CanonicalMethodProjection
  → Client
```

The client never consumes Core Runtime JSON. Raw calculation result objects, Core output schemas, plugin codes, internal method identities, stack traces and server paths remain internal.

## Canonical root

```json
{
  "method": {},
  "calculation": {},
  "projection": {},
  "unknown": [],
  "evidence": [],
  "version": {},
  "execution": {},
  "interpretation": { "included": false }
}
```

### MCD-5A Method
Only controlled public labels, an opaque protected reference, version, governed status and calculation mode are client-visible. Method results do not claim life, destiny or Reality conclusions.

### MCD-5B Calculation
Only whitelisted deterministic values are copied from internal execution artifacts. NUM currently projects numeric values, normalized structures and cycles. AST/BZR do not fabricate unavailable astronomy/solar-term values.

### MCD-5C Projection
The projection contract is stable and Core-schema-independent. Frontends must consume `CanonicalMethodProjection` only.

### MCD-5D Unknown
Unknown categories are `MISSING_INPUT`, `UNCERTAIN_VALUE`, `UNAVAILABLE_CALCULATION`, `POLICY_LIMITED_RESULT`, and `NOT_CALCULABLE_STATE`. Every unknown carries `rendererMustDisplay=true`.

### MCD-5E Evidence
The client projection records input, timezone, coordinates, rule, calculation and runtime lineage. Missing evidence is represented as unavailable; it is never fabricated.

### MCD-5F Version
Production-safe projections require Method Registry, projection runtime, adapter, input contract and projection contract versions.

### MCD-5G Execution
The projection records request ID, execution status, sanitized MPA decision, public-safe runtime identity and execution completion time. Stack traces, secrets and internal paths are forbidden.

### MCD-5H Interpretation
`interpretation.included=false` is invariant. Calculation is not Interpretation, Meaning Authority, Reality Reading or Professional Judgment.

### MCD-5I–K HDR
HDR remains `VALIDATION_ONLY_NOT_CLIENT_DISPATCHABLE`. Governance may define schemas, normalization, unknown states, version structure and renderer fixtures. No Production customer result is permitted. Public vocabulary is limited to **Personal Runtime Projection / 个人运行投射**. Raw internal astronomy, moment, gate-related, structure-related and bodygraph-related schemas may never flow directly to the client. Any future activation must still traverse Adapter → CanonicalMethodProjection → controlled public projection.

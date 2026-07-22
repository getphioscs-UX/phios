# M1-W4 Provider Closure

Status: **Closed**

## Provider priority

```text
Rule Engine
  ↓
Workers AI
  ↓
OpenAI
  ↓
Professional Review
```

Rule Engine output is always produced first and remains available throughout fallback. External providers may add bounded enrichment only; they cannot create evidence, change the Evidence Boundary, choose a Navigation path, persist Runtime state, or route another provider.

## Provider interface

Every successful provider returns `phi-os.provider-result.v1` with:

```text
success
provider
model
stage
output
confidence
missing_evidence
warnings
usage
```

The compatibility field `enrichment` aliases `output` during the 1.x migration and must not become an independent value.

## Call boundary

```text
Page → API → Router → Provider
```

Pages cannot import or invoke providers. API routes invoke Entry or Reading routers. Only routers invoke provider implementations. Providers return data and never write the Runtime session.

## Fallback rule

If Workers AI fails, its failure is appended to the Router attempt log, the Rule Engine result is preserved, and OpenAI may be tried only when eligible. If all eligible external providers fail, the Router returns the preserved Rule Engine result with warnings and keeps Professional Review available. Provider failure must never destroy session state.

## Failure fixtures

Fixtures cover timeout, invalid JSON, empty output, schema mismatch, quota exceeded, and provider unavailable. They freeze failure classification without making network calls.

No Provider may be added or reprioritized after closure without reopening the Provider Contract.

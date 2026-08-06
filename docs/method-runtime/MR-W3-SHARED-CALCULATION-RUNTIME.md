# MR-W3｜Shared Calculation Runtime

MR-W3 freezes one deterministic execution authority shared by every Method Plugin. It consumes governed records from `SHARED_DATA_AUTHORITY` and produces versioned Calculation Results.

## Authority order

`Method Definition → Data Authority → Calculation Runtime → Projection Runtime`

Calculation does not own source data, Projection, Interpretation, Reality conclusions or Professional decisions.

## Deterministic execution

Every execution binds an algorithm code and semantic version, canonical input digest, input record identities, governed reference versions and output digest. The runtime executes the same algorithm twice against cloned canonical inputs and fails closed when results differ.

## Provider boundary

OpenAI, Workers AI, prompts and any Provider are forbidden. Provider-shaped or Interpretation-shaped fields are rejected in requests and results.

## Shared authority

Plugins register governed algorithms but cannot create a parallel calculation runtime, override Shared Data Authority, silently repair inputs or convert a Calculation Result into Projection.

## Result boundary

A Calculation Result is a deterministic fact about algorithm execution. It is not Method Projection, Knowledge, Interpretation, Reality Evidence or Professional Conclusion.

## Production boundary

MR-W3 establishes the runtime contract and deterministic engine. It activates no production algorithm or Method Plugin. The next gate is `MR-W4｜Shared Projection Runtime`.

## Validation

```text
npm run check:mr-w3
```

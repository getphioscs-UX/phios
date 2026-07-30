# PWS-I1-T06 Canonical Events and T07 Canonical Errors

Status: **Frozen v1**  
Schema version: `pws-v1`  
Baseline: `main@1a032cdf851d71060ddb2d0033b9d65b75e35254`.

## T06 Canonical Events

The registry contains exactly the 24 events frozen by STEP 1.7. A Canonical
Event is an immutable past fact. It does not execute an Operation, change
state, carry business content, or promote Provider output into a formal object.

Readiness uses two explicit outcome events. All four Professional Response
operations converge on `professionalResponse.recorded`, with the response kind
remaining on the referenced response rather than in event payload.

Provider invocation events carry references and lifecycle metadata only.
Provider budget events record a threshold decision, not a Provider output,
charge instruction, or formal state mutation.

The nine event codes introduced by the earlier T06 draft but excluded from the
new formal list remain documented as read-only Legacy events. They cannot be
written as Canonical Events.

## T07 Canonical Errors

The Error Registry freezes 18 Error Families and a closed initial catalogue of
stable `PWS_<FAMILY>_<REASON>` codes. Free-string families and codes are
prohibited.

Every error declares a family, stable code, HTTP status and retryability.
Customer-facing language must be resolved separately and cannot be substituted
for the canonical code. Public error responses cannot expose stack traces,
causes, credentials, tokens, customer data, Provider output, or raw payloads.

Existing Professional access denial reasons, Runtime typed errors and Provider
failures keep their current owners. This Contract documents future canonical
mapping boundaries; it does not rename or replace existing Runtime errors.

## Preserved boundaries

- No Runtime, API, Provider, state-machine, or error-handler implementation.
- No Migration or Runtime/content Registry change.
- No page or Customer Runtime behaviour change.
- No Legacy deletion.

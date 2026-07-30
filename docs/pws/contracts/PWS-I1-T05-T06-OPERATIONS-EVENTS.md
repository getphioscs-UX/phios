# PWS-I1-T05 Canonical Operations and T06 Canonical Events

> T06 is superseded by
> `PWS-I1-T06-T07-EVENTS-ERRORS.md` at
> `main@1a032cdf851d71060ddb2d0033b9d65b75e35254`. T05 remains frozen.

Status: **Frozen v1**  
Schema version: `pws-v1`  
Baseline: `main@7a99bda47c7a32f7e490ca95e06e4fa4574443c7`.

## T05 operation boundary

The Canonical Operation Registry contains the 25 required operations. Every
operation identifies one object, one closed set of legal source states and one
resulting state. It also requires explicit authority, preconditions and an
idempotency key.

An operation cannot change two formal objects. Commercial confirmation may
activate a Payment, but it cannot create or activate a Journey in the same
operation. Entitlement and Journey changes require their own separately
authorised operations.

`assignment.create` is the only creation operation in this freeze. Its source
marker is `__absent__`, and its sole resulting state is the Assignment initial
state `proposed`.

The four Professional Response operations submit a previously drafted response
with one fixed response kind. They do not rewrite a Journey Report, create a
Deliverable, or alter Customer Runtime.

## T06 event boundary

Each successful operation maps to exactly one canonical past-tense event. The
event records references and the before/after state, but never stores business
payload, customer data, provider output, card data, or document content.

Events are immutable append-only facts. They cannot execute operations, mutate
state, become API commands, or promote Provider output into a formal object.
Existing Customer Runtime timeline events, access audit records, and gateway
webhook inputs keep their current owners and are not renamed.

## Preserved boundaries

- No business operation implementation is added.
- No state-machine implementation or API is added.
- No Migration or Runtime/content Registry entry is added.
- No Customer Runtime, page, payment gateway, or Provider behaviour changes.
- Legacy operations and events remain readable only through their existing
  owner boundaries; new Legacy writes are prohibited.

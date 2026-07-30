# PWS-I1-T04 Canonical States

Status: **Frozen v1**  
Schema version: `pws-v1`  
Baseline: `main@78e3c4a46b02adc6fb637e7f4a761bc61dd7d619`.

## Decision

Twenty State Families are frozen in
`pws-canonical-states-v1.json`. Each family has one initial state, a closed
allowed-state enum, terminal states and an explicit transition table.

Any state not present in the relevant `allowedStates` array is invalid. A
transition not present in the current state's transition list is illegal and
must be rejected before persistence, events, Provider calls or other side
effects.

## State authority

| Family | Initial state |
|---|---|
| Professional | `pending_verification` |
| Capability | `active` |
| Registry | `draft` |
| Product | `draft` |
| Offer | `draft` |
| Order | `draft` |
| Payment | `pending` |
| Entitlement | `pending` |
| Consent | `draft` |
| Journey | `draft` |
| Assignment | `proposed` |
| Workspace | `awaiting_consent` |
| Candidate | `captured` |
| Journey Report | `draft` |
| Professional Readiness | `not_ready` |
| Professional Response | `draft` |
| Deliverable | `draft` |
| Knowledge Resource | `draft` |
| Observation | `reported` |
| Provider Operation | `queued` |

## No free-string rule

UI labels, translated text, HTTP status, queue wording, Provider status and
gateway status are not canonical object states. API, UI, AI and Provider code
cannot append a new string to an enum or infer a transition.

Legacy adapters may read existing domain states only through the declared
compatibility boundary. New writes use the canonical enum. Existing Runtime,
Book Commerce and Professional contracts remain under their current owners and
are not rewritten in T04.

## Semantic separation

- Journey state is not a Journey stage.
- Workspace state is not Permission.
- Payment state is not Entitlement.
- Entitlement state is not Consent.
- Consent state is not Assignment.
- Observation state is not an Evidence class.
- Provider success does not accept or promote Candidate material.
- Deliverable state does not constitute Signature.

## Non-actions

T04 adds no state-machine implementation, API route, database column,
Migration, Runtime/content Registry entry, page control or production
behaviour.

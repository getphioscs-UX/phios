# RMO-W5-W7 Reality Structure Runtime

Baseline: `5430224d5fb21232d77c19b0f854ba4f802a73a7`

## Preserved foundation

RMO-W0-W4 remains content-preserved. Its frozen output list is covered by normalized `UTF8_NO_BOM_LF` SHA-256 digests so substantive drift fails closed while Windows CRLF conversion and a UTF-8 BOM do not create false drift.

Reality v1 remains immutable. W5-W7 records bind independently to its digest. RMO-W13 Reality Versioning will be responsible for incorporating component references into a later Reality version.

## RMO-W5 Relationship Runtime

A Reality Relationship is a structural link between two distinct, known Entities in the same Reality. Its type registry controls directionality and accepts only non-inferential RDG data natures in this tranche.

It is not a PWS Registry relationship, Runtime revision lineage, Evidence, Interpretation, Inference or professional judgment. Creation writes neither the PWS Registry nor operational lineage.

## RMO-W6 Constraint Runtime

A Reality Constraint is a descriptive record bound to known Reality components. Type and scope are controlled; validity is either unbounded or an explicit interval.

`DESCRIPTIVE_ONLY` and `NOT_ENFORCED` are fixed. A Constraint does not create a Navigation restriction, path, recommendation, action or professional judgment. Existing Navigation rules remain untouched.

## RMO-W7 Reality State Runtime

RMO owns three state classes. RDG continues to own data nature and certainty; the fields are deliberately independent.

| State class | Required binding | Explicit boundary |
|---|---|---|
| `OBSERVED` | observation timestamp and source-component lineage | not truth and not accepted Evidence |
| `DERIVED` | deterministic method, method version and exact input-component lineage | not `INFERRED` or `INTERPRETED` |
| `PROJECTED` | deterministic method/version, exact basis lineage, scenario and future horizon | not an RDG data nature, fact, prediction authority, action or Navigation choice |

`PROJECTED` uses governed `CALCULATED` or `DERIVED` data nature. Adding a `PROJECTED` RDG nature would duplicate RDG authority and is forbidden. A projected State cannot use another projected State as basis in W7.

State definition and value are stored as opaque references, not free-form payloads. All three classes retain `NOT_EVALUATED`, `NOT_INTERPRETED` and `NOT_INFERRED` boundaries.

## Non-activation

W5-W7 is deterministic and validation-only. It creates no persistent Reality store, database migration, Evidence promotion, Interpretation, Inference, professional judgment, Provider/AI authority, production execution, real user data, PWS Registry write, Runtime lineage write or Navigation mutation.

Next: `RMO-W8 Evidence Binding`.

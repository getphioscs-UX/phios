# RMO-W0-W4 Canonical Reality Foundation

Baseline: `0732b3dfef7c15d3571d980887f1423b68eee6a2`

## Authority

RMO is the sole Canonical Reality Model authority and the sole owner of the Reality identity represented as `RUNTIME_STATE_RECORD`. ICR remains the authority for Canonical Input, Verified Input, Canonical Case and the Reality Initialization Request. RDG remains the authority for data nature, certainty, Evidence eligibility, persistence, consent, retention and deletion.

The existing M1/M2 Runtime continues to own operational Journey execution, operational Timeline events and persistence adapters. RMO Reality Events do not replace or write that Timeline.

## RMO-W0 Reality Model Audit

The audit binds the current ICR, RDG, Master Work and existing Runtime authorities with normalized `UTF8_NO_BOM_LF` SHA-256 digests. Normalized digests detect semantic source drift without treating a Windows checkout's CRLF conversion as an authority change.

## RMO-W1 Canonical Reality Object

`Reality v1` is an immutable root snapshot produced only after RMO verifies both the ICR initialization request and its referenced Canonical Case. It contains opaque subject and source references, RDG lifecycle references, reserved component reference lanes and deterministic lineage. It contains no Verified Input payload, Evidence payload, Interpretation or Provider output.

The initial component lanes are empty. Entity, Event and Signal records bind independently to the immutable Reality root; later RMO versioning will incorporate their references without mutating Reality v1.

## RMO-W2 Entity Registry

The Entity Registry controls entity types and roles but stores no entity instances or user data. A Reality Entity holds only an opaque canonical reference, Reality binding, controlled RDG nature/certainty and source references. `PRIMARY_SUBJECT` must match the Reality subject reference.

## RMO-W3 Event Runtime

A Reality Event records an occurrence, transition, interaction, milestone or condition change bound to a Reality and known Entities. Event creation is not Evidence promotion and does not create Interpretation. The existing operational Timeline remains untouched.

## RMO-W4 Signal Runtime

A Signal is a governed indicator bound to known Entities and Events. A Signal is not an Event, Evidence, Interpretation or Inference. W0-W4 accepts only non-inferential source natures; calculated and derived Signal execution remains deferred to the later interpretation/inference boundary.

## Non-activation

This tranche is deterministic and validation-only. It creates no database migration, persistent Reality store, production execution, customer database adapter, Evidence promotion, Interpretation, Inference, Provider/AI authority or real user data.

Next: `RMO-W5 Relationship Runtime`.

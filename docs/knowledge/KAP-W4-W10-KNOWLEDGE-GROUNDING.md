# KAP-W4–W10｜Knowledge Grounding

## Purpose

KAP Phase 2 activates the governed `Question → KnowledgeGroundingBundle → CoverageDecision` path for `ASK_PHIOS` without activating answer composition, AI, Guided Reading, Reality Journey mutation, MCD, publication, or a client surface.

## Authority chain

```text
Client Question
  ↓
KAP-W4 Question Intake
  ↓
KAP-W5 Deterministic Normalization
  ↓
KAP-W6 KSAR Knowledge Access reuse
  ↓
KAP-W7 Governed Node Matching
  ↓
KAP-W8 Bounded Relationship Expansion
  ↓
KAP-W9 KnowledgeGroundingBundle
  ↓
KAP-W10 CoverageDecision
```

KAP does not become a new retrieval authority. W6 routes through the existing KSAR Knowledge Access boundary. Reviewed manuscript material can ground a question without becoming a Published Article, and source-native manuscript material without an approved canonical binding does not gain a node claim.

## Node matching

A node can enter the KAP match set only from a published retrieval result or an already `APPROVED` manuscript canonical binding. `PENDING` bindings stay unknown. KAP does not perform automatic semantic binding and does not mutate Canonical Nodes.

## Relationship expansion

W8 consumes the existing `published_graph_only` relationship authority and controlled evidence-backed mechanism expansion. Expansion depth is one. Unpublished targets are `disclose_not_promote`: they may appear as blocked continuations but their content cannot enter grounding. Provider-generated or unsupported relationship inference is forbidden.

## Grounding bundle

`KnowledgeGroundingBundle` is a non-authoritative input object for later answer composition. It may contain published fragments, reviewed manuscript excerpts, governed node matches, bounded relationships, evidence-backed mechanism facets, unknowns, and explicit exclusions. It cannot contain a raw full book, raw section body, unpublished target content, Reality evidence, Method calculation result, or AI-created knowledge.

The existing KSAR runtime may return a deterministic grounded answer. Phase 2 records whether that upstream projection existed but intentionally does not consume its text. Answer composition begins only at KAP-W11.

## Coverage

The deterministic W10 states are:

- `STRONG_COVERAGE`
- `PARTIAL_COVERAGE`
- `INSUFFICIENT_COVERAGE`
- `OUT_OF_SCOPE`

`OUT_OF_SCOPE` requires an explicit scope disposition; it is not inferred by a model. W10 does not route into Guided Reading or Reality Journey and does not require AI.

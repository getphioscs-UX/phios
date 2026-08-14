# KAP-W11–W17｜Answer Composition

Baseline: `09d6ee76315cf7a8d6ab7e373d86fff816866845`

This phase activates the first independently deliverable **Ask PHI OS** answer path without activating MCD, Guided Reading, Reality Journey, publication authority, Reality Reading authority, or a generative-AI provider.

## Runtime chain

```text
ASK_PHIOS
  → KAP-W4 Question Intake
  → KAP-W5 Deterministic Normalization
  → KAP-W6 KSAR Retrieval
  → KAP-W7 Canonical Node Matching
  → KAP-W8 Governed Relationship Expansion
  → KAP-W9 KnowledgeGroundingBundle
  → KAP-W10 Coverage Decision
  → KAP-W11 Deterministic Answer
  → KAP-W12 Answer Depth
  → KAP-W13 AI Eligibility Classification
  → KAP-W14 AI Authority Boundary
  → KAP-W15 Cost Route
  → KAP-W16 Source Projection
  → KAP-W17 Known / Unknown Boundary
  → QuestionScopedKnowledgeAnswer
```

## Production endpoint

`GET /api/ask-phios?q=<question>&locale=zh-Hans&depth=STANDARD&source=hybrid`

The endpoint returns a `PHI-OS-ASK-PHIOS-RESPONSE-v1.0.0` envelope containing the governed `QuestionScopedKnowledgeAnswer`, source projections, coverage, unknown boundaries, and AI eligibility metadata.

## Deterministic-first rule

Phase 3 always delivers through `TIER_0_DETERMINISTIC`. W13 may classify a request as `AI_OPTIONAL` or `AI_RECOMMENDED`, but this classification does not authorize a provider call. Tier 1 and Tier 2 are declared for future successor work and remain inactive.

## Authority boundary

The answer remains:

- not Canonical Knowledge;
- not a Published Article;
- not a CAR asset;
- not a Reality Reading;
- not a persistent Reality Case;
- not Method Calculation;
- not Professional Judgment.

Only content already present in the governed grounding bundle may support substantive answer claims. Policy-generated text is restricted to boundary, unknown, and observation guidance.

## Source projection

The client can see question-scoped source excerpts and governed references. Full manuscript bodies, unpublished relationship target content, pending Canonical bindings as node claims, and raw internal registry objects remain blocked.

## Independent production condition

Ask PHI OS is considered independently deliverable when:

- KSAR/public knowledge grounding is available;
- deterministic answer composition succeeds;
- a generative provider is not required;
- MCD is not required;
- Guided Reading is not required;
- Reality Journey is not required.

The existing `/knowledge-search` surface is the first Ask PHI OS client projection and now calls `/api/ask-phios` rather than directly rendering KSAR's predecessor grounded-answer text.

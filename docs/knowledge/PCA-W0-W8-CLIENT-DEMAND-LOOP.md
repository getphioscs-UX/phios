# PHI OS｜PCA-W0–W8 Client Demand Feedback Loop

Baseline: `dcfcc7685aa31c6af4a32e77022365a01847493b`

PCA is a **non-authoritative demand feedback plane** between client Knowledge Answers and the already frozen KPP → PJA / CAR production authorities. It does not create Canonical Knowledge, Meaning, publication authority, or production activation.

## Authority chain

```text
Client Questions
→ Dynamic Knowledge Answers
→ anonymous aggregated QuestionDemandSignal
→ QuestionDemandCluster
→ advisory KPPDemandInput
→ KPP planning / human production decision
→ PJA article path and/or CAR asset path
→ Human Review
→ Published Knowledge
→ Better future answers
```

Hard boundary:

```text
Demand cannot rewrite Canonical Truth.
```

## W0｜PJA Boundary

PJA remains the Publication Production Runtime. PCA never becomes a Client Answer Generator, article approver, or publisher.

## W1｜CAR Boundary

CAR remains Reusable Knowledge Asset Production. PCA may propose a reusable visual need only after a governed KPP CAR handoff; it cannot render, approve, or publish the final asset.

## W2｜Question Demand Signal

`QuestionDemandSignal` stores anonymous aggregated metrics only:

- question cluster code
- matched canonical node codes
- frequency
- coverage gap
- follow-up rate
- answer difficulty
- journey escalation rate

Raw question text, user/account/session/case identifiers, birth data, IP address, and personal answer content are rejected by the runtime.

## W3｜Demand Cluster

Signals sharing the same `questionClusterCode` can be deterministically aggregated. Frequency is summed, rates are frequency-weighted, and the most severe observed coverage gap / answer difficulty is retained. A Demand Cluster is never Canonical Knowledge.

## W4｜KPP Demand Input

PCA projects six advisory dimensions to KPP:

`Canonical Maturity / Knowledge Gap / Client Demand / Surface Need / Academy Need / Reading Need`.

This input cannot silently mutate a frozen KPP plan, production role, or production wave.

## W5｜Article Candidate

The initial v1 demand policy marks a reusable candidate eligible for KPP consideration only when demand is high and governed Knowledge support is strong. PCA still does **not** assign the `ARTICLE` production role. KPP retains that decision and its human production decision gate.

## W6｜PJA Brief Candidate

A demand-originated PJA brief can be created only after KPP has selected `ARTICLE`, recorded an approved human production decision, and supplied frozen plan and wave references. The brief includes scope, canonical nodes, thesis, boundaries, source refs, and locale requirements. Thesis must come from `CANONICAL_THESIS` or `HUMAN_EDITORIAL`; demand-derived or AI-inferred thesis is forbidden.

## W7｜CAR Visual Candidate

Reusable `FIGURE / DIAGRAM / FLOW / COMPARISON` needs can create a CAR visual candidate only with a governed KPP CAR handoff using `FIGURE`, `DIAGRAM`, or `MULTI_ASSET`. The output is not a final asset.

## W8｜Production Feedback Loop

Published outputs may improve future answer coverage, but customer behavior never automatically creates a Canonical Node, changes thesis / relationship / Meaning, or publishes an article / asset.

## Production activation state

The PCA runtime primitives and validation fixtures are active. Production demand registries intentionally start empty. Client-surface event wiring belongs to PHASE 17 Unified Client Surface; PCA itself does not introduce a second public endpoint or a hidden collection path.

## Validation

```bash
npm run check:pca
```

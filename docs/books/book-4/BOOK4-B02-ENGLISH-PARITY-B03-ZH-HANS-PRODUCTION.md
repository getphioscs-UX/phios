# BOOK IV · B02 English Semantic Parity + B03 zh-Hans Production

Baseline: `e8d9c5c0b222fabfae9bae0ed9abb6e098705c1f` (`PHASE 9`), using the user-supplied `books.zip` aligned to main.

## B02 successor state

- Owner decision: 4/4 zh-Hans Articles ACCEPTED.
- Reviewed zh-Hans candidate bytes remain unchanged.
- 4 English candidates were produced only after the 4/4 decision.
- Source-section bindings, canonical-node bindings, and block-function shape are identical across locales.
- English semantic parity: MACHINE ACCEPTED 4/4.
- English editorial quality is not inferred as human-accepted from the Chinese decision.
- Publication remains closed.

## B03 production state

- 5 zh-Hans Articles generated from the frozen A3 grouping.
- Exact coverage: 10 final Book IV nodes / 10 final manuscript sections.
- Every Article contains summary + 7 prose paragraphs + key judgment + Reality Question.
- Human editorial gate: PENDING 0/5.
- English production remains blocked until explicit 5/5 zh-Hans acceptance.
- Publication remains closed.

## Commands

```text
npm run check:book4:b02-en
npm run check:book4:b03
npm run book4:b03:review
```

## Boundary

Book IV A6 knowledge admission remains complete. Article acceptance, English parity, and public publication are separate authorities. No canonical node is created or mutated by this work, and no Book IV Article is marked published.

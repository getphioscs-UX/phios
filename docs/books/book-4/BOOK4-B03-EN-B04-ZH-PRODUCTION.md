# BOOK IV — B03 English + Semantic Parity / B04 zh-Hans Production

Baseline: `35bba5e0d9ce328801e5d56d812851bb1aad2044`  
Recorded: 2026-09-11

## B03

Owner decision: **5/5 zh-Hans Articles ACCEPTED**.

English production is therefore authorized for `B4-ART-013` through `B4-ART-017`.
Five English Article candidates are generated with the same source bindings,
Canonical Node bindings, A2 semantic-profile bindings, and block-function shape
as the accepted Chinese source-bound Articles.

Machine semantic parity: **5/5 ACCEPTED**.

This is not an English human editorial acceptance and does not create publication
authority. Both locales remain `not_published`.

## B04

Five zh-Hans Article candidates are generated for `B4-ART-018` through
`B4-ART-022`, covering exactly `KN-B4-P10-231` through `KN-B4-P10-240` and the
ten frozen final manuscript sections `CM-B4V1-P10-S031` through `S040`.

B04 human editorial state: **0/5 PENDING**.

English production remains blocked until the owner explicitly accepts all five
Chinese Articles.

## Commands

```text
npm run check:book4:b03
npm run check:book4:b03-en
npm run check:book4:b04
npm run book4:b04:review -- /path/to/BOOK4-B04-ZH-HANS-HUMAN-REVIEW.html
```

## Authority boundary

No Canonical Node mutation.
No A3 regrouping.
No active KIR source-admission mutation.
No published-Article binding mutation.
No customer publication cutover.

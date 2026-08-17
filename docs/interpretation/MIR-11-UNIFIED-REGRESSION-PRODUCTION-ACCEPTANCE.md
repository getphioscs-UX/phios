# MIR-11｜Unified Regression + Production Acceptance + Successor Freeze

Baseline: `3986cca72634d9a09bb4cfd38d1d11981bce571e`.

MIR-11 adds no second runtime authority. It reconciles historical freeze evidence with current successor wiring, runs structural/figure/manuscript/Personal Structure/Interpretation/KAP/RJX/PCA regression, and produces a fail-closed production acceptance candidate.

## Current validation state

Machine/domain validation is green for the current MIR successor chain. The aligned ZIP does not contain `.git`, so repository checks that intentionally resolve historical Git commits cannot run from the ZIP. The untouched aligned baseline fails at the same Git-history gate. MIR-11 therefore does **not** rewrite those checks and does **not** stamp final MIR COMPLETE inside ZIP validation.

## Final command in the real Git worktree

```text
npm ci
npm run check:mir
```

`check:mir` first runs MIR-11 unified machine regression, then runs the mandatory full `npm run check` gate in a real Git worktree. No fake human approval is created by this command.

## Frozen authority

Calculation != Projection != Interpretation != Meaning != Reading != Navigation != Professional Judgment. Renderer remains projection-only. KAP cannot derive new Interpretation. RJX remains non-default. PCA cannot mutate Canonical Truth. HDR remains restricted/internal. New knowledge and validated successor discoveries remain evolvable through versioned successors.

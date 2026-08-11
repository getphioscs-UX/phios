# PHASE MPA — W11–W16 Validation Evidence Foundation

Baseline: `3dd903344945ecd3b585c8aafe48b93d7894caa9`.

This package establishes Calculation Data Authority, Reference Fixture Corpus, Method Validation Harness, Regression Runtime, Cross-Implementation Comparison, and the canonical Method uncertainty/error contract.

It does **not** activate Production or Professional execution. Existing MR/IMR frozen v1 authorities are not rewritten.

Key fail-closed facts:

- NUM validation literals are bound to governed payload digests; Production must resolve authority codes.
- AST ephemeris package/data version and digest are not frozen, so Production remains blocked.
- IANA TZDB runtime version/data digest and license review remain unresolved for Production.
- BZR independent calendar reference evidence is not yet bound.
- HDR remains blocked by restricted license/mapping authority and unresolved ephemeris authority.
- Synthetic adapters are validation evidence only and cannot substitute for trusted reference evidence.
- `looks correct` is never an acceptance state.
- Canonical errors never return pseudo results.

Validation:

```powershell
npm run check:mpa-w11-w16
npm run check:mpa
```

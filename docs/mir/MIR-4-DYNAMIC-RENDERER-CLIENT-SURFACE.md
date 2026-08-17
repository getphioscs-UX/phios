# MIR-4｜Dynamic Renderer + Method Client Surface Reconciliation

Baseline: `73ba874ecad0e452eb768a36af9f0c66241c906a`

## Frozen predecessor rule

MCD-6 and MCD-7 v1 frozen outputs are historical truth and are byte-preserved. MIR-4 is additive successor work only.

## Authority

`Canonical Input != Calculation != Projection != Renderer != Interpretation != Meaning != Reading`.

Renderers own geometry, layout, visual encoding, label placement, responsive behavior, accessibility and presentation selection only. They may not calculate, normalize missing facts, decide projection, interpret, create Meaning, call AI, fill UNKNOWN, expose raw runtime state, or grant Production.

## Method renderers

AST, BZR and NUM continue to use the frozen MCD-6 CanonicalMethodProjection renderers. MIR-4 does not modify their bytes. Cross-method composition renders only classifications supplied by an upstream canonical composition object.

## PHI OS Personal Structure successor

The historical HDR validation renderer remains validation-only. The new `PHI_OS_PERSONAL_STRUCTURE` renderer consumes only `PHI-OS-PERSONAL-STRUCTURE-PROJECTION-BUNDLE-v1.0.0` from MIR-3 Shared Projection Runtime output. It uses PHI OS public vocabulary, neutral layer presentation, PHI OS Center System geometry, structural connection edges, projected Type/Authority/Definition/Profile/Configuration, lineage and explicit UNKNOWN states.

The visual angle transform is presentation-only and does not reuse the +302° astronomical Gate Wheel offset as a CSS/SVG rotation rule.

## MCD-8 leakage successor

The historical MCD-8 leakage checker remains byte-preserved. Its pre-MIR-3 global ban on structural field names is reconciled by a scoped successor: only the governed Personal Structure renderer may consume `definedCenters`, `undefinedCenters`, `typeCode` and `definitionCode` when they are already present in the MIR-3 canonical projection bundle. Direct Core/Calculation runtime access, branded HDR surface data, raw results and UNKNOWN filling remain forbidden. The current `check:mcd-8` package alias points to this versioned successor; historical frozen evidence is not rewritten.

## Client surface successor

The v2 successor composition exposes Overview, AST, BZR, Numeric, Comparison, Personal Structure and Reading-handoff panels. Reading is handoff-only until MIR-8 and cannot calculate or interpret. Personal Structure remains controlled-unavailable while MIR-3 `currentFullCoreProductionReady=false`; the renderer cannot bypass readiness.

Route promotion remains deferred to MIR-11 unified acceptance so the frozen MCD-7 v1 route bytes remain unchanged.

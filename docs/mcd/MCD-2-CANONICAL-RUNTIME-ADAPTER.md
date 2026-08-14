# MCD-2 | Canonical Runtime Adapter

Baseline: `eb55edb1a183a173aca707e3d3f1a6f842e36271`

## Purpose

MCD-2 establishes the only canonical Method binding path:

```text
POST /api/method-execute
        ↓
MPA-owned MCD-1 successor gate
        ↓
MCD Canonical Adapter Registry
        ↓
Method Adapter
        ↓
Core Method Runtime factory binding
```

MCD-2 does **not** create Method Truth, Production authority, Interpretation, Professional Judgment,
Canonical Method Input, customer calculation output, or Canonical Projection.

## Current method state

| Method | Adapter | MPA successor | Core binding | Customer calculation |
|---|---|---:|---:|---:|
| AST | registered production-authorized binding | allowed | AST Astronomy + Planet | deferred to MCD-3/MCD-4 |
| BZR | registered production-authorized binding | allowed | Solar Calendar + Four Pillars + Luck Cycle + Projection | deferred to MCD-3/MCD-4 |
| NUM | registered production-authorized binding | allowed | Birth Number + Structure + Cycle + Projection | deferred to MCD-3/MCD-4 |
| HDR | registered validation-only | blocked | validation factory metadata only | forbidden |

## Why calculation remains deferred

The historical Core Method runtimes preserve explicit validation-only execution boundaries. MCD-2 does not
rewrite those boundaries or pass raw browser input into them. MCD-3 must first establish CanonicalBirthInput /
method-specific input contracts and MCD-4 must establish governed execution.

The Adapter probe binds module/factory identity only. It does not perform a customer calculation.

## HDR

HDR remains:

```text
state = BLOCKED
executionMode = validation_only
Production invocation = FORBIDDEN
Professional release = FORBIDDEN
public customer result = FORBIDDEN
```

The registration exists so future governance can validate adapter compatibility without activating the method.

## MPA successor reconciliation

The historical MPA-W30 freeze remains intact. MCD-2 adds:

`content/professional/method-production-activation/successors/mpa-w30-mcd2-adapter-successor-v1.json`

It authorizes only the canonical API binding drift needed to consume the already-existing MPA MCD-1 authority successor.
All other W0-W30 preserved artifacts remain exact-hash bound.

# PJA-W2F-C2｜Universal Scope and Batch Production Infrastructure

## State

`PJA-W2F-C2-v1.0.0-Infrastructure-Ready`

## Contract

C2 adds deterministic production selection for `NODE`, `PREFACE`, `PART`, `BOOK`, and `ALL`. The default mode is a write-free plan. `--apply` delegates to the governed C1/B2 article producer and may create packages only for registered, Human-Frozen, `production_ready` Nodes.

## Current Preface result

`KN-PREFACE-001` is the sole eligible Node and already has a governed Chinese Draft Package. `KN-PREFACE-002` through `KN-PREFACE-013` remain blocked. Scope selection never changes readiness, Human Freeze, review, approval, publication, Registry, Runtime, Provider, Payment, Entitlement, or D1 state.

## Commands

```text
npm run knowledge:plan-articles -- PREFACE
npm run knowledge:produce-articles -- PREFACE --apply
npm run knowledge:validate-articles -- PREFACE
npm run check:pja-w2f-c2
```

## Cross-platform validation

The directory-symlink security fixture is executed where the operating system permits symlink creation. Windows or OneDrive denial does not bypass security validation because the archive-based symlink rejection fixture remains mandatory on every platform.

# PHASE RR v2｜Customer Report Runtime

Baseline: `1ebd26901fb63db0753a8fc737ea6423155cf8b0`.

RR v2 upgrades the existing report layer into the canonical `REPORT_RECORD` assembly authority. It does not replace legacy M4A/M4B report adapters and does not take authority from RMO, RRE, CMR, PR, JR, Knowledge Authority, CPR or LRM.

## Canonical chain

```text
Upstream governed records / references
        ↓
RR Assembly
        ↓
Immutable Candidate
        ↓
RR Review
        ↓
Approval Gate
(PR required only when service contract requires Professional)
        ↓
Canonical REPORT_RECORD
        ↓
Release
        ↓
CPR → HTML / PDF / Workspace
        ↓
LRM event intent (deferred until LRM executor exists)
```

## Authority boundary

RR is assembly authority only. Report ≠ Knowledge, Meaning, Professional Judgment, Journey, Readout or Metric. Semantic sections are reference-only. RR does not write PR approval, generate a readout/metric, render CPR surfaces, or persist LRM timeline events.

## RDG reconciliation

RDG v1 already grants RR `REPORT_RECORD` write authority. The RR v2 successor adds only read authority for `RUNTIME_STATE_RECORD`, `METHOD_PROJECTION_RECORD`, `MEANING_PROJECTION_RECORD`, and `NAVIGATION_RECORD`; the RRE successor's existing read-only `REALITY_READOUT_RECORD` grant is inherited. No new RR data type is created.

## LRM

The baseline still has no dedicated LRM executor. RR-W10 therefore emits `REPORT_RELEASED` / `REPORT_REVISED` event intents and returns `DEFERRED_LRM_EXECUTOR_NOT_ACTIVATED`; it never claims timeline persistence.

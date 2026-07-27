# M4B-W2A — Professional Workspace Foundation

## Outcome

M4B-W2A establishes the contract layer for a future Professional Workspace.
It reuses the service, consent, privacy and financial boundaries already
frozen by M4A. It does not create a second service catalog or redefine Human
Design, Runtime, Reading, Navigation or Review contracts.

## Contracts

| Contract | Responsibility |
| --- | --- |
| `phi-os.professional-workspace.v1` | Consent-gated workspace shell and resource capabilities |
| `phi-os.professional-client-index.v1` | Minimal client-list projection without embedded sensitive content |
| `phi-os.professional-task.v1` | Review Queue task types, priorities, status and legal transitions |
| `phi-os.professional-source.v1` | Source classification and External Reader separation |

## Consent gate

A Workspace may be created in `awaiting_consent`, but every resource
capability remains disabled. Activation requires an active Professional
Consent whose client, professional and service match the Workspace.
Revocation disables every capability again.

## Source boundary

Runtime sources, rule inference, AI interpretation, professional observation
and External Reader interpretation remain separately labelled. Human Design
and every future External Reader are interpretation-only and cannot become
Runtime Evidence.

## Current implementation boundary

This work package does not add:

- a Professional Workspace page or client-facing route;
- real client records, birth data, chart files or uploaded documents;
- D1 tables, migrations or persistent Workspace storage;
- Professional Notes, Reading Revision or report generation;
- appointments, payment, checkout or public service pages;
- automatic Human Design chart calculation;
- automated recommendations or regulated professional advice.

## Next work package

`M4B-W2B — Client List, Runtime View, Professional Notes and Review Queue`
may project these contracts into a guarded interface. Persistence must remain
disabled until its own schema, migration, authorization and recovery gates are
approved.

## Verification

```powershell
npm run check:m4b-professional-workspace-foundation
npm run check
```

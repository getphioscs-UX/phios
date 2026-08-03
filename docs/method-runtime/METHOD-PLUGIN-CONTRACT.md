# Method Plugin Contract

## Purpose

The Method Plugin Contract is the only entry contract for a method implementation. Registration connects a Plugin to the single Method Runtime Platform; it does not create a second Runtime or Production authority.

## Frozen root fields

The contract requires:

| Field | Meaning |
| --- | --- |
| pluginCode | Unique Plugin identity |
| pluginVersion | Plugin implementation version |
| runtimeVersion | Required Method Runtime version |
| projectionVersion | Projection JSON contract version |
| status | Unified lifecycle state |
| licenseStatus | Commercial and source-rights state |
| dependencies | Explicit dependency declaration |

The governed schema also requires schemaVersion, imrStatus, methodDefinitionVersion, dataAuthority, authority, calculationPolicy, projectionPolicy, interpretationPolicy, professionalPolicy and capabilities.

## Dependency contract

Journey Runtime, Knowledge Runtime and Professional Workspace must be false as required dependencies. Published Knowledge and Journey Runtime may be declared only as optional Interpretation inputs. Method Plugin and verified external calculation-engine dependencies are explicit and versioned.

## Authority contract

Every Plugin must bind to:

- IMR-approved Method Definition
- Shared Data Authority
- Shared Calculation Runtime
- Shared Projection Runtime
- Shared Interpretation Runtime
- Shared Professional Runtime
- Authorized-human release

Missing authority blocks the Plugin.

## Calculation contract

Calculation declares deterministic_engine or verified_external_engine, 100_percent repeatability and false for Provider participation, AI, Workers AI, Prompt and Interpretation.

## Projection and Interpretation contract

Projection output is PROJECTION_JSON, contains no Interpretation and has no Professional authority. Interpretation output is INTERPRETATION_CANDIDATE, is not a Professional Conclusion and cannot directly release.

## Professional contract

Professional Review is independent. An authorized human is required and release authority remains SHARED_PROFESSIONAL_RUNTIME.

## Registration and Production

A schema-valid contract is necessary but not sufficient for Production. Production additionally requires production lifecycle state, IMR production_eligible and approved or not_required license status.

## Fixtures

Valid fixtures cover HDR, AST and BZR. Invalid fixtures prove blocking for missing runtimeVersion, Provider or AI participation in Calculation, missing authority and missing lifecycle status.

## Translation layers

Gene Keys is not registered as a Runtime. It may be registered later as a governed translation layer that consumes Human Design Projection and supplies another Interpretation system.


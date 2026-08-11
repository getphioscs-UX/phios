# PHASE WPR-E｜WPR-W20 Reality Journey Production Composition

Baseline: `1ebd26901fb63db0753a8fc737ea6423155cf8b0`

## Purpose

Project the frozen JR v2 Canonical Journey Runtime onto web surfaces without creating a second Journey runtime or promoting validation-only upstream state into production.

## Authority

Canonical workflow authority remains:

- `content/runtime/journey-runtime/freeze/jr-v2-freeze-v1.json`
- `content/runtime/journey-runtime/registries/canonical-journey-stage-registry-v2.json`
- `content/runtime/journey-runtime/registries/journey-stage-compatibility-registry-v1.json`
- JR progress, safety and recommendation contracts

WPR owns web projection only.

## Production projections

### `/reality-journey`

Mode: `JR_V2_CANONICAL_AUTHORITY_OVERVIEW`

- Public.
- Read-only.
- Eight canonical JR v2 stages are loaded from the stage registry.
- Existing six customer tasks remain a registered compatibility projection.
- No customer/private state is read.

### `/reality-dashboard`

Mode: `BROWSER_LOCAL_JOURNEY_COMPATIBILITY`

- Customer-oriented local recovery/status view.
- Existing M3C browser-local state is preserved.
- Legacy M3C stage identifiers are mapped through JR v2 compatibility authority.
- This route does **not** claim authenticated canonical customer workspace or canonical JR v2 persistence.
- No server customer data is consumed by WPR-W20.

## Non-activation

WPR-W20 does not:

- create a live customer Journey;
- persist canonical Journey or Readout state;
- execute RNE;
- persist LRM timeline events;
- create professional responsibility;
- activate Method execution;
- activate WPR-W21;
- create CPR production records;
- add WPR or JR to `postcheck`.

## Validation

```powershell
npm run check:wpr-w20
npm run check:wpr
npm run check:jr
npm run check:m3c-public-journey-acceptance
npm run check:m3c-journey-dashboard
npm run check:pds-w4
npm run check:i18n
npm run check:pws-entry-w1
```

## Next

`WPR-W21｜Personal Runtime Surface`

WPR-W21 remains separately gated by MPA Method eligibility and must not infer execution eligibility from JR v2.

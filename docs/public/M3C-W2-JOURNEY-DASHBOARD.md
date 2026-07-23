# M3C-W2 · Journey Dashboard

## Outcome

`reality-dashboard.html` is the customer-facing, bilingual status view for an
existing Reality Journey. It projects the frozen Runtime state into five
summary fields:

- Current Stage
- Completed Stages
- Next Step
- Latest Update
- Recovery Status

It also provides Resume Journey, the Resume / Revise / Start New Journey
boundary, and a compact append-only Journey Timeline.

## Runtime boundary

Opening the dashboard is read-only. It:

- reads stage state through `inspectRuntimeWorkspaceState()`;
- reads the browser recovery snapshot and recovery status;
- builds the timeline through the existing Runtime Lineage module;
- never submits Entry, creates a revision, creates a Runtime, clears storage or
  executes a transition.

Resume opens the current canonical stage. Revise and Start New Journey route
through `my-reality.html#continuity`, where the existing Runtime contract
requires explicit confirmation and preserves lineage.

The recovery label describes the state this client can actually prove. It does
not claim cloud recovery when only browser persistence is available.

## Files

- `reality-dashboard.html`
- `assets/css/reality-dashboard.css`
- `assets/js/pages/reality-dashboard.js`
- `assets/js/modules/journey-dashboard-projection.js`
- `assets/js/modules/runtime-workspace-state.js`
- `assets/js/locales/en/journey.js`
- `assets/js/locales/zh-Hans/journey.js`
- `content/registry/m3c-journey-dashboard.json`
- `scripts/check-m3c-journey-dashboard.mjs`

## Verification

```powershell
npm run check:m3c-journey-dashboard
npm run check
```

After Cloudflare Pages deploys:

```powershell
Start-Process "https://phios-github.pages.dev/reality-dashboard"
```

Acceptance should cover an empty browser, an interrupted Entry, a later
Runtime stage, a restored snapshot, both languages, and mobile widths.

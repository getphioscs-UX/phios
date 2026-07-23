# M3C-W10 — Public Journey Acceptance

## Purpose

This gate verifies that the public Reality Journey remains understandable,
recoverable and continuous across the complete customer path:

`Entry → Reconstruction → Reading → Navigation → Review → Memory → Continuity`

It is an acceptance layer. It does not change a frozen Runtime contract,
provider boundary, persistence schema, lineage rule or D1 binding.

## Automated matrix

Eight scenarios run in English and Simplified Chinese at mobile and desktop
viewports, producing 32 acceptance cases:

1. First-time user
2. Returning user
3. Interrupted session
4. Provider failure
5. Language switching
6. Mobile use
7. Slow network
8. Expired session

The checks exercise the real Journey Dashboard projection, Runtime snapshot
save/restore functions and Provider Failure result contract. They also verify
the seven-stage route graph, customer-visible recovery states, bilingual
refresh hooks, responsive contracts, loading/retry states, explicit Entry
recovery consent, lineage preservation, and visible Memory/Continuity views.

## Local acceptance

```powershell
npm run check:m3c-public-journey-acceptance
npm run check
```

The local production command is intentionally safe when no URL is configured:
it confirms that the deployed gate is ready and exits without making requests.

## Post-deployment read-only acceptance

```powershell
$env:PHIOS_PUBLIC_JOURNEY_BASE_URL="https://phios-github.pages.dev"
npm run check:m3c-public-journey-production
Remove-Item Env:PHIOS_PUBLIC_JOURNEY_BASE_URL
```

The production gate only sends `GET` requests. It verifies eight Journey
routes, nine critical static assets and the production Runtime D1 binding. It
does not create, revise, delete or persist a customer Runtime.

## Manual deployed acceptance

Complete these browser checks after deployment:

- Start once in English and once in Chinese; verify coordinate-first Entry.
- Interrupt a disposable test Journey, reopen it and explicitly choose Resume.
- Switch language in the middle of Reading or Navigation; verify the same
  Runtime and stage remain active.
- Use browser network throttling; verify loading and explicit retry without
  losing the last valid customer state.
- Test at 360 px width and on a physical phone; verify navigation, forms,
  progress, error states and action buttons.
- Complete a disposable test Journey through Review, then verify Memory,
  Continuity, revision choice and lineage history.

## Completion boundary

M3C automated completion is reached when both local commands pass. Production
completion is recorded only after deployment and the live read-only command
passes. Human visual acceptance remains a deployed release gate.

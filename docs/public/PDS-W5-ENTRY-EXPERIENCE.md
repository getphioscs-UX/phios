# PDS-W5｜Entry Experience

Baseline: `main@eb462d91c62144aa52f405cdceba60516665141c`

## Boundary

This work aligns only the Entry interface and interaction feedback with the
PHI OS Design System. It does not change Entry question selection, completeness
evaluation, maximum-round behavior, Evidence extraction, `entry_complete`, API
payloads, persistence, or Provider routing.

## Interface contract

- The opening prompt and composer are the visual focus.
- Conversation roles remain explicit and each turn stays visually distinct.
- Confirmed information and information still being clarified are both visible.
- Recovery, correction, pause, continue, and consent boundaries use customer
  language.
- Input, editing, submitting, and failure states are announced without creating
  a second submission path.
- Failure recovery returns focus to the existing input. It never resubmits,
  reconstructs, or mutates Evidence.
- Internal schema labels, status flags, Provider details, data keys, and round
  budget are not shown in Customer View.
- The existing action and information architecture remain unchanged.

## Responsive contract

- `360px`: composer and actions remain reachable in one column.
- `768px`: the composer stays attached to the conversation while scrolling.
- `1440px`: conversation retains priority over the supporting clarity summary.
- Reduced-motion preference disables the submitting pulse and transitions.

## Verification

Run:

```sh
npm run check:pds-w5
```

The check validates the presentation contract and verifies SHA-256 hashes for
all protected Entry and Provider behavior files.

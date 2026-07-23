# M3C-W3.2 · Entry Recovery Consent Gate

## Outcome

Reality Entry now opens through two explicit decisions:

1. choose where the change is most noticeable;
2. describe the recently observed change in one sentence.

The Reality Coordinate replaces typing as the first interface question. A
user must choose one or up to two coordinates. “I’m not sure yet” remains
exclusive. The choice personalizes the second prompt but does not call AI,
advance the formal Entry round or change the frozen Runtime Entry contract.

The same coordinate-first order is used in the public Light Try. The Light
Try remains fully client-side and does not use an API, session storage, local
storage or Runtime Memory.

## Recovery consent

A direct visit to `/reality-entry` never reveals recovered Entry content.
When a previous Entry exists in the browser, the page shows a neutral consent
gate containing only recovery availability and saved time.

The user must explicitly choose:

- **Resume previous Entry** — reveal and continue the recovered Entry;
- **Start a new Entry** — remove browser Runtime recovery and open a blank
  coordinate-first Entry;
- **Open Journey Dashboard** — inspect journey status without exposing the
  Entry on this page.

The Dashboard’s Resume action uses `/reality-entry.html?mode=resume` when
Entry is the current stage. Explicit Revise and New Runtime routes keep their
existing behavior.

Starting fresh removes only the browser recovery copy. It does not delete a
server-side Runtime or rewrite historical lineage.

## Contract boundary

Reality Coordinate remains `reported_orientation`. It is excluded from:

- `/api/reconstruct-reality`;
- model conversation and answer bindings;
- formal Entry question counting;
- automatic classification and Navigation selection;
- Professional service routing.

`runtime-persistence.js`, the Runtime Entry schema, API and contract registry
remain frozen. The consent gate is implemented in the Entry page controller,
so automatic browser recovery can continue serving later journey stages
without silently disclosing Entry content.

## Verification

```powershell
npm run check:m3c-entry-recovery-consent
npm run check
```

After deployment, verify `/reality-entry`, `/reality-dashboard` and
`/reality-demo` in both languages and at desktop and mobile widths.

For the recovery case:

1. choose a coordinate and enter enough content to create Entry state;
2. reopen `/reality-entry` without a mode query;
3. confirm that no prior personal text is visible;
4. choose Resume and confirm that the previous state appears;
5. repeat and choose Start a new Entry, then confirm that the coordinate
   question is blank.

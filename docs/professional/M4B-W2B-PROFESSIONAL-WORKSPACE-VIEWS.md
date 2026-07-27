# M4B-W2B — Professional Workspace Views

## Outcome

M4B-W2B projects the consent-gated W2A contracts into four read-only
professional views:

1. Client List
2. Runtime View
3. Professional Notes
4. Review Queue

The route is not added to public navigation. Without an authenticated,
prevalidated Workspace payload it displays an unavailable state and no client
information.

## Runtime View

Entry, Reconstruction, Reading, Navigation and Runtime Memory are projected
only when their individual Workspace capability is enabled. Every item carries
a source label. Human Design and future External Readers stay in a separate
perspective section and cannot become Runtime Evidence.

## Professional Notes

Notes distinguish private and client-visible material, preserve source labels,
and use immutable revision links. Chart accuracy and birth-time reliability
notes are always private. External Reader content is restricted to
interpretation-specific note types.

## Review Queue

The queue supports the W2A task types and deterministic display sorting.
It does not assign professionals, change priority, start work, send reminders
or persist tasks.

## Current boundary

The page:

- contains no real or example client records;
- does not call an API;
- does not scan Runtime session or local storage;
- does not create a D1 Workspace record;
- does not save Professional Notes;
- cannot revise Reading or issue Navigation recommendations;
- does not implement uploads, reports, appointments or payment.

## Verification

```powershell
npm run check:m4b-professional-workspace-views
npm run check
```

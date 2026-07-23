# M3C-W3.1 · Guided Entry

## Outcome

Reality Entry now gives a first-time user a small, bilingual starting frame:

- begin with one sentence;
- describe only what recently started to change;
- optionally choose up to two Reality Coordinates;
- continue into the existing guided Entry conversation.

The eight coordinates are Body & Health, Relationships & Family, Work &
Career, Money & Resources, Learning & Growth, Meaning & Purpose, Environment
& Place, and I’m not sure yet.

## Data and evidence boundary

Reality Coordinate is `reported_orientation`, not verified evidence or a
diagnosis. It is saved only inside the existing page-refresh Entry state so
the interface can restore the selection.

The selection is deliberately excluded from:

- `/api/reconstruct-reality`;
- the model conversation;
- answer bindings;
- Entry question counting;
- automatic evidence or domain classification;
- Navigation path selection;
- Professional service routing.

No new session-storage key is introduced. If coordinates should later affect
Runtime output, that requires a separately versioned contract change.

## Selection behavior

- The field is optional.
- A user may choose up to two coordinates.
- “I’m not sure yet” is exclusive.
- The coordinate panel closes after the first completed Entry round.
- The primary action begins as “Begin Guided Entry” and then returns to the
  standard “Continue” action.

## Professional boundary

Professional Applications are not added to Entry in this milestone. Their
service, consultation, review, pricing, consent and routing contracts belong
to M4A Professional Workspace. Guided Entry contains only a neutral boundary
statement and does not promote or select a service.

## Verification

```powershell
npm run check:m3c-guided-entry
npm run check
```

After deployment:

```powershell
Start-Process "https://phios-github.pages.dev/reality-entry"
```

Confirm English and Chinese at desktop and mobile widths. Test zero, one and
two coordinate selections, the exclusive “not sure” option, refresh restore,
first submission, provider failure and retry.

# M3C-W9 · Continuity

## Outcome

Reality Continuity now shows and records:

- the Continuity trigger;
- the next Review date, derived from the observation window when possible;
- a customer Check-in;
- whether a new observable change was reported;
- the Revision or New Journey branch selected earlier in Review.

The Check-in is attached to the saved Continuity object as
`reported_experience`. It is not an automated change detector.

## Branch boundary

Continuity confirms the same `nextRuntimeState` selected in Review. To choose
a different branch, the customer returns to Review. A confirmed Continuity
prepares—but does not automatically execute—a transition. A new Journey still
requires explicit execution and preserves the earlier Runtime in lineage.

## Verification

```powershell
npm run check:m3c-continuity
```

After deployment, confirm that only the Review-selected outcome can be
confirmed, a Check-in response is required, and no Runtime is created before
the customer executes the prepared transition.


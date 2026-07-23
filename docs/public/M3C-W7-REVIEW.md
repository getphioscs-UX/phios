# M3C-W7 · Review

## Outcome

Reality Review now presents four customer-facing areas:

1. **Review Summary** — the selected Navigation path, action status and report
   counts;
2. **Change Since Reading** — observed change, unchanged conditions and
   unexpected reality;
3. **Action Result** — path status, difficulties and customer notes;
4. **Continue / Revise / Close** — a customer-controlled grouping of the
   existing Review outcomes.

The grouping does not add new Runtime states. Continue maps to the existing
observation/path states, Revise maps to the existing Reading, Navigation, new
Entry or professional states, and Close maps to `remain_open`.

## Boundary

The customer projection is read-only. Review reports remain
`reported_experience`; no result becomes fact automatically. The frozen Review
and Review-to-Memory builders are unchanged.

## Verification

```powershell
npm run check:m3c-review
```

After deployment, verify `/reality-review.html` in English and Chinese on
desktop and mobile. Confirm that no Review outcome is selected automatically.


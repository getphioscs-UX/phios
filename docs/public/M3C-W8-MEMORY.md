# M3C-W8 · Memory

## Outcome

Runtime Memory now shows:

- a transparent Memory Summary;
- every saved customer-report, evidence, interpretation and Unknown Reality
  group with its evidence class;
- the selected path and Review outcome;
- a local HTML report export;
- an explicit browser Runtime deletion control.

## Deletion boundary

The deletion action removes every PHI OS Runtime contract in the current
browser, the local recovery snapshot and the local Runtime history after
confirmation. It does not claim to delete an authenticated account or remote
D1 data because no authenticated public privacy endpoint exists in this
milestone.

The existing server-side privacy service remains frozen and available for a
future authenticated account boundary.

## Verification

```powershell
npm run check:m3c-memory
```

Test deletion only with a disposable Runtime. Verify that export downloads an
HTML report and that the report preserves evidence classifications.


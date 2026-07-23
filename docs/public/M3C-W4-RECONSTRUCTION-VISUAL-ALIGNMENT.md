# M3C-W4 · Reconstruction Visual Alignment

## Outcome

Reality Reconstruction now presents the customer-facing result as a clear
review surface before Reality Reading:

- **Edit answer** returns to the existing Entry revision route;
- **Evidence source** identifies where displayed material came from;
- **Confidence** communicates structural coverage, not factual certainty;
- **Missing evidence** combines preserved Unknown Reality with unanswered
  Reconstruction targets;
- **Continue** uses the existing Reconstruction → Reading gate;
- **Return to Entry** keeps the revision and lineage boundary explicit.

The header now shows all seven Runtime Journey stages, and the customer
workspace uses the same typography, spacing, cards, buttons, responsive
behavior and status treatment established for Reality Entry.

## Evidence and confidence boundary

The new customer projection is read-only. It consumes the already returned
Runtime Entry and Reconstruction result. It does not:

- call `/api/reconstruct-runtime` or another API;
- read or write browser storage;
- mutate Runtime Entry, Reconstruction or lineage;
- decide whether Reality Reading is available;
- convert reported experience, inference or Unknown Reality into fact.

The displayed confidence percentage comes from the existing Reconstruction
`maturityScore`. It means structural coverage only. Card statuses distinguish
reported material, provisional reconstruction, evidence-supported material
and unresolved material.

## Editing boundary

M3C-W4 does not add inline data editing. Each **Edit answer** action opens the
existing `/reality-entry?mode=revise&target=...` route. The original Runtime
history remains available and the revision process continues to own changes.

The bottom **Return to Entry** action uses revision mode. **Continue to Reality
Reading** remains disabled until the frozen Reading-readiness bridge permits
the transition.

## Cumulative package note

At implementation time GitHub `main` remained at
`26451dff0b974daaed9c84aa505361ae0bd4d466` (M3C-W3.1). The delivery ZIP
therefore carries forward the verified M3C-W3.2 Entry Recovery Consent files
alongside M3C-W4 so that extracting W4 cannot remove the W3.2 package scripts
or `package.json` checks.

## Verification

```powershell
npm run check:m3c-reconstruction-visual-alignment
npm run check
```

After deployment, verify `/reality-reconstruction` in English and Chinese at
desktop and mobile widths. Confirm all five customer cards show source and
confidence, Missing evidence remains visible, each Edit answer route includes
revision mode, Return to Entry preserves revision mode, and Continue follows
the existing Reading-readiness gate.

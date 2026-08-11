# VAP-W20 / VAP-W21 Apply

Baseline: `021007b80fa20739a726fb28bcda4a9369af48e4`

This delta establishes the governed Article ↔ Figure binding and structured Figure projection capability without fabricating a Published Figure.

Current main contains zero CAR Published Assets and the legacy `BOOK-1-FIGURES` R2 entry is an unverified directory group. Therefore the production binding registry intentionally remains empty and fails closed until CAR publishes a concrete Figure/Diagram and the target Published Article exposes stable section identity.

Apply from repository root:

```powershell
Expand-Archive .\vap-w20-w21-delta.zip -DestinationPath . -Force
node scripts/apply-vap-w20-w21-package-scripts.mjs
npm run check:vap-d
npm run check:pja-w2d
npm run check:wpr-w10
npm run check
```

The delta reuses the existing Article `figure` block, `resolvePublishedVisualAsset`, `createPublishedPicture`, and `renderArticleDocument`. It does not add a second image renderer and does not mutate CAR publication authority.

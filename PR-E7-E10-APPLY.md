# PR-E7–E10 Apply

```powershell
Expand-Archive .\pr-e7-e10-delta.zip -DestinationPath . -Force
node scripts/apply-pr-e7-e10-package-scripts.mjs
npm run check:pr-production-complete
npm run check:pr
npm run check:rr
npm run check:alr-w33-w35
npm run check:alr-governance
npm run check
```

The package patch preserves all existing postcheck command tokens and appends `npm run check:pr-production-final` only once. It does not redefine the frozen `check:pr-production` or `check:pr-production-e4-e6` aliases.

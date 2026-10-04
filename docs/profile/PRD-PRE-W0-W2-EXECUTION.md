# PRD-PRE + PRD-W0 + PRD-W1 + PRD-W2

Baseline: `4290fa30d816d34cab7c17f03e495b546b8b49f2`

This package contains successor contracts and a checker. It intentionally does not commit or push.

## Required customer-UI edits

### `perspectives/index.html`
Remove the standalone `PROFILE & ASSESSMENT` card. Keep Personal Reality as the main entry. Do not delete `/perspectives/profile/`.

### `perspectives/profile/index.html`
Keep existing backend calls and seven internal mode IDs. Change only customer identity:
- title: `Personal Evidence — PHI OS`
- eyebrow: `PERSONAL EVIDENCE · OPTIONAL`
- heading: `See yourself through more than one source.` / `从更多来源理解自己。`
- `Deepen my profile` → `Add personal evidence`
- `One optional Profile lane, seven ways in.` → `Choose what evidence you want to add.`
- result heading → `YOUR PERSONAL EVIDENCE`
- `Try another Profile mode` → `Add another evidence source`
- remove the hero `CXICON-METHOD-PROFILE`
- consent copy should say `this evidence result`, not `this Profile result`

## Package script to add
`"check:profile:personal-evidence-prd-pre-w2": "node scripts/check-profile-personal-evidence-prd-pre-w2.mjs"`

## Run
```powershell
npm run check:profile:personal-evidence-prd-pre-w2
npm run check:profile
npm run check:ppr-current-shared-owner
npm run check:cx-r12
npm run check:cx-r31
npm run check:pages-build
```
After UI edits:
```powershell
$env:PRD_REQUIRE_UI_CUTOVER='1'
npm run check:profile:personal-evidence-prd-pre-w2
Remove-Item Env:PRD_REQUIRE_UI_CUTOVER
```

## Do not change yet
- `COM-REPORT-PROFILE-FULL`
- bundle eligibility
- old entitlements
- Profile scoring contracts
- PFIG semantics
- Current Reality correlation
- O*NET provider boundary

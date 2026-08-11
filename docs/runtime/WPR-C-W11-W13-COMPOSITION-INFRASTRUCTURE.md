# WPR-C — Composition Infrastructure

Baseline: `1d4bc9e98d38c743b44f9659fd89d75bdbb1c0f7`

Scope: WPR-W11 through WPR-W13.

WPR-C establishes the Web composition execution boundary, explicit locale projection, and controlled public vocabulary. It does **not** create CPR production records, select Knowledge or Meaning, select Related Nodes or Reading Paths, rewrite public pages, create method production eligibility, or activate a production surface.

## WPR-W11
`resolveWebComposition()` executes explicit web slot bindings that reference upstream CPR composition authority. WPR cannot infer component-to-slot placement. Because CPR `productionRecords` are still empty, live production composition remains fail-closed; the included fixture is validation-only.

## WPR-W12
Supported locales remain `en` and `zh-Hans`, aligned with CPR. Fallback is explicit-only. Missing canonical content never authorizes WPR translation or synthesis.

## WPR-W13
Public/customer web terminology is separated from internal method identity. Internal IMR records are not renamed. The controlled WPR public mapping for `HUMAN_DESIGN/HDR` is `Personal Runtime Projection` / `个人运行投射` for controlled public/customer projection. Existing public occurrences are audit findings for WPR-D, not rewritten here.

`NUMEROLOGY` remains intentionally absent because the current IMR registry does not register it. WPR cannot create method identity or production eligibility.

Commands:
```powershell
npm run check:wpr-composition
npm run check:wpr
```

Do not add WPR to `postcheck` before WPR-W29/W30.

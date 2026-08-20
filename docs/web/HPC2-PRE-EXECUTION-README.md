# HPC2-PRE v2 — execution handoff

This successor implements the repository side of `HPC2-PRE-0` through `HPC2-PRE-13` against execution baseline `f78aec2bc74b772494ba6f2831c010da31f83fb4`.

It deliberately does **not** claim `HPC2_PRE_READY` until the external and human gates are real. The current repository state is fail-closed: owner-reported R2 uploads are registered, but the public resolver will not render a governed asset until live remote verification promotes that concrete object.

## 1. Repository acceptance

```powershell
npm run check:hpc2-pre
npm run check:figure
npm run check:wpr-w7-w10
npm run check:wpr-w14
npm run check:rjx
```

`npm run check:wpr` may still expose unrelated historical WPR successor drift from post-WPR publication/discovery changes. HPC2-PRE does not rewrite those historical authorities.

## 2. Configure the real public asset base URL

Use the verified HTTPS public base URL that fronts `phios-public-assets`:

```powershell
$env:PHIOS_PUBLIC_ASSET_BASE_URL="https://<your-public-r2-or-custom-domain>"
```

Do not put credentials in this value.

## 3. Live R2 verification

Dry-run the 16 blockers first:

```powershell
npm run check:hpc2-pre-r2-live
```

Then verify and record all concrete Hero / Figure / Icon objects plus the five critical covers:

```powershell
npm run hpc2-pre:r2-verify
```

The verifier performs real HTTPS HEAD/GET checks, MIME checks, Hero WebP dimension checks and SVG safety/viewBox checks. Failed objects are never promoted.

## 4. TL critical visual acceptance

After visually reviewing the 16 critical assets:

```powershell
npm run hpc2-pre:accept-critical -- --reviewer TL --confirm
```

This records **visual-asset acceptance only**. It grants no Knowledge, Method, Professional Judgment or route authority.

## 5. Deploy and inspect the actual Homepage

Check the production Homepage at:

- 390 / EN
- 390 / zh-Hans
- 768 / EN
- 768 / zh-Hans
- 1440 / EN
- 1440 / zh-Hans

Confirm Hero, five covers, Figures, SVG scaling, labels, HTML copy/legend alignment, CORS/404/resolver state, mobile wrapping, CTA usability and no local governed-asset bypass.

## 6. Record browser acceptance

```powershell
npm run hpc2-pre:accept-browser -- --reviewer TL --deployment-url https://<deployed-homepage-origin> --confirm
npm run hpc2-pre:refresh-status
npm run check:hpc2-pre-ready
```

Only the last command passing means `HPC2_PRE_READY` and permits entry into `HPC2-P0`.

## Preserved boundaries

- One existing resolver only: `assets/js/runtime/web-production/asset-resolver.js`.
- `/reality/` is not silently activated; current public links remain on `/reality-journey` until RJX human UX + route activation gates pass.
- No final HPC2 9-scene narrative/DOM authority is created here.
- Hero copy and CTA remain HTML-owned.
- All 57 canonical Figure masters remain SVG; raster derivatives never become second canonical identities.

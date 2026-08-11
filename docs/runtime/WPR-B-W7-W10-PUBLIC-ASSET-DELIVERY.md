# WPR-B — Public Asset Delivery

Baseline: `39fb21c54768c2c247a73cf5f005cf25d73435fc`

Scope: WPR-W7 through WPR-W10.

This phase establishes fail-closed public asset resolution, a Cloudflare Pages public base URL configuration bridge, registry-only responsive variants, and visual production projection authority. It does **not** upload or publish assets, promote CAR/CPR, rewrite pages, or activate a public surface.

Current canonical blocker: `content/registry/public-assets.json` still has `public_base_url: null` and `public_domain_status: verification_required`. Configure `PHIOS_PUBLIC_ASSET_BASE_URL` in the Cloudflare production environment, then run `npm run check:wpr-public-assets-live` with the same environment value for read-only exact-object verification. Upstream verification state must be changed only by its owning governance authority.

Commands:

```powershell
npm run check:wpr-assets
npm run check:wpr
```

Optional live verification after public base URL configuration:

```powershell
$env:PHIOS_PUBLIC_ASSET_BASE_URL="https://<verified-public-asset-domain>"
npm run check:wpr-public-assets-live
```

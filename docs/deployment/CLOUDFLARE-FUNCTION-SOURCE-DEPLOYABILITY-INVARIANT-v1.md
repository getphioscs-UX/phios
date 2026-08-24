# Cloudflare Pages Functions Source Deployability Invariant v1

Baseline: `13364abcedc47d935829dbc4dec1a8da4a3adee9`

This invariant closes the production incident where local repository checks passed but Cloudflare Pages Functions bundling failed on JSON import attributes such as:

```js
import registry from './registry.json' with { type: 'json' };
```

The current production-compatible form is:

```js
import registry from './registry.json';
```

The invariant scans `functions/**/*.{js,mjs,cjs}` and fails closed before the long PHI OS check suite proceeds.

Truth boundary:

- checker pass = source compatibility validated;
- Cloudflare deployment pass = `DEPLOYED` may be recorded;
- real production endpoint verification = `LIVE_VERIFIED` may be recorded;
- these states must never be silently collapsed.

Commands:

```powershell
npm run check:cloudflare-function-import-compat
npm run check
```

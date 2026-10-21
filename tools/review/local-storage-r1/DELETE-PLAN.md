# DRY RUN — LOCAL STORAGE R1

Root: C:\phios. Exact narrow allowlist only; permanent deletion, no Recycle Bin.

- .tmp/pages-final-npm-cache/_cacache — 99.96 MB / 350 files. npm content-addressed download cache. Recreate: npm ci --cache <new-cache-path> (only later when needed; no reinstall now).
- .tmp/node-compile-cache — 1.06 MB / 398 files. V8 Node compile cache. Recreate: Node regenerates bytecode on next enabled run.
- .wrangler/tmp/bundle-dXCzgP — 0.00 MB / 2 files. Wrangler generated middleware facade. Recreate: wrangler pages dev / existing Pages build.
- .wrangler/tmp/bundle-ZVLhbL — 0.00 MB / 2 files. Wrangler generated middleware facade. Recreate: wrangler pages dev / existing Pages build.
- .wrangler/tmp/dev-4d2GhF — 37.73 MB / 2 files. Wrangler temporary dev bundle and sourcemap. Recreate: wrangler pages dev / existing Pages build.
- .wrangler/tmp/pages-7HE3Q6 — 37.85 MB / 4 files. Wrangler compiled Pages temporary bundle and sourcemap. Recreate: wrangler pages dev / existing Pages build.

Estimated total 176610824 bytes. Existing free space exceeds 20 GiB; the explicit owner request authorizes removing verified unnecessary caches, not arbitrary additional evidence to reach 10 GiB.

Before each batch: resolve path inside C:\phios, reject all reparse points, refresh process snapshot, assert no tracked files, reject open/locked files using exclusive handles, compare exact size/count to inventory, log planned action, then Remove-Item -LiteralPath. Stop a candidate on any mismatch. No .pages-output / .wrangler/state / node_modules / P9 archives / Financial R3 / accepted review files will be removed.

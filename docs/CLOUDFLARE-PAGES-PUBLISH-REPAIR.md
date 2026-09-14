# Pages Function publish investigation

The supplied 2026-09-14 deployment of `1bc2650` compiled Functions with the
platform's Wrangler 3.114.17 and published static assets, then failed with
`Failed to publish your Function: Unknown internal error occurred`.
This is not an npm installation or asset-upload failure. The log does not
identify a binding, startup, size, or platform-service root cause.

## Reproducible build

In Pages Settings → Builds, change **Build command** from `npm ci` to
`npm run build:pages`. Keep **Build output directory** as `.` and keep the
existing project root. Pages already installs dependencies with `npm ci`.

The build compiles the existing Functions using the lockfile's Wrangler 4,
with the compatibility date and flags from `wrangler.jsonc`, into `_worker.js`.
Pages consumes this advanced-mode entry rather than compiling `/functions`
with the platform's older Wrangler. The existing ASSETS fallback and all
Function routes remain in the generated bundle and `_routes.json`; bindings are unchanged.
`_worker.js` and `_routes.json` are generated and ignored by Git. Never hand-edit them.

Run `npm run check:pages-build` for a local build without generating the root
entry. The measured current artifact is approximately 6.01 MB raw / 1.21 MB
gzip. The build rejects artifacts above a conservative 3 MiB gzip budget.
Compilation and size checks do not attest production startup or publication.

Retry deployment after committing the repair and changing the build command.
If the same publish error persists, retain the new deployment ID and request
Cloudflare's Function publication error detail; inspect the existing AI,
RUNTIME_DB and MANUSCRIPTS bindings in that project. Do not delete bindings or
disable Functions to make a static-only deploy appear successful.

References:
- https://developers.cloudflare.com/pages/functions/advanced-mode/
- https://developers.cloudflare.com/workers/platform/limits/

No production redeployment or dashboard setting change was performed locally.

# R2.3 large private PDF candidate

Local child adapter: functions/account/local-large-private-pdf-artifact.js. No production route or feature activation.

The existing 1MiB guard in local-private-pdf-artifact.js is unchanged. It bounds a full-response arrayBuffer, base64 encoding, encrypted JSON and runtime_artifacts payload; this is an application guard, not a Cloudflare-wide PDF or response limit. Removing it would retain an unsuitable large-object path.

The new local candidate stores only encrypted object metadata in the same runtime_artifacts owner; complete bytes use the existing PRIVATE_REPORTS binding contract. Trusted callers supply a renderer-produced byte count/digest and stream; no customer upload route accepts that descriptor. Maximum candidate object size128MiB is a separate bounded transfer policy, not a claim about safe heap usage. It does not replace the old1MiB path.

Identity comes only from the current trusted context normalizer; dossierEligibility reuses active membership/historical access. Every request checks the existing runtime owner, source callback, report/language/snapshot/template and immutable object digest/ETag. Source check wiring remains a route-admission gate: this exported prototype is not a new permission owner.

Chosen transport: authenticated streaming proxy, not presigned object URL. Existing DAR header grants expire after15minutes; no bearer in URL and no permanent public report link. Every new request rechecks entitlement/source. Revocation cannot recall already downloaded bytes or promise termination of transfers already started. Signed storage URLs were not issued.

Upload validates byte count/PDF prefix/SHA incrementally and supplies the R2 checksum option. In native workerd it uses FixedLengthStream for known-length R2 input; Node uses a stream in the local adapter. Store metadata only after verified complete upload. Failed uploads are removed locally; retries explicit. Download streams, counts bytes, verifies complete-body SHA, supports bounded single/suffix byte ranges and HEAD, cancels source on interruption, and returns private/no-store/noindex headers. Conditional R2 ETag read binds range data to the stored object.

Measured local tests: 35; chunks <=65536bytes; object.arrayBuffer calls0. Files83,527 /1,403,603 /49,446,831bytes; full/repeated digest equality, identity/report/language/source denial, existing membership revocation, source revoke, expired/tampered grant, range/resume/HEAD, upload interruption, stream truncation, checksum failure and retry. These are Node plus file-backed R2-contract tests and real SQLite/account/entitlement/DAR modules, not a Cloudflare runtime benchmark.

External integration BLOCKED: native Cloudflare PRIVATE_REPORTS checksum/stream/FixedLengthStream/conditional/range behavior; route source/consent binding and retention cleanup under existing owner; renderer trusted size/digest contract; workerd peak-memory/concurrency and disconnected-client behavior; deployment/release admission. No production resource was written to obtain evidence.

Official references read for API design: https://developers.cloudflare.com/r2/api/workers/workers-api-reference/ (stream/checksum/range); https://developers.cloudflare.com/workers/platform/limits/ (128MB isolate memory; response body no enforced size cap). Platform capacity alone does not prove application delivery safety.

## Native local runtime successor evidence

Same final child adapter passed6 checks in native Miniflare workerd/D1/R2:49,446,831byte upload checksum + FixedLengthStream, full/repeated exact downloads, conditional range, wrong identity and revoked-source denial. See NATIVE-RUNTIME-TESTS.json. This closes the local native-protocol uncertainty; real Cloudflare account configuration, route source/consent/retention admission, concurrent/peak-memory and production authorization remain open. Earlier Node-only statements are superseded for local native protocol proof, not for production authority.

Parallel HEAD advancement preserved. No commit/push/deploy by this task. Do not rerun close-r23.mjs without reapplying this native successor closure.

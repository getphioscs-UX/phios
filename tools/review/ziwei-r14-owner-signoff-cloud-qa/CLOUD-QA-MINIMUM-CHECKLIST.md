# Zi Wei — minimum non-production Cloud QA checklist

State: PREPARED_ONLY / NOT_AUTHORIZED / NOT_RUN. This document is not execution permission. This turn performed no Cloud discovery, login, service call, resource write, deployment, code change or repeat local test.

## Entry gates — all required before a later campaign

- Independently recorded Owner decisions A (reference visual) and B (watermark policy), each with exact packet/file digests, scope, owner and time. Current decisions remain PENDING. Prior manuscript ACCEPT is preserved.
- Separate explicit Cloud execution authorization: exact existing non-production environment, private Worker service binding, D1 database, private R2 bucket/namespace, authorized QA accounts/Subjects and limited test actions. No production credentials, production namespaces or real customer data. Authorization must cover any necessary non-production deployment/writes separately; the current instruction authorizes neither.
- Existing-owner QA admission candidate reviewed. Current local-only scope and unsigned-local receipt contract are NOT Cloud-ready. Add the required bounded QA admission through the existing publication/delivery owners in a later authorized task; preserve old local receipts, actual source versions and global P8=false. Do not bypass Entitlement or Subject Consent.
- Real QA account authentication and active QA rights through the existing supported QA mechanism. No local injected principal as Cloud proof, no real charge, no fake verified Stripe webhook, no paid manuscript generation.
- A manifest for the final target, signed admission references and source-to-final binding. The target is a complete 68-page synthetic customer-shaped QA file for its own verified Subject. Prefer the retained V2 bytes (9838466 / 7babe9af729f3f82704dfaaa7265f8019066d8c271fc3f27023ded0bd1950d72) if that exact edition is admitted; retain SYNTHETIC. The unmodified reference (9807509 / 2dd6e0b3a4c6fba2a5ab7305afdb1cd2a1d4e9c72b56c63f8ca3677275d578b4) is a separate transport control, not a substitute customer file. If policy/personalization legitimately changes bytes, assign a new version/SHA/receipt; never claim either pinned hash.
- Keep native source page count 72 and final publication page count 68 in separate receipt fields. No global page-count constant. Existing accepted text, charts, R2 assets and local evidence remain frozen.

## Small cloud-only campaign

| ID | Cloud operation after separate authorization | Required evidence |
|---|---|---|
| C01 | Existing-owner final-file admission and private persistence for the one authorized QA account/Subject | Account, Subject, canonical input/native snapshot, observation context, approved manuscript version, Order/Purchase/Entitlement, Publication, final page map, watermark policy, version, bytes and SHA all agree. Actual private R2 conditional-put and immutable receipt acknowledgment; no production write. |
| C02 | Download through the real authenticated native Account endpoint and its Library PDF link | application/pdf, safe opaque filename, correct byte length, full client-side SHA and binary comparison against the admitted manifest. No Base64 JSON/truncation and no public R2 download URL. |
| C03 | Redownload, close the session, reopen/login and download from a cold process/isolate | Same admitted bytes/version/SHA each time. Actual durable storage reads, render/provider counters 0, no new charge, no snapshot replacement. |
| C04 | Anonymous/wrong account, absent/revoked Entitlement and revoked Subject Consent | Access denied using real Cloud authorization owners; no file or sensitive identity leakage. Mutate only explicitly authorized QA fixtures and restore through their existing owner. |
| C05 | Wrong Subject/Snapshot/Order/Publication or mismatched final receipt/SHA; 72/68 edition confusion | Admission/read denied. Tamper only an authorized QA copy/receipt, never baseline evidence or an existing issued file. Record actual server outcomes. |
| C06 | Repeat and concurrent same-version writes; attempt changed bytes/receipt under that version | Idempotent same file; changed content/receipt rejected; first issued version and prior download retained. Legitimate new content requires a separate version and receipt. |
| C07 | Private object isolation and response/cache headers | A second account and unauthenticated direct access cannot fetch the private PDF. Private/no-store policy and service-binding access hold. Public shared WebP artwork does not grant private report access. |
| C08 | Interrupted download/retry and missing/corrupt-file handling in the isolated namespace | Retry returns the same complete admitted file; corrupt/missing data fails closed, without fallback HTML, regeneration or a Provider call. Preserve logs and recovery disposition. |

Reuse existing local evidence for layout, accepted text and Q87 quality; do not rerun the 27-case local suite, full npm check or all report generation. Verify Cloud-specific byte/permission/storage behaviour only. Re-render only if an actual authorized change produces a new file; document that new version separately.

## Evidence and stop rules

Create a new run-specific evidence record only after authorization: authorization ID, exact non-production resource identifiers and code/admission versions; admitted file manifest; private object/immutable receipt binding; authenticated Account response evidence; cold-reopen byte checks; negative outcomes; actual render/provider counts; named blockers. No credentials or session tokens in review output. Append the result to the existing Master; do not overwrite local or historical receipts.

Cloud PASS requires actual Cloud evidence. Local PASS, source-code presence, Owner visual acceptance and successful upload alone are insufficient. On a binding, authentication, corruption or receipt mismatch, stop the affected campaign and retain the first issued file; do not bypass guards. Deployment admission, Live Customer issuance, commercial Artifact Store admission and P8 remain separate even if this non-production campaign later passes.

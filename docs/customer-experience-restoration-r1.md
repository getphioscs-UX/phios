# PHI OS Customer Experience Restoration R1

Status: **SOURCE_CANDIDATE — NOT_DEPLOYED — BROWSER_ACCEPTANCE_PENDING**.

The request concerns `https://96c1d61b.phios-free-country-review.pages.dev/`.
This branch uses Git main `58b4e464cf44bd3ec3b68ba5f4def1d0994ceb89` as its source baseline.
That main homepage is older than the requested Preview's R3 homepage. This branch
is a portable presentation increment, not a reproduction of the Preview source tree.
Do not replace the Preview homepage or its newer navigation with this baseline.

## Customer changes

- R3 home: approved Family/Business/Country photography, concise opening copy,
  six photographic subject cards, a clearer question field and reading paths.
- Existing six subject heroes remain intact; tool descriptions are simpler.
- Knowledge: readable two-column composition; an older inserted hero panel and
  its original image become one composition when both exist.
- Books and Financial: missing hero slots can consume existing approved hero
  identities through the existing asset resolver. Withheld/unavailable identities
  remain unavailable; no guessed fallback URL bypasses the registry.
- Explicit button foreground/background colors, visible focus, responsive widths,
  reduced motion, and a less cramped Profile hero with the steps below it.
- Image delivery: actual decode failure replaces an invented synchronous error;
  stale attempts cannot fail a newer request; repeated failures create one retry.

## Exact reception scope

Two new presentation files:

- `assets/customer-ui/js/customer-experience-r1.js`
- `assets/customer-ui/surfaces/customer-experience-r1.css`

Two existing-file hunks:

- `assets/customer-ui/js/shell.js`: optional dynamic presentation import only.
- `assets/js/global-visual-r2.js`: image failure lifecycle only.

**Apply existing-file hunks to the current receiver. Do not copy the old full
shell file over a newer Six Perspectives shell.** Preserve that receiver's
navigation, locale modules, assets and all unrelated increments. Record actual
before/final hashes at reception. A patch delivery is not an application receipt.
This document is subordinate to the owner's existing unique Master.

No new PR has been created. Existing Six Perspectives draft PR #20 must be
reconciled by its current integration owner; do not create a competing merge.

## Evidence and limits

- 18 isolated DOM/lifecycle checks passed under Node 24.22.1 and jsdom 26.
- JavaScript syntax and `git diff --check` passed.
- 8 book hero objects and 12 subject desktop/mobile objects returned HTTP 206
  with 16 requested bytes and `image/webp`. This is a bounded HTTP range probe,
  not full image-decoding or immutable-object proof.
- Browser recheck: all eight book covers were loaded and `ready`, with no visible
  cover fallback. Their hidden fallback text must not be reported as a failure.
- Browser recheck: inspected subject hero photography was present. Do not infer
  an unbound asset from a lazy image that is still below the viewport.
- Live Knowledge and Financial buttons were observed with near-white foregrounds
  on white backgrounds. The candidate supplies explicit foreground/background
  pairs; candidate computed-style/browser verification remains pending.
- The review artifact contains 10 static views built from the requested Preview.
  It is a visual proposal; forms do not submit and backend functions are not
  simulated. Some links lead back to the original Preview.
- Full `npm run check`, Node 22.16 required CI, Pages Build, candidate browser
  sweeps and candidate deployment have **not** been run in this branch.
- Current tools cannot publish to this external Cloudflare project. Browser local
  HTML navigation was refused by its URL policy. No workaround was attempted.

## Finish in the current integration receiver

1. Identify the exact source of the requested Preview, keep its R3 homepage,
   accepted assets, current shell and existing reception history.
2. Apply the four-file increment by exact new-file bytes and existing-file hunks.
   Resolve drift concretely; never overwrite newer navigation or relax checks.
3. Render all changed public entry templates in EN/ZH at 390/768/1440. Inspect
   actual foreground/background, duplicate hero identity, clipping, image decoding,
   menu and keyboard controls. Do not count DOM-only evidence as browser PASS.
4. Keep the current eight-book art, PLAN-KNOW-03 versions and other approved
   figures. Maintain an asset-to-placement inventory with reasons for deferred or
   inapplicable assets; this round does not claim every historical asset is bound.
5. Verify real journeys: home → subject → usable tool; Knowledge → reading;
   each method → its own input; Financial → tools and return paths. Retain honest
   unavailable/locked states. Account and checkout are outside marketing styling.
6. Run the final receiver's complete npm checks, Pages Build and actual required
   CI on the exact candidate SHA, using the existing zero-cost protection.
7. Publish only to the existing isolated Preview channel, verify its exact artifact
   and screenshots, then report the new URL and unresolved issues. Existing release
   authorization and gates govern any later main/production action.

No Provider calls, paid unlock, Unknown settlement, ledger change, R2 mutation,
production write, or Windows worktree cleanup forms part of this increment.

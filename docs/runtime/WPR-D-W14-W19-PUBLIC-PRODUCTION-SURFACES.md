# WPR-D｜Public Production Surfaces

Baseline: `b939293cea3ddbe8afd4ca45b25debb98f30a0a1`

## Scope

- WPR-W14 Homepage Production Composition
- WPR-W15 Library Production Composition
- WPR-W16 Article Production Composition
- WPR-W17 Figure / Diagram Production Composition
- WPR-W18 Four-Volume Book Production Composition
- WPR-W19 Academy Discovery Production Composition

## Production mode

WPR-D activates public surfaces as `LIMITED_PRODUCTION`.

This does **not** create CPR production records. CPR remains the presentation/composition authority and its canonical production registry remains empty. Public surfaces use `STATIC_PUBLIC_SHELL_TRANSITIONAL` where no CPR production record exists; the existing published Article runtime is accepted as `EXISTING_PUBLISHED_RUNTIME_ACCEPTED`.

## Preserved authorities

WPR-D does not create Knowledge, publication, Meaning, method eligibility, customer Reality, professional judgment, CAR publication, Academy entitlement, learning progress, assessment result or credential state.

## Canonical book projection

The public Book surface consumes `books.json` and `parts.json` directly:

- Book I: Parts 1–4
- Book II: Parts 5–9
- Book III: Parts 10–12
- Book IV: Parts 13–15
- Part 0 remains cross-volume core language.

## Figure drift

Five historical Figure Registry records still declare Book I while belonging to canonical Part 5, now owned by Book II. WPR-D excludes those records from Book I public projection and records the drift without rewriting the upstream Figure Registry.

## Asset boundary

Book covers resolve through the WPR-B public asset resolver. Until public-base URL and asset verification pass, the UI uses a non-authoritative visual fallback. Figure member R2 inventory is not fabricated; existing registered `web_file` members are consumed as registry-led legacy compatibility.

## Academy boundary

Only `ACADEMY_DISCOVERY` is public. Live delivery, entitlement, progress, assessment and credentials remain inactive.

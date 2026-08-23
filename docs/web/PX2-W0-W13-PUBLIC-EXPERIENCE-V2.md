# PX2-W0–W13 — Public Experience V2

Baseline: `09329d4`

PX2 replaces the transitional PUXR public composition with a stable customer-facing Public Experience V2 while preserving backend authorities and historical freezes.

## PX2-W0 — Current Public Consumer Audit

Authority: `content/web-production/px2/audit/px2-w0-current-public-consumer-audit-v1.json`

The audit records the current primary public surfaces and their pre-PX2 presentation consumers. It distinguishes presentation composition from KAP, MPA/MCD, Financial, Knowledge, Book and Reality runtime authorities.

## PX2-W1 — Public IA Freeze

Authority: `content/web-production/px2/freeze/px2-w1-public-ia-freeze-v1.json`

Primary customer journey:

`SEARCH → ASK → READ → FINANCIAL → MY REALITY`

Primary navigation is frozen in `content/web-production/px2/registries/public-navigation-v2.json`:

- Ask
- Search
- Readings
- Financial
- Reality
- Books & Articles
- My PHI OS

Reality Journey is retained as a deeper case workflow rather than the primary site-navigation metaphor.

## PX2-W2 — Unified Visual Authority

Current visual registry pointer:

`content/web-production/registries/current-client-visual-registry.json`

Unified resolver:

`assets/js/public-v2/unified-public-visual-resolver.js`

The resolver first consumes existing canonical public assets, then the current verified client-visual registry. Public pages no longer need page-specific ILL/FIG R2 resolvers. Unavailable assets collapse rather than reserving blank frames.

## PX2-W3 — Public Shell V2

- `assets/css/phios-public-v2.css`
- `assets/js/public-shell-v2.js`

The shell owns only header, footer, primary navigation, language, mobile navigation and account entry. It does not own knowledge, method, financial, Reality or visual authority.

## PX2-W4 — Homepage V2

`index.html` now begins with a single intent surface: “What do you want to understand today?” and exposes the five customer modes directly:

- Search
- Ask PHI OS
- Readings
- Financial
- My Reality

Five books, published articles, Personal Runtime and Financial Runtime remain visible downstream instead of being hidden behind Reality Journey composition.

## PX2-W5 — Search

New route: `/search/`

- `search/index.html`
- `assets/js/pages/search-v2.js`

Search is a FIND surface. It consumes governed published-article and book registries and returns navigable resources. It does not synthesize an answer or create a Reality case.

## PX2-W6 — Ask

`knowledge-search.html` is recomposed on Public V2 while retaining the existing KAP/CKA runtime client and relevance guard. Ask remains a bounded question-scoped answer surface. Guided context and Reality handoff remain explicit and consent-gated.

KAP presentation successor:

`content/knowledge/answer-projection/reconciliation/kap-w18-w22-px2-presentation-successor-v1.json`

## PX2-W7 — Readings

New route: `/readings/`

Public catalog:

`content/web-production/px2/registries/public-method-catalog-v1.json`

The catalog exposes method visibility without bypassing production eligibility. Every current public catalog record has `runAllowed: false` until its governing runtime/MPA/MCD authority admits execution.

Current catalog:

- Astrology
- BaZi
- Human Design
- Numerology
- I Ching
- Tarot
- Zi Wei Dou Shu

Presentation boundary:

`Projection ≠ Evidence` and `Reading ≠ Destiny`.

## PX2-W8 — Financial

`/professional/financial/` is promoted into a primary Financial Reality surface. Existing financial backend authorities remain unchanged. The page foregrounds dated reconstruction, evidence/calculation/judgment separation, Financial Stamina Analysis, Financial Navigation Plan, follow-up and annual review.

## PX2-W9 — Books + Articles

Canonical five-volume projection is consumed through:

`assets/js/components/five-volume-grid.js`

Published article projection is consumed through:

`assets/js/components/publications-v2.js`

Book and article authority registries remain unchanged.

## PX2-W10 — Reality Integration

`/reality/` is recomposed as My Reality integration rather than a giant Journey shell. Search, Ask, Readings, Financial and lived experience can contribute to Current Reality while preserving their authority type. Deeper Reality Journey remains available when a persistent multi-factor case requires it.

## PX2-W11 — Checker Successor Migration

Authority:

`content/web-production/px2/successors/px2-w11-checker-successor-v1.json`

Current presentation checkers are migrated by semantic successor rather than by mutating historical freezes. Core migrated checks include PDS-W3, M3A, M4A Financial, M4B Professional and KAP current/guided presentation assertions.

## PX2-W12 — Zero-consumer Legacy Audit

Authority:

`content/web-production/px2/deletion/px2-w12-zero-consumer-legacy-audit-v1.json`

Physical deletion is permitted only for files with zero active PX2 primary consumers and no frozen evidence requirement. Secondary legacy pages are intentionally left intact until their own successor migration.

## PX2-W13 — Physical Deletion

Authority:

`content/web-production/px2/deletion/px2-w13-physical-deletion-v1.json`

Removed transitional PUXR presentation files:

- `assets/css/puxr-v8.css`
- `assets/js/puxr-shell.js`
- `assets/js/puxr-publications.js`
- `assets/js/puxr-visuals.js`

Frozen BFR evidence and presentation files still consumed by secondary/legacy surfaces are preserved.

## Validation

Primary PX2 acceptance:

`npm run check:px2`

KAP semantic preservation:

`npm run check:kap`

The supplied Library ZIP does not contain `.git`, so the complete `npm run check` cannot pass the PDS-W0 historical-commit verification in this sandbox. The checker fails at `git rev-parse ...` before the rest of the top-level suite can run. No fake history bypass is committed. Run the complete command in the real Git checkout after applying this package.

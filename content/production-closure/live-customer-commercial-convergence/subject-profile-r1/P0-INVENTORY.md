# P0 — Subject-centred Profile R1 · 2026-10-30

Baseline main / remote main: af44a78737fa8378fb4c5e284b2a6216d0364ea5. No ref changes.
Concurrent BaZi acceptance record: docs/acceptance/bazi-paid-report/visual-first-r1/ZERO-COST-GUARD-EVIDENCE.json (preserve; unrelated to this task).
Prior customer closure remains in .worktrees/customer-service-closure-r1; it is not silently merged.
No applicable AGENTS.md found in repository/ancestor paths checked.

## Reuse and authority
- Account/identity: functions/account/oidc-auth.js; verified sessions and canonical user IDs. Subject references are not new identities.
- Object, version and relationship storage: functions/pws/registry/universal-registry.js, registry-query-api.js, version-store.js, relationship-store.js, restriction-store.js; existing schema db/migrations/0005_pws_universal_registry.sql. Generic registry storage itself is not an account authorization boundary.
- Profile: assets/customer-ui/js/surfaces/profile-visitor-r1.js; existing six-lens wheel, seven assessment producers and privacy/consent are preserved. Current semantics are Personal.
- Reality: reality/index.html, functions/api/customer-my-reality.js, assets/customer-ui/js/surfaces/my-reality.js. Existing source/reading projections remain Personal by default.
- Financial/Estate: functions/api/customer-financial-reality.js, customer-estate-planning.js and functions/account/financial-will-draft-store.js. Existing report/authority/entitlement contracts must not be repurposed as organization finance.
- Navigation/continuity: functions/customer-projection/ric-navigation-continuity.js and tools/review/reality-navigation-continuity-r1/local-owner.mjs. SQLite adapter is local-only, not production authority.
- World: tools/review/world-ux-r1/world-r4/engine.mjs and functions/_lib/world-measurement-observations.js. Reuse existing measurements, sources and dates; no new data domain.
- Methods/PHI Configuration: existing personal-reading, hd, ecr and canonical-presentation-runtime owners. Applicability is additive; calculation/product/PDF bytes are not changed.
- Commerce: existing product, Stripe, receipt, entitlement, PDF and watermark owners are outside this change.

## Missing and permitted minimum
Add a purpose-scoped, version-bound SUBJECT_CONTEXT_REF projection on the existing PWS registry. No new subject database, no migration. Reuse canonical Account/World references; only local synthetic business references may be seeded in QA. Production owner provisioning, private Financial/Relationship authority and permission grants remain separate approval work.
Add six-type semantics and safe financial-scope analysis; an Account role never implies another member's private data. Business/Country cannot invoke personal birth methods.
Add a disabled, loopback-only request adapter and switcher inside existing My Reality. No new product page. Local fixtures must be clearly distinguishable from observed facts.

## Protected contracts
Account IDs, legacy Personal profile/record IDs, five calculation engines, ECR identity, accepted visuals, book registry, Financial published report and all prices/orders/entitlements remain unchanged. No subject creation on visiting or choosing a type. No production activation.

## State
P0 inventory complete; implementation and tests pending. No Human ACCEPT claimed. Full npm run check excluded.

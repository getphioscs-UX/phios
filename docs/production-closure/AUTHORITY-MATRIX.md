# Production authority inventory

Inventory only: existing owners retained. UNKNOWN is not evidence of admission. Historical/current Book registries and Book V/VI Atlas owners are explicitly scoped.

| Capability | Canonical source | Runtime | Renderer | Customer route | Status |
|---|---|---|---|---|---|
| BOOKS | content/registry/current-book-architecture.json | assets/js/web-production/public-surface-data-seven.js | assets/js/pages/books.js | /books/ | Unverified production admission |
| ARTICLES | content/knowledge/public/public-knowledge-catalog.json | assets/js/knowledge/published-content.js | assets/customer-ui/js/surfaces/knowledge.js; article body assets/js/pages/article.js | /articles/ | Unverified production admission |
| ATLAS | content/civilization-atlas/cases/civilization-case-registry-v1.json | assets/js/pages/civilization-atlas.js | assets/js/pages/civilization-atlas/atlas-shell.js | /books/reality-differentiation/#atlas | Unverified production admission |
| REPORTS | content/runtime/customer-report-runtime/registries/report-lifecycle-state-registry-v2.json | functions/account/ziwei-account-delivery.js | assets/js/pages/wpr-report-workspace-production.js | /professional/reports/ | Unverified production admission |
| COMMERCE | functions/pws/commercial/stripe-product-registry.js | functions/commerce/commerce-stripe-api.js | functions/commerce/report-presentation.js | /professional/services/ | Unverified production admission |
| ACCOUNT | functions/account/oidc-auth.js | functions/api/account-reports.js | assets/js/pages/account-method-status-v2.js | /account/ | Unverified production admission |
| ASK | functions/contextual-ask/context-source-registry.js | functions/contextual-ask/contextual-ask-runtime.js | assets/customer-ui/js/surfaces/contextual-ask.js | /knowledge/ask/ | Unverified production admission |
| PERSON | functions/api/account-persons.js | functions/symbolic-method-persistence/symbolic-account-identity-v1.js | assets/js/pages/my-reality.js | /reality/ | Unverified production admission |
| AUTH | functions/account/oidc-auth.js | functions/api/auth/[[action]].js | account/index.html | /account/ | Unverified production admission |
| R2 | content/registry/public-assets.json | functions/api/public-asset-config.js | assets/js/runtime/web-production/asset-resolver.js | /api/public-asset-config | Unverified production admission |
| D1 | content/registry/runtime-migrations.json | wrangler.jsonc | UNKNOWN_NOT_A_CUSTOMER_RENDERER | /account/ | GAP — inspect registry |
| LOCALE | assets/js/i18n.js | assets/customer-ui/js/locale.js | assets/js/public-shell-v2.js | / | Unverified production admission |
| FINANCIAL | functions/financial/product-activation/financial-product-runtime.js | functions/financial/analysis-runtime/financial-analysis-runtime.js | assets/js/pages/financial-runtime-product.js | /professional/financial/ | Unverified production admission |
| WILL | content/legal/will/registries/will-jurisdiction-registry-v1.json | functions/legal/will/escalation-gate.js | UNKNOWN_STANDALONE_PUBLIC_RENDERER_NOT_PROVEN | /will/ | GAP — inspect registry |
| ACADEMY | content/academy/academy-learning-runtime/contracts/lesson-experience-contract-v1.json | assets/js/pages/academy.js | assets/js/pages/academy.js | /academy/ | Unverified production admission |
| ENTERPRISE | research/index.html | UNKNOWN_DEDICATED_ENTERPRISE_RUNTIME | assets/js/pages/brand-research-commerce-legal.js | /research/ | GAP — inspect registry |

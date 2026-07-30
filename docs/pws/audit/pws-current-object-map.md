# PWS Current Object Map

Baseline: `main@7546538b3418c715392eca38dc2738e2a9512679`

`—` means no implementation was located. `productionActive=conditional` means
the code path exists but is configuration-dependent or explicitly
non-authoritative.

## 1. Classification and ownership

| Object | exists | partial | missing | legacy | productionActive | currentOwner | suspectedDuplicate |
| --- | ---: | ---: | ---: | ---: | --- | --- | --- |
| Professional |  | yes |  |  | no | PWS | External Reader and Financial authority contracts model roles without one Professional identity |
| Capability |  | yes |  |  | no | Core Runtime / PWS pending | `RUNTIME_CAPABILITIES` is not Professional Capability |
| Credential |  |  | yes |  | no | PWS pending | Payment/API credential wording is unrelated |
| Certification |  |  | yes |  | no | PWS pending | none |
| Method |  | yes |  |  | no | PWS | modality boundaries and service methods are catalogs, not one lifecycle |
| Service |  | yes |  |  | no | PWS | service catalogs, appointment service types and revenue offers overlap |
| Product | yes |  |  |  | yes | Commerce for books; PWS pending for services | `book-products.json` and `book-product-registry.js` are aligned representations |
| Offer |  | yes |  |  | no | PWS | offer catalog overlaps service catalog but has different purpose |
| Price |  | yes |  |  | conditional | Commerce / PWS | Book price is active; professional amounts are pending |
| Order |  | yes |  | yes | conditional | Commerce / PWS pending | `commerce_purchases` and checkout attempts substitute for a canonical Order |
| Payment |  | yes |  |  | conditional | Commerce / PWS | Book Stripe flow active when configured; professional payment is contract-only |
| Entitlement | yes |  |  |  | yes | Commerce | M4C client entitlement preview is non-authoritative |
| Consent |  | yes |  |  | conditional | Core Runtime / PWS | Journey consent, professional consent and external-reader consent are scoped variants |
| Journey | yes |  |  |  | yes | Core Runtime | `journeys.json`, runtime records and browser Journey state must remain projections of one identity |
| Assignment |  |  | yes |  | no | PWS pending | queue task assignment wording is not Professional Assignment |
| Workspace |  | yes |  |  | no | PWS / Core Runtime | Runtime Workspace and Professional Workspace are distinct scopes; PWS persistence disabled |
| Evidence | yes |  |  |  | yes | Core Runtime | financial evidence and professional sources must not become Runtime Evidence automatically |
| Record |  | yes |  |  | conditional | Core Runtime / Commerce / PWS | generic runtime, payment and professional records lack one universal Record object |
| Candidate |  | yes |  |  | no | Core Runtime / PWS | reconstruction candidates and candidate Reading revisions are distinct |
| Journey Report |  |  | yes |  | no | Core Runtime/PWS boundary pending | generic runtime/professional reports are unsafe substitutes |
| Professional Response |  |  | yes |  | no | PWS pending | notes/revisions are not a response object |
| Specialist Report |  | yes |  |  | no | PWS | external-reader and financial report types exist inside generic report contracts |
| Deliverable |  | yes |  |  | no | PWS | catalog/report final state exists; release lifecycle and authoritative storage are missing |
| Signature |  | yes |  |  | no | PWS | required fields and report status exist; signing operation is explicitly disabled |
| Follow-up |  | yes |  |  | no | PWS | timeline contract/read-only projection only |
| Complaint |  |  | yes |  | no | Governance pending | none |
| Incident |  |  | yes |  | no | Governance pending | runtime recovery/security events are not Incident objects |
| Policy |  | yes |  |  | conditional | Governance / Commerce / PWS | distributed policy registries and static policy pages |
| Restriction |  | yes |  |  | conditional | Governance pending | access and safety rules exist, but no canonical Restriction lifecycle |
| Organization |  |  | yes |  | no | Governance pending | website organization copy is not an object |
| Governance |  | yes |  |  | conditional | Platform / PWS | repository and privacy governance are distributed |
| Knowledge Resource |  | yes |  |  | yes | Knowledge/PJA | books, figures, glossary and thesis are separate catalogs without one resource contract |
| Question Route |  | yes |  | yes | yes | Core Runtime / PJA | adaptive Entry routing exists as functions/rules, not a canonical object |
| Observation |  | yes |  |  | conditional | Core Runtime / PWS | customer observation, professional observation and symbolic observation are intentionally distinct |
| Professional Readiness |  | yes |  |  | no | PWS | pre-appointment checks and navigation readiness do not form one object |
| Provider | yes |  |  |  | yes | Core Runtime | Entry/Reading provider contracts duplicate shape intentionally by stage |
| Provider Usage |  |  | yes |  | no | PWS pending | no metering object/event/persistence found |
| Provider Cost |  |  | yes |  | no | PWS pending | no budget/cost object found |
| Registry | yes |  |  |  | yes | Core Runtime / Platform | multiple domain registries are expected; migration naming is ambiguous |
| Permission |  | yes |  |  | conditional | Core Runtime / PWS | evidence permissions and access boundaries exist without one permission grant object |
| State Machine |  | yes |  |  | yes | Core Runtime / PWS | Runtime transition engine is active; PWS uses local status arrays |
| Event | yes |  |  |  | yes | Core Runtime | professional access/follow-up events are contract-only |
| Audit |  | yes |  |  | conditional | Core Runtime / Governance | evidence audit, privacy logs and migration history are distributed |
| Persistence | yes |  |  |  | yes | Core Runtime / Commerce | PWS Workspace and notes persistence explicitly disabled |

## 2. Canonical and implementation locations

Each row records all required location fields. Multiple paths are separated by
`;`.

| Object | canonicalPath | knownLegacyPaths | schemaLocation | stateLocation | operationLocation | eventLocation | permissionLocation | apiLocation | persistenceLocation | testLocation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Professional | PWS pending | external-reader/financial authority role fragments | `functions/professional/financial/financial-professional-authority.js` | same | same | professional access event contract | `content/registry/pws-w0-baseline-responsibility-boundary.json` | — | — | `scripts/check-pws-w0-baseline-responsibility-boundary.mjs` |
| Capability | PWS pending | `functions/runtime/formation/book-1-runtime-model.js` | PWS-W1A modality registries | — | — | — | financial authority | — | — | `scripts/check-pws-w1a-revenue-architecture.mjs` |
| Credential | — | — | — | — | — | — | — | — | — | — |
| Certification | — | — | — | — | — | — | — | — | — | — |
| Method | `content/registry/pws-w1a-modality-boundaries.json` | service-level method labels | same | registry status | — | — | modality boundaries | — | registry JSON | `scripts/check-pws-w1a-revenue-architecture.mjs` |
| Service | `content/registry/professional-service-catalog.json` | M4A service definition; appointment service types | service catalog | service levels | appointment contract | follow-up timeline | service boundaries | — | registry JSON only | M4A/M4B checks |
| Product | `functions/commerce/book-product-registry.js` | `content/registry/book-products.json` | book-commerce schema | commerce product status | book product/readiness | commerce webhook | commerce readiness | `functions/api/book-one-product.js` | `commerce_products` | `check-m3b-book-access-payment.mjs` |
| Offer | `content/registry/pws-w1a-offer-catalog.json` | service catalog entries | same | catalog status | — | — | modality boundaries | — | registry JSON | PWS-W1A check |
| Price | `content/registry/professional-pricing-policy.json`; book product registry | locale/page amounts | pricing policy/book product schema | active dates / product active | checkout amount validation | checkout/webhook events | pricing rules | book checkout/product API | commerce tables | M3B/M4A checks |
| Order | PWS pending | `commerce_checkout_attempts`; `commerce_purchases` | `db/migrations/0004_book_commerce.sql` | checkout/purchase states | book commerce store/fulfillment | webhook events | commerce readiness | checkout/status/webhook APIs | D1 commerce tables | M3B payment check |
| Payment | commerce book flow; professional payment contract | appointment UI confirmation | commerce schema; payment record contract | payment/refund status arrays | Stripe client/webhook; payment record creator | webhook event | checkout readiness | Stripe webhook/book status | commerce purchases/webhook events | M3B/M4B payment checks |
| Entitlement | `digital_entitlements` / book commerce store | M4C account preview | commerce schema | entitlement status | fulfillment/access APIs | download/access events | book access checks | book access/download APIs | D1 digital_entitlements | M3B/M4C checks |
| Consent | `functions/professional/consent/` plus Runtime journey consent | page/session consent | consent contracts | grant/revoke/expire status | contract creators/evaluators | access event contracts | PWS-W0 boundary | no authoritative PWS API | no PWS consent table | M4A/M4B/PWS checks |
| Journey | `functions/runtime/` | `content/registry/journeys.json`; browser session shapes | runtime schemas/contracts | runtime and stage states | seven stage operations | runtime timeline | runtime access boundary | reconstruct/read/navigate APIs | runtimes/events/snapshots | Runtime and M3C checks |
| Assignment | — | task assignee wording | — | — | — | — | PWS-W0 requires assignment | — | — | boundary assertion only |
| Workspace | `functions/professional/workspace/`; Runtime Kernel workspace | demo/read-only projections | workspace contracts | workspace/task states | projection builders; task transition | follow-up events | consent boundary | none for PWS | PWS disabled; Runtime local/D1 active | M4B/PWS checks |
| Evidence | `functions/runtime/reading/reading-evidence-contract.js` | source buckets normalized by reconstruction | Runtime/reconstruction evidence contracts | evidence class/maturity | classify/dedupe/gate | Runtime events | evidence permissions | reconstruct/read APIs | runtime artifacts/snapshots | evidence boundary/dedup checks |
| Record | `functions/runtime/persistence/persistence-contract.js` | domain-specific payment/professional records | persistence and domain contracts | record status by domain | normalize/store/query | runtime/payment/access events | access boundary | domain APIs only | D1 runtime/commerce | persistence and domain checks |
| Candidate | reconstruction candidates; professional reading revision contract | UI candidate labels | reconstruction/revision contracts | candidate/review status | build/review revision | timeline/follow-up | no auto-promotion rule | no PWS API | PWS disabled | M3C/M4B checks |
| Journey Report | — | generic runtime/professional report labels | — | — | — | — | — | — | — | — |
| Professional Response | — | notes and revisions | — | — | — | — | — | — | — | — |
| Specialist Report | `functions/professional/reports/professional-report-contract.js` | financial/external-reader report profiles | report contracts | draft→final→superseded | report creators/versioning | follow-up timeline | source/consent rules | — | disabled | professional report checks |
| Deliverable | `content/registry/professional-deliverable-catalog.json` | report final state | catalog/report contract | report version states | report creators | release not formalized | data governance/signature requirements | — | disabled | M4A/M4B report checks |
| Signature | report/data-governance requirements | plain signature fields | report contract and PWS-W0 binding fields | unsigned/signed implied only | automatic signing prohibited | — | assignment/consent/source binding | — | — | PWS boundary/report checks |
| Follow-up | `professional-follow-up-timeline-contract.js` | appointment/review labels | follow-up contract | event timeline status | projection builder | defined follow-up events | consent/access boundary | — | disabled | M4B-W2C check |
| Complaint | — | — | — | — | — | — | — | — | — | — |
| Incident | — | recovery/security events | — | — | — | — | — | — | — | — |
| Policy | distributed canonical registries | static Terms/Privacy/product-policy pages | pricing/privacy/security policies | per-policy flags | evaluators where present | privacy/access events | policy itself | — | registry JSON | privacy/security/PDS checks |
| Restriction | PWS pending | access boundary/error codes | security and modality rules | blocked/revoked states | access/risk evaluators | privacy/access events | access boundary | runtime APIs enforce some gates | runtime logs | security/professional checks |
| Organization | — | page copy | — | — | — | — | — | — | — | — |
| Governance | `GOVERNANCE.md`; professional governance registries | distributed milestone registries | privacy/data-governance registries | freeze/status files | checks | privacy/audit events | governance rules | — | registries/migration history | many governance checks |
| Knowledge Resource | `content/registry/{books,figures,thesis,concepts}.json` | separate page catalogs | content registries | release/access/progress states | knowledge catalog/readers | commerce access events | book entitlement | book APIs | commerce + browser progress | M3B checks |
| Question Route | `functions/runtime/entry/` | front-end fixed/adaptive question flow | entry provider contract/runtime schema | round/completeness state | rule-entry/provider-router | Runtime events | Entry boundaries | reconstruction/read entry endpoints | runtime state/browser session | guided-entry/full-journey checks |
| Observation | Core Runtime evidence; PWS source contract | UI observation copy | evidence/source contracts | confirmed/unverified status | classification/review | follow-up/runtime events | no automatic evidence promotion | Runtime APIs | Runtime active/PWS disabled | evidence and PWS checks |
| Professional Readiness | PWS pending | navigation readiness; pre-appointment checks | appointment constants/domain contract | check results | pre-appointment projection | appointment events | authority/consent gates | — | — | M4B appointment checks |
| Provider | Entry/Reading provider contracts and routers | `functions/_lib/openai.js` older shared helper | provider contracts/shared interface | provider result/fallback state | routers and provider adapters | failure/audit outputs | provider/evidence boundary | reconstruct/read APIs | no usage ledger | provider closure checks |
| Provider Usage | — | provider metadata on outputs | — | — | — | — | — | — | — | — |
| Provider Cost | — | — | — | — | — | — | — | — | — | — |
| Registry | `functions/runtime/registry/`; `content/registry/` | dual migration-registry terminology | registry schemas/contracts | version/freeze status | lookup/validation | migration history | registry validation | infrastructure health | JSON + D1 migration history | registry/migration checks |
| Permission | evidence permission and PWS access boundary | browser visibility flags | reading evidence permissions/security contracts | allowed/blocked/revoked | access/evidence evaluators | access/privacy events | canonical rules are distributed | Runtime APIs | privacy logs | security/consent checks |
| State Machine | Runtime transition engine | page-local states and PWS status arrays | transition/contracts | runtime/task/commerce statuses | transition managers/task transition | Runtime event bus/timeline | gates in contracts | Runtime APIs | Runtime persistence | navigation/runtime/PWS checks |
| Event | `functions/runtime/timeline/` | browser event bus | timeline/event contracts | append/version state | append/read/project services | canonical runtime event types | access boundary | Runtime APIs | runtime_events | timeline/infrastructure checks |
| Audit | evidence audit/privacy logger/migration history | milestone check output | audit fragments | pass/fail/log state | builders/loggers | runtime/privacy events | security governance | infrastructure health | runtime events/migration history | audit/security/migration checks |
| Persistence | `functions/runtime/persistence/` | browser local/session storage and legacy platform tables | persistence contract/D1 schema | driver/recovery state | routers/drivers | runtime events | access/security boundary | Runtime infrastructure API | D1 + local/memory drivers | persistence/D1/recovery checks |


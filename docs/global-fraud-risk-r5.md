# PHI OS · Fraud Risk & Information Integrity R5

Status: engineering candidate; browser, complete CI and Owner release acceptance pending.
Change class: explicit contract version upgrade, plus privacy and jurisdiction bug fixes.
Base: `main` / `9321494a63de591ac36d7ec44ff90675059b2e5a` (PR #22 already merged).
Contract: `EXTERNAL_REALITY_CONSUMER_SCAM_R5`, replacing R4.2 only in the existing External Reality projection.
Reviewed: 27 November 2026, Malaysia time.

## Customer behavior

Open the existing **Ask** page and select **Check something suspicious**, or use `/knowledge/ask/?task=SCAM_CHECK` after this candidate is released. This is the existing form and API, with a specialist task. No separate engine, account system, case database or risk score was introduced.

Customers describe a message, requested action or link. They can choose their country, the payment-account country and a second event country. Five exposure choices can be combined: payment/loss, passwords/codes, app installation, screen/remote access and identity documents. Text-derived exposure remains an unverified customer report. A request to act is distinguished from an affirmative report of acting.

The result shows the assessment, prioritized protective steps, unknowns, country-specific official references and reference-review dates. A changed supplier bank account receives independent verification guidance, without asserting fraud. New task/deposit, safe-account and indirect withdrawal-fee expressions extend the existing rule list. Existing spiritual, relationship, investment, recovery and account/device risk rules remain under the same owner.

If several exposures are reported, device isolation comes before account recovery from a separate trusted device; payment-provider contact and credential protection are both retained. Unsupported or unselected countries receive generic protective guidance and explicit local-source gaps. Multiple selected countries produce scoped references, not a legal jurisdiction or reimbursement determination. UK guidance distinguishes Scotland.

Unmatched descriptions in the explicit check produce insufficient-evidence guidance. They cannot fall through into a model or a paid interpretation. Neither matching a pattern nor finding no warning establishes guilt or safety.

A local text download contains the assessment, actions, unknowns and official references. It omits the raw submitted text, identifiers and secrets. Customers can privately add their own timeline and transaction references. It is a review summary, not a police report or verified evidence record.

## R1–R5 implementation and remaining gates

| Stage | Implemented in this candidate | Remaining gate |
| --- | --- | --- |
| R1 · Existing capability audit | Traced External Reality → contextual Ask and public intent; found MY defaults in both APIs and hidden legacy World form | Local unpublished worktrees are not accessible in this environment |
| R2 · Global applicability | No MY fallback; MY/SG/US/GB/AU references; unknown and cross-border handling; selected-country directory | Additional countries require verified official sources and local scope review |
| R3 · Practical analysis | Multiple patterns, indirect fee demands, bilingual denials, multi-exposure triage, structural URL review and insufficient-evidence response | Rule matching can miss complex wording; no measured detection accuracy claim |
| R4 · Evidence integration | Existing source list extended; explicit permissions and no-live-lookup states; 30-day review expiry; secret-free local summary | No authorized live database adapter, OCR, screenshot analysis, incident matching or document authentication |
| R5 · Customer journey | Native Ask task; normal entry uses POST instead of placing question text in the URL; hidden old component delegates to Ask; source groups and download; failure/offline protective message | Full browser/keyboard/360–768–1440 EN/ZH acceptance, complete repository CI and Owner review |

## Official sources reviewed

All are direct references, with `apiAuthorized: false`. Opening a public portal does not grant automated database access. The source list remains in `functions/external-reality-impact/consumer-scam-navigation.js`; this table is documentation, not another registry.

| Country | Official reference | Scope |
| --- | --- | --- |
| MY | [Bank Negara Malaysia](https://www.bnm.gov.my/faqs/scams) | Bank contact, NSRC 997 and police reporting |
| MY | [PDRM Semak Mule](https://semakmule.rmp.gov.my/) | User-initiated portal; no automated query; no-record result is not proof of safety |
| MY | [SC Scam Meter](https://www.sc.com.my/investor-empowerment/scam-meter) | Advance fees, pressure and clone firms |
| MY | [SC Investment Checker](https://www.sc.com.my/investment-checker) | Authorization for capital-market services |
| SG | [ScamShield](https://www.scamshield.gov.sg/) | Scam assistance and 1799; [victim response](https://www.scamshield.gov.sg/i-have-been-scammed/) informed the triage |
| SG | [MAS institutions](https://eservices.mas.gov.sg/fid) | Institution, activity and official contact details |
| SG | [MAS representatives](https://eservices.mas.gov.sg/rr) | Appointed representatives; identity requires separate verification |
| US | [FTC response](https://consumer.ftc.gov/articles/what-do-if-you-were-scammed) | Payments, credentials and device exposure |
| GB | [Report Fraud](https://www.reportfraud.police.uk/) | England, Wales and Northern Ireland; Scotland uses police 101 |
| GB | [FCA authorization](https://www.fca.org.uk/consumers/how-check-firm-individual-authorised) | Relevant permissions and activities |
| GB | [FCA clone firms](https://www.fca.org.uk/consumers/clone-firms-individuals) | Registration alone does not authenticate a caller |
| AU | [ASIC Moneysmart](https://moneysmart.gov.au/check-and-report-scams/what-to-do-if-youve-been-scammed) | Payment, identity and device protection; directs reporting to Scamwatch |

Sources were reviewed on 2026-11-27. Publication dates are not invented. References older than 30 days, a future review date or invalid clock trigger revalidation. Numeric local-contact actions are withheld when revalidation is required. Sources remain dated references; runtime does not claim fresh live incident evidence. Do not delay contacting a payment provider to await a PHI OS result.

## Boundaries and integration

- Both existing Ask APIs use the same projection. General risk recognition remains available without selecting a country.
- Medical emergency routing remains ahead of fraud analysis. Existing method, entitlement, report and checkout owners are unchanged. Explicit checking does not execute a method.
- No model, paid provider, external fetch, database write, automatic report, bank contact or transaction block occurs in the check path. Raw submitted questions are not echoed by the fraud response.
- URLs are parsed locally for supported structure, credentials and internationalized-domain flags. Paths, query secrets and fragments are discarded. Submitted URLs are never fetched or made clickable; their reputation is unknown.
- Institution/World/Country evidence remains independently governed. A curated reference is not a source admission into those canonical datasets. Existing authorized-source machinery is not bypassed.
- No new persistent incident record is created. Existing My Reality retention still requires its own access and consent process.
- Automated production deployment remains OFF. No main merge or production deployment is included in this work.

## Verification

Executed locally on the current candidate:

- **14/14** Node test groups passed: rules, actual contextual/public handlers, deterministic unknown input, both locales, five supported countries and unknown countries, multiple exposures, denials/normal transactions, structural URLs, sensitive-response non-echo, source expiry, DOM controls/rendering and version corruption refusals.
- Explicit handler tests replace outbound `fetch` with a throwing sentinel and verify no calls; CI also loads the existing zero-cost guard. Test inputs are synthetic regression cases, not a field accuracy benchmark.
- Existing R4.2 brand/scam historical regression passed, including its 20 legacy output comparisons and source-drift refusals. It is now labelled historical. Current R5 outputs are validated separately; old MY defaults are not certified as R5 behavior.
- Existing Cloudflare source-import compatibility check passed. Node API and browser-target Ask UI bundles compiled. These are compilation checks, not a Pages deployment.
- `git diff --check` passed.

Not passed / not claimed:

- Browser script `tests/fraud/fraud-browser.mjs` is prepared but has no successful run: `/usr/bin/chromium` points to a missing binary, the official Playwright browser download was unavailable, and the cloud browser could not reach the local server. DOM tests do not substitute for visual acceptance.
- Complete `npm run check` could not finish against this sparse checkout. The initial missing Cloudflare policy was materialized and its standalone check passed. The next full-check attempt stopped at `check-master-governance.mjs:103`: `Missing governed journey surface without P1 presentation successor: my-reality.html`. The sparse checkout cannot resolve the full governed successor set; this is not a complete repository PASS.
- No Preview, production verification, external API certification, OCR acceptance, crime finding or financial-loss prevention claim.

Reproduce current regression:

```sh
npm ci
node --import ./scripts/lib/report-zero-cost-preload.mjs --import ./scripts/lib/pages-json-import-preload.mjs --test tests/fraud/*.test.mjs
node scripts/check-brand-scam-strict-receiver-r1.mjs
node scripts/check-cloudflare-function-import-compat.mjs
```

To run the prepared browser acceptance in an environment with Playwright and Chromium:

```sh
node --import ./scripts/lib/pages-json-import-preload.mjs tests/fraud/serve-fraud-review.mjs
# In another shell, set FRAUD_PLAYWRIGHT_MODULE to the installed Playwright module if needed.
# CHROMIUM_PATH is optional when Playwright has its own installed browser.
node tests/fraud/fraud-browser.mjs
```

The finite successor record `global-fraud-risk-r5-exact-successor.json` seals six product source files and their exact accepted predecessors. Two existing historical readers apply this finite mapping while retaining their own original hash/refusal assertions. No production runtime imports the history helper. The record grants no release authority and does not replace current R5 behavioral tests.

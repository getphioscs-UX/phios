exec((__import__('pathlib').Path(__file__).parent/'build.py').read_text(encoding='utf-8').split('seeds=')[0])
docs={
'RIC-INFORMATION-ARCHITECTURE.md':'''# Information architecture

Question / IntentContext → owner-scoped source references → admitted per-item claims → scoped relevance evaluation → ephemeral RealityView → AnswerBundle → explicit selected preview.

Sources are never rewritten into a new knowledge corpus. Six independently versioned objects: question, source, claim, support relation, ephemeral bundle, revision event. Unknown and consent reference are first-class supporting objects. A consent reference records an external owner decision; RIC cannot issue access. Canonical Articles URLs, Books scopes, Atlas figure identities, report entitlement and account ownership remain unchanged.

Three customer layers: original question and bounded answer; source observations separately from published explanation; unknowns and minimal next evidence. The local preview executes the same pure functions as the tests. Public evidence never becomes personal fact through selection. Unsupported graph relations remain absent rather than decorative lines. Revisions are local comparisons, not reconstructed account history.

Existing World R2/P1 owns reading and bounded public queries. Ask owns retrieval/grounding and synthesis admission. My Reality owns account source discovery. Navigation/Continuity consume admitted projections only. RIC owns none of these product authorities.
''',
'RIC-CONTRACT-REFERENCE.md':'''# Contract reference

Eight draft-07 JSON schemas are compiled by the repository's existing Ajv. Each requires schemaVersion and explicit fields, rejects unknown top-level fields, specifies enum authority kinds and nullable properties. Opaque nested source-native metadata is not treated as a new fact owner. Required null is distinct from an absent key. Geography is an extensible string/null, not a Malaysia/USA allowlist. schemaVersion identifies a contract; sourceVersionOrDigest binds bytes separately.

Question: exact original text, locale, subject/geography/period, purpose, evidence dependencies, allowed/excluded scopes, selection mode, session-only persistence default. A mechanism question needs neither a person's name nor income nor a mandatory country. Minimal evidence needs are explicit IDs; no keyword inference admits a claim.

Source: owner, publisher, canonical reference, language, rights/publication/access/entitlement, acquisition mode, original fragment/row, byte checksum, observation/publication/revision/retrieval/review times, jurisdiction/population/institution coverage, method/unit/base/frequency/limitations. Public fixture SHA is checked against current local source bytes in a separate test; caller-provided checksum equality is not a cryptographic trust authority. Production adapters must supply owner-verified registries, not arbitrary client source objects.

Claim: source+fragment references, origin class, epistemic kind, confirmation scope, question/dependency/scope binding, temporal validity, version/status/limitations, personal/public flags, authorization and retention references, contradictions/unknown dependencies/supersession/provenance. Source-statement confirmation is not independently confirmed reality. Relevance validates explicit question identity, required evidence dependency and allowed scope. A planner/owner must first establish those dependencies; the candidate is not an unrestricted semantic classifier.

Relation: explicit endpoints, qualifying evidence and owner, justification, scope/time, permission context, admission/version/validity. Unknown: dependency, missing input, reason, consequence, proxy limits, next evidence, whether general explanation remains possible, resolution/review. No qualifying relation means edges remain empty and RELATION_NOT_ESTABLISHED.

AnswerBundle separates observations/derived calculations from interpretations, visible conflicts and unknowns. States are DIRECT_SUPPORTED, BOUNDED_MECHANISM, PARTIAL_SUPPORTED, INSUFFICIENT_EVIDENCE, PERMISSION_REQUIRED, OUT_OF_SCOPE. Local scenarios exercise partial support and transparent insufficient-evidence boundaries; this does not prove a general free-text answering service. No provider is invoked.

Revision events include source updates, claim recheck, user correction, permission revocation, new professional records, confirmed action, observed outcome and completed review. Same ID/version with changed content is rejected. Source or permission changes require recheck; prior user actions are not silently rewritten.
''',
'RIC-EPISTEMIC-AUTHORITY-MATRIX.md':'''# Epistemic authority

| Origin | Permitted meaning | Prohibited promotion | Existing authority |
|---|---|---|---|
| PUBLIC_STATISTIC | Bounded published observation | National aggregate → personal outcome | World observation / source owner |
| PRIMARY_DOCUMENT | What the document states | Document existence → universal truth | Current facts/current-web authority |
| PUBLISHED_KNOWLEDGE | Source-supported mechanism explanation | Theory → measured statistic | Books/Articles manuscript/publication admission |
| USER_SELF_REPORT | A selected statement by this user | Self-report → independent confirmation | Account/current-reality owner |
| PROFESSIONAL_RECORD | Scoped qualified opinion/assessment | Opinion → verified outcome or legal authority | Professional owner/admission |
| CALCULATION | Derived result with inputs/unit/formula | Calculation → external observation | Financial calculation owner |
| METHOD_INTERPRETATION | Symbolic/method reading | Agreement → objective evidence | Canonical method owner |
| AI_SYNTHESIS | Synthesis of admitted source claims | Self-reference or invented source | Existing Ask grounding/provider gate |

All can remain disputed/unknown. RIC does not rank symbolic interpretation as measurement, does not issue professional admission, and does not grant AI budget. OTHER remains explicitly unclassified, not trusted by default.
''',
'RIC-DATA-FLOW.md':'''# Data flow and side effects

The candidate imports no product API, database client, provider SDK or account store. JSON fixture loading is explicit in tests/browser. Public artifact bytes are read locally; no external crawl, account scan or paid synthesis. Request selection is an injected local mock decision. Source and claim registries are temporary copies. Returned arrays are cloned; no shared input is mutated.

Public source → source/version/fragment admission → explicit dependency relevance → answer/unknown partition. Selected public claim + synthetic self-report → PREVIEW_ONLY. Revoked private use → denied next preview; public reading survives. Bank assessment → qualified synthetic local diff → canonical history remains NO_VERIFIED_HISTORY. RIC does not perform deletion on revocation and cannot assert production retention cleanup.

Measured execution evidence: node test process replaces fetch with a throwing counter; browser aborts every non-local origin. No D1/R2/provider binding exists in the local server. HTTP server accepts GET/HEAD only and exposes only this candidate directory. Production state is NOT_EXERCISED, not a claim that production globally had no activity.
''',
'RIC-RELEVANCE-AND-UNKNOWN-CONTRACT.md':'''# Relevance and unknowns

Question ID, explicit dependency IDs and admitted scope jointly govern inclusion. Lexical overlap alone is insufficient. Claims cannot silently replace the original question or import unrelated fixed reading. Existing Articles can support many questions; no new article per question is required. No claims in the authorized evidence set produces an insufficient-evidence result, not fabricated filler.

Unknown reason enums distinguish not collected, unavailable, permission absent, incomparable, observation absent, stale/superseded, conflict, not applicable and uncertain mechanism. The bundle displays impact and next source even when a mechanism explanation is available. Missing matched Malaysian application denominator blocks approval probability, not all general household context. CCRIS monetary amounts are not probability; SLOOS net standards are not refusal rates; HMDA action records require the stated action 1+2+3 denominator. CPI monthly indices and survey-year household income are different frequencies, populations and quantities.

Comparison requires identical definitions or an explicitly admitted transformation, geography, unit, price basis and period. This candidate rejects mismatches rather than inventing a transformation. There is no silent year fallback and no null substituted for an observed numeric value. Observation time differs from publication and retrieval time. Pinning a new fetch does not make an old observation live.
''',
'RIC-PERMISSION-AND-RETENTION.md':'''# Permission and retention

Layers: PUBLIC_SOURCE_ACCESS; CURRENT_QUESTION_PROCESS; ONE_TIME_HANDOFF; SAVE_SELECTED; PERSISTENT_CONTINUITY; THIRD_PARTY_SHARED. A public question authorizes no private account search. Holding an account/report is not selection for this purpose. Existing permission owner decides subject/account, source class, selected refs, purpose, processing/sharing, retention, expiry/revocation, decision time and identity.

Local mock capabilities are SIMULATED and cannot satisfy production access. Private source access checks account, selection, purpose, expiry and revocation. Third-party information requires separate participant consent; no automatic relationship inclusion. Sensitive query-string credentials/email are rejected. Private manuscripts cannot be republished through a public answer. Cross-account data is denied. Session output cannot auto-persist. A separate reviewed owner integration would be required to save selected items or establish ongoing continuity.

Revocation stops future local private preview. It does not claim physical deletion, retroactive removal from delivered copies, or a production retention operation. A production integration must call the authoritative revoke/retention owner and record the true result. No consent token or customer credential appears in fixtures/review.
''',
'RIC-VERSION-REVISION-CONTINUITY.md':'''# Versions and continuity

Three layers remain separate: immutable answerSnapshot; explicitly session-selected preview; persistent continuity NOT_IMPLEMENTED by RIC. Question and input versions accompany a bundle. Same source/claim ID with changed bytes requires a new version and admitted revision evidence. Observation period, publication/retrieval/check time, effective interval, supersession and revision reason are separate fields.

Diff must show previous/new question, new evidence, changed conclusion, unchanged scope, remaining unknowns, next review and revoked-current exclusions. Source update or permission revocation means RECHECK_REQUIRED, not fabricated prior actions. An unconfirmed customer action is denied. In scenario D a synthetic bank assessment is three months later; it supplies only a simulated local comparison. No real history owner is provided, so canonical G3 remains NO_VERIFIED_HISTORY with no events. Continuity's existing upstream-event projection is retained, not replaced.
''',
'RIC-WORLD-P1-COMPATIBILITY.md':'''# World P1 compatibility

Verified source reuse: functions/_lib/world-evidence.js, functions/api/world-observations.js, content/world/world-evidence-series-v1.json and world-evidence-observations-v1.json. RIC consumes only locally bundled observation metadata and the existing Book VI canonical paragraph. It neither changes P1 routes nor registers a new query API. Original P1 and Gate2C negative results remain separate historical records. Prior World 0/16 is not overwritten by the 20 RIC contract plans.

P1 can supply source ID/version, country/period, measurement definition, value/unit, publisher URL, vintage and raw-artifact hash. Missing publication dates stay null. RIC's checksum binds current bundled bytes; this run does not claim a new external raw download. Public source references can be represented without making personal facts.

Future minimum product connections, each needs separate acceptance: (1) World/Ask owner emits per-claim fragment+scope metadata and real relevance decisions; (2) selected handoff calls existing permission and account owners, not this mock; (3) Reality/Navigation accepts owner-admitted relations; (4) Continuity reads actual versioned revision/action/outcome events and invalidation; (5) customer views display these authority lanes and revocation/recheck states. No new database/knowledge/permission system is required. Existing provider budget and entitlement gates remain authoritative.
''',
'RIC-GLOBAL-SOURCE-SCALING.md':'''# Global source scaling

| Domain / country | Source owner | Metric | Availability | License | Cadence | Limit / next adapter |
|---|---|---|---|---|---|---|
| Economy MYS | World P1 / DOSM | CPI, household survey income | VERIFIED local pinned bytes | Source recorded public-data terms | Monthly / survey year | No matched application cohort; owner-scoped definition adapter |
| Housing USA | World P1 / FFIEC-CFPB | HMDA action counts | EXISTING pinned snapshot; not re-fetched | Federal public data | Annual | Not unique-person approval probability; retain filters/denominator |
| Credit USA | World P1 / Federal Reserve | SLOOS balances | EXISTING pinned snapshot | Source terms | Quarterly | Survey standards/demand, not denial; institution-count adapter |
| Credit MYS | BNM / CCRIS | Applications/approvals monetary flows | PARTIAL historical audit | Recheck source terms | Monthly | No matched cohort count; no invented approval rate |
| Economy CN | NBS / PBOC | Prices, credit, housing | METADATA_ONLY / NOT_EXERCISED | Source terms unverified here | Series-specific | Definition and rights adapter required |
| Economy JP | Statistics Bureau / BOJ | Prices, rates, credit | METADATA_ONLY | Unverified here | Series-specific | Japanese definitions and vintages |
| Economy EA | Eurostat / ECB | Harmonized prices/rates | METADATA_ONLY | Source-specific | Series-specific | Area composition/metric comparability |
| Economy UK | ONS / Bank of England | Prices/credit | METADATA_ONLY | Source-specific | Series-specific | Territorial and vintage scope |
| Cross-country | BIS | Credit/property | METADATA_ONLY | Source-specific | Quarterly/series-specific | Not a substitute for national approval probability |
| Energy/water/logistics/food | Existing World/Books/Articles | Mechanisms; no new quantitative ingestion | PARTIAL published interpretation | Existing admission | Version-bound | Public authoritative dataset adapter missing |
| Demography/work/housing/resources/institutions/conflict | World Bank + existing World materials | Existing population/GDP and mechanism context | PARTIAL | Existing source terms | Snapshot/series-specific | Question-specific evidence coverage required |
| Family/financial | Customer/current-reality/Finance owner | Selected self-report and calculation | OWNER_GATED | Private consent | User version | RIC permission integration absent |
| Professional | Existing professional owner | Qualified assessment | OWNER_GATED / synthetic this run | Private | Record-specific | Real admission/recipient authorization absent |
| Symbolic methods | Canonical method owner | Method interpretation | EXISTING boundary only | Existing entitlement | Reading version | Never measurement or independent fact |

No global data completeness, fresh external availability, legal entitlement or actual professional authority is claimed by this metadata matrix. Country coverage expands through existing owners; no MYS/USA-only schema restriction.
''',
'RIC-TEST-PLAN.md':'''# Executable validation

Run `node --test tools/review/reality-information-contract-r1/tests/ric.test.mjs`. Existing Node test runner and repository Ajv; no installation. Forty negatives in five groups of eight record expected/actual code and differences. Additional tests validate eight bilingual scenario runs against schemas, malformed/null/missing/additional fields, real local article/snapshot SHA, and twenty multilingual contract boundary plans. They do not claim twenty live answered questions.

Run `node tools/review/reality-information-contract-r1/review/server.mjs`, then `node tools/review/reality-information-contract-r1/review/verify-browser.mjs`. Browser visits only localhost, exercises A–D at 1440/390 in both locales, selects public+synthetic private items, previews exactly two, revokes and denies new private preview, then confirms public-only preview still works. Checks overflow, page/HTTP errors, keyboard focus, aria-live, reduced motion and no broken images. Four representative final screenshots only; initial failed process metadata retained, no unnecessary repeated screenshot archive.

Schema/source checks are contract evidence. Local fixture consent is simulated. External source availability, real accounts, actual professional credentials, production flags, provider use authorization and durable history are NOT_EXERCISED. Full unrelated repository suites and product compilation are not run because no product code changed.
''',
'RIC-LIMITATIONS-AND-BLOCKERS.md':'''# Limitations and next owner connections

R0 source inspection and local SHA checks are VERIFIED; contracts and mock private transitions are CONTRACT_ONLY / SIMULATED; product integration is NOT_IMPLEMENTED; production runtime RUNTIME_UNVERIFIED. Human acceptance PENDING. No Gate R3 authorized.

Actual existing capabilities: bounded World observations, canonical Articles/Books fragments and source eligibility, Ask grounding and explicit temporary handoff, account-scoped saved-source discovery, explicit world-context save owner, graph lanes with no invented relations, Navigation/Continuity read-only projections, financial and professional owner boundaries. Source existence is not runtime availability. Some save/discovery routes explicitly admit only local/QA/preview flags.

Candidate capabilities: unified question/source/claim/relation/unknown/version/consent envelopes, explicit dependency relevance, authority separation, bounded AnswerBundle, selected temporary preview, future-use revocation and qualified synthetic version diff. Arbitrary free text is not semantically solved by this reference adapter; upstream owners must validate the evidence need. The source registry is injected and trusted only because local tests bind actual files; it is not client-controlled production admission. Professional scenario uses no actual professional record.

Exact missing product connections: per-item provenance from World/Ask/Reality string lanes; authoritative permission decisions and selected account handoff; relation owner records before drawing edges; versioned history/revision/outcome owner before G3; unified customer rendering and source/consent invalidation. These are engineering acceptance dependencies, distinct from external legal/professional/paid-AI/production approvals. No new parallel system is needed.

Malaysian mortgage approval trend remains unanswerable as probability from monetary flows. Global source coverage outside pinned pilots remains partial. General Book VI household mechanisms can be explained within their published scope, not used to prove a named household's condition. Fresh runtime/publication/entitlement activation must be verified separately before release.

Recommendation: review the local candidate and contract boundaries; do not accept general product or production completion. Screenshots support human visual review, not semantic acceptance. Human may ACCEPT_LOCAL_CANDIDATE, ACCEPT_CONTRACT_ONLY, REVISE or BLOCKED; no automatic acceptance is recorded.
'''
}
for name,text in docs.items():write(name,text)

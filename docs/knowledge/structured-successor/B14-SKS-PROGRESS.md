# B14-SKS execution progress

## Latest batch: W34–W36 on e00e914

Added the 71-object cross-book discovery registry, a separate relationship graph and full provenance backlinks. Book identities are taken from explicit publication metadata or approved manuscript bindings, never inferred from legacy KN-B1/KN-B2 prefixes. The index references each owning registry without creating a new Knowledge Master.

W35 includes two proposed reading links (Book II coordination → Book III coordination continuity; Book III continuity → Book IV expansion), both UNREVIEWED and excluded from retrieval. The existing Book IV → V bridge is referenced with a digest; Book V data is not copied. Pressure and Threshold links remain explicitly withheld because their Book I source objects are missing. No causal relationships are admitted by the builder.

W36 adds a source-backlink panel to each of the four book pages. Every indexed object resolves to its canonical registry record, manuscript section/page/digest, published articles where available and book section. Private text delivery remains blocked; missing locale publication is stated explicitly. Book III topic URLs open the corresponding source topic.

Run `node scripts/build-b14-sks-cross-book.mjs` followed by `node scripts/check-b14-sks-cross-book.mjs --record`. Provenance digests, all 71 source identities, bilingual source selection, graph exclusion and external bridge checks pass; Book III and seven-volume consumer regressions also pass. Browser visual acceptance remains deferred. Human review stays consolidated; next batch W37–W40.

## Latest batch: W27–W33 on 75599e46

Generated Book IV taxonomy, expansion modes, reading chain, scale-transition structure, constraints and a separate Book IV → V navigation bridge. Twenty topic projections bind to the final 125-node Book IV authority and approved bilingual published-article records. Article summaries are copied exactly, explicitly labelled as article scope rather than a new single-node definition. Historical article-production completion notes are superseded for publication availability by the existing book4-publication-v1 registry.

The `/books/reality-expansion/#expansion` Explorer provides search, selection, source summaries, article links, source boundaries and a six-topic reading sequence; query selection survives browser history and preserves other parameters. The bridge points to `/books/reality-differentiation/#atlas` without copying or writing Book V data.

W27/W28/W31/W32/W33 are machine-accepted previews. W29 is a source-backed reading order pending causal/condition extraction; W30 has no asserted concrete sourceScale/targetScale or irreversible transition until supported. Human review remains grouped at the end. Full browser visual acceptance is not claimed by DOM tests.

Reproduce with `node scripts/build-b14-sks-book4.mjs` and `node scripts/check-b14-sks-book4.mjs --record`. The latter verifies source digests, exact published summary/href parity, canonical manuscript binding, type vocabulary, bilingual search/selection/history and the Book V boundary. Seven-volume public-consumer regression also passes. Next implementation batch: W34–W36.

## Latest batch: W19–W26 on d8a489d

Generated seven Book III artifacts from the 103-node final manuscript authority, with 28 selected topic entries and exact canonical/section digest checks. Added `/books/reality-continuity/#maintenance` search and source-topic inspector. Unknown observable signals, failure mechanisms, thresholds, recovery windows and transitions remain empty pending extraction; no automatic Reality state write or recovery recommendation is enabled. W26 currently supplies a read-only binding contract, not an activated Reality consumer.

Run `node scripts/build-b14-sks-book3.mjs` then `node scripts/check-b14-sks-book3.mjs --record`. Human decisions are deferred together as requested in `B14-SKS-CONSOLIDATED-HUMAN-REVIEW.md`; unfinished extraction is tracked separately and is not claimed as acceptance. The next implementation batch is W27–W33.

KAP grounding's Book I scope change is registered in the additive M4 maintenance successor, chained to the existing M2 grounding digest. Historical freezes remain unchanged. The digest resolver now validates the predecessor chain before returning its successor. `check:kap-grounding`, Book I/II/III component/provenance checks and Atlas scope regression pass.

Baseline: `ca1a38b150740ce74ef83b24c421c08e22cb79e7`

## Stage 1: W0–W4

Implemented and machine checked. This is foundation acceptance, not human acceptance or production freeze.

- W0: current and historical authority inventory, per-book canonical nodes, publication bindings, review campaigns, existing consumer evidence and article-checker reconciliation candidates.
- W1: structured knowledge remains a projection; publication, Ask, Reality and canonical ownership stay with existing owners.
- W2: common object schema and required canonical/manuscript provenance.
- W3: 24 universal types. Book-specific specializations must map to this vocabulary; W5's STRUCTURE is not silently added as a universal type.
- W4: 21 relationship types, explicit claim strength and evidence restrictions. Unreviewed relationships cannot claim CANONICAL or SUPPORTED status.

Book III's 103 final nodes and Book IV's 125 final nodes supersede the corresponding book-w1d records. The current seven-volume Book/Part registry owns public book identity and part assignment. Manuscript bytes and remote R2 delivery were not reverified in this local audit.

## Stage 2: W5–W11 (baseline f72f4094)

Implemented a source-grounded preview: 11 structured objects, mechanism and state projections, a partial G1–G4 reading sequence, and Structure / Carrier definition comparison. Definitions come from the stable concept registry with approved manuscript-to-node bindings. New classifications and draft English translations await human review. Unsupported conditions, transitions and examples remain empty.

Formation Explorer is integrated into `/books/reality-formation/` with search, type filters, comparison, source inspector, URL selection/history and existing contextual Ask links. The server resolves the concept into its trusted structured object; KAP retrieves the selected object, related objects, canonical nodes and broader sources in that order. Existing Atlas scope and health routing retain their owners.

W5–W7 and W10–W11 are machine-accepted previews. W8–W9 remain PARTIAL_SOURCE_GAPS: the exact Condition → Signal → Interaction → Pattern → Structure → Runtime → Reality sequence and five requested comparison pairs lack admitted supporting content. The generator records these as withheld. W12–W80 remain not started; W56–W59 human review and production freeze are not satisfied.

Validation: structured schema/provenance, actual KAP retrieval, bilingual DOM interaction/history, Book I runtime/figure alignment, existing Atlas Ask regression (20 cases), contextual Ask regression (32 scenarios). The standalone component was visually checked at desktop and 390px mobile widths. Full paid Ask and deployed R2 delivery were not exercised.

Rebuild with `node scripts/build-b14-sks-book1.mjs`; verify and record with `node scripts/check-b14-sks-book1.mjs --record`. The fixture is `tools/review/book-1-formation-explorer.html`.

## Seven-volume public cleanup

## Stage 3 implementation on e49e5ff8: W12–W18

Book II now has taxonomy mappings into the shared universal vocabulary, 12 approved chapter-source index entries, interaction/relationship/collective registry structures and explicit missing semantic fields. Publication ownership comes from `publicationBookCode`, including Book II P5 nodes whose historical IDs begin KN-B1. One proposed conflict entry was excluded because the active binding registry supplied no approved source.

The book page mounts a bilingual Runtime Interaction Atlas at `/books/reality-runtime/#runtime-atlas`: search, runtime-level filter, source chapter inspector, chapter-scope comparison and URL/history selection. Both Perspectives entry pages link to it as a knowledge framework, with explicit limits against substituting for user facts, relationship readings or professional judgment. It does not compute feedback direction from chapter titles.

`node scripts/build-b14-sks-book2.mjs` regenerates the six registries. `node scripts/check-b14-sks-book2.mjs --record` verifies provenance, universal type mappings, bilingual interaction and consumer links. W12/W18 are machine-accepted previews; W13–W17 remain source-index implementations pending paragraph extraction, feedback modelling and full-page visual acceptance. No production or human acceptance is claimed.

Book I was re-audited against the user's latest 406-page PDF, not the historical 404-page review. W8/W9 source admission and W10/W11 full production acceptance remain open. This stage does not silently promote the new manuscript or replace the 448-section governed access freeze.

## Earlier public cleanup notes

Revision follow-up on baseline `6455ef39`: the user-designated 404-page Book I PDF differs from the registered 402-page binary. See `B14-SKS-W8-W11-REVISION-REVIEW.md`, the source verification report, 275 heading candidates and proposed editorial decisions. Source-native W8 chains and Capacity / Load evidence were located, but revised section bindings are not yet admitted. Page 9 of the private revision still contains five-volume prose; do not propagate it into public projections. W11 now filters retired, withheld, unsupported and wrong-book objects and handles unavailable or malformed asset responses, with negative regression coverage.

Public copy and legacy book entry points use seven-volume terminology and current Book IV/V identities. Public-data compatibility loaders resolve all seven books and current Part ownership. `/book-one` and `/book-one.html` redirect to `/books/reality-formation/`. The figures landing page no longer features retired FIG-001/FIG-007 five-volume diagrams. Explore uses HERO-7V-SYSTEM; the obsolete academy figure was removed. Historical registries and asset records remain intact.

## Checks

## W56–W59 consolidated review preparation on 1bc2650

`human-review/B14-SKS-W56-W59-HUMAN-REVIEW.html` is an offline review workspace for all 71 candidates, with book filters, search, per-book criteria, source page/digest references, reviewer names, decisions and notes. It exports drafts and restores only matching-source drafts. No external service, automatic save, source-registry mutation or decision application is involved.

Book I checks manuscript/node fidelity, abstraction, causality, duplication and Explorer value. Book II checks interaction distinctions, psychological overreach and collective boundaries. Book III checks diagnosis/advice/scoring boundaries; Book IV checks growth/superiority/ranking boundaries. Forty records with missing meanings cannot be approved. Book IV approval is explicitly limited to summary assembly, not node definitions. Historical manuscript page references require version verification.

`check:b14-sks-human-review` validates the packet against the extraction digest, pending review defaults, blocked approvals, required reviewers/reasons/criteria and stale or malformed drafts. `--browser` additionally verifies the offline mobile layout, filters, prevented premature approval, export and import recovery. No test decisions are stored in the review packet.

W56–W59 human review remains deferred under the user's consolidated-review instruction; only preparation and machine checks are complete. Forty missing meanings still need extraction, not merely a signature. Next executable batch: W60 onward, with these human gates open.

## W53–W55 deterministic extraction tooling on d856622

The strict draft-07 `structured-extraction-candidate-v1.schema.json` records identity, explicit book/Part ownership, manuscript references, proposed meaning/relationships, exact quote pointers, confidence and review state. Confidence means source-bound versus unresolved, not a fabricated probability. All candidates remain pending human review and cannot assert canonical authority.

`npm run build:b14-sks-extraction` reproducibly assembles 71 candidates into `docs/knowledge/structured-successor/extraction/b14-sks-extraction-candidates-v1.json`: 11 existing source definitions, 20 published article summaries and 40 unresolved meanings. It verifies upstream registry digests before assembling and records available/missing node metadata, blueprint, approved mapping, heading and figure metadata paths in the frozen priority order. It does not turn headings into definitions or summaries into node-level authority. No raw full-book delivery, semantic relationship synthesis, source registry writeback or publication occurs.

W55 reuses `selectPaiRoute` and its existing execution classes: identity/mapping T0, object assembly T1, short summaries T2, relationship synthesis T3. Only deterministic assembly is executed here. T2/T3 route plans have no admitted model and remain controlled-unavailable; no provider is invoked, no cost is incurred by these tools, and AI output cannot approve itself.

`npm run check:b14-sks-extraction` verifies schemas, exact source pointers, manuscript page order, stable IDs, byte-equivalent repeated assembly, stored-output freshness, source digest tampering rejection, prohibited authority/review flags and all four execution classes. Actual new paragraph extraction for the 40 unresolved meanings, semantic relationship synthesis and consolidated human review remain open. W53–W55 tooling completion is not their acceptance. Next: W56.

## W50–W52 boundary preview on 30ab6b4

`knowledge-reality-boundary-v1.json` fixes the distinction between a knowledge framework and a current personal fact. The existing customer Reality handoff accepts optional `structuredCandidates`; each requires an allowlisted role, explicit user confirmation and a server-resolved source with text. Client-supplied fact/diagnosis flags are ignored. Observations remain user-reported, and candidates enter only the workspace's knowledge side context. This creates no facts, prescriptions or persistence. Source-index-only Book II/III records are rejected until semantic extraction is complete.

The five supported roles are interpretation candidate, observation prompt, comparison frame, recovery option frame and navigation frame. These are reference frames, not computed comparisons or recovery advice. W51 is an API/runtime preview: a dedicated customer candidate-selection/confirmation interface and its paid end-to-end acceptance remain future implementation work, not completed human approval.

Explorer navigation now links Book II to Relationships, Book III to current-situation review and Book IV to Professional, with Book I also linking to current-situation review. These are existing route entries; following them creates no personal evidence or method execution.

The header now declares LOGO-009 as required by current brand authority, retaining automatic dark-surface contrast selection and the LOGO-010 footer. `check-cx-r5-global-shell.mjs` passes without weakening the assertion. Fifteen candidate cases plus unavailable-source, real handoff consent and workspace tests pass, as do existing Book I–IV checks and current CX-R31 handoff routes. The older `check-stage15-reality-orchestration.mjs` still asserts the retired `reality-entry-stage15-handoff.js` inclusion in a compatibility redirect; that separate legacy assertion is not a production failure introduced by this batch. Full `npm run check` is not claimed. Next: W53–W55.

## W45–W49 article / figure reconciliation on 01d942d

`article-figure-reconciliation-v1.json` adds 218 approved article projections, 471 current Book I–IV node decisions and 16 existing figure contexts. Article role defaults are explanation with discovery/search-entry roles pending consolidated review; the full role vocabulary is retained. Published article bytes and URLs are protected by checksums. The builder creates only the additive registry. Article pages add source-bound Explorer links without republishing their body.

Figure bindings use explicit book/Part ownership as reading context, not inferred mechanism or causal relationships. Explorer reuses the existing figure registry, ownership check and public source resolver. Available, correctly owned figures may appear as Part illustrations; unresolved/unavailable figures retain the reading map/text. No separate SVG or visual authority was introduced.

The reported article bug came from a second decorator inserting a generic hero outside the article renderer's layout. The renderer now owns one hero, using the existing generic asset only when no specific hero is provided. Local real-browser article pages at 360/1440px pass single-hero, readable-heading and overflow checks; external asset delivery remains outside that local test.

Ask recognizes explicit article/book/figure navigation before retrieval. Asking “文章” returns a brief article link, with no manuscript retrieval or personal-context consumption. Long answers are expandable; source excerpts are bounded and collapsed. Insufficient evidence requests clarification and offers a reading entry without asserting an unsupported answer. The request has a 25-second timeout, duplicate-submit lock and restored retry state. Seed loading also has a timeout. The CSS namespace checker distinguishes import URLs from selector namespaces; the separate legacy-import guard remains active.

Checks: `check:b14-sks-article-figure`, `check:b14-sks-article-ask-browser`, PJA-W2D's 23 renderer fixtures, both CX legacy guards, existing Book I–IV checks and Contextual Ask regression. The browser test uses local pages/API and does not establish paid or deployed production acceptance. Next: W50–W52; human review remains consolidated.

## W39 customer presentation and W41–W44 public component pass on 28a7cbb

The supported seven-part answer now passes through CKA and customer projection to the Contextual Ask renderer. Direct answer remains the existing primary answer; mechanism/state, conditions, related factors, possible transition, unknown boundary and Book link follow. Missing evidence is visibly unknown. Fourteen real bilingual grounding cases now test the complete projection/HTML path, including abstention and escaping. KAP M6 records the optional CKA field successor; original frozen evidence is preserved.

All four Explorer adapters share responsive CSS, keyboard navigation, visible focus, reduced motion, forced colors and a selected-topic Ask action. Book III adds selection URLs and popstate synchronization; `degradation` and `scale` are accepted aliases for existing `topic` and `expansion` links. Search preserves browser selection. Existing URLs remain valid.

`scripts/check-b14-sks-public-browser.mjs` runs 32 real Edge component cases across four books, two languages and 360/390/768/1440px. It checks overflow, arrow-key focus, URL selection/history, no-match search, forced-color focus and selected Ask links. Set `PHIOS_PLAYWRIGHT_MODULE` to an installed Playwright module and `PHIOS_BROWSER_CHANNEL=msedge` when using the desktop bundled runtime.

W41 now shares navigation, central reading map, right source inspector, all-matching/selected-only filter and source reading entry. Book I retains its source-supported formation visualization; the other central maps show reading navigation without inventing causal relationships. Book III details retain the source-index boundary. W43/W44 acceptance covers isolated real-browser components, not full-page or paid journeys. Those acceptance tasks remain consolidated; continue with W45–W49.

## W37–W40 Ask integration preview on 7bbd7d7

Book I–IV source navigation now supplies a registry-validated selected object to the existing Contextual Ask runtime. Retrieval prioritizes selected structured evidence and rejects unrelated recovery, scale-transition and relationship questions. Ten intent families are recognized; comparison intentionally abstains until multiple supported objects are available. Book II/III chapter indexes supply no answer prose. No unreviewed cross-book edges are admitted.

The deterministic composition layer emits the seven-part structured answer for supported short answers. Missing conditions, factors and transitions remain empty with an explicit boundary. W39 customer presentation of all seven fields and full paid browser journeys remain implementation/acceptance work; this batch does not claim complete W37–W40 production acceptance.

`node scripts/check-b14-sks-ask.mjs` verifies ten intents and fourteen bilingual real KAP pipeline cases, including supported short-answer composition, unrelated questions, missing objects and unavailable assets. KAP grounding, current W11–W17 composition, Contextual Ask and PPR W47–W66 targeted regressions passed. The obsolete PPR method-heading assertion now checks the current expandable method-reading structure. Full `npm run check` is not claimed: the separate POC live check encounters DNS `ENOTFOUND www.getphios.com` in this environment. The attachment's `.mjsnode` module error comes from concatenated commands.

KAP M5 records the additive runtime hash successor without rewriting the historical freeze. Human review remains consolidated. W41–W44 is next, with the W39 presentation gap still open.

```text
node scripts/check-b14-sks-foundation.mjs --record
node scripts/check-seven-volume-public-consumers.mjs
npm run check:book-w1-public-projection
npm run check:cx-knowledge
npm run check:i18n
npm run check:tarot-current
node scripts/check-customer-image-loading.mjs
git diff --check
```

The foundation builder resets W0–W4 to pending check; rerun the checker with `--record` to record machine acceptance. No deployment or full repository regression is claimed by this stage.

## W60 dedup engine on 7c57546

Machine implementation and targeted checks complete: 71 objects, 2,485 pairs, 465 pairs with both meanings, five Book IV article-summary reuse findings. Forty meanings remain unavailable. Exact text and lexical overlap are review evidence, not confirmed semantic duplication. See dedup/B14-SKS-W60-DEDUP.md. No merge or authority writeback; human review deferred. Next: W61.

## W61 conflict registry on 2151998

Four-state conflict validation and a source-bound registry are implemented. Five W60 clues remain UNRESOLVED and unconfirmed; there are zero confirmed conflicts. Forty missing meanings still prevent full semantic coverage. Explicit reviewer, rationale, evidence and direction/context are required for resolution records; validation does not apply authority changes. Builder refuses to overwrite modified records. VAP-W20/W21 now checks one body figure separately from the current fallback hero. Targeted checks passed. Human review deferred; next W62.

## W62 loading on 22d8cca

Progressive loader and four public mounts implemented; source backlinks are lazy. Initial selected-topic load uses four scoped JSON requests, approximately 6.3–9.1 KB. Complete reading maps and comparisons remain available on explicit request. Projection/loader tests, four new browser mounts, and 32 retained reading-component cases pass. See B14-SKS-W62-LOADING.md. Human and production performance review remain open. Next W63.

## W63 metadata search on 7614ca6

The seven-field 71-record index and lazy current-book, cross-family Explorer search are implemented. Deterministic source/field/search checks and four-book browser navigation tests passed. No source definitions or manuscript prose are indexed. See B14-SKS-W63-SEARCH.md. Next W64; human review remains deferred.

## W64 schema checker on da0b0a6

Common schema and cross-registry checks cover 71 objects, valid IDs/book/Part/sourceRefs and orphan detection. Twelve negative fixtures are rejected. Book-specific extension contracts remain intact; absent definitions stay unresolved. See B14-SKS-W64-SCHEMA.md. Next W65; human review remains deferred.

## W65 authority checker on 403b681

The registered 71-object corpus retains canonical-source and projection-only boundaries. Twenty article summaries remain summaries; forty missing meanings remain unresolved. W64 plus source reconstruction and 12 authority-negative cases pass. See B14-SKS-W65-AUTHORITY.md. Next W66; human review remains deferred.

## W66 relationship checker on cc24b53

Endpoint existence, semantic schema/type, distinct pending-reading role, duplicate IDs/pairs and self-loop authorization are checked. Zero semantic edges and two pending reading proposals remain unchanged. Eight rejection cases and an explicit fixture-only self-loop exception pass. No production exception or human decision was created. A separate 40-task source-extraction packet and Chat prompt are in meaning-extraction/. Next W67.

## W67 projection checker on 893d7c1

71 static discovery/deep-link checks and 142 English/Chinese rendered inspector/Ask-context cases passed. See B14-SKS-W67-PROJECTION.md for test scope. Incoming meaning batches await restored/current file paths before full coverage and quote verification; the 40 registered missing meanings remain unchanged. Next W68.

40-meaning follow-up: all 40 restored proposals and 88 quotations now pass source/identity checks. Book III is verified through exact section SHA256 from the supplied original review HTML; its PDF authority is unchanged. All 40 await consolidated semantic review and successor import. See meaning-extraction/MEANING-PROPOSALS-AUDIT.md.

## W68 book-specific checkers

The four required check:b14-sks:book1–book4 aliases now point to the existing book-specific contracts. The check:b14-sks:books aggregate verifies aliases and runs all four without nested npm or historical recording. All passed (11/12/28/20 objects). The 40 source-verified meaning proposals remain pending semantic review/import. See B14-SKS-W68-BOOK-CHECKERS.md. Next W69.

## W69 cross-book checker on d09f7d4

The required check:b14-sks:cross-book command now composes existing source, dedup, conflict and relationship checks, plus cross-book route/owner and Book IV–V bridge invariants. All 71 objects and one bridge pass; eight scope/authority mutation tests reject invalid changes. Pending findings and 40 proposal imports remain deferred. See B14-SKS-W69-CROSS-BOOK.md. Next W70.

## W70 Ask checker

All six mandated questions have bilingual coverage: two missing-object cases, six missing-live-meaning cases, four bounded-source cases. Fixed a Book IV expansion relevance gap for structural costs and scale shifts, with negative scope tests. Existing 14 bilingual KAP cases still pass. This does not claim full answers for all six questions; see B14-SKS-W70-ASK.md. Next W71; human review remains deferred.

## W71 Book I acceptance preparation

Five-minute first-time reader test packet, offline timed observation form and draft-only exporter are ready. Eight invalid draft cases and mobile browser timer/export/layout checks passed. No reader acceptance was performed; source entry and actual Ask continuation must be observed. See customer-acceptance/W71-BOOK1-ACCEPTANCE.md. Next W72 preparation; W71 human gate remains open.

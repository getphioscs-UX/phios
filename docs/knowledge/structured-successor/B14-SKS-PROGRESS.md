# B14-SKS execution progress

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

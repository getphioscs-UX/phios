# BaZi full-report composition R1

Accepted content was composed into **38 physical pages in each locale**, down from 74 ZH / 64 EN. The ten Section Masters, fixed opening pages, accepted paragraphs and original source-node identities are retained. There are no new BaZi narrative paragraphs.

## Composition contract

The existing customer builder accepts the explicit review-candidate option `compositionR1`. The composition layer maps canonical definition/paragraph ordinals to physical groups, instead of giving every locale-specific continuation node a full page. Source nodes are never renamed. Groups carry compositionGroupId, sourceNodeIds, physicalPageRole, sectionId, pageFamily, locale, fitMode, priority, canMerge and mandatory break flags.

Both locales use the same roles and section counts: opening 6; S01 2; S02 4; S03 5; S04 4; S05 3; S06 3; S07 3; S08 3; S09 3; S10 2. Sparse retention/timing and appendix pages were merged after visual review. Pressure/maintenance and guidance/decisions retain separate pages because merging them overflowed in English; the shared 38-page architecture stays within the authorized 36–40-page range without shrinking body text.

S03 combines carrying/function charts, renders Ten Gods and pattern paths in compact tables, and distributes the seven accepted paragraphs across their relevant roles. The integrated page also carries capability material to keep the evidence table readable. S08 owns the timing overview; annual descriptions sit on Current-Year Observation. Other sections retain their already-accepted domain-specific timing implications but no repeated standalone timing strip is added.

The existing renderer renders multiple source fragments under one physical-page heading. Visible continuation headings disappear. Section Masters retain their original binding, paragraph and insight content. STANDARD → COMPACT → REFLOW changes spacing, grid structure and line height, never body font below 16px. Evidence table text remains 14px, boundaries 12px. There is no clipping-based success condition.

Boundary records distinguish local, section and global scopes; exact duplicates have an explicit canonical-reference ledger. For this fixture no exact boundary or accepted narrative block needed deletion. Accepted source-file digests and rendered paragraph text remain unchanged. Similar-but-not-identical accepted sentences were not silently removed.

The shorter Chinese maintenance and decision closing pages use a 20px reading scale and narrower measure. This balances their three accepted paragraphs on the shared physical architecture without adding text or a standalone takeaway page.

## Validation

`npm run build:bazi-full-report-composition` reuses the existing review builder.  
`npm run check:bazi-full-report-composition` verifies source coverage, identical locale architecture, all ten unchanged masters, no exact narrative duplicates, no visible continuation headings, actual A4 fit, clipping, font floor and loaded assets. It also prints in memory and checks the actual physical page count; it does not rely solely on DOM count.

The manifest records each physical page's role, source nodes, merge count, measured fit and overflow. Browser evidence and representative screenshots are kept in this directory. Full source-node coverage is PRESERVED or MERGED; no accepted node is silently dropped.

Review: [switchable review](../../../../tools/review/BAZI-FULL-REPORT-COMPOSITION-R1-REVIEW.html), [Chinese](../../../../tools/review/BAZI-FULL-REPORT-COMPOSITION-R1-ZH.html), [English](../../../../tools/review/BAZI-FULL-REPORT-COMPOSITION-R1-EN.html).

Editorial and Composition R1 are now **ACCEPT**, frozen by [HUMAN-ACCEPTANCE.json](HUMAN-ACCEPTANCE.json). This is the cross-method physical composition reference; BaZi semantics and visual selectors remain method-specific. The historical review remains unbound and unchanged. A separate [controlled subject proof](../controlled-subject-r1/README.md) passes the positive and negative binding checks. Production admission and commerce E2E remain pending independently.

# BOOK-W1B｜Part 8–15 Canonical Outline Reconciliation

## Current result

BOOK-W1B remains in progress and blocked. Eight deterministic migration-map drafts now account for all 471 existing P8–P15 frozen Canonical Nodes and record the already-accepted BOOK-W1A publication-owner moves. They do not claim that the upgraded outline has been canonically matched or accepted.

The source constraint contains 621 outline chapters across P8–P15 and 471 existing Canonical Nodes. **621 outline chapters ≠ 621 Canonical Nodes.** The +150 chapter-count delta produced 0 approved new Canonical Node candidates.

| Part | Current authority | Publication owner | Outline chapters | Existing nodes | Full chapter list |
| --- | --- | --- | ---: | ---: | --- |
| P8 | Runtime Maintenance / 运行维持 | BOOK-3 | 64 | 47 | No |
| P9 | Coordination Runtime / 协调运行 | BOOK-3 | 43 | 39 | No |
| P10 | Runtime Expansion / 运行扩展 | BOOK-4 | 81 | 77 | No |
| P11 | Civilization Runtime / 文明运行 | BOOK-4 | 77 | 64 | No |
| P12 | Civilization Atlas / 文明图谱 | BOOK-4 | 84 | 46 | No |
| P13 | Reading Science / 读取科学 | BOOK-5 | 87 | 75 | Yes |
| P14 | Navigation Science / 导航科学 | BOOK-5 | 79 | 52 | No |
| P15 | Reality Continuation / 现实延续 | BOOK-5 | 106 | 71 | No |

P13 is the only Part with a complete chapter list in the recorded source authority. P8–P12 and P14–P15 contain only title, count and semantic-anchor constraints. P13 still lacks explicit Human Canonical match decisions for inserts, moves, supersessions, splits, merges and truly new candidates.

## Migration-map state

Every existing node has a preservation entry with:

- its original frozen `oldNodeCode`;
- unchanged `oldChapterCode` and placeholder `newChapterCode`;
- `canonicalIdentityChanged: false`;
- the BOOK-W1A publication-owner transition;
- `outlineMatchStatus: pending-explicit-human-canonical-review`;
- no successor code and no automatic approval.

The `move` action in these draft entries records publication ownership only. It does not claim a same-Part chapter-position decision. Retain, rename, same-Part move, supersede, split, merge, cross-Part relationship and new-candidate decisions remain explicitly unresolved.

## Boundary and next gate

BOOK-W1B acceptance requires the missing complete chapter inventories and explicit Human Canonical decisions. Until then:

- `content/knowledge/registry/nodes.json` remains unchanged;
- the frozen Blueprint Registry remains unchanged;
- no frozen Node is deleted or renumbered;
- no new Canonical Node candidate is approved;
- no successor Blueprint may be generated;
- no Article is approved or published;
- no Production Authority is created.

The next permitted gate is `BOOK-W1B-HUMAN-CANONICAL-OUTLINE-ACCEPTANCE`, not BOOK-W1C.

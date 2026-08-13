# BOOK-W1｜Five-Volume Canonical Architecture Migration

## Baselines

- Actual execution baseline: `a8e6c3e9cd1495c407df321cfb94cdaa60e6446a`
- Master Work declared checkpoint: `b42b775e460041605955d2baee4f15234b649b11`
- Historical planning baseline: `807efc359a0d1477bc697044f55970fc5e6e8500`
- Previous publication architecture: 4 volumes / 15 numbered Parts
- Successor publication architecture: 5 volumes / 15 numbered Parts

The later `a8e6c3e` baseline is recorded as the actual execution source. The earlier `b42b775e` checkpoint remains traceable because it is the baseline named by the approved Master Work v3. Neither baseline rewrites the historical `BOOK-W0` audit or the KAU-R0 freeze.

## BOOK-W1A acceptance

Current Book ownership is:

| Book | Volume | Canonical title | Parts |
| --- | ---: | --- | --- |
| BOOK-1 | I | Reality Formation / 世界如何形成 | P1–P4 |
| BOOK-2 | II | Reality Runtime / 世界如何运行 | P5–P7 |
| BOOK-3 | III | Reality Continuity / 世界如何维持 | P8–P9 |
| BOOK-4 | IV | Reality Civilization / 世界如何扩展 | P10–P12 |
| BOOK-5 | V | Reality Navigation / 世界将如何继续 | P13–P15 |

Publication ownership migrated as follows:

- P8–P9: BOOK-2 → BOOK-3
- P10–P12: BOOK-3 → BOOK-4
- P13–P15: BOOK-4 → BOOK-5

Part Codes remain unchanged. The Current Part Authority for P8–P15 is Runtime Maintenance, Coordination Runtime, Runtime Expansion, Civilization Runtime, Civilization Atlas, Reading Science, Navigation Science and Reality Continuation. Superseded names remain aliases or historical titles only.

## Identity and freeze boundary

- Canonical Node identity remains governed by `content/knowledge/registry/nodes.json`.
- All 716 existing Canonical Node identities remain present and byte/content-normalized hash bound.
- Publication ownership is not inferred from the `KN-B` prefix.
- `content/knowledge/blueprints/blueprint-registry.json` remains the frozen KAU-R0 authority in W1A; successor Blueprint generation is gated until W1B migration-map acceptance and occurs only in W1C.
- `docs/audits/BOOK-W0-four-volume-migration.md` remains immutable historical evidence.
- W1A does not modify Public/Website projection, approve new Nodes, publish Articles, or create Production Authority.

The pre-existing Book Architecture Manifest schema still owns the legacy `phios-volume-{n}` manifest identifier. W1A therefore adds explicit `canonical_book_id` and `bookCode` fields while retaining the legacy schema-bound identifier. Schema/consumer compatibility is a governed BOOK-W1F concern and is not silently rewritten here.

## Checkpoint

BOOK-W1A is accepted only when both commands pass:

```text
npm run check:book-w1a
npm run check
```

Only after that checkpoint may BOOK-W1B begin.

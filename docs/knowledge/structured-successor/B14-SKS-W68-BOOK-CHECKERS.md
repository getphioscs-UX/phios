# W68 book-specific checkers

The required commands now reuse the existing per-book checkers:

| Command | Coverage |
| --- | --- |
| check:b14-sks:book1 | 11 source-bound objects, schema/source digests, formation reading/comparison, bilingual Explorer and actual KAP context retrieval |
| check:b14-sks:book2 | 12 mappings, runtime taxonomy, missing-definition boundary, bilingual selection/comparison/history and Perspectives boundaries |
| check:b14-sks:book3 | 28 final node/section mappings, maintenance/recovery taxonomy, source search and prohibition on automatic Reality state mutation |
| check:b14-sks:book4 | 20 published-source projections, bilingual article summaries, expansion chain and Book V bridge boundaries |

Run npm run check:b14-sks:books to validate all four aliases and execute their existing scripts sequentially in one Node process. This avoids another nested npm dependency chain. The aggregate rejects --record so historical stage status cannot be rewritten accidentally. All four checks and the npm aggregate passed. Existing W62/W67 tests remain the separate progressive-loading and rendered projection gates; this stage does not claim another full-site or paid-flow acceptance.

The 40 submitted definitions have passed source verification and remain pending consolidated semantic review and versioned import. Book II/III live registries therefore still contain null definitions; their checks correctly preserve that boundary. Human review is not inferred from a passing test. No registry, manuscript or frozen evidence was rewritten by W68. Next W69 Cross-Book Checker.

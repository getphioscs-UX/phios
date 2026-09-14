# W60 dedup engine

Implemented on main `7c57546`. Deployment success for the preceding repair was reported by the user; this stage does not attest a new deployment.

The engine evaluates 71 structured candidates / 2,485 pairs. Only 465 pairs have meaning text on both sides. Forty Book II/III candidates still lack meanings. Their identities and titles are checked, but semantic deduplication cannot be completed from titles alone.

The version-bound JSON report contains five pending findings:

| Book IV object pair | Evidence | Review question |
| --- | --- | --- |
| SK-B4-B4-P10-212 / SK-B4-B4-P10-214 | Identical article summary | Is the shared summary too broad for these distinct nodes? |
| SK-B4-B4-P10-215 / SK-B4-B4-P10-216 | Identical article summary | Is the shared summary too broad for these distinct nodes? |
| SK-B4-B4-P10-217 / SK-B4-B4-P10-219 | Identical article summary | Is the shared summary too broad for these distinct nodes? |
| SK-B4-B4-P10-222 / SK-B4-B4-P10-223 | Identical article summary | Is the shared summary too broad for these distinct nodes? |
| SK-B4-B4-P10-241 / SK-B4-B4-P10-242 | Identical article summary | Is the shared summary too broad for these distinct nodes? |

Every finding retains original title, meaning kind, source pointers, source hashes and manuscript references. Rebuild verifies source hashes and reconstructs the extraction candidates, rejecting drift. Finding IDs and pair ordering are deterministic.

Rules check normalized exact text under different IDs, title collisions with differing or missing meanings, cross-book overlap, lexical overlap, and article-derived duplicate candidates. Normalization only folds Unicode compatibility forms, case and whitespace. Punctuation and negation are retained. Character-bigram Jaccard ≥ 0.65 flags lexical review; this is not a semantic equivalence score. Shared article provenance alone does not create a duplicate finding.

Paraphrase equivalence and same-title semantic differences require human review. No finding authorizes a merge, deletion, conflict resolution or canonical writeback. No unreviewed conclusion is exposed through customer retrieval. W56–W59 and these five findings remain deferred for consolidated review. Next: W61 Conflict Registry.

Validation: `npm run check:b14-sks-dedup` and `node scripts/check-b14-sks-extraction.mjs`. Coverage includes exact-text duplicates, bilingual title collisions, cross-book candidates, article-summary reuse, null meanings, shared-article nonduplicates, negation, Chinese lexical overlap, deterministic ordering and duplicate-ID rejection.

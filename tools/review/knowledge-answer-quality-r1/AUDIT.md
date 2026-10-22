# Knowledge Retrieval & Answer Quality R1 — local candidate

Status: HUMAN_REVIEW / EVIDENCE_GAPS_OPEN. This is an Explicit Contract Version Upgrade candidate, not a production cutover. All pre-existing dirty files are protected by BASELINE.json. No original book/article, owner, freeze or historical receipt is rewritten.

## Gate 0: actual source chain

The baseline is HEAD `1c51e90c90554ace8d83759235d49bb9d4ef7f59`, main **plus** INITIAL-DIFF.patch and protected file hashes in BASELINE.json. HEAD alone does not identify the prior uncommitted World/RIC candidate. No remote/main or production runtime identity is claimed by this local audit.

| Owner | Verified behavior | Limitation |
|---|---|---|
| functions/_lib/kir-r2-intelligence.js | Keyword + profile expansion; canonical/node/article/profile classes | `hybrid` currently means source classes, not measured vector retrieval. Canonical rerank adds direct hits ×2, authority 1–4 and length specificity. Canonical coverage uses primary count. |
| functions/_lib/kir-r2-answer-intelligence.js | Content paragraphs, question-type lexical boost, authority boost, dedup, extractive composer | Content score adds authority 7/6/1, canonical boost, lexical, exact-title, type and kind. Retrieval tier precedes score. Two primary fragments imply STRONG irrespective of required propositions. Guard length ≥60, consumed chars ≥80, ≥3 sentences for causal/how and used-ID membership do not prove entailment. |
| functions/_lib/knowledge-answer-grounding.js | KAP routes source scope, public article resolver, private manuscript access, PTRC | Independent lexical anchors establish relevance, not causal support. Explicit scope must not silently count as answer sufficiency. |
| functions/_lib/ptrc-knowledge-quality.js | Source-policy filter; comparison dimensions and evidence classification | Lexical fraction, language, source state and scope influence score; coarse SIDE_A/SIDE_B/PRIMARY_QUESTION are not a full user-specific coverage map. |
| functions/_lib/knowledge-access-api.js | Existing manuscript metadata, source/corpus SHA, admission and published projection owner | No private corpus downloaded or activated in this run. Three current whole-chapter records remain NOT_ACTIVATED, including qualified Book III. Source acceptance does not grant whole-text answer authority. |
| functions/knowledge-runtime/manuscript-source-runtime.js | Bounded excerpts (4 results, 1200 chars each, 3600 total), parsed corpus cache, source-bound explanation units | Full stored original, materialized corpus and admitted bounded ranges differ. Existing R2 object verification is historical, not fresh runtime proof. |
| functions/contextual-ask/contextual-ask-runtime.js#resolveSelectedArticle | Five current publication manifests; receipt/hash checks for pending successors; article approved/published; canonical article URL preserved | This is a public article owner, not full eight-book admission. |
| scripts/lib/knowledge-public/published-retrieval-index-v1.mjs | Published authority → nodes, fragments, questions, aliases, relationships, manifests | Builder reviewed read-only, not rerun to rewrite production index. |
| functions/_lib/book-vii-published-admission.js | 20 Chinese fragments pass existing packet/fragment digest and explicit refresh authority | CURRENT_SOURCE_REFRESH_PENDING_HUMAN_REVIEW; new human acceptance remains null. No English counterpart inferred. |
| functions/_lib/atlas-retrieval-scope.js | Existing Book V/VI structured scope and Book VI provider boundary | No object presence promoted to factual evidence. Atlas scenario/time/metric evidence must retain its own scope. |
| functions/_lib/world-published-explanation.js | Existing World local mechanism packet and KAP/Ask article lookup | Prior packet handles bounded common mechanisms, not a general open-domain answer engine. Product files left unchanged this round. |

CORPUS-COVERAGE.json contains 16 book/language rows and exact manuscript registry records. 454 article locale versions yield 3813 paragraphs through the actual Ask owner; six article versions are not assigned to one of Book I–VI by that owner and remain unassigned. Book VII adds 20 Chinese fragments (3833 indexed units total). Book VIII manifest is retained as a manifest, not body evidence. Production readability is RUNTIME_UNVERIFIED for every row.

Old 100-case evidence is not discarded. The old correction checker passes; final W16R successor receipt records effective 100/100 after 93 initial accepts plus seven remediations, not a repeated full human review. OLD-100-AUDIT.json describes the expected-source injection limitation. OLD-100-REPLAY.json instead retrieves from the full local public corpus (existing scorer, bounded top20 before expensive legacy dedup). This replay is a new machine observation, not invalidation or replacement of historical accepted outputs.

## Gates 1–3: implemented and still missing

VERIFIED_LOCAL: ARGUMENT-INDEX.json preserves exact paragraph text, source/manifest identity, version/body and paragraph hashes, language, book/node and original anchor. It is a derived cache, not a new canonical registry. Accepted concept names from content/registry/concepts.json expand bilingual queries; source language remains separate. An offline BM25 sparse score adds term rarity and length normalization to 0.15 × the existing KIR score; it is explicitly not a semantic vector. An offline BM25 sparse score adds term rarity and length normalization to 0.15 × the existing KIR score; it is explicitly not a semantic vector. An offline BM25 sparse score adds term rarity and length normalization to 0.15 × the existing KIR score; it is explicitly not a semantic vector. An offline BM25 sparse score adds term rarity and length normalization to 0.15 × the existing KIR score; it is explicitly not a semantic vector. Argument types are heuristic hints and explicitly require review. Chapter hierarchy, conditions and exceptions are not fabricated: where the public projection does not supply them, they remain null or unannotated and the original paragraph remains available.

VERIFIED_LOCAL: functions/_lib/knowledge-answer-quality-local.js reuses KIR question/scorer and manuscript query terms, separates related reading from answer evidence, and maps version-bound reviewed support to required points. Background, contradictory, irrelevant or unverified material cannot accumulate into a complete answer. Packs are bounded to five sources/6000 characters; dropping an over-budget source reopens its missing requirements. This is an optional local adapter; no production owner has been replaced.

PARTIAL: question categories and required dimensions are deterministic. They are a review scaffold, not semantic understanding of every subclaim. Specific conjunction-delimited question parts are preserved, but not automatically proven. Human support annotations are required for corpus-wide direct evidence. The existing World ten-mechanism candidate is reused without turning its source mappings into authority over the rest of the books.

MISSING: genuine bilingual dense vectors, semantic cross-encoder/NLI reranking, verified exceptions/argument annotations for the full corpus, production source-refresh invalidation, whole-book chapter evidence and new human gold. No bag-of-words vector is mislabeled as semantic embedding. Raw phrase similarity is still used for reading ranking only.

## Gates 4–5: model and evaluation

The existing KIR gateway is exercised with a fetch test double. No provider secret is read and no external request occurs. The production admission flags remain separate from any local plan. COST-AND-MODEL.json specifies rate-card inputs and budget arithmetic, not invented current prices.

THRESHOLDS.json was fixed before candidate implementation. Original ten questions ×2 languages are unchanged. Additional 24 bilingual question pairs are Codex-authored unfamiliar candidates, not independent human blind gold. The user agreed to subsequent human annotation. The review UI lets the human inspect a question independently and download annotations; it does not autosave to an account or report unreviewed labels as accepted.

PAIRED-RESULTS.json contains 68 actual question runs: 29 use the existing bounded World mechanism candidate and 39 have only unverified reading. These counts are routing observations, **not answer correctness**. Recall@5, precision@5, subquestion coverage, accuracy, citation correctness and unsupported-answer rate remain null pending gold. There is no claimed complete-answer improvement yet. Severe hallucination/permission violation at general-answer scale also awaits human review; only specific machine invariants have passed.

## Gate 6 / exact continuation

Open http://127.0.0.1:59835 for a live local query and human annotation. Start command is in REVIEW.html. Existing World/RIC product owners and other windows' dirty bytes remain unchanged. Four representative screenshots and BROWSER-HTTP.json cover en/zh-Hans ×1440/390; this is a retrieval/answer workbench, not another World page.

Next: human annotates the 48 unfamiliar language-specific cases with correct passage locators, misleading paragraphs, required points and acceptable boundaries. A reviewed version-bound support map can then drive the local adapter and paired metrics without relaxing THRESHOLDS.json. Do not wire production, activate private sources or pay for embeddings/model calls until separately authorized. This candidate has **not** completed the whole Master Work's semantic retrieval and human quality acceptance requirements.

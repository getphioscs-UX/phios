import fs from 'node:fs';const d='tools/review/world-r3/gate2b/';
fs.writeFileSync(d+'WORLD-R3-KNOWLEDGE-AUDIT.md',`# Gate 2B · Existing knowledge audit
Status: VERIFIED local source inspection; production behavior RUNTIME_UNVERIFIED. Gate 1 acceptance unchanged.

| Capability | Result | Evidence / limitation |
|---|---|---|
| World catalogue | VERIFIED | assets/js/pages/civilization-atlas/world-experience-r2.js doSearch/sourceReadings: catalogue title/summary matching, not full-body paragraph search |
| Full published body | VERIFIED | world-published-reading.js fetches locale JSON, checks SHA, published/approved status, renders sections. Private manuscript is not embedded or authorized by this projection. |
| Search discovery | PARTIAL | assets/js/knowledge/public-discovery.js combines book4 discovery index, Book V/VI metadata and Atlas records; surfaces/knowledge.js searches searchText or title/summary/tags. This is not proof of a comprehensive passage index across all eight books. |
| Passage retrieval | VERIFIED | functions/contextual-ask/contextual-ask-runtime.js resolveSelectedArticle reads release manifests, admission receipts for candidates, locale, published/approved article and text sections. Six real source/locale resolutions PASS in ASK-SOURCE-RESOLUTION.json. |
| Locator | PARTIAL | Has section codes, sourcePositions and source PDF section/page metadata where recorded. Public article-body often shared by multiple paragraphs. Gate2B records exact JSON pointer plus document SHA; no invented paragraph anchors or physical PDF page claims. |
| Metadata | PARTIAL | Article publicHref, locale, version, publishedAt, taxonomy and provenance retained in REAL-SOURCE-MAPPING.json. publicSources can be empty; publication time is not observation time. Original external URLs absent in a source remain absent. |
| Ask handoff | PARTIAL | customer-contextual-ask.js validates selected article/sourceVersion and calls existing orchestrator; deterministic source retrieval explicitly reports providerCalls 0. World reader sends ARTICLE/BOOK ref through world-reading-context.js, not an automatically verified cross-source answer or full place/year/question bundle. |
| Figures / Atlas | PARTIAL | Sources retain relatedFigures and relatedAtlasEntries; oil article points to FIG_13E and Book VI cases/snapshots. Existing approved bindings remain authoritative. No new acceptance, current-data inference or remote decode proof from registry presence. |
| All books | PARTIAL | Eight-volume projection exists; public article manifest coverage is uneven. Published projections are usable; full private manuscripts, restricted materials and unpublished successors are not automatically admissible. |

Articles remains the canonical publishing and reading owner. World selects relevant passages from one or many articles, combines bounded explanations, and links back to canonical articles; it does not copy the publication corpus or require a new article for each question.

No product source edited. No existing accepted receipt rewritten. Source snippets in design are repository-owned public text, not new article publication.
`);
fs.writeFileSync(d+'WORLD-R3-ANSWER-CONTRACT.md',`# World Answer Contract · Gate 2B successor
Design candidate; Gate3 NOT_AUTHORIZED.

Classify each requested claim, not just the entire question:

| Class | Required evidence | Permitted answer |
|---|---|---|
| A mechanism | Admitted published passages supporting the causal/structural connection | Answer directly with attributed explanation, conditions, uncertainty. Optional region/year stays context, never becomes an empirical assertion. Missing B observations cannot suppress supported A. |
| B fact | Exact region, period, indicator definition, unit, revision, authority and retrieval time | Give verified value only when matched. Otherwise identify missing observation, retain any independently supported A explanation. |
| C comparison | Multiple admissible facts with compatible periods, units, populations and definitions | Compare aligned claims; identify unmatched dimensions. General mechanisms may be explained independently. No ranking from missing values. |
| D insufficient | No adequate admissible support for the requested claim | State exactly what cannot be answered; offer relevant available reading or a specific evidence request. No generic filler or unrelated fixed recommendations. |

Answer envelope: originalQuestion; normalizedIntent; selectedRegion/year/topic; claimType A/B/C/D; directAnswer; claim-level supports with sourceId, canonicalURL, locale, sourceVersion, SHA256, section/JSON pointer; evidenceKind (observed fact / published interpretation / conditional inference); applicability; missingInputs; retrievalState; meaningfulVisual; relevantFurtherReading; followUpContext. Empty sections omitted.

A quoted or paraphrased passage must actually support its linked claim. A source's publishedAt is not data vintage. A general theory is not proof of current conditions. A map locates; an explanatory diagram illustrates; neither supplies missing statistics. Unsupported subclaims are withheld without discarding supported subclaims.

Mixed oil question with Malaysia 2024: A explains transport/industry/logistics cost transmission; B remains UNKNOWN for local prices, subsidies and household incidence. No zero substitution. Unknown natural-language questions still show D in this curated prototype; this is not a deployed semantic engine.
`);
fs.writeFileSync(d+'WORLD-R3-GATE3-MINIMAL-PATH.md',`# Minimal Gate3 proposal · not implementation authorization
1. Keep World R2 map, URL state and current source/index owners. Extend existing question handoff with original question, region, year, topic, scale and explicit selected source/version references; no private context by default.
2. Reuse public-discovery for candidate discovery, then resolveSelectedArticle for admitted text. Add a passage-ranking adapter over these existing records, not a parallel content registry. Claim support must use the actual passage, not metadata alone.
3. Revalidate permission, locale, publication, accepted version/hash and claim applicability. A/B/C/D classification is per claim. Keep scope separately from data availability.
4. Reuse World answer presentation and Articles canonical links. Deterministic approved mechanism templates may combine verified passages with explicit interpretive labels. Local structured data gateway handles B only when definitions/year match. Unsupported details stay unknown.
5. Follow-up preserves the public question context and source versions through existing Ask contract; source drift requires re-resolution. No automatic submit, purchase, personal-data import or model call.

Zero-provider boundary: lexical/passage retrieval, source validation, curated bilingual mechanism explanations, exact supplied structured observations, deterministic aligned comparisons and navigation. This does not provide arbitrary novel causal synthesis or exhaustive multilingual semantic understanding.

Model option: only after separate approval of task, provider/model, data sent, input/output limits, per-call ceiling and total budget. Current authorized incremental budget USD0, calls 0. Before any model execution obtain current official price and compute inputTokens*inputRate + outputTokens*outputRate, enforce capped usage and retry policy. No speculative dollar price is presented as approved cost. Model output must cite admitted passages and fail unsupported claims; model use cannot manufacture facts.

Acceptance before Gate3: approve corrected direct answers and A/B/C/D contract; then separately authorize minimal product changes. Local prototype PASS is not production question-answer capability PASS. Regional/year empirical sources and remote figure display remain specific evidence gaps, not blockers to A mechanisms.
`);
let review=fs.readFileSync('tools/review/world-r3/WORLD-R3-HUMAN-REVIEW.html','utf8');const block=`<section style="padding:24px;border:2px solid #947344;margin:24px 0"><h2>Gate 2B · Answer-first correction / 先回答，再限定证据</h2><p>READY_FOR_HUMAN_REVIEW · Gate 1 ACCEPT 保持。Gate 2 全面答案设计未获接受；本次是纠偏 successor，Gate 3 未授权。</p><p>三道真实问题：<a href="gate2/WORLD-R3-PROTOTYPE.html?lang=zh-Hans&view=answer&id=oil&region=MYS&year=2024">石油与家庭</a> · <a href="gate2/WORLD-R3-PROTOTYPE.html?lang=zh-Hans&view=answer&id=cost">增长与家庭</a> · <a href="gate2/WORLD-R3-PROTOTYPE.html?lang=zh-Hans&view=answer&id=resources">资源与富裕</a>。页面内可切换 English；复用下方桌面/390px预览控制。展开每题“核对原文段落与相关图示”，阅读全文和真实来源位置。</p><p>General mechanisms remain answerable without local annual statistics. Published interpretation, conditional synthesis and missing observations stay separate. This is a curated offline design, not general semantic retrieval.</p><ul><li><a href="gate2b/WORLD-R3-KNOWLEDGE-AUDIT.md">现有知识能力审计</a></li><li><a href="gate2b/WORLD-R3-ANSWER-CONTRACT.md">四类答案契约</a></li><li><a href="gate2b/REAL-SOURCE-MAPPING.json">双语来源、原文、SHA、定位和图示</a></li><li><a href="gate2b/ASK-SOURCE-RESOLUTION.json">真实 Ask owner 六项读取验证</a></li><li><a href="gate2b/WORLD-R3-GATE3-MINIMAL-PATH.md">最小端到端及费用授权边界</a></li><li><a href="gate2b/VALIDATION.json">本轮浏览器验证</a></li></ul><p>无产品源码修改、无新文章、无 R2 删除、无 provider、无 D1 写入、无提交/推送/部署。下方旧 Gate 2 记录是历史设计，不代表本轮已获 Human ACCEPT。</p></section>`;
review=review.replace('<!-- WORLD_R3_GATE2_START -->',block+'<!-- WORLD_R3_GATE2_START -->');fs.writeFileSync('tools/review/world-r3/WORLD-R3-HUMAN-REVIEW.html',review);
console.log('Audit, contract, source mapping, minimal path and same review entry updated');

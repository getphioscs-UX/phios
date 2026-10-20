from pathlib import Path
import json
p=Path('tools/review/reality-information-contract-r1');h=p/'RIC-HUMAN-REVIEW.html';s=h.read_text(encoding='utf-8')
banner='''<section class="panel" id="ric-l1-review"><h2>R3-L1 · 真实本地会话交接 / Local product chain</h2><p>R2 已获 Human ACCEPT：仅本地参考候选。R3-L1 等待人审；未进入生产或持久化。</p><p><a href="http://127.0.0.1:59832/L1/PRODUCT-LOCAL.html?locale=zh-Hans">打开中文真实产品链路</a> · <a href="http://127.0.0.1:59832/L1/PRODUCT-LOCAL.html?locale=en">Open English product chain</a></p><p>启动：node --import ./scripts/lib/pages-json-import-preload.mjs tools/review/reality-information-contract-r1/L1/server.mjs --serve</p><ul><li><a href="L1/HTTP-EVIDENCE.json">真实 HTTP 与字段保真</a></li><li><a href="L1/BROWSER-EVIDENCE.json">四视口真实浏览器验收</a></li><li><a href="L1/OWNER-AND-LIMITS.md">源码 owner、边界和缺口</a></li><li><a href="L1/CHECKPOINT.json">当前 checkpoint</a></li><li><a href="L1/DELIVERY-MANIFEST.json">本轮实际文件摘要</a></li><li><a href="L1/product-zh-Hans-1440.png">中文桌面</a> · <a href="L1/product-zh-Hans-390.png">中文手机</a> · <a href="L1/product-en-1440.png">English desktop</a> · <a href="L1/product-en-390.png">English mobile</a></li></ul><p>以下保留 R0–R2 参考候选。新链路复用 World、Ask 的来源投影、RDG 与 My Reality；没有调用 Ask 模型或建立关系历史。</p></section>'''
if 'id="ric-l1-review"' not in s:h.write_bytes(s.replace('<nav aria-label=',banner+'<nav aria-label=',1).encode('utf-8'))
if not (p/'L1/accepted-r2-master-state.json').exists():(p/'L1/accepted-r2-master-state.json').write_bytes((p/'RIC-MASTER-STATE.json').read_bytes())
(p/'L1/OWNER-AND-LIMITS.md').write_text('''# RIC R3-L1 local product integration

Human ACCEPT R0–R2 applies only to the accepted local reference candidate. Current L1 is a new local review candidate; neither acceptance authorizes production or persistence.

## Source/owner matrix

| Path | Owner / role | Change | Conflict handling |
|---|---|---|---|
| functions/api/world-observations.js | Existing public observation endpoint | READ ONLY; real HTTP requests | Hash-bound; no overwrite |
| functions/_lib/world-evidence.js + content/world/*.json | Existing evidence validation/calculation | READ ONLY | Existing sources preserved |
| assets/js/pages/civilization-atlas/world-reading-context.js | World planner/query/answer | READ ONLY consumer | World parallel work protected |
| functions/_lib/knowledge-reality-handoff.js | Ask source-reference projection | READ ONLY projectKnowledgeGroundingForHandoff | No persistent Journey consent used |
| scripts/lib/reality-data-governance/rdg-access-rights-v1.mjs | Canonical RDG visibility/data permission | READ ONLY evaluateVisibility/evaluateDataPermission | No new permission issuer or consent token |
| functions/customer-projection/my-reality-workspace-projection.js | Existing My Reality workspace | READ ONLY; externalEvidence preserves rich objects | No string-only provenance projection |
| functions/customer-projection/reality-navigation-graph-projection.js | Existing Graph owner | READ ONLY | Edges empty; G3 NO_VERIFIED_HISTORY |
| functions/customer-projection/ric-world-session.js | New thin consumer of the above + accepted RIC | NEW opt-in module | No production route registration |
| assets/customer-ui/js/surfaces/ric-world-session-panel.js | New opt-in local product panel | NEW browser module | No World/BaZi/Finance page edits |
| tools/review/reality-information-contract-r1/L1/* | Local transport, tests and evidence | NEW | No deployed API/configuration |
| RIC-HUMAN-REVIEW.html / RIC-MASTER-STATE.json | Existing unique review/current checkpoint | APPEND SUCCESSOR | Accepted R2 originals and manifest preserved in L1 |

## Actual request chain

The product panel POSTs a public question in the body to the local transport. answerWorldSession calls the existing World planner and queryWorldEvidence, which makes a real GET to the existing /api/world-observations handler. Its pinned owner validates source identities and derives the HMDA action3/(action1+action2+action3) result. composeWorldAnswer supplies the direct bounded bilingual answer. RIC admits each observation and the separate derived calculation. The Ask owner's reference-only projection is invoked; there is no model call or new Ask engine. Explicit item selection and explicit consent then pass the existing RDG visibility/permission evaluator before the existing My Reality workspace receives source-rich items.

The derived conclusion carries all three input sources; a raw observation carries only its own source, not a detached full calculation. Source ID/version, original fragment/URL, observation/publication/retrieval times, jurisdiction, definition, population, unit/frequency, nature, permissions, limitations and unknowns remain attached. Null publication dates remain null. HTTP-EVIDENCE.json compares source objects before/after without metadata projection loss.

## Permission and identity boundaries

Public read is separate from question processing, session selection/use, saving and later reuse. Defaults are no selection and no consent. Selection requires current answer IDs/version, explicit acceptance, RUNTIME_CONTINUITY purpose, matching current session subject, non-expired and non-revoked state. The adapter enforces these preconditions then calls existing RDG; it does not issue a grant/token. The local HTTP-only SameSite session cookie is a transport isolation key, not an account, consent token or production credential. Two browser sessions and two HTTP clients are isolated. No real account authentication or cross-account data reading is claimed.

Session state is memory-only in the localhost harness, with a ten-minute default expiry and no localStorage, sessionStorage, filesystem or database persistence. Refresh/back can reread the same selected version in that live session, but revocation/expiry/source invalidation makes later reads empty. Fresh source checks run before existing selections are rendered. Asking a new question revokes the prior session use before querying; failed answers do not silently reuse it. A server restart drops all sessions. No public URL/log/screenshot contains private customer data or transport-cookie values.

## Proven version and error coverage

Real pinned HMDA 2024 and 2025 artifacts have different source versions and scopes. Replacing the question/scope invalidates prior selection; replaying old IDs/version is rejected. Substituting the real 2025 response into a 2024 recheck also fails identity/period validation. This is a real source/scope replacement test, NOT evidence of a same-period publisher revision, a customer's changed circumstances, an action or a canonical historical event. No such real revision/history owner was available, so no revision/outcome is invented. Errors include real missing period and injected HTTP/transport failure, explicitly labeled as injection.

## Real limits / next stage

This completes an opt-in local module/HTTP/product-panel chain. The official World page, production Ask route and authenticated My Reality page are not globally wired; they remain protected. The accepted RIC module is imported from its review directory only by this isolated candidate, so production promotion would require separately reviewed canonical placement and route admission. Persistent saving, true account entitlement, professional sharing, relationship edges, verified history, migration and production runtime remain NOT_IMPLEMENTED / NOT_EXERCISED. Ask reuse is the existing source-reference projection, not paid synthesis. General free-text coverage remains the existing bounded World planner; missing evidence produces no selected facts. No new database, account, permission engine or Reality graph owner is created.

## Commands

- R2 before product edits: node --test tools/review/reality-information-contract-r1/tests/ric.test.mjs — 47/47, exit 0. Its generated result was restored byte-for-byte to its accepted hash; rerun receipt is separate.
- Local HTTP: node --import ./scripts/lib/pages-json-import-preload.mjs --test tools/review/reality-information-contract-r1/L1/integration.test.mjs
- Browser: node --import ./scripts/lib/pages-json-import-preload.mjs tools/review/reality-information-contract-r1/L1/browser.mjs
- Preview: node --import ./scripts/lib/pages-json-import-preload.mjs tools/review/reality-information-contract-r1/L1/server.mjs --serve

Only four representative L1 screenshots are retained, alongside the unchanged accepted R2 set. No cleanup/deletion performed. Provider cost, real payments, production D1/R2 writes, commit, push and deploy remain zero for this task. Production isolation/runtime status is RUNTIME_UNVERIFIED.
''',encoding='utf-8')

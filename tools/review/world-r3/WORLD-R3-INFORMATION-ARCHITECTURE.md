# WORLD-R3-INFORMATION-ARCHITECTURE

BLOCKED — Gate 2 design not yet submitted/accepted. This is an audit handover, not an implemented IA.

Existing: one globalSearch, three modes current/history/compare, folded question presets, shared public state, older source tools in details. Reuse these, rather than a second World page/ledger. Audit identifies current duplication: source search, case search and book/figure discovery serve different scopes but lack prioritisation; duplicated exploration actions and first-screen selectors precede reading on390px.

Gate 2 required decisions: six ordinary-life question groups; one initial country/place/topic/question input; when to show country/year refinement; answer versus catalogue distinction; contextual evidence/interpretation/compare/follow-up; no-book-first hierarchy; bounded World×Me. Design must resolve missing-topic-data behavior and not invent answers.

## Concurrent-owner evidence boundary

并行工作区补充：审计期间其他窗口推进首页／Ask入口。shell.js 与 contextual-ask.js 的 ENTRY 路由由POST改为GET；相关首页、client-intent路由与customer-entry-r1文件正在修改。本轮未修改它们，也未提交Ask/意图路由；该分支保持PARTIAL／NOT_EXERCISED。可复用候选包括assets/js/customer-entry-topic-map.js、functions/public/client-intent-router.js、content/web/index-surfaces/customer-entry-home-successor-r1.json，须待其owner稳定后核对，不能提前宣布生产接通。浏览器记录是共享工作树现场观察，并非整个repo的隔离快照；World核心源码未被本轮改写。全局git diff --check的client-intent-route.js尾随空白来自并行窗口，未代修。

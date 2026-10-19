# WORLD-R3-CAPABILITY-AUDIT

Gate 1 — SUBMITTED_FOR_HUMAN_REVIEW. Audit conclusions are bounded to local main 510eee069a19a04d31acd6e7d71a201dac83cfb3; actual deployed/latest remote parity BLOCKED. 2026-10-20 (Asia/Kuala_Lumpur).

| ID | 能力 | 能力状态 | 证据状态 | 发现 | 代码 | 验证 |
|---|---|---|---|---|---|---|
| A01 | 地图与地区 | EXISTING | VERIFIED | 176个选择范围、国家选择、地图缩放及键盘路径已有；底图版本不是现行边界证明，更不是主题热力层。 | assets/js/pages/civilization-atlas/world-experience-r2.js:104; content/civilization-atlas/geography/world-selection-geometry-r2.json | 4组浏览器counts.geography=176，MYS选择恢复；未逐一地理核验 |
| A02 | 主题、年份与三种尺度 | EXISTING | VERIFIED | current/history/compare与主题、年份、baseline已有。城市细粒度仍未接通。 | assets/js/pages/civilization-atlas/world-experience-r2.js:158 | 4组切换尺度、刷新与返回保留MYS/topic；完整所有字段组合未穷举 |
| A03 | 自由问题连续性 | PARTIAL | VERIFIED | 自定义问题在内存；saveHash不含customQuestion/searchText，刷新后搜索框为空。 | assets/js/pages/civilization-atlas/world-experience-r2.js:162-165 | 4/4 afterRefresh.query为空；同问题并未完整恢复 |
| A04 | 世界问题的直接答案 | MISSING | MISSING | doSearch只按字符串匹配地区、主题、案例、图号及标题摘要；搜索结果明确不是回答。没有统一World Answer对象。 | assets/js/pages/civilization-atlas/world-experience-r2.js:164-165 | 40次观察；不能以结果链接数量或build替代回答验收 |
| A05 | 主题解释检索 | PARTIAL | VERIFIED | 235条published-reading；按主题关键词和人工lead排序前4，非问题语义／段落检索。 | assets/js/pages/civilization-atlas/world-experience-r2.js:63; assets/js/pages/civilization-atlas/world-published-reading.js | 40次均观察解释链接，未逐条证明回答相关性 |
| A06 | 八册连接 | PARTIAL | VERIFIED | 正式projection有8册路由；R2 VOL和renderBooks只到6，43张匹配图，外层八册图示目录另行存在。 | assets/js/pages/civilization-atlas/world-r2-inputs.js:12-20; assets/js/pages/civilization-atlas/world-experience-r2.js:131; assets/js/knowledge/eight-volume-summary-catalog.js | 8路由registry已读；R2六册入口与八册外层目录不能混同为统一检索 |
| A07 | Ask入口和手动提交 | EXISTING | VERIFIED | 同源postMessage带入问题INPUT_ONLY，接收端存在；不自动提交或给予会员权限。 | assets/js/entry-context-handoff.js:2-43; assets/customer-ui/js/shell.js:2-3 | 4组真实弹窗接收问题；API执行阻断，无生成证明 |
| A08 | Ask地区／主题／年份／来源上下文 | PARTIAL | VERIFIED | 历史对象scope可带case/time；R2当前模式只构造BOOK-6/dossiers，未映射当前region/topic/year；askURL还裁剪hash。 | assets/js/pages/civilization-atlas/world-experience-r2.js:274; assets/js/pages/civilization-atlas/world-reading-context.js:11-26 | 4组Ask URL无所选MYS/2026/topic字段。原问题刷新后已丢，接收的是默认主题问题 |
| A09 | 年度权威公共数值 | PARTIAL | VERIFIED | 只接World Bank人口和现价GDP；精确年份、国家身份、单位、缺值及来源更新时间显式处理。无自动最新年份回退。 | functions/_lib/world-bank-observations.js:3-15; functions/api/world-observations.js:1-3 | 代码验证；本轮未请求真实数值，无实时可用性证明 |
| A10 | 专题／家庭分布统计 | MISSING | MISSING | CPI、实际工资、家庭分布、产业增加值／就业、油价、年龄结构、物流、水电等未有R2指标适配。国家GDP和人口仅作背景。 | content/production-closure/world-content-convergence-20261019/topic-data-coverage.json; assets/js/pages/civilization-atlas/world-experience-r2.js:115 | 既有覆盖报告与当前INDICATORS交叉一致；不是来源不存在 |
| A11 | 比较可比性 | PARTIAL | VERIFIED | 同指标／年份、单位显示；不产地区总分。缺少产业等指标的定义版本、覆盖群体、价格基期及频率可比性契约。 | assets/js/pages/civilization-atlas/world-experience-r2.js:115; functions/_lib/world-bank-observations.js | 现有2指标同年结构存在；复杂比较尚未验收 |
| A12 | 接受来源与时效 | PARTIAL | VERIFIED | 按acceptedPosition证据引用投影当前陈述；acceptance不等于freshness，原文和sourceTimestamp分开。没有全站自动同步承诺。 | assets/js/pages/civilization-atlas/world-current-claims.js:4-10; assets/js/pages/world.js:29-31 | 11个admitted-current-evidence索引对象，不代表全地区／全专题可回答 |
| A13 | Atlas视觉复用 | EXISTING | VERIFIED | 已接受binding392项：BOOK-5 380、BOOK-6 12；含bucketKey、公开URL、subjectId、review证据、无历史事实权威。 | content/civilization-atlas/visuals/civilization-visual-approved-bindings-v2.json; assets/js/pages/civilization-atlas/atlas-data.js | registry计数和R2加载计数一致；本轮未列举bucket或逐图decode，当前对象在线状态PARTIAL |
| A14 | 六种普通问题首屏 | PARTIAL | VERIFIED | R2已有生活问题折叠预设、标题、单搜索、三尺度。尚非用户要求的六组优先问题；首屏有地区、主题、重复探索按钮和其他入口。 | assets/js/pages/civilization-atlas/world-experience-r2.js:103-108,212-225; world/index.html | 4张首屏截图已查看；390px地图/正文在900px折线下，无横向溢出不等于密度验收 |
| A15 | 固定无关导读 | PARTIAL | VERIFIED | 贸易城市、企业运行、化验记录三链接无条件附加。主题四条解释也不随未命中问题自动重新定题。 | assets/js/pages/civilization-atlas/world-guided-readings.js:5; assets/js/pages/civilization-atlas/world-experience-r2.js:142 | 40/40观察有相同三导读；不是每个链接均已证明相关 |
| A16 | World与我／Profile／PHI Configuration | PARTIAL | VERIFIED | 现有正式路由、手动摘录、明确分类同意、内存清除、上下文改变后重新确认；未自动读账户个人结果。 | assets/js/pages/civilization-atlas/world-experience-r2.js:147-155; assets/customer-ui/js/surfaces/profile-progressive.js; perspectives/phi-configuration/index.html | 代码与既有r2-browser-evidence交叉；当前审计不创建私人资料 |
| A17 | Search与首页入口复用 | PARTIAL | VERIFIED | 当前/search实际挂载customer-ui knowledge.js，复用discovery/structured索引；search-v2.js不是该页当前挂载。entry-context-handoff可复用输入边界。 | search/index.html:26-28; assets/customer-ui/js/surfaces/knowledge.js:106-118; assets/js/entry-context-handoff.js | 入口脚本已查；未把未挂载旧脚本计为当前能力 |
| A18 | 中英与a11y | PARTIAL | VERIFIED | 双语shell、tab/键盘、地图键盘、reduced-motion、live region、skip已有。四视图无pageerror/横向溢出。图内语言和所有案例正文未逐项核对。 | assets/js/pages/civilization-atlas/world-experience-r2.js:299; assets/css/world-experience-r2.css; world/index.html | 1440/390×中英本地浏览器，不代替屏幕阅读器或逐图语言验收 |
| A19 | 线上及最新GitHub main身份 | BLOCKED | BLOCKED | 本地main与缓存origin/main均510eee…；实际远程ls-remote DNS失败，网页读取亦失败。不能证明线上等于本地或缓存为最新。 | GATE1-AUDIT-STATE.json | 网站web读取不可达；GitHub cache miss；git ls-remote Could not resolve host |
| A20 | R3答案检索/生成许可 | MISSING | MISSING | Ask已有受控检索／资格／provider边界，可复用；没有证据证明当前R2已执行十问题答案检索生成。 | functions/api/customer-contextual-ask.js:37; functions/api/ask-phios-consumption.js:95-107 | 全程API执行阻断，零模型调用；不能将无调用说成回答PASS |

## Priority findings

1. 原问题未持久化；范围状态不是问题状态。2. R2当前Ask scope丢地区/主题/年份；接收端INPUT_ONLY已接通，不需重建Ask。3. 无问题级答案契约/证据检索，十问题均不能宣称答案PASS。4. 固定三跨域导读需按相关性约束。5. R2六册主入口与现有八册所有权不一致，复用现有八册projection。6. 只人口/GDP，不将书稿解释或图像当作实时专题证明。7. 原R2导航密度与手机首屏深度待设计关卡收敛。

## Reuse / authority

Keep current atlas-data owners, accepted visual binding registry, world-search index, world-published-reading and source authority checks; existing three-mode state, public observation adapter and private/provenance consent boundaries. Search actual owner is assets/customer-ui/js/surfaces/knowledge.js. Existing worldAskContext/askURL and entry-context-handoff should be repaired, not replaced by a second identity or provider path. GOVERNANCE.md and content/registry/master-governance.json read; no applicable AGENTS found in repository/ancestors.

Gate 2 design must show six question groups, one search and conditional answer sections with three complete representative pages. These do not exist as R3 prototypes in this Gate 1 package. Gate 3 is not authorized before design acceptance. No product source modified.

## Concurrent-owner evidence boundary

并行工作区补充：审计期间其他窗口推进首页／Ask入口。shell.js 与 contextual-ask.js 的 ENTRY 路由由POST改为GET；相关首页、client-intent路由与customer-entry-r1文件正在修改。本轮未修改它们，也未提交Ask/意图路由；该分支保持PARTIAL／NOT_EXERCISED。可复用候选包括assets/js/customer-entry-topic-map.js、functions/public/client-intent-router.js、content/web/index-surfaces/customer-entry-home-successor-r1.json，须待其owner稳定后核对，不能提前宣布生产接通。浏览器记录是共享工作树现场观察，并非整个repo的隔离快照；World核心源码未被本轮改写。全局git diff --check的client-intent-route.js尾随空白来自并行窗口，未代修。

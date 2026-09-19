# R2 原始 260 项核查与中断续作结果

原始执行基线：`c6983b07b643d982512731a640717fb80ecbb0ea`（main，起始干净且当时与 origin/main 一致）。续作／结束 HEAD：`dc427746f91efd7d3680db617493bbe74caac7c5`，分支 `main`。用户在中断期间提交了 dc427746；本轮没有 commit、push、部署、R2 写入或 ZIP。当前工作树修改见末尾。

## 结果边界

260 项全部得到终态分类，原始编号、key、公开链接、用途、原登记页面和引用列哈希完全保留。177 项有客户页面／正式交互 renderer／浏览器图标证据；72 项有非当前必需展示的处置依据；11 项因冻结 PHI 映射阻塞。检查器 PASS 表示证据及处置完整，不表示 260 张都展示或线上已部署。

## 精确 before / after

| 原始状态 | 数量 |
|---|---:|
| 浏览器图标链接已引用 | 2 |
| 所查页面未观察到 | 105 |
| 已在本地页面显示并解码 | 26 |
| 交互／报告流程待确认 | 127 |

| 终态 | 数量 |
|---|---:|
| BROWSER_ICON_ACTIVE | 2 |
| CONTEXTUAL_VARIANT_NOT_REQUIRED | 8 |
| DISPLAYED_ON_ACTIVE_SURFACE | 20 |
| DISPLAYED_CONDITIONALLY | 39 |
| LEGACY_ROUTE_ONLY | 4 |
| RETIRED_SURFACE_REFERENCE | 10 |
| HISTORICAL_REGISTRY_ONLY | 12 |
| INTENTIONALLY_NON_RENDERED_ASSET | 38 |
| INTERACTIVE_FLOW_DISPLAYED | 116 |
| EXTERNAL_FLOW_BLOCKED | 11 |

## 实际浏览器证据

- 静态：23 个现有路由 × 390/1440 × zh-Hans/en，92 个视图；展开合法说明区、滚动触发 lazy-load、检查 attached/visible/decode/natural size/box size/object key。无横向溢出。
- PHI：512 个激活扇区中点探查，选择 10 个覆盖见证，经已有确定性 QA anchor → accepted meaning → 正式 product assembly → 客户页 specialist renderer；40 个视图覆盖 37/48 张，每张四种组合。没有把任意 cardId 或 URL 强塞进 UI；此证据不替代线上天文 API／出生资料入口验证。
- Tarot：实际提问、选择三张牌阵、等待原有 120 秒洗牌、选牌及重新选牌、读取正式 runtime 输出。104 次执行覆盖 78 张牌面与 1 张 CSS 牌背，合计 316 条观察。授权状态使用本地测试 transport，牌义、选牌、资产解析与 renderer 使用正式代码；不冒充线上 provider 测试。
- 非展示：4 项旧 HTML 路由已转向新页面；10 项旧呈现或明确 deferred；12 项只有登记没有现用挂载；38 个旧图标 rail/signature 被 PXR CSS 明确隐藏；8 个品牌变体在当前背景／布局不需要。保留文件与用途，不恢复旧页面或装饰栏。

## 11 张 PHI 的逐项阻塞

| 原编号 | 卡 | 原始 object key | 当前规则为何无法选中 |
|---:|---|---|---|
| 138 | ECR-PC-C05 | `images/phi-cards/phi-card-c05-expansion-v1.webp` | G7/G9/G15 与对应 Q 的得分平分，较小卡号 C04/C01 胜出。 |
| 139 | ECR-PC-C06 | `images/phi-cards/phi-card-c06-reconfiguration-v1.webp` | G14、Q4、Q13 的对应规则分别与 C03/C04/C03 平分，较小卡号胜出。 |
| 141 | ECR-PC-C08 | `images/phi-cards/phi-card-c08-orientation-v1.webp` | G10、Q5、Q8 的对应规则与 C04/C01/C07 平分，较小卡号胜出。 |
| 142 | ECR-PC-D01 | `images/phi-cards/phi-card-d01-seeking-v1.webp` | D3 单项映射 D01；相邻 D2、D4 都映射 D08，合并权重压过 D3。75° 中心也因 9 位小数舍入而落后。 |
| 152 | ECR-PC-F03 | `images/phi-cards/phi-card-f03-collaboration-v1.webp` | FIELD 的 motionCodeToCard 与 configurationCodeToCard 均没有 F03。 |
| 161 | ECR-PC-G04 | `images/phi-cards/phi-card-g04-express-v1.webp` | R3 只在 Q1/Q9 作为辅助能力出现，权重 1；主能力 R2/R7 权重 2，G04 无法胜出。 |
| 175 | ECR-PC-T02 | `images/phi-cards/phi-card-t02-pull-v1.webp` | 近似双驱动规则权重 3；全部 12 个 driver 包含 D9，使 T07 始终有权重 4。 |
| 176 | ECR-PC-T03 | `images/phi-cards/phi-card-t03-stall-v1.webp` | G2/M6 与 A1/A2 条件权重 3，被始终满足的 D9→T07 权重 4 覆盖。 |
| 177 | ECR-PC-T04 | `images/phi-cards/phi-card-t04-dispersion-v1.webp` | 前四驱动接近规则权重 2，被 D9→T07 权重 4 覆盖。 |
| 178 | ECR-PC-T05 | `images/phi-cards/phi-card-t05-compression-v1.webp` | G2/M1 条件权重 2，被 D9→T07 权重 4 覆盖。 |
| 179 | ECR-PC-T06 | `images/phi-cards/phi-card-t06-loop-v1.webp` | G12/G16 条件权重 2，被 D9→T07 权重 4 覆盖。 |

这些是冻结的语义／呈现映射依赖，不是 R2 缺图、登录或付款问题。解决需要方法 authority 的合法 successor 明确：平分优先级、驱动聚合语义、D9 条件究竟指全部存在还是当前主导、R3/F03 的适用构型；或者提供当前规则下可复现的合法接受态见证。当前视觉审计不擅自改变这些语义。每行机器证据包含精确矩阵、selector、calculation/spec 路径。11 张未记为展示 PASS。

## 第一册与 4E

第一册原 key `images/figures/books/book-1/4E.webp` 已验证 HTTP 200、有效 WebP，登记恢复。12/12 总结图在四种组合均可见、解码、尺寸非零；客户页显示所有者确认的 **407 页**。旧版 402 页手稿提取与冻结记录仍对应历史 PDF，未篡改其引文页码，也未宣称重新校验当前完整 PDF。旧回归检查已从 11 张＋4E 缺失改为 12 张。

## 第五册附件是否完成

**尚未达到 W16 PRODUCTION_ADMITTED。** 当前已有 42 篇文章 × 双语、126 节目录、176 条知识关系、Search／Ask／Atlas 导航；聚合检查重新 PASS。W15 的文章语义、双语与体验人工审核仍待用户决定，实际生产模型回答尚未验证。本次 229 张 Atlas 授权不会被重新加人工关卡，也不被扩大解释成全部文章内容已接受。

视觉旧统计已修正：现用绑定 `content/civilization-atlas/visuals/civilization-visual-approved-bindings-v2.json` 有 392 项，全部可解析；其中 BOOK-5 380 项、BOOK-6 关联 12 项。15 个代表家族真实图片请求 PASS，31/31 文章实际引用图片请求 PASS。旧“218 项未解析”来自审计仍用 v1 绑定、且只按 timeline/cases 选择条件检查其他家族，已消除这个审计错误。

## 修改原因与验证

| 位置 | 原因 | 修正 |
|---|---|---|
| scripts/audit-book-v-pka-r1-visuals.mjs | 旧绑定＋错误家族选择造成过时未解析统计 | 复用 ATLAS_VISUAL_BINDINGS_PATH 和 resolveAtlasVisualById，保留历史 registry，纳入已存在合法绑定 successor |
| assets/js/knowledge/book-public-samples.js、book-public-samples-v1.json | 当前出版页数未记录；旧 4E 缺失状态 | 显示所有者确认的 407 页，4E 可用，12 张真实图片回归 |
| R2-260-DISPLAY-CHECKLIST.csv/html | 105 NOT_OBSERVED＋127 交互待确认 | 保留身份列，仅更新状态／实际页面；证据、阻塞与历史处置可筛选 |
| scripts/check-r2-260-display.mjs | 原无最终证据完整性门禁 | 冻结哈希、终态集合、四组合、实际客户路由、原 key、解码尺寸、源文件摘要校验；保留 npm alias 兼容 |
| 核查脚本 | lazy 图片在滚动前尺寸为零；旧 CSS 牌背 selector 记录不准 | 先滚动容器与解码；牌背证据指向实际 .cx-tarot-card-back 所有者 |

## 执行检查

| 命令／验证 | 结果 |
|---|---|
| `npm run check:pages-build` | PASS (exit 0) |
| `npm run check:r2-260-display` | PASS (exit 0) |
| `npm run check:package-aliases` | PASS (exit 0) |
| `node scripts/check-book-one-summary-browser.mjs` | PASS: 12/12 figures and 407 publication pages in all four combinations (exit 0) |
| `node scripts/check-book-v-pka-r1.mjs` | PASS: current existing Book V publication aggregate; no live provider claim (exit 0) |
| `node scripts/audit-book-v-pka-r1-visuals.mjs --remote` | PASS: 392 resolved, 15 representative families, 31 article objects (exit 0) |
| `node .tmp/check-r2-review-pages.mjs` | PASS: 390/1440 review UI, 260 rows, 11-item filter, evidence links, current Book 1 / Book V notices (exit 0) |
| `npm run check` | PASS: precheck + check + postcheck, final working tree (exit 0) |
| `git diff --check` | PASS (exit 0) |

首次 Pages 构建在沙箱中启动 Wrangler 子进程遇到 EPERM；允许启动后已重跑通过。这不是代码检查豁免。完整 npm 链包含 precheck/check/postcheck；未删除、跳过或放宽既有检查。

## 交付入口

- [原 260 项核查 HTML](R2-260-DISPLAY-CHECKLIST.html)
- [原 260 项 CSV](R2-260-DISPLAY-CHECKLIST.csv)
- [机器证据](../../../content/web-production/client-visual-consumption/evidence/r2-260-display-browser-verification-v2.json)
- [第五册真实人工审核](../../../tools/review/BOOK-V-PKA-R1-HUMAN-REVIEW.html)
- [第五册当前状态](../../../content/books/book-5/maintenance/book-v-pka-r1-current-status-v2.json)

## 完整 changed files（自原始基线，含用户中途已提交的续作文件）

- `assets/js/knowledge/book-public-samples.js`
- `content/books/book-5/maintenance/book-v-pka-r1-current-status-v2.json`
- `content/books/book-5/maintenance/visual-reconciliation-v1.json`
- `content/web-production/client-visual-consumption/evidence/r2-260-consumer-trace-v2.json`
- `content/web-production/client-visual-consumption/evidence/r2-260-display-browser-verification-v2.json`
- `content/web-production/client-visual-consumption/evidence/r2-260-phi-browser-v2.json`
- `content/web-production/client-visual-consumption/evidence/r2-260-phi-reachability-v2.json`
- `content/web-production/client-visual-consumption/evidence/r2-260-predecessor-freeze-v1.json`
- `content/web-production/client-visual-consumption/evidence/r2-260-static-browser-v2.json`
- `content/web-production/client-visual-consumption/evidence/r2-260-tarot-browser-v2.json`
- `content/web-production/registries/book-public-samples-v1.json`
- `docs/assets/r2-public/R2-260-DISPLAY-CHECKLIST.csv`
- `docs/assets/r2-public/R2-260-DISPLAY-CHECKLIST.html`
- `docs/assets/r2-public/R2-260-VERIFICATION-REPORT.md`
- `docs/assets/r2-public/R2-ALL-VISUAL-ASSETS-REVIEW.html`
- `docs/assets/r2-public/book-one-4e-verification-v1.json`
- `docs/assets/r2-public/book-one-summary-browser-v2.json`
- `docs/assets/r2-public/r2-260-final-checks-v2.json`
- `docs/assets/r2-public/r2-image-http-audit-2026-09-19.json`
- `docs/assets/r2-public/r2-usage-coverage-2026-09-19.json`
- `package.json`
- `scripts/audit-book-v-pka-r1-visuals.mjs`
- `scripts/audit-r2-260-phi-v2.mjs`
- `scripts/audit-r2-260-static-v2.mjs`
- `scripts/audit-r2-260-tarot-v2.mjs`
- `scripts/build-book-v-pka-r1-review.mjs`
- `scripts/build-r2-260-verification-v2.mjs`
- `scripts/build-r2-usage-review.mjs`
- `scripts/check-book-one-summary-browser.mjs`
- `scripts/check-r2-260-display.mjs`
- `scripts/check-r2-usage-browser.mjs`
- `scripts/freeze-r2-260-predecessor.mjs`
- `scripts/lib/r2-260-evidence.mjs`
- `scripts/probe-r2-260-phi-reachability.mjs`
- `scripts/trace-r2-260-consumers-v2.mjs`
- `scripts/verify-book-one-4e.mjs`
- `tools/review/BOOK-V-PKA-R1-HUMAN-DECISION.json`
- `tools/review/BOOK-V-PKA-R1-HUMAN-REVIEW.html`

## 当前未提交的 working tree 文件

- `assets/js/knowledge/book-public-samples.js`
- `content/books/book-5/maintenance/book-v-pka-r1-current-status-v2.json`
- `content/books/book-5/maintenance/visual-reconciliation-v1.json`
- `content/web-production/client-visual-consumption/evidence/r2-260-display-browser-verification-v2.json`
- `content/web-production/client-visual-consumption/evidence/r2-260-static-browser-v2.json`
- `content/web-production/client-visual-consumption/evidence/r2-260-tarot-browser-v2.json`
- `content/web-production/registries/book-public-samples-v1.json`
- `docs/assets/r2-public/R2-260-DISPLAY-CHECKLIST.csv`
- `docs/assets/r2-public/R2-260-DISPLAY-CHECKLIST.html`
- `docs/assets/r2-public/R2-260-VERIFICATION-REPORT.md`
- `docs/assets/r2-public/R2-ALL-VISUAL-ASSETS-REVIEW.html`
- `docs/assets/r2-public/book-one-summary-browser-v2.json`
- `docs/assets/r2-public/r2-260-final-checks-v2.json`
- `docs/assets/r2-public/r2-usage-coverage-2026-09-19.json`
- `scripts/audit-book-v-pka-r1-visuals.mjs`
- `scripts/audit-r2-260-static-v2.mjs`
- `scripts/audit-r2-260-tarot-v2.mjs`
- `scripts/build-book-v-pka-r1-review.mjs`
- `scripts/build-r2-260-verification-v2.mjs`
- `scripts/build-r2-usage-review.mjs`
- `scripts/check-book-one-summary-browser.mjs`
- `scripts/check-r2-260-display.mjs`
- `tools/review/BOOK-V-PKA-R1-HUMAN-DECISION.json`
- `tools/review/BOOK-V-PKA-R1-HUMAN-REVIEW.html`

工作树保留以上修改，无本轮提交或推送。没有声称 human PASS、production PASS 或 live provider PASS。

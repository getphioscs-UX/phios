# 免费命盘专项核对 — 2026-10-09

基线 HEAD：f3d812d8fad4b389de76d4facde3d4bbfa656ad9。主工作区保留修改供 Changes 审阅；无 commit、push、部署、生产迁移、付款或 provider 调用。期间其他窗口修改了 Personal Reality、账户交付和构建文件，未覆盖其修改。本报告覆盖当前源码和本地组件；DEPLOYED、LIVE_CUSTOMER 均为 RUNTIME_UNVERIFIED。

## 状态分开记录

| 方法 | 已批准 | 已绑定 | 已验证 |
|---|---|---|---|
| BaZi | 既有专业表面 W13/W14 24/24 Human ACCEPT；不扩大为当前付费报告完成 | 当前原生四柱已接回免费 publication 产品；仅传柱位、干支、十神、藏干 | 源码回归、当前模型变更测试、桌面/手机/打印组件预览通过；完整账户流程未验证 |
| Astrology | 既有 PVP 家族接受有效；当前 v3 精确图示 Human ACCEPT 未找到，机器记录明确 false | 当前 v3 计算投影绑定；仍存在旧版 compatibility fallback | 当前源数据快照、27 预览中的相关 9 项及本地选择/重开通过；手机需横向滚动 |
| Zi Wei | W15 v2 Human ACCEPT 12/12、admission 12/12 | W12/W13 专业十二宫绑定，禁止旧通用图 fallback | 十二宫来源回归、9 项预览、6 项屏幕选择/重开通过；本次隐藏规则修复不自动获得新 Human ACCEPT |

图文件、hash、机器 PASS 均不等于当前显示稳定或 Human ACCEPT。共享 `content/product-visual-platform-r1/phase13/acceptance/pvp-r1-vis-w35-w36-human-acceptance-v1.json` 保留历史接受；`pvp-r1-vis-w35-personal-reality-cx-successor-reacceptance-v1.json` 的 PENDING_HUMAN_REACCEPTANCE 是当前整体呈现 successor 的边界，不能倒推撤销已接受方法图，也不能自动批准当前 successor。

## BaZi

1. 凭证：`content/customer-experience-rebuild/bazi-cx-pro/acceptance/bazi-cx-pro-w13-w14-human-cutover-acceptance-v1.json`，HUMAN_ACCEPTED_24_OF_24_MARKET_GRADE_CUTOVER_ACTIVE，2026-08-31，默认 BAZI_PROFESSIONAL_READING。范围是该专业表面；48 页/15 图付费参考报告的验收另属报告范围。
2. 实际入口 `/api/customer-personal-reality` → 原生 builder → `functions/personal-reading/bazi-customer-publication.js` → `assets/customer-ui/js/specialists/bazi/product-renderer.js` → `renderBaziProfessionalStructure`（`assets/customer-ui/js/surfaces/bazi-professional-reading.js`）；CSS `assets/customer-ui/surfaces/bazi-professional-reading.css`。四柱是动态 HTML，不是参考 PNG。
3. 原先免费 publication 清除了原生 source，导致付费文稿准入未开放时免费四柱也消失。本次新增最小 `freeChartSource`，沿用已接受 renderer，保留付费正文关闭。测试改变当前模型柱干后输出随之改变，原模型不变；没有把参考稿命盘接成客户命盘。预览刻意用 synthetic fixture，不冒充真实客户。
4. 仅方法准入 customerPublishable 的当前 BZR 原生模型可进入本次免费接线，无参考图 fallback。MFIG026–033 的 SEMANTIC_GOVERNANCE_BOUND 只是治理绑定，productionGrant=false，不能当交付凭证。
5. 桌面、390px 手机、中英文及打印媒体已有截图；四柱手机纵向排列、打印两列，所看样本未见四柱裁切。双语为配对组件测试，不证明产品原生同时双语。免费最小投影未包含关系/格局正文；既有 renderer 的关系/格局摘要显示默认开放文本，此文本不能被视为该客户关系已计算的证据，仍需免费摘要语义边界审核。
6. 已修免费图缺失接线；未重绘。指标未检出 body 横溢或非 SVG 文本横向裁切，但不足以证明任意出生资料都无重叠。
7. 本地原生计算、重新生成中英文组件、重新装载预览均零 provider。四柱本身无可点击宫位切换。账户提交、浏览器持久状态、真实客户重开尚未端到端验证。

## Astrology

1. 当前投影 `PHI-OS-AST-CUSTOMER-PRODUCT-PROJECTION-v3.0.0`。`content/professional/ast-full-production/customer-product-v3/acceptance/ast-cx-r3-w24-machine-acceptance-v1.json` 为 MACHINE_ACCEPTED_240_OF_240，humanVisualAcceptance=false；`ast-cx-r3-w21-w23-layout-print-acceptance-v1.json` 为 ENGINEERING_ACCEPTED。R1R5 报告图示验收不授权当前免费 v3 星盘。当前精确 v3 Human ACCEPT 是具体缺口。
2. 实际消费者 `assets/customer-ui/js/specialists/ast/product-renderer.js` → `buildAstrologySpecialistSurfaceV3` / `buildNatalChartV2`，文件 `assets/customer-ui/js/specialists/ast/ast-specialist-surface-v3.js`；CSS `assets/customer-ui/surfaces/astrology-specialist-v3.css`。资产是内联 SVG viewBox 720，不是静态参考图。
3. 行星、宫头、角点、相位来自当前 p.chart；ASC 定向和宫位几何沿用计算结果。快照回归核对当前 source-derived 数据。MFIG018–024 治理绑定不替代显示与客户输入验证。
4. **未全面禁止旧版 fallback**：缺 v3 时 `legacyCompatibilityPlan` 可接受 surfaceCutoverActive 的 `PHI-OS-AST-INTERACTIVE-WORKSPACE-v1.0.0`，进入 `assets/customer-ui/js/surfaces/astrology-workspace.js`。未擅自删除旧消费者。需要确认旧入口是否仍具有有效保留权威，决定准入边界。
5. 桌面、手机、中英文、配对双语、打印媒体已有预览。手机 SVG 大于容器，通过内部横向滚动查看完整图；默认视野并非完整盘。打印截图呈完整轮盘。输出了 PDF，但未逐页验证 PDF 分页和实际打印机结果。
6. 样本未见明显几何错绑，密集行星文字仍需拥挤输入样本检查；现有 SVG 文本不在通用 HTML 裁切检测覆盖范围。不能写“所有图示稳定”。
7. 实际组件事件处理器的行星切换和重开均 PASS，中英文和配对双语共 6 次屏幕检查。网络请求拦截后记录 0；完整账户免费生成和 deployed 重开仍 RUNTIME_UNVERIFIED。

## Zi Wei

1. 凭证 `content/customer-experience-rebuild/ziwei-cx-r1/acceptance/ziwei-cx-r1-w15-human-visual-acceptance-v2.json`：HUMAN_VISUAL_ACCEPTED_12_OF_12_W16_OPEN；`admission/ziwei-cx-r1-w15-human-visual-admission-v1.json`：HUMAN_ADMITTED_12_OF_12，2026-08-30。保留既有接受，无重新画图。
2. 当前消费者 `assets/customer-ui/js/specialists/ziwei/product-renderer.js` → `buildZiweiW12W13RenderPlan`，`assets/customer-ui/js/specialists/ziwei/ziwei-specialist-workspace.js`，rendererId ZIWEI_CX_R1_W12_W13_SPECIALIST_WORKSPACE；CSS `assets/customer-ui/surfaces/ziwei-specialist-workspace.css`。动态十二宫 HTML / 星曜标签，不借固定参考图片。
3. 十二宫及星曜读取当前原生 source；来源回归核对 12/12 中英文 source-derived 宫位。预览 fixture 只是验证输入，不进入实际 API 客户数据。
4. product renderer 准入关闭时 fail closed；`suppressLegacyZiweiWithinSpecialistHost` 排除旧通用图、列表、单方法 fallback，保留当前 owner 内节点。
5. 桌面、手机、中英文、配对双语、打印媒体均生成预览。390px 十二宫仍保留四列，因此星曜标签较小，不能用无裁切指标替代手机可读性 Human 审核。打印刻意展开全部宫位详情。
6. 发现真实 CSS 层级问题：base 的 [hidden] 在 cascade layer 内，被未分层 inspector display:grid 覆盖，屏幕同时显示全部 12 个详情，页面异常拉长。新增 screen-only hidden 规则，当前屏幕仅显示选中宫位；原 print 展开规则保留。六次宫位切换/重开均恰有 1 个可见详情。无十二宫几何重绘。
7. 本地生成、切换和重开零 provider；未证明真实账户记录持久化、部署版本与本机一致。

## 实际验证与证据范围

| 命令 | 退出码 | 当前结果 |
|---|---|---|
| `node scripts/check-pvp-r1-vis-w25-ast-snapshot.mjs` | 0 | v3 当前 AST 投影快照 |
| `node scripts/check-pvp-r1-vis-w26-bzr-snapshot.mjs` | 0 | 原生四柱来源 |
| `node scripts/check-pvp-r1-vis-w19-ziwei-twelve-palace.mjs` | 0 | 十二宫中英文来源；CSS 修复后复跑通过 |
| `npm run check:bazi-visual-commerce` | 0 | 免费接线、当前柱变化、付费正文关闭及既有回归链通过 |
| `node scripts/audit-free-natal-diagram-preview.mjs` | 0 | 27 预览、9 HTML、27 PNG、9 PDF；外部请求 0，provider 0 |
| `git diff --check` | 0 | 当时工作区无空白错误 |

原始指标见 `PREVIEW-RESULTS.json`；截图与 PDF 同目录。实际 AST/Zi Wei 事件处理器已接入 harness；重开指重新选择和组件重载，**不是登录账户后的跨会话重开**。无付费调用授权消耗，预算追加 0。

## 剩余证据与下一步

Codex 可继续零费用检查：更密集 AST 图的标签冲突、手机内部滚动完整性、实际账户免费入口的本地端到端验证、BaZi 免费摘要投影边界、PDF 逐页分页；先确认本地 mock/账户流程的无网络依赖。部署和客户证据需读取既有授权可访问的运行记录，未取得前保持 RUNTIME_UNVERIFIED，不部署以制造证据。

Human 需要审核的具体对象：本次八字免费接线截图、紫微屏幕隐藏修复截图、紫微手机四列可读性、占星手机横向滚动体验；确认当前 AST v3 的精确接受凭证及 legacy 保留权威。历史内容与方法准入接受保留，未将其提升为当前付费产品完成。本报告状态 EVIDENCE_GAPS_OPEN，尚不宣称三方法整体 READY_FOR_HUMAN_REVIEW 或 LIVE_CUSTOMER 完成。

# 免费图示零费用补充核查

2026-10-09。开始 HEAD f3d812d8fad4b389de76d4facde3d4bbfa656ad9；期间其他窗口提交／合并后 HEAD 31d5709d71c2aa37806c78039499a62204d3a291。本窗口没有执行 commit、push、部署或生产调用。API 与八字边界检查在后一 HEAD 复跑通过；图示及 PDF 检查不可宣称全部在同一 HEAD、同一工作树执行。

## 已实际执行

| 检查 | 命令 / 退出码 | 结果与界限 |
|---|---|---|
| 免费入口实际 handler + renderer | `node scripts/audit-free-natal-api.mjs` / 0 | 三方法各两个不同出生资料，6/6 HTTP 200 并有当前图示；各方法两份 markup 不同。八字 FREE_REPORT_PREVIEW，付费原生正文不暴露 |
| 全网络隔离 | 同上 / 0 | global fetch、Node http/https 全阻断，尝试次数 0；直接构造 Request，不经 HTTP 服务。明确位置 snapshot，不调用地理服务 |
| 当前八字免费摘要边界 | `node scripts/check-bazi-visual-commerce.mjs` / 0 | 增加 chartOnly 接线选项：免费最小四柱投影不再展示缺失关系／格局字段的默认判断。原完整专业表面与已接受图形保留，冻结 hash 未修改 |
| 当前组件截图 | `node scripts/audit-free-natal-diagram-preview.mjs` / 0 | 修复后重新生成 27 预览；请求与 provider 0。AST 和 Zi Wei 本地选择／重新选择测试通过 |
| 密集 AST 与手机滚动 | `node scripts/audit-ast-dense-scroll.mjs` / 0（证据采集成功） | 8 个样本；基准图 0 标签 bbox 交叉，合成密集样本每语言手机 13 对、桌面 19 对交叉。布局断言应为 BASELINE_FAILURE，不能把采集程序 exit 0 写成布局 PASS |
| PDF 逐页提取和渲染 | bundled Python `scripts/audit-free-natal-pdf.py` / 0 | 9 PDF / 103 页，逐页提取文本并用 Poppler 渲染；没有空文本页。分页仍有问题，详见下方 |
| 工作区空白检查 | `git diff --check` / 0（修正本窗口生成文件 CRLF 后） | 中间一次 PDF 指标文件 CRLF 被报 trailing whitespace，已规范为 LF；没有调整产品测试断言制造通过 |

## AST 压力测试与滚动

证据 `AST-DENSE-SCROLL.json`。在实际英文／中文投影的复制件中，将十颗行星放到 120° 起每 0.8° 的位置，仅测试 renderer 的拥挤处理；这是 **合成布局压力样本，不是天文计算得到的真实客户命盘**。不得用它证明真实客户已有这组重叠，也不得认为普通样本通过就涵盖全部星盘。

实际 390px viewport，轮盘内部 overflow-x:auto，可移动 143px，到最右时 SVG 右缘在容器内，页面没有整体横向溢出。此前测试脚本向 newPage 传 viewport 无效，已改为 setViewportSize 并重跑；旧结果不作为证据。滚动测试目前是程序设置 scrollLeft，触屏手势可发现性与键盘易用性仍需审核。

失败对象：`assets/customer-ui/js/specialists/ast/ast-specialist-surface-v3.js` 的 bodyLayout／buildNatalChartV2。现有 3 个 radial lanes 对极密集位置重复使用，文本矩形仍交叉。保留 planet/house/aspect 已接受几何，未擅自重画或换参考图。下一步为局部标签避碰布局修复及拥挤真实计算样本回归；现阶段不能批准“所有命盘显示稳定”。

## 免费账户入口与摘要

`API-RESULTS.json` 覆盖真实 customer-personal-reality handler，合成认证 context，env=local，无生产 DB／付款／provider 依赖。三方法当前输入影响当前图示，未用固定参考 markup 代替。Zi Wei 未提供明确 target context 的首次探测返回 NEEDS_ATTENTION／ZIWEI_CX_R1_FULL_PRODUCTION_UNAVAILABLE；补齐明确的目标日期、时间、时区后 2/2 图示返回。HTTP 200 单独不等于方法成功，已断言有图示。

八字关系／格局默认文本被移出免费 chartOnly 表面，避免将缺少投影当“没有关系”的事实。免费 API 的 `view.reading.map` 仍将 FULL_REPORT 标为 READABLE，而 product.reportAccess 是 FREE_REPORT_PREVIEW，这是**状态摘要边界不一致**，已记录，不得宣称全文可交付。该字段还涉及其他窗口正在修改的 Personal Reality／账户工作，应由其 owner 修正；本窗口没有覆盖它。

**尚未完成：浏览器实际表单 → HTTP 本地服务 → 账户保存 → 跨会话重开**。直接 handler + renderer 是更强的接线证据，但不是这一完整账户端到端链。现有 `scripts/run-master-customer-preview.mjs` 使用合成 identity、内存 SQLite / R2；其默认 preload 允许外部 GET，因此未将“脚本存在”或默认守卫视为无网络保证，未盲目运行整条账户流程。完整浏览器验证仍须全出口拦截、仅放行本地 mock，并覆盖免费保存与重开。

## PDF 分页实际发现

页数：AST 中文 1／英文 1／配对双语 2；BaZi 中文 2／英文 2／配对双语 3；Zi Wei 中文 20／英文 26／配对双语 46。共 103 页。PDF-PAGE-RESULTS.json 为逐页文本指标；`pdf-pages-v2/` 是当前有效的逐页渲染和 contact sheets。

AST 当前样本轮盘完整；八字修复后四柱在第一页完整，但英文第二页主要只有读图 footer，分页不够紧凑。Zi Wei 英文十二宫图被分到第 1、2 页，不能宣称整盘打印完整在一页；十二宫详情两列跨页，续页缺少重复宫位标题，阅读定位不稳定。保留 print 展开全部详情的既有行为，不将屏幕隐藏修复提升为打印验收。以上列为 PRINT_LAYOUT_FAILURE / EVIDENCE_GAPS_OPEN；尚未进行物理打印机验证。

早期 PDF contact sheet 程序重跑时把旧 contact 图纳入 glob，导致拼页图混入旧缩略图。已修为仅匹配数字页号，输出独立 `pdf-pages-v2/`，保留旧目录不删除；旧 `pdf-pages/*contact*` 明确作废，不能用于接受。文本页数始终来自 PDF 本身，未受 contact 图影响。

## 部署和客户运行记录

读取已有仓库证据：`docs/guided-report-successor-r2/bazi-t3/deployed-evidence.json` 记录 2026-09-23 的 QA、旧 commit、真实 provider 曾到达和 cache reopen；这是旧付费 QA 的证据，不是本轮免费图零 provider 证明。`content/governance/current-authority-reconciliation/carc-w4-deployment-evidence-v1.json` 明确 CURRENT_REPO_NOT_DEPLOYMENT_VERIFIED／STALE_RECORDED_DEPLOYMENT，不能拿历史记录证明本轮部署。

未取得当前 HEAD 的部署身份与三方法免费调用／跨会话重开日志。本轮不调用旧真实 provider probe、不部署制造记录；DEPLOYED、LIVE_CUSTOMER 继续 RUNTIME_UNVERIFIED。

## 审核对象与当前状态

历史方法准入、参考稿及视觉接受保留。Human 可以审核八字免费接线及摘要隐藏、紫微屏幕隐藏修复、紫微手机四列可读性、AST 内部滚动体验；这些是有限范围的逐项审核，不能批准三方法全部完成。

待 Codex／对应 owner 完成：AST 密集标签局部避碰；免费八字 reading 状态摘要对齐；完整账户本地浏览器保存与重开；BaZi footer 和 Zi Wei 十二宫／详情分页修复；获取当前部署只读身份和调用记录。待 Human 提供／确认：AST v3 精确 ACCEPT 与 legacy 保留权威。状态 **EVIDENCE_GAPS_OPEN**，费用 0、预算追加 0，不提升为 READY_FOR_HUMAN_REVIEW 或 LIVE_CUSTOMER 完成。

# BaZi minimal version compatibility — no new Provider call

## 独立状态

| Gate | 当前结论 |
|---|---|
| 历史真实调用 | **HISTORICAL_PROVIDER_PASS**，按 Owner 已核实结论保留 |
| 新旧模型输入一致性 | **PROVIDER_EVIDENCE_VERSION_GAP**，不是再次付费调用要求 |
| 原始 Snapshot → 当前 IR | PASS，原始 Authority 与 18 个正文单元逐项 Digest 一致 |
| 当前 Diagram | 15 张，现有 fidelity 检查 15 PASS；不是另一命盘或重新计算 |
| 当前实际 PDF | 已生成 SYNTHETIC QA：48 页、36,101,614 bytes，SHA `3f86a5cda140bb8518c8245bbdec127964dce102b563db83357b0cbd9f08724f` |
| 正文与书签 | 333 个出版正文片段均可提取；44 个原生书签；43,057 个可提取字符。18 个完整源单元保留于 IR，PDF 使用现有摘录合同，不能把“摘录完整”说成“整篇原稿全部印入 PDF” |
| 当前整体出版回放 | **CURRENT_DETERMINISTIC_REPLAY_PARTIAL_WITH_PUBLICATION_DEFECTS**，P17/P22/P29/P33 溢出，不伪造整体 CURRENT_DETERMINISTIC_REPLAY_PASS |
| 正式客户投影 | 正确拒绝 reviewOnly/fixture：`BAZI_CUSTOMER_PUBLICATION_REQUIRED`；未更改 flag 绕过 |
| 同一新 PDF → Account | 尚未放行：该回放有实际出版缺陷，而且是 QA 来源。此前 native Account 的 10 项通过继续有效于其原文件，不能冒充该新 PDF 已交付 |

本轮 Provider Calls = 0、Provider Cost = USD0；未重新压缩、未调用 AI、未修改历史来源或视觉原件，未将 QA 候选写入正式 Artifact Store。

## 实际语义比较

从 git `eaf655d9` 提取历史 Prompt／Batch 原文。历史 Prompt 的 canonical digest 与三次 usage 中 `promptDigest` 完全一致；使用**原始 AUTHORITY-PACK.json** 重投影旧三个 Batch，其 Digest 逐批等于真实回执记录。因此对比的是实际调用的旧版，不是根据版本名字猜测。

Prompt-2 保留原先命理事实边界、连贯中英长文要求与 schema 字段，同时增加一个实质段落：每批接收 CURRENT_TIMING_SUMMARY；有大运/流年时不可误说资料缺失；区分无法映射的年份/年龄/起运日期；各主题分别解释学习判断、运行节奏、职业权责、留存、亲密、家庭照护、压力、周期、当前激活；减少跨主题反复套用 output/carrying；区分印比与季节温暖，解释已准入官杀的具体作用。这些会改变模型生成内容，不能仅称为排版修复。

Batch-2 对原始同一命盘的新增顶层模型输入为 `CURRENT_TIMING_SUMMARY`、`domainGuidance`、`admittedCareerAnchors`；原先详细 timing 仅在 B03，现在每批都获得紧凑时序真值，详细 timing 仍归 B03。当前时序中的条件化 admittedTenGods 仅在严格来源身份匹配时附加。三个 Batch 的 sectionIds 与 natal facts 在此原始 Authority 上保持一致。没有通过换命盘或删事实制造兼容。

Publication-3、Diagram-3、Renderer-3 是确定性内容选择/图表投影/页面与 HTML 渲染升级。本轮不把这些版本变化当作历史真实 Provider 无效，也不将新渲染结果回写历史 Provider receipt。旧稿是否满足新 Prompt 的新增质量要求属于内容准入差异，不是 schema 或 source digest 无法读取。

精确证据：PROMPT-BATCH-SEMANTIC-DIFF.json、PROMPT-BATCH-SOURCE-INDEX.json、HISTORICAL-/CURRENT- 两份原文对照。

## 出版缺陷与最小处置

实际 PDF 的 P17、P22、P29、P33 英文末段接近或进入页脚，现有 inspectBaziDeepLayout 返回 overflowPages，独立 Poppler PDF 截图已确认。没有删段落、遮盖溢出或缩字号来制造 PASS。保留该缺陷候选及 SHA，用作兼容性证据，不替代已接受 R1.2 文件。

下一步仅使用既有 publication recompose/local reflow owner，先比较它对旧稿选择范围的影响：如会遗漏既定应刊内容，停止该方案并使用既有完整源稿分页合同；不得改写已接受正文、替换静态 WebP，或直接给 review IR 标 customerPublishable。修复应另产版本与 SHA。

## 自动交付续接范围

此前真实共享 sweepPaidReports → 同 Subject 历史回放 → 当前 compiler → QA 私有 IR 通过，一次 Job／一次 Assembly；重复扫描无重复，错误账户及不同 Subject 拒绝。此次源级兼容验证进一步确认原始 Authority/Prompt/Batch 可严格绑定。

实际 Sandbox Checkout/Webhook 仍 NOT_RUN；不能把种子付款当 Stripe PASS。对应 publication fit 尚未通过，故不执行该缺陷文件的正式发布/权益/Account 接线，不把当前失败变成新收费 QA 要求。其他方法的既有成果及阻断沿用六方法矩阵，不重开全文开发。

当前应优先完成旧稿确定性分页兼容及同一 Publication 的私有交付，然后按既有 Sandbox 清单验证事件验签、Entitlement、可信调度、下载、冷重开、撤销和退款。无需新 OpenAI Project 或 API Key。

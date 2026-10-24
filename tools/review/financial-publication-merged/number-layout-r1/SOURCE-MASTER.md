# PHI OS — Financial Fixed-Asset Overlay, Report Reference and Stripe Invoice Crosswalk · CODEX MASTER R1

**执行性质：READ-ONLY AUDIT → LOCAL CANDIDATE → SYNTHETIC ACCEPTANCE → HUMAN REVIEW。** 本轮不得修改真实 Stripe、线上 R2/D1、生产账单，亦不得自动 commit、push、deploy、生产迁移或调用付费模型。不要覆盖并行窗口的未提交修改。

## A. 用户最终批准的设计边界

1. **R2 正式 WebP 原图直接复用**，不重新绘制 P01–P05、P21、P22 的 logo、固定正文、装饰、图标与结构。
2. P01 只在批准的安全空区叠加客户显示名称、生成日期、报告展示编号（可加“截至日期”，但不能将其误标生成日期）。
3. P21 只填批准的半动态槽位；如果当前 R2 源仍烘焙了样例值，则为 BLOCKED，不得把样例遮盖并宣称真正获得批准，也不得自由另设计一页。
4. P22 保留 12 个附录的固定图文背景；只叠加基于真实最终 manifest 的勾选、双语状态和真实页码。状态框最多两行（中文＋英文）；未收录、资料待补不另打印 `—` 或额外的状态符号；每行只出现一个与状态对应的图标，且不与 R2 图中已存在的符号重复。
5. **统一报告编号是对外展示的不可变关联身份**，不等于订单 ID、支付 ID、下载 URL、报告技术 hash、Stripe 发票编号或税务电子发票号。
6. 保留 Financial 已完成的财务计算、R3.2 22 页双语核心、动态附录、RM69 商品草案、四问、USD5 cap、FREE providerCalls=0，不重新开发这些能力。

## B. 已只读查证的 GitHub `main` 事实与需要本地复核的范围

- `functions/financial/holistic-planning-product/publication-merged-renderer.js`：`css` 中 `catalog-status` 宽 11.2%、高 4%、文字 `b/span/i` 依次排列，且会渲染第三行 `—`；P22 同时绘制 `catalog-tick` 单独的 `✓/?/−`。这与用户截图中的符号重复、状态框紧贴边界吻合。必须在**本地当前 HEAD**重新定位对应实现，不假设 GitHub `main` 已包含所有未提交的 R4 修正。
- 同一文件里 `cover-meta` 使用 `top:61.4%; left:26%; right:6%` 等基础定位，当前合成版把 `TEST_ONLY` 与日期等压在底图局部；要只改叠加区的布局与字形，不更换封面资产。
- `db/migrations/0011_report_context_sequence_reservation.sql` **只有 SELECT 1；不是正式报告流水号表**，不可误判已有编号机制。
- `db/migrations/0018_shared_paid_report_delivery.sql` 存在 `paid_report_jobs.report_id` 与订单关联；`functions/report-delivery/paid-report-delivery-core.js` 按购买／方法／人物计算稳定 job ID，属于内部工作身份，不是已对外统一的序列号。
- `functions/financial/holistic-planning-product/factual-report-job.js` 使用 `finance_<digest>` 的工作标识、`reportId` 等；不应直接把长 hash 印到封面。
- `db/migrations/0006_commerce_stripe_r1.sql` 的 `commerce_receipts.receipt_number` 已唯一；`functions/commerce/book-commerce-store.js` 当前有 `PHI-<environment>-<checkout_attempt_id>` 型平台收据号码。这个 **Receipt Number** 与新报告编号、Stripe Invoice Number 不同，不能重复造收据 ledger。
- `functions/pws/commercial/stripe-product-registry.js` 已有 BAZI、ZIWEI、ASTROLOGY、HD、ECR、PROFILE、NUMEROLOGY、CROSS、FINANCIAL、WILL 等相关商品身份。是否各自正式产生已交付客户报告，应逐条到其真实 generation/artifact owner 查证，不能仅凭商品已登记就标记为上线。
- `functions/report-delivery/paid-report-method-registry.js` 在 `main` 中仅看到 BZR 的 p8Admitted true 与 ZWR 的 false；**不能据此推断所有其余产品的单独交付管道都不存在**，须继续巡检产品域。
- `functions/commerce/stripe-client.js#createCommerceCheckoutSession` 一次性报告是 `mode=payment`，当前未设置 `invoice_creation[enabled]`，只把 `order_id`、`commerce_product_id` 等写入 Checkout／PaymentIntent metadata。这不足以保证每个一次性付款都有自动 Stripe Invoice PDF，也不代表 metadata 会印在发票上。
- 只读查看连接的 PHI OS Stripe Live 最近列表：仅见一个 `open`、`manual` 发票，且未设置 custom fields；**不能视作自动报告发票功能已验收**。本轮不访问更完整的敏感客户明细，不对账户写入。

## C. 工作顺序（不可跳过）

### C0 — 工作树与来源冻结

读取 `git status --short`、当前 HEAD、已有 Financial merged human-review、publication contract、各类报告生成器、数据库 migration 列表与既有商业对账；列出修改文件/预期。只读比较 `main` 与本地修改，不重新执行已通过的长链。

### C1 — P22 状态框局部 CSS／DOM 修复（优先完成）

1. 在本地找出 P22 的 appendices overlay 代码。对照批准的 R2 WebP 实际尺寸，建立**一个**相对坐标 schema（实际图像尺寸、画布、可填写矩形），不得假设右边英文标签能任意换行。
2. 删除重复的 `catalog-tick` 或重复图形叠加。若 R2 背景本身已预印 checkbox 图形，动态只能选择**一个**目标位置填充符号；若原图烘焙了多余 `—` 而无法通过纯叠加消除，准确标 BLOCKED 或申请一版正式空槽位资产，不要偷偷重画。
3. 状态框最多两行：`已收录 / Included`、`资料待补 / Data needed`、`本次未收录 / Not included`、`不适用 / Not applicable`。显示图标至多一个，图标不占额外的第三行。实际附录页码只在 INCLUDED 状态出现，建议第一行 `✓ 已收录`、第二行 `Included · 25–31`（仅合成示例）；没有页码时第二行只显示英文状态。不得出现第三行，也不得使用 `—` 占位。
4. 状态文本布局采用固定 clip 边界、`box-sizing:border-box`、较小的固定 padding、适当字号（印刷最小可读值经打印检查确定），明确 `overflow:hidden`。两行全长必须不溢出；不要通过缩小整张 WebP 达成。确保 A01–A12 12 个状态横纵对齐，双语居中且视觉完全对称。
5. 用 UI 测试覆盖包含 12 个状态的合成 manifest：INCLUDED 单页、多页范围、DATA_NEEDED、NOT_INCLUDED、NOT_APPLICABLE，验证页码重算和目录导航。对每一格做文字盒边界测量，记录最大可用宽高、实际 text metrics、溢出 PASS/FAIL；截图 100% A4 与浏览器 390px 缩放。
6. 禁止因为溢出而裁掉固定资产内的中文/英文类别名称。若类别需缩写，须经用户逐项批准。

### C2 — P01 封面动态信息的版式优化

1. 不改写原图 Logo、书名和已有美术文字；仅在原图上视觉允许的一个安全区域叠加：**客户称呼／家庭名称、报告生成日期、报告展示编号**，可选 `资料截至日`，必须明确区别生成日期。
2. 动态层的字体来自 repo 已有、授权的中英文字体，选择与正式 P02–P05 匹配的深蓝/暖金、层次明确的排法。客户姓名为主视觉，日期与编号为次信息。避免当前截图中的 `TEST_ONLY 2026-10-23 03` 单行小字压在金色波带上。
3. 使用同一固定 safe zone 对 5 个合成名字做视觉验收：短中文、较长中文、英语全名、混合中英、两行最大边界；测试日期长格式、不同序号长度、A4 实际像素与裁切边界。禁止用改变底图纵横比、字体过小或侵入 Logo/装饰方式解决。
4. 只有真实报告正式发行才显示正式 `Report No.`。测试报告以独立明显的 `SYNTHETIC/TEST ONLY` 审阅水印说明，不能伪装真实已发编号。不要把技术 job hash、ownerAccountId、sourceDigest 等原样输出客户封面。
5. 统一保存版本重开、再下载必须复用同一个展示编号和生成日期；新的财务资料版本重新发行时使用新编号，并保留 previous reference。仅技术恢复、同字节重渲染不新发编号。

### C3 — 全品类报告身份核查表（先观察、后设计）

至少逐项记录：
- Bazi `COM-REPORT-BAZI-FULL` / BZR
- Ziwei `COM-REPORT-ZIWEI-FULL` / ZWR
- Astrology `COM-REPORT-ASTROLOGY-FULL` / AST
- Human Design `COM-REPORT-HD-FULL` / 当前 HDR/HD owner
- ECR `COM-REPORT-ECR-FULL`
- Profile `COM-REPORT-PROFILE-FULL`
- Numerology `COM-REPORT-NUMEROLOGY-FULL`
- Cross `COM-REPORT-CROSS-FULL`
- Financial `COM-REPORT-FINANCIAL-FULL`
- Will `COM-WILL-WRITING` 与非法律生效的 template/draft assembly
另检查 Tarot 与 I Ching 若生成可保存的付费 reading；Books 另按订单和水印身份处理，不混进此轮报告编号。

每个产品列出：商品 code、既有交付类型、内部报告 artifact id、版本、交易引用、正式编号字段是否存在、代码路径、QA 证据、Production admission 状态。`NOT VERIFIED` 不能写成 `NO ID`。特别区分 `sourceReportRef`、`reportArtifactId`、`reportId`、`receipt_number` 与客户展示 `publicReportNumber`。

### C4 — 最小化统一展示编号契约

建议格式（**示例，不预先认定为发行**）：`PHI-FIN-2026-000001`；同一原则延伸 `PHI-BZR-2026-...`、`PHI-ZWR-2026-...`、`PHI-AST-2026-...`、`PHI-HD-2026-...`、`PHI-ECR-...`、`PHI-PROFILE-...`、`PHI-NUM-...`、`PHI-CROSS-...`、`PHI-WILL-...`。METHOD code 映射必须来自当前真实 registry，不要自造产品代码。

对 `publicReportNumber`：
- 唯一、持久化、可查询（环境隔离 QA/LIVE）、按发行事件 immutable。
- 不包含姓名、生日、身份证、财务金额、隐私关键词或 customer_id。
- 私人报告下载必须仍检查 owner、grant、subject consent、digest 与版本，不可以只知道展示号码就读取报告。
- 保留和现有 order_id / purchase_id / receipt_number / report_id / reportArtifactId 的映射（最少唯一 index、外键和发放时间）；不要创建第二份收费 ledger。
- 以当前真实数据库事务性保证并发与幂等；若确实要求每产品年度递增序列，只能通过经 review 的**增量本地 migration candidate** 与原子写实现，旧版不可倒填成推断的序号。正式迁移另行授权。
- REPORT_RESERVED、REPORT_ISSUED、VOID/EXPIRED 状态分别保留。取消支付的 reserved reference 不可移给其他客户；允许序号空缺。仅正式 paid grant 确认、已冻结报告达成发行条件后进入 ISSUED。
- Will 模板编号明确标识为 `Will preparation / Draft reference`，不可表述为法律认可或签署生效编号。
- Free 报告没有 Stripe invoice 也要有自身可追踪的报告引用，但须另标明 `FREE` 和非付费性质。
- 一笔订单多个报告：一个 order reference，多份 publicReportNumber；不能用订单号冒充每份报告的唯一号码。

### C5 — Stripe 发票可显示内容的两套接入策略

**原理：Stripe 自动 Invoice Number 是其开票身份；PHI OS Report No 是报告交付身份，必须分开。** Stripe `metadata` 用于后台查找，不保证打印在 PDF。要让客户看见，使用 Stripe invoice 的 `custom_fields`（或明确的 invoice description），且必须在发票 finalization 前设置。

A. 默认较简单方案：Stripe invoice 显示**Order Reference**（在 checkout 前存在）；报告 PDF 同时显示 `Report No.` 与 `Order Reference`。这种关联最稳定，适合 bundle、重新生成、多份交付，不依赖报告已生成。订单后台显示每份报告编号。

B. 如果用户确定必须在发票直接看见同一个 Report No：单件产品可**在 Stripe checkout 前预留**不可逆的 publicReportNumber，并在付费成功、版本冻结后才标为正式发行；在创建一次性 invoice 的 `invoice_creation[invoice_data][custom_fields]` 填展示 reference，同时传 invoice metadata。取消支付则废弃预留号码不再使用。Bundle 仍优先显示 Order Reference，并通过商户订单页面列明各分报告号码。

Stripe 接线检查：
- 当前 `functions/commerce/stripe-client.js#createCommerceCheckoutSession` 的 payment mode 没有 `invoice_creation[enabled]=true`。仅传 Checkout 和 PaymentIntent metadata 不代表一次性销售会生成 Stripe Invoice。
- 先在 QA/Sandbox 证明 `invoice_creation[enabled]` 可用，再核对 `invoice_creation[invoice_data][custom_fields][0][name]` 和 `[value]`、Invoice PDF 的显示效果、实际费用／开票政策、Webhook `invoice` 关联。绝不可未经批准直接在 LIVE 开通新自动开票行为。
- subscription 会按期产生自己的 Stripe 发票，订阅本身不是一份具体报告：不要把一次性报告编号固定写在每期会员 invoice 上。
- 已 finalised/paid 发票不得尝试回填后生成的报告编号或篡改法定发票内容。历史 Stripe invoice 保持原样。
- Stripe Checkout 日志和 metadata 只存必要、不敏感的 order/report reference；不得上传客户财务报告原文、出生资料、家庭关系、资产负债、身份证件、Will 内容等。
- 支持退款与取消：保留报告/订单/发票原始对应关系，标明 reversed/refunded，不复用编号。
- 马来西亚 MyInvois e-Invoice 是独立税务合规流程，不要把 Stripe PDF invoice 或 PHI OS Report No 当作 MyInvois 认可号。

### C6 — 测试矩阵与本地交付

逐项验证：
1. P22 12 行所有状态在 A4 100% 下中文英文两行均未溢出；无重复 `—`、`?`、`✓`；包含完整页码和 PDF 目录可点击跳转。
2. P01 五组名称、日期、生成时间、长编号、测试水印，固定背景无改动，字体位置自然并可打印。
3. BZR、ZWR、AST、HD、ECR、PROFILE、NUM、CROSS、FIN、WILL 等逐项 identity coverage，有证据者标记已有、缺失者待补、未查证者不得宣称 PASS。
4. 一份已发行报告二次下载／技术恢复保持原号；新的冻结版本得到新的展示号，链接保留；并发不会撞号。
5. QA/Sandbox 单次支付、重复 webhook、cancel、refund、bundle、free 各有映射且不多发号码；Stripe invoice number 与 public report number 不混淆。
6. 如没获授权启用 invoice_creation，只产出模拟发票和 request diff，不向 Stripe LIVE 写入。
7. 对照当前 R2 asset 的 SHA，P01/P22 仅修改动态 overlay；P03 仍走冻结选择，不自行更新。
8. 新增失败是 FAIL，不对旧 5 个 rental 历史例外做扩大豁免。

### C7 — Handoff

只更新已有 `tools/review/financial-publication-merged/MASTER-HUMAN-REVIEW.html` 和相应现有执行记录，不另建新的 Master。交付：
- P01 与 P22 修改前/后 A4 同倍率并排截图（含长名称与各类状态）。
- 所有报告类型编号现状 audit matrix（文件路径／是否已有内部 id／是否已有对外编号）。
- 本地 `publicReportNumber` 设计或候选、需要的迁移审查与兼容策略。
- Stripe QA mock invoice PDF 的 Order Reference / Report No 显示实例及当前现有 Checkout 差异。
- 真实测试结果、阻断、文件改动清单、隐私与资产哈希对账。

**Stop conditions**：任何未经批准的 R2 对象修改、生产 Stripe/DB 写入、读取真实客户原文、编号重复、重复扣款或改写历史单据，立即停止对应子项，其余纯本地验收可继续。

## D. 固定不动的生产边界

无 commit、push、deploy；无生产迁移、Invoice 实发、真实收费、Provider 付费、R2 写入。当前 repo `main` 的事实只作只读审查基础，不得当作用户本地未提交 R4 候选的完整替代。最终状态最多 HUMAN_REVIEW_READY，不是 Production PASS。

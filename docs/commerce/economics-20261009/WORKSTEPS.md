# PHI OS 商业价格与报告成本整改：真实交付与后续完整步骤

日期：2026-10-09。源码基线：`951de416fb7cad11b82edc2d63d2e7c90f6a5e6b`。本地分支：`commerce-economics-20261009`。

当前结论：Stripe QA 和正式账户的 14 项价格、产品默认价格及登记已修改并读回核验；仓库价格、组合、语言、预算与支付环境适配已修改。本地订单测试及 Pages 构建通过。没有 Git push、生产部署、生产数据库迁移、实际购买或付费 OpenAI 调用。所有方法的生产交付与四次追问仍有接线阻断，整体完成状态为 **未完成**。

## 1. 唯一当前商业规则

| SKU | 基础售价 MYR | 整份交付最高成本 USD | 语言规则 |
|---|---:|---:|---|
| COM-REPORT-BAZI-FULL | 59 | 4 | 单语；双语加 RM10 |
| COM-REPORT-ZIWEI-FULL | 59 | 3 | 单语；双语加 RM10 |
| COM-REPORT-ASTROLOGY-FULL | 59 | 3 | 单语；双语加 RM10 |
| COM-REPORT-PROFILE-FULL | 129 | 6 | 固定双语，不加价 |
| COM-REPORT-HD-FULL | 129 | 5 | 单语；双语加 RM10 |
| COM-REPORT-ECR-FULL | 129 | 6 | 单语；双语加 RM10 |
| COM-REPORT-NUMEROLOGY-FULL | 39 | 2 | 单语；双语加 RM10 |
| COM-REPORT-CROSS-FULL | 299 | 10 | 单语；双语加 RM10 |
| COM-READING-TAROT-FULL | 19 | 1 | 固定双语，不加价 |
| COM-READING-ICHING-FULL | 39 | 2 | 固定双语，不加价 |
| COM-REPORT-FINANCIAL-FULL | 159 | 7 | 固定双语，不加价 |
| COM-WILL-WRITING | 29 | 2 | 固定双语，不加价 |
| COM-REPORT-BUNDLE-2 | 99 | 按两个所选报告分别计上限 | 整个组合双语仅加 RM10，总价 RM109 |
| COM-REPORT-BUNDLE-3 | 149 | 按三个所选报告分别计上限 | 整个组合双语仅加 RM10，总价 RM159 |

组合只允许八字、紫微、占星。组合二比两份 RM59 单购节省 RM19；组合三节省 RM28。组合五及以上退出新销售。每份报告含四次报告追问；组合按每个所选报告分别计成本与追问，不再重复创建组合报告。

成本上限包含两种语言、完整报告、必要的针对性修复以及随后四次追问，不因双语加价而提高 USD 上限。免费版本的 OpenAI 调用数为零。正常生成以三次主要调用为目标；修复以实际失败章节、成本、重复条件及既有内容关卡约束，不用盲目追加调用代替完整性校验。

当前预算实现在生成状态规划中保留总上限的 10% 给追问，生成与修复共享其余 90%。这是本次保守实施选择，不是用户另行指定的比例；正式模型预检必须验证此分配能支持完整正文与四次合格回答。若不满足，应在总上限内调整分配或模型，不得缩短专业内容来伪造 PASS。

## 2. Stripe 已完成事项与真实证据

正式账户：`acct_1Pkdz8B2F823WiPt`（LGS Wealth Management，livemode=true）。QA：`acct_1UFr0TBEKXJyHMkK`（PHI OS QA，livemode=false）。

1. QA 更新现有产品的价格、默认价格、语言规则、报告成本元数据与四次追问范围；加入 Tarot 和 I Ching 当前 SKU。
2. QA 归档八个被新售价替代的旧价格，停用 Bundle 5+ 产品。未删除历史价格、订单或客户权益。
3. 正式账户创建全部 14 个 PHI OS 商品与对应 MYR 基础价格，并绑定默认价格。该账户此前不存在这些 PHI OS SKU，因此没有同 SKU 的旧价需要归档。
4. 正式账户原有其他业务的 Financial planning 产品及 Payment Link 保留；它们不是本次 PHI OS SKU，不替换其价格或历史账单。
5. 对正式与 QA 的全部 14 项默认价格逐项读回比对。
6. 双语可选加价仍由服务器核价后建立同一 Checkout 的单次加价行，不需要为每个方法创建第二套产品。没有用客户端金额决定收款。

真实 ID 对账见 `stripe-live-mappings.json`、`stripe-qa-mappings.json`。价格读回见 `stripe-live-price-readback.json`、`stripe-qa-price-readback.json`。产品默认价格与元数据读回见 `stripe-product-readback.json`。来源检查见 `canonical-check.json`。

Stripe 商品配置 PASS 只证明商品目录正确，不证明 getphios.com 已部署这些代码，也不证明报告可以交付。

## 3. 仓库已实施修改

1. `functions/pws/commercial/commerce-economics-policy.js`：当前统一经济规则，14 SKU、12 方法成本、免费零调用、四次追问、固定双语与组合资格。
2. `report-successor-contract.js` 与 `stripe-product-registry.js`：当前合同价格与实际 QA/LIVE ID；去除当前 Bundle 5+；恢复 Profile 当前购买合同；保留历史订单合同及价格映射。
3. `functions/commerce/commerce-environment.js`、`stripe-client.js`、`commerce-stripe-events.js`、`functions/api/stripe-webhook.js`：区分 QA 与正式账户；校验服务器账户、环境、价格、订单金额、客户和 webhook 对象模式。生产启用开关没有自动打开。
4. `functions/commerce/book-commerce-store.js`：订单、客户绑定与账户投影按环境隔离；历史订单按存档价格验收；保留既有 Commerce 权益 FULFILLED 语义；前台明确显示“使用权益已开通”，不称完整报告已生成。
5. `db/migrations/0016_commerce_environment_bindings.sql`：本地迁移提案，使同一客户的 QA/LIVE Stripe 客户映射互相隔离，保留已有映射。已登记校验和；仅在内存 SQLite 执行过，未运行生产迁移。
6. `assets/customer-ui/js/surfaces/commerce-account.js`：固定双语不显示加价；组合资格收缩；停售商品历史订单仍可显示，不重新加入购买选项。服务预约入口保留。LIVE 下未绑定正式 Stripe 价格的商品保留展示与预约范围，但不提供可点击购买；不会让客户点击后才发现价格未配置。
7. `report-generation-budget.js` 与 `paid-report-transport.js`：按订单、报告、客户和权威摘要绑定生成状态；实际费用先由既有 ProductCostEnvelope 原子预留；预留费用后才调用；记录实际用量；用量未知时保留预留并阻止重复调用；四次追问额度、已完成交付前禁止追问、结果缓存及局部修复条件。要求调用方提供真实互斥持久存储、已核价模型及领域校验器。
8. `report-provider-access.js` 与两条真实 narrative / BaZi transport：免费访问与缺少服务器付费预算上下文时，在网络调用之前拒绝。付款成功 URL 或客户端宣称 paid 不构成授权。
9. BaZi/VFR 与紫微共享预算规划：取消当前付费报告统一 USD1 上限，按方法使用新上限；BaZi 可容纳 USD3.27 的计划，仍须通过实际模型最坏成本预检。历史受控实验的旧授权金额没有自动扩大。
10. Master 的当前商业决策与 Commerce map 更新为新价格，原始历史 Master 权威文件和已接受客户正文未覆盖。

## 4. BaZi 哈希报错的处理

报错中的 customer-publication 实际哈希源于 main 已有的参考命盘正文覆盖保护，与冻结基线不同。本次没有把它回退，也没有把所有冻结检查替换成当前文件的任意哈希。

`bazi-prelive-owner-successors.json` 精确记录四个已审查文件的原哈希、当前哈希与修改范围，包括 main 既有出版/renderer 防护，以及本次成本/调用准入修改。原始审计文件保留。未登记的后续漂移继续失败。45 组 prelive 测试通过不等于 HUMAN_ACCEPTED 或生产激活。

## 5. 当前检查结果

| 检查 | 结果 | 实际范围 |
|---|---|---|
| check:commerce-economics | PASS，15 组 | 价格、语言、历史订单、付费门槛、成本、缓存、用量未知、领域校验 |
| check:commerce-stripe | PASS，17 组 | SQLite + 注入 Stripe HTTP fixture；不是真实支付 E2E |
| check:commerce-canonical | PASS | 当前源码目录与认证 Stripe 读回记录，14 项默认绑定 |
| check:pws-report-successor | PASS | 当前14产品 schema、生产关卡和组合负例 |
| check:guided-report-successor | PASS | 32语言核价、语言锁、既有内容/资产边界 |
| check:commerce-catalog-runtime | PASS | 当前目录与 Profile/Ziwei 语言选项 |
| check:vfr:shared-core | PASS | 新方法上限与预算规划 |
| check:runtime-migrations | PASS | 1–16 版本校验、历史行保留、QA/LIVE 双绑定 |
| check:bazi-deep-manuscript:r2-prelive | PASS，45 组 | 原报错解决；无模型调用 |
| check:cloudflare-function-import-compat | PASS | Pages Functions 源码导入规则 |
| check:report-provider-spend-protection | PASS | 普通回归与构建禁止付费请求 |
| check:product-total-cost | PASS | 既有 SQL 成本池，原子预留、退款拒绝、未知用量冻结 |
| check:report-followup-store | PASS | 既有 SQL 四次问答记录与历史保留；回答生成未接线 |
| check:my-reality-saved-sources | PASS | 新 main 只读保存源与身份隔离 |
| check:package-aliases | PASS | 现有命令入口兼容 |
| check:pages-build | PASS | 本地 Pages 静态资源与 Worker 编译；未部署 |
| 生产报告端到端 | NOT_RUN | 没有实际扣款或付费模型调用 |
| 真实手机客户验收 | NOT_RUN | 没有生产部署，不能测试新版本 |

本次付费 API 调用数为零；新 main 带入的历史20次 Tarot QA 属于另一窗口先前执行记录，未重跑、未覆盖，也不属于本次支出。

一次 Pages 构建因 Wrangler 未安装失败；安装锁定依赖后重跑通过。初次使用旧经济断言的检查失败，已改为新规则并保留负例，不移除业务约束。

## 6. 每个方法仍须完成的闭环，不能漏项

以下 12 个方法的价格、语言和成本合同已更新；**没有一个因此被宣布生产交付 PASS**。

| 方法 | 当前剩余工作 |
|---|---|
| BaZi | 将服务端已验证订单和权威命盘绑定完整 BDM 生成；绑定持久预算上下文；按新上限完成三调用最坏成本预检；保留已接受正文与章节视觉；双语完整性、局部修复、实际保存与四次追问仍须验收 |
| Ziwei | 现有 `account-method-reports.js` 只允许 local/qa/preview，交付仍走 controlled Ziwei 身份；先完成正式订单准入、预算与 renderer receipt 接线，再移除具体生产阻断 |
| Astrology | 当前共享合同已有新价/上限；必须把实际占星事实、专业生成、双语交付与四次追问接入同一订单预算，禁止只有商品价格没有履约 |
| Profile | 固定双语零加价且新购合同恢复；须验证正式购买后的 Profile 生成、完整正文与保存，无历史“仅旧用户可读”残留 |
| HD | 保留真实 Human Design 权威图与外部 reader 边界；缺少权威数据不能让模型补造图；生成、双语、保存和四次追问接线 |
| ECR | 接入正确的构型事实与已批准表达；确认当前生产准入关卡，不以 USD6 代替内容批准；完整交付与追问 |
| Numerology | 免费复用批准确定性内容；付费完整报告与 USD2 预算、可选双语及四次追问接线 |
| Cross | 依照购买的独立跨方法产品执行，禁止组合自动生成 Cross 或 Cross 自动赠送单方法；来源与冲突保留；USD10 包含完整交付和追问 |
| Tarot | 免费洗牌、选牌、翻牌和确定性内容保留零调用；新的付费 SKU/权益不等于 paid narrative 已完成；须实现付费保存、双语与 USD1 生命周期预算，真实触控验收 |
| I Ching | 免费起卦、变爻/之卦、传统术语解释复用批准内容；付费深解、双语与 USD2 生命周期预算接线；内部 Authority Pack 不暴露给客户 |
| Financial | 仍有 professionalReviewRequired/服务履约边界；固定双语不加价；应把报告生成和人工预约明确接上既有流程，保留财务专业审阅，不把付款当报告完成 |
| Will | 仍为人工服务与法律审阅流程；固定双语不加价，USD2 是报告模型成本上限；资料、司法辖区、人工验收与交付关卡继续保留，不能把模型正文当已完成法律文件 |

同步发现：新 main 已增加 `report-followup-store.js`、`provider-cost/product-cost-envelope.js`、迁移14/15及四问历史读取 API；本次全部保留，环境迁移顺延16。统一成本上限现由 Commerce 规则导出，`paid-product-cost-authority.js` 接入既有 SQL 成本池，而不是另起第二个扣费预算。新 main 的四问持久记录已有 fixture 验证，但 `account-report-questions.js` 仍是 QA 只读历史接口，明确 `answerGenerationAdmitted:false`，不能宣称已实现付费回答生成。

价格冲突：新 main 的 CURRENT-OWNER-DECISION 记录另一窗口导航附件 Tarot RM9。本次执行本窗口明确的 RM19，保留附件原始记录及历史价格字段，更新当前商业读法和 Master builder，禁止下次生成退回9。其他导航与内容权威不改。

通用实证阻断：`createPaidReportTransport` 当前尚未由各生产 producer 创建并传入，因此新真实 transport 会安全拒绝缺失付费上下文的调用；共享生成状态需要真实服务器持久 store 和跨 worker 互斥；成本预留已适配既有 SQL cost envelope，而 Map fixture 不能充当生产生成状态存储。`ask-narrative-reading.js` 的 quotaConsumption 仍是投影，必须绑定持久四次计数和同一报告预算后才是实际额度管理。

## 7. 下一阶段逐步执行顺序

### A. 将当前补丁纳入同一仓库

1. 先读取另一个窗口最新 main 和未提交变更，记录 HEAD；禁止覆盖该窗口正文、FIG、R2 与总导航的权威修改。
2. 当前补丁已同步至上述 951de416 HEAD。先执行 `git apply --check PHIOS-COMMERCE-20261009.patch`；不通过时审查冲突后逐项合并，不能强行 apply 或 reset。
3. 合并后重新计算四文件 successor receipt（原审查基线538442c保持为历史证据，新 main 的对应文件哈希未改变）；只有已审查经济/准入修改可以更新，不得把未知正文差异加入豁免。
4. 执行下列零成本命令，保留失败输出。不要调用 provider generation 脚本。

```powershell
npm ci --ignore-scripts --no-audit --no-fund
npm run check:commerce-economics
npm run check:commerce-stripe
npm run check:commerce-canonical
npm run check:commerce-catalog-runtime
npm run check:pws-report-successor
npm run check:guided-report-successor
npm run check:vfr:shared-core
npm run check:runtime-migrations
npm run check:bazi-deep-manuscript:r2-prelive
npm run check:cloudflare-function-import-compat
npm run check:report-provider-spend-protection
npm run check:product-total-cost
npm run check:report-followup-store
npm run check:my-reality-saved-sources
npm run check:package-aliases
npm run check:pages-build
```

### B. 完成所有 producer 和追问接线

5. 使用现有 Commerce 服务器记录核验已付款订单、环境、客户、所选方法与语言。不要相信浏览器的 paid、price、success query 或 SKU 猜测。
6. 在现有存储体系实现 `withLock/get/put/putIfAbsent`，生成状态键至少含环境、owner、order、report；继续复用既有 ProductCostEnvelope 和 report-followup-store，不另建扣费池或追问存储；锁丢失或用量未知必须暂停，不能自动重发。
7. 为每个方法提供已验证模型价格、输入/输出最大用量、domain validator 和真实 paid context；免费路径必须不创建 paid context。
8. 先用零费用 fixture 覆盖每个方法的新购买→权益→权威数据→主生成→缺陷→局部修复→双语→批准→分页→存储；分页与重开必须零模型调用。
9. 完成报告且有发布 receipt 后才标记 delivered，并确认既有权益 FULFILLED 与实际 material/release receipt 分开对账。不得直接因 webhook paid 就宣布报告已生成。
10. 将报告四次追问绑定同一持久 ledger；校验 answer 相关性、来源及方法事实之后才计为已交付答案。失败调用仍记录成本；第五问拒绝；同 requestId 重放零调用；不同客户和不同报告不能互换额度。
11. 逐项确认价格加价、完整专业篇幅、双语正文、修复失败处理、保存/My Reality 所有权以及实际成本不超过表中上限。模型预检超预算时暂停销售该方法，不能偷换成免费模板。
12. 未经额外明确授权，不执行新的付费生成测试；商品目录修改授权不自动授权模型实验花费。

### C. 人工验收与生产发布

13. 汇总 12 方法的 SOURCE 证据、正文差异、语言质量、已批准资产版本、四次追问结果与总成本。所有 HUMAN_ACCEPTED 正文/FIG 的替换必须按既有关卡明确验收。
14. 形成可审阅发布包：源码提交、迁移16、正式账户绑定、服务端环境配置、逐方法 delivery admission、回退与历史订单兼容结果。不要在此之前启用全局 LIVE checkout。
15. 在明确生产发布授权后，执行迁移、部署和所需环境配置；本次未执行。
16. 读回线上部署 commit、API catalog、每个基础价/双语价及静态版本，记录 DEPLOYED PASS。
17. 在窄屏手机、常规手机、平板、桌面完成真实购买/权益/生成/保存/重开/四次追问验收；真实购买和模型支出须在相应明确授权范围内。
18. 对任何失败方法保留具体阻断与客户可理解的交付状态，不宣称全部完成；全部 SOURCE、DEPLOYED、LIVE CUSTOMER 三门通过后才能关闭此工作。

## 8. 旧价格的保留范围

旧售价仍可出现在历史合同、已接受审计、已支付订单及冻结实验记录中，这些必须保留作为历史兼容证据。它们不属于当前销售规则。当前 Commerce 合同、主登记、目录 UI 和 Master 当前商业 map 以新经济版本为准。不能为了“全仓搜索没有旧数字”而篡改历史订单或已接受客户正文。

线上目录本次经公开读取工具访问失败，不能从缓存 HTTP 记录断言当前 getphios.com 的新价格已生效。没有部署意味着本次仓库修复不会自动改变客户当前看到的版本。

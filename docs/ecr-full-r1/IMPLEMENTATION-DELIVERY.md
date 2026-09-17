# ECR-FULL-R1 + ECR-FULL-R1A 实现交付

按最新可执行附件推进：R1 是独立的 11 章核心报告，R1A 是有独立证据才出现的第 12–14 章。内部可审核实现已完成；**人工审核与生产准入未完成，不声称已上线或可购买**。所有新人工项目与 PIS-R1 放入 [最后统一审核](./FINAL-REVIEW.md)。旧 DELIVERY.md / authority-census.json 是第一份附件的历史审计，不是当前状态。

## A. 基线

本地 HEAD / main 为用户指定的 `1046e1ee66db5403142c76f6754729de36d37ce7`。远端读取因代理失败，未声称核实远端最新 main。修改保留在工作区，未提交、推送或部署。

变更等级 **Explicit Contract Version Upgrade**：原 Full Report schema 增加显式 `edition: ECR_FULL_R1`；旧六卡报告路径在新准入之前不变。共享 Customer Claim IR schema 不变，扩展条件 claim 适配器。shared-owner registry 记录前身 digest、当前 digest 和限定范围，不改历史 freeze 或人工验收。

## B. Authority census

复用链路：ECR calculation → canonical projection → Reading IR → accepted interpretation → shared Customer Claim IR → existing full-report assembly → existing Personal Reality adapter → existing ECR specialist renderer。

未新建第二套计算、选卡、ontology、meaning、比较状态或 entitlement authority。11 章引用原获准解释和 Motion 原子定义；PHI 构型取原 H64 意义，不加入生物/心理推断。报告资产 COM-REPORT-ECR-FULL 进入现行 visual registry。用户提供的 ECR / Profile SVG 原图保留，两页绑定更新，图标检查按九个正式清单文件逐项核对。

R1A carrier / experience 规则位于原 functions/interpretation-runtime，标为 PENDING_HUMAN_REVIEW。Part4/5 依据是既有解释契约、source inventory 与 canonical refs；**覆盖记录不等于已逐句审核原稿，候选模板仍需人工核实**。报告消费条件 claim，不自行解释。当前路径与 digest 见 current-authority-census.json。

## C. R1 W0–W17

| 波次 | 结果 |
| --- | --- |
| W0 基线 / census | 完成；远端 freshness 未验证 |
| W1 产品身份 | ECR_FULL_REPORT / ECR，中英文标题与描述已配置 |
| W2 PHI Card | 同一六卡 ID、mapping 和 lineage，无重选 |
| W3 Free / Paid | 服务端按共享 entitlement 分深度；免费首位 PHI Card，去除付费 claims；CTA 内部禁用 |
| W4 11 章 IA | 完成；无空章或占位付费章 |
| W5 Report IR | 原 owner 内 edition 扩展，旧路径保持 |
| W6 Claim IR | 原共享 schema + projection / meaning / rule lineage |
| W7 Paid projection | 内部审核投影完成，公开准入关闭 |
| W8 双语 | en / zh-Hans renderer 完成 |
| W9 一致性 | 64 构型 × 双语检查通过 |
| W10 Commerce | RM39 草稿 SKU / offer / price + 共享 entitlement 消费完成；实际支付、订单后权益发放、公开付费 API 尚未启用 |
| W11 Report 视觉 | SVG、现行 registry、SHA256 与审核页绑定完成；人工待审 |
| W12 桌面 / 手机 | 8 组 R1/R1A × 双语 × 390/1440 浏览器检查通过 |
| W13 Print / Export | 四份 A4 样例完成并逐页核对，无文字裁切；可浏览器打印 |
| W14 Machine | 64 组 / 128 双语执行通过 |
| W15 Human | 24 组 / 48 双语视图已生成，PENDING |
| W16 Production | CLOSED；旧 ECR 获准状态不代表新 successor 获准 |
| W17 Freeze / Delta | 实现 manifest + Delta ZIP；生产 freeze 等待人工与商业 gate |

## D. Product / Commerce binding

Product `ecr-full-report`，Offer / Price `ecr-full-report-myr`，3900 minor units / MYR，状态 draft。金额仅在 Commerce 配置中，正文与 renderer 不硬编码价格。草稿 offer / price / product 禁止下单；旧 registry 的 active seed 不自动纳入 draft。

内部 Paid 切换只使用合成共享 entitlement fixture。生产 API 未接受客户传入的 reviewMode 或 paid 布尔值。公开付费流程须在准入后接服务器购买权益；审核预览不是支付授权。

## E. PHI Card consistency

逐例机器记录包含结构、卡 ID、semantic digest、report digest。免费/付费投影不重算、不重选卡、不把当前现实写回出生基线。出生驱动优先级不是当前优先级，Activation 不表述运气、命定或事件时机。64 组合成太阳锚点覆盖坐标；它不是天文引擎准确性认证，既有计算测试另行保留。

## F. R1A census / evidence / W0–W19

载体需要独立 CARRIER_CONDITIONS + CARRIER_ENVIRONMENT。经验需要 carrierRuntime、selection、stabilization、perspective、motivation 五项独立输入，复用原 experience deriver 必填契约。沿用 Current Reality 的 consent、purpose、600 字和总量限制，七个可选问题不从出生资料补填。审核页可核对并下载证据；服务器不保存，不改上方合成案例。

比较复用 CURRENTLY_RESONANT / PARTIALLY_RESONANT / CURRENTLY_NOT_RESONANT / OPEN，由客户明确选择。没有第五态、真实性得分或自动对齐。缺证据、错 domain、经验输入不全时隐藏整章；反证保留，OPEN 不自动成为反证。

| 波次 | 结果 |
| --- | --- |
| W0 Authority census | 原 Part4 / Part5 / Current Reality 已定位 |
| W1 Independent evidence | 契约与可选输入核对入口完成 |
| W2 Section12 evidence | 独立载体 / 环境输入，完成 |
| W3 Part4 mapping | source / meaning / rule 引用齐全的候选，人工 PENDING |
| W4 Section12 machine | 纳入 96 场景，通过 |
| W5 Section12 human | 12 组准备完成，PENDING |
| W6 Experience input | 五项独立输入齐全才执行 |
| W7 Part5 mapping | 原 interpretation owner 中候选，人工 PENDING |
| W8 Section13 machine | 纳入 96 场景，通过 |
| W9 Section13 human | 12 组准备完成，PENDING |
| W10 Shared states | 沿用四态，无新 taxonomy |
| W11 Comparison projection | 基线 / 观察 / 回应各保来源 |
| W12 Section14 machine | 四态与缺证据检查通过 |
| W13 Section14 human | 12 组准备完成，PENDING |
| W14 12–14 integration | 可选 context projection，缺证据无空章 |
| W15 双语 / 设备 / 打印 | 内部样例与检查完成，人工待审 |
| W16 Combined machine | 96 场景通过 |
| W17 Combined human | 36 重点案例 PENDING |
| W18 Production | CLOSED，与 R1 独立 |
| W19 Freeze / Delta | 同一实现增量包；语义准入 freeze 尚未成立 |

## G. Machine results

[核心结果](./core-machine-results.json)、[情境结果](./context-machine-results.json)、[浏览器结果](./browser/results.json)、[最终核验汇总](./verification-summary.json)。已有 ECR R3、PPR R3、图标、shared-owner 回归已执行，全仓状态以最终汇总的实际退出码为准。

重跑命令：`npm run check:ecr-full-r1`、`npm run check:ecr-full-r1a`；追加 `-- --write-review` 重建审核 fixtures。浏览器脚本 check-ecr-full-browser.mjs 需 PHIOS_PLAYWRIGHT_MODULE 指向本机 Playwright，使用 Edge。图片来自既有 R2 卡面，没有重绘卡牌。

## H. Human review

统一 [FINAL-REVIEW.md](./FINAL-REVIEW.md)，[实际审核网页](./review.html)。24 核心组与 36 情境组均 PENDING；没有机器代签，也不把开发者视觉检查当成客户人工验收。PIS-R1 原 packet 与已批准图片保持不变。

## I. Production admission

R1 和 R1A 准入均 false。R1 不被 R1A 的语义审核阻塞；各自人审后仍需在现有发布体系中完成准入。真实 checkout / 权益发放未启用。公开客户继续原获准路径。

## J. Delta ZIP

相对指定 HEAD 的新增 / 修改清单与逐文件 SHA256 见 implementation-manifest.json。Delta ZIP 包含本次实现、案例、检查、图标和导出样例，排除无关未跟踪内容。删除文件：无。旧 audit-only ZIP 是历史产物，不是本次实现包。

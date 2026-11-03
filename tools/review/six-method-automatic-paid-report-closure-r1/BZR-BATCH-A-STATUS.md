# BaZi Batch A — conditional approval recorded, execution blocked

历史状态，已被后续 OWNER DECISION — Skip Repeated Paid Provider QA 覆盖。US$3.60 授权已取消，不再需要新 Project/Key；当前授权与回放进展见 PROVIDER-QA-REVOCATION.json / ZERO-COST-REPLAY-CONTINUATION.md。

Owner 已批准本批次最多一份 SYNTHETIC QA BaZi 完整报告，累计 Provider 费用不超过 US$3.60，含正常及必要恢复调用，不得动用 US$0.40 正式追问预留。其他五方法未获付费授权。原始授权独立记录于 BZR-BATCH-A-OWNER-AUTHORIZATION.json；历史 BASELINE.json 保持原状。

## 本次实际执行

- 复用现有预算与 BaZi Owner Cost Contract，7/7 定向零费用检查通过：生成/追问隔离、超限事前拒绝、未知用量阻断恢复、正常与恢复合并上限、第四正常调用拒绝、in-flight 拒绝、同请求重放。
- 只读规划：使用主工作区既有合成参考 Authority，当前 Report Owner 模型与默认正文密度，三个正常调用配置最大费用合计 **US$2.938628**。历史深度遥测未注入；此结果只说明当前默认规划可容纳于上限，不是所选新客户快照、完整执行准入或实际账单。
- 复核官方 OpenAI 文档的模型价格及项目限额边界；项目限额不能替代现有持久化事前预留。[定价](https://developers.openai.com/api/docs/models/gpt-5.6-sol)、[支出控制](https://developers.openai.com/api/docs/guides/spend-limits)。
- 没有修改 Runtime、原始视觉、历史 PDF、已批准正文、商业权益或生产配置。

## 阻断及最小解决方式

| Gate | 状态 | 最小解决方式 |
|---|---|---|
| 条件预算 | APPROVED_CONDITIONALLY | 不必重复申请；不得扩大范围 |
| 独立非生产 Project / Key | BLOCKED_CONFIG | Owner 提供 Project ID 和安全保管引用，不发送密钥值；验证其环境和模型可用性 |
| 可信自动 Job 调度 | NOT_VERIFIED | 复用现有 sweepPaidReports，限定本地隔离合成 Job；不能使用 P9 LIVE watchdog 或以直接调用 composer 充当自动 Job 通过 |
| 出版版本 / Subject / Snapshot | NOT_PINNED_FOR_BATCH | 固定本批次 synthetic subject、Authority、R11 来源、composer、48 页 adapter 或兼容出版版本与源 SHA；不得混用 R1.1 候选或把待审内容升为 ACCEPT。QA 文件不要求正式商业水印签署，但必须明显标注 SYNTHETIC QA |
| 批次唯一性与成本 | NOT_VERIFIED_END_TO_END | 将唯一 batch/report/job/project 身份绑定到已有 durable ledger；全部恢复复用同一账本；禁止 FOLLOWUP；不得创建新订单/报告绕过本批次上限 |
| PDF / 真实回答 / 账单 | NOT_RUN | 上述 Gate 全过后才调用；随后验证真实个性化内容、Assembly、完整性、Token 与费用 |

当前 **Provider 0 调用、Token 0、实际 USD 0、自动 Job 实际执行 0、新 PDF 0、生产写入 0**。没有真实调用回执或最终新 PDF，不能用历史样张冒充。

现有纯函数检查不能证明实际 SQL 并发预留、项目身份、批次限额及 Job 全链均通过，因此本轮保持 executionEnabled=false，按 Owner 的条件停止付费执行。Project 引用待补充后，继续其余零费用前置项，再决定是否具备执行条件。

本文件是同一专项审阅包的增量交接；由既有统一发布 Owner 纳入唯一 Master。未创建新 Master、未提交、推送、部署或运行全量检查。

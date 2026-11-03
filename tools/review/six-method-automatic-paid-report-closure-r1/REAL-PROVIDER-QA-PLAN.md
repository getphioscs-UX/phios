# Real Provider QA — prepared, NOT AUTHORIZED / NOT RUN

最新决定：Owner 已取消 Batch A US$3.60 真实测试授权。以下全部预算提案及后续条件批准现为历史背景，不再执行或索取 Project/Key。当前改用严格版本绑定的历史只读回放，见 PROVIDER-QA-REVOCATION.json 和 ZERO-COST-REPLAY-CONTINUATION.md。本阶段所有方法 Provider Calls = 0、USD0；未来已准入真实客户生成不受本次取消影响。

后续 Owner 决策已覆盖本文件中 Batch A 的未批准状态：BaZi 条件预算 US$3.60 已批准；执行前置仍未满足，Provider 0 / USD0。准确授权和当前状态见 BZR-BATCH-A-OWNER-AUTHORIZATION.json 与 BZR-BATCH-A-STATUS.md。其他方法仍未授权；下表保留原提案背景。

仅合成资料。专用 OpenAI 测试 Project，独立于生产，密钥由现有 secret owner 保管；只记录 secret 引用，不记录值。必须在执行前核对账户可用模型与真实账单价格。

建议分批审批，避免六种方法尚未就绪时全部消耗预算：

| Batch | 前置门槛 | 建议最高 USD | 当前状态 |
|---|---|---:|---|
| A: BZR 一份完整合成报告 | 指定出版版本 + Sandbox paid job + durable paid context + 隔离资源授权 | 3.60 | NOT_APPROVED |
| B: ZWR 一份五次调用实验 | 正式预算上下文接线及客户来源合同通过；先复用现有实验 | 1.00 | NOT_APPROVED，代码前置未完成 |
| AST / NUM / HD / ECR | 各自现有来源与 adapter 准入 | 未提请、默认 0 | 不进行无意义的强制 AI 调用 |

3.60 是 BZR 当前商业生成上限，不是已批准支出。ZWR $1 为既有实验上限，不保证覆盖修复后正式商业客户全文。不得自动加预算或将多次重试分摊到新 Job 规避上限。Owner 可以仅批准 Batch A；任一批准均不授权部署或生产写入。

建议配置在 `PROVIDER-QA-CONFIG.json`，默认执行关闭、预算未批准、项目未填写。执行器必须使用现有 `createServerPaidReportContext` / durable ledger 和 `invokeBudgeted`。不能只传一个客户端 cost 数字、API Key 或本地 fixture context。不得绕过 paid context guard。

记录实际 request ID、model、input/cached/output usage、价格版本、估算与实际结算、恢复次数、内容 sourceRef、Subject/Snapshot/Publication 引用和最终 PDF SHA；日志不含 API Key 或不必要个人资料。每个 Job 先持久化预留，再发请求；未知调用结果先核对持久化记录，不盲目重试。现有 composer 的 resume 成本记录不重写，过时价格需在正式恢复准入前重新核对。

本轮 ZWR 定向估算使用现有 PAI owner：短上下文输入/缓存/输出 $4/$0.4/$20 每百万 token；超过 272,000 输入时整请求 $8/$0.8/$30。当前五次调用最坏规划估算 $0.888452，旧估算 $0.6552825；实际 usage 与费用尚无。工具、特殊区域、缓存写入等额外收费不在该简单 token 估算范围，测试禁用未预算功能。[官方模型定价](https://developers.openai.com/api/docs/models/gpt-5.6-sol)。

项目独立设置硬支出限制及告警；告警本身不是限额，硬限制传播也可能有短暂超额，因此仍须保留应用端持久化预留。[官方支出限制](https://developers.openai.com/api/docs/guides/spend-limits)。测试与生产资源分离遵循[官方生产实践](https://developers.openai.com/api/docs/guides/production-best-practices)。

停止条件：超过 Owner 总预算或单 Job ceiling、source/admission mismatch、Subject/Consent 失败、无 durable context、意外真实个人资料、输出 schema/语义不合格、使用未批准模型、环境/对象绑定不一致。费用已发生但结果不合格仍计入预算，不得隐去。

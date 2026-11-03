# 最小执行顺序与正式阻断

后续 Owner 已取消重复付费 Provider QA：本文涉及申请测试预算/新项目的步骤不再执行。最新行动以 ZERO-COST-REPLAY-CONTINUATION.md 为准，使用历史版本绑定的回放；其余出版/Adapter/隔离交付准入边界保留。

本次没有 READY_FOR_PUBLIC_SALE 或 READY_FOR_CONTROLLED_CANARY。不是因为六种计算均未完成，而是各自正式客户出版和真实付款交付证据尚有缺口。矩阵中的历史 PASS 继续有效于原有范围。

1. **统一发布窗口集成两个小修复**：ECR 付款前能力检查、ZWR 新请求价格估算。只合入独立差异，保留统一后继已有的 Live publication admission guard、Price 校验及其他窗口成果。尚未提交或集成到 main。
2. **BZR 首条真实隔离链**：Owner 指定已准入的准确客户出版版本、时序资料缺失政策和商业水印。现有 48 页交付合约与 R1.1 的 49/49/50 页候选不能默认为同一版本。确认专用 API 项目与预算，再使用现有 durable paid context，不重写 R11 正文。
3. **通用异步执行断点**：复用 `sweepPaidReports`，由已有可信 Worker Owner 为非生产 Sandbox 明确绑定环境、数据库、私有桶和密钥；当前部署配置是 P9 Live BZR 范围且默认关闭，不能直接打开当作通用测试调度。状态 GET 不执行生成。需要 Job → 实际执行 → 失败重试的独立凭证，不新建报告引擎。
4. **ZWR 紧接 BZR**：签署参考视觉和正式水印两项独立决策；将已有 `createServerPaidReportContext` 接到 ZWR 正式生命周期，补齐尚缺的九阶段 adapter 和获准的非生产私有存储范围。保留当前 local-only delivery guard，不能为通过 QA 删除它。最终 68 页参考、72 页 native source 与未来客户个性化版本分别签发回执。
5. **AST**：保留已接受的 64 页出版系统与英文正文，复用三次调用 composer；补 shared paid adapter、预算上下文、当前客户 source pack 和正式 artifact 接线。未见客户实际三调用是独立待准入项，不重写已接受参考。
6. **NUM**：先明确 R30 对新客户的解释来源及自动化准入；复用既有 local adapter 并切到确切 R30 projector。禁止将旧 R20 默认或离线参考片段当成任意新客户正式正文。
7. **HD**：优先使用已准入的外部确认命盘路径，明确 Full Report 及不同配置变体的视觉准入。现有 R611 完整候选可复用；不重造内部计算，不强加付费 AI。
8. **ECR**：保留 48 案 composition admission 及作者稿/视觉接受；先解决“作者个案”到“客户 Full Report”的来源合同，之后补 adapter。当前新增付款前拒绝是正确行为，不是开放销售。

## 每方法 Sandbox E2E 准入与证据

必须先满足该方法出版准入、合成 Subject/Consent、专用 Sandbox Product/Price metadata（method/product、币种/金额/环境）、受限密钥、Webhook secret、Provider 预算（需要时）和隔离资源授权。当前未进行云端读取或写入，云端配置与账号能力尚未验证。

执行：Test Checkout → 实际 Stripe 已付款事件 → 验签及 canonical session/line items → 同账户 Entitlement → 唯一 Job → 可信调度执行 → Native Snapshot → 已获准正文/Provider → PDF → Q87（适用且兼容）→ 新 SHA/不可变回执 → 私有 Artifact → Account 下载 → 冷重开 → 相同字节重下载。

必须保留：事件 ID/重放次数、环境、脱敏账户/订单/Subject/Snapshot/Publication/Entitlement 关联、Job 状态转换、Provider request/usage/cost、完整 PDF 长度/SHA/页数、私有对象版本及下载响应头。不得记录秘密或在公开路径写出生资料。

负例：重复及乱序 Webhook 不重复扣费/生成；错误账户、无权益、撤销、Consent 撤回、回执不匹配均拒绝；Provider 超限/超时不暴增调用；进程中断重试遵循现有持久化预算和幂等回执；退款后禁止新下载；冷重开及重复下载不重新调用 Provider/renderer、不收费。没有实际 Stripe 事件的种子付款只能记本地 QA。

## 仍需 Owner 决定

- 各方法准确出版版本、正式水印政策及客户动态解释来源的签发范围，分别批准，不批量推定。
- 是否授权专用非生产 Cloud QA 资源及 Sandbox 测试交易；本次未创建、部署或写入任何资源。
- 专用 OpenAI 测试 Project 的密钥保管引用与 USD 预算；不得在聊天中粘贴密钥。
- 最终集成、Cloud QA、canary、Live、P8 分别准入。商业价格存在、局部 P8 标记或合成 PDF 成功均不替代这些决定。

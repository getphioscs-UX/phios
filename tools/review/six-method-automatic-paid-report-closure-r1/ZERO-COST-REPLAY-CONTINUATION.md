# Six Method Closure — historical Provider evidence continuation

最新 Owner 决策取消 BaZi US$3.60 测试授权。PROVIDER-QA-REVOCATION.json 覆盖原条件预算；不新建 Project，不配置或请求新的 Key。历史授权与 preflight 保留作为历史记录。当前测试执行始终 Provider Calls = 0、Provider Cost = USD0；未来已准入真实客户生成权限不由此撤销。

## 历史证据适用范围

已定位 `.runtime-evidence/bazi-deep-manuscript-r2/BDM-R2-REFERENCE-20261006-01/` 的 checkpoint 与完整 snapshot，以及 docs 下的 live receipt、usage 和 publication closure。原始文件保持只读。

- 三个真实 `resp_…` ID、模型 `gpt-5.6-sol`、prompt/schema/batch authority digest、每次 Token/费用及 18 个完整中英文正文单元存在。
- 历史合计输入 7,153 tokens、输出 20,923 tokens，记录费用 US$0.447072。该值是原回执记录并可按记录 token 定价复算，不是本轮支出；`USAGE-RECONCILIATION.json` 仍为 RECEIPTS_AVAILABLE_RECONCILIATION_PENDING，未伪造独立账单对账通过。
- 原始 live snapshot digest：`f6147d8ec0426a45e83dff10d2df52417046f4d1d4cd5e4245f572ee16677c46`。九章 × 两种语言，不是只有单章，也不等于整套固定视觉/PDF/商业 E2E。
- 后继已接受 closure snapshot digest：`2cc520d1e7f1eafb46e9f16e565b9f4793c756ad8ad7fabca44a130ede57c2c9`。现有 R3.4 人审记录为 VISUAL_PUBLICATION_ONLY / ACCEPT，不能把后继编辑稿全部声称为原始 Provider 原文。Owner 的 R11 ACCEPT 继续保留，不重开正文。
- 本次回放的原始快照与当前 batch/prompt/compiler/diagram/pagePlan/renderer 六个版本不同，明确记为 **PROVIDER_EVIDENCE_VERSION_GAP**。这不表示必须再次付费；只限定它可以证明的范围。
- 找到 normalized output、ID、usage 与 checkpoint；未据此声称保留了完整原始 HTTP headers/body。其他五方法未在本次限定目录搜索中找到可同等绑定的 Response ID，不将 BaZi 记录扩展为六方法 Provider PASS。

完整 manifest 含原文件 SHA，见 HISTORICAL-PROVIDER-REPLAY-MANIFEST.json。该 manifest 是只读引用而非新客户稿；历史同 subject 的所有 18 单元摘要已逐项验证。

## 新执行的零费用验证

| 实际路径 | 结果与边界 |
|---|---|
| shared sweepPaidReports → Job → historical same-subject replay → 现有 compileBaziDeepPublication → QA private IR | PASS_SCOPED_ZERO_COST_REPLAY_DISPATCH_ASSEMBLY；一次回放、一次 Assembly，第二次扫描 0 Job，错账户与不同 Subject 拒绝。使用独立测试 adapter 注入，没有注册正式 BZR adapter，没有 Provider 或网络调用 |
| 原生 Account API → Library / 已签发私有 PDF → 下载 → 冷重开 → 重下载 → 权限负例 | 复制既有 synthetic DB/私有对象到本专项新目录后，以独立 Node 进程执行原有 Owner。10 项通过，35,640,638 bytes，SHA `8ee63665c551505a5c394c210ef403296da8186212926f89eb7003a72b156636`，Renderer 0、Provider 0 |
| 新 PDF 渲染/压缩 | 未执行。字节完全复用已有 PDF，不重复已通过的昂贵出版测试，不把它叫作本轮新生成报告 |
| 实际 Stripe Sandbox Checkout/Webhook | 未执行；本次 Job 由既有 QA helper 种子付款建立，不能标 Stripe E2E PASS |

两段证据**不具有同一个 Publication 身份**：历史 live 同 Subject 的新编译 IR 与原 P8 native Account 已签发 PDF 属于不同历史 fixture。因此仍不能宣称“该次历史真实输出已自动穿过正式 native adapter 并成为 Account PDF”。原先共享核心 mock render/release 也不计正式 PDF 渲染通过。

本轮脚本调试中两个未通过的尝试只在新 runs/ 目录创建 QA 状态：一次未推进 Job 60 秒初始 due time；一次误读 IR 字段。修正测试 harness 后实际通过；没有为测试改变生产调度或出版源码。

## 下一步最小接线

1. **BZR**：在既有 native pipeline 的测试 producer seam 绑定与历史 snapshot 完全一致的 Authority/Subject/版本，或使用同一后继 accepted-copy 的明确 lineage 映射；将已有真实输出送入原生 Adapter，再由同一 Publication 回执连到已验证 PDF/private/account owner。不同命盘不得硬绑；来源不兼容则保留 PROVIDER_EVIDENCE_VERSION_GAP，不重写稿、不调用 Provider。
2. **ZWR**：保留 exact Q87-to-Account 本地通过；补正式九阶段 owner/paid context 候选及隔离 replay 测试，不能用 BaZi 内容代替 Zi Wei。现有 source/watermark/cloud gate 维持。
3. **AST**：复用 accepted publication/English 与已有三调用 composer；补共享 Adapter 的明确阶段映射和客户 source pack，不把参考 64 页设为所有客户硬限制。
4. **NUM**：local adapter 必须绑定 R30 和已准入解释来源；未知客户 fail closed 继续有效。
5. **HD**：复用 admitted external-chart path 和 Full Report 候选，保留变体覆盖与 Full Report 人审边界，不另造内部计算或强制 AI。
6. **ECR**：本轮之前已补的付款前拒绝保持；composition ACCEPT 不等于一般客户完整作者稿准入。先处理现有全文来源合同，再接共享 Adapter。
7. **Stripe Sandbox**：待对应 publication/adapter 满足后，按既有 Sandbox E2E 清单验证实际验签事件、Entitlement 和 trusted dispatch。当前没有测试云端凭据与资源绑定证据；不得偷偷使用 Live 或生产桶。Provider 环节只允许严格绑定的零费用回放。

六方法仍分别 BLOCKED_WITH_EXACT_REASON。Provider 测试预算或新 Project 不再是本阶段的待申请条件。当前阻断改为版本绑定、实际 Adapter/Job/Publication 一致性和非生产商业交付验证。

未新增 Master。此专项新增证据由唯一统一发布 Owner 纳入原 Master；未覆盖其他窗口代码、未提交/推送/合并/部署、未运行全仓测试。

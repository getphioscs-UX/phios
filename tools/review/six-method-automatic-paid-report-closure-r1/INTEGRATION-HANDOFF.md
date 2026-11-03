# Integration handoff — NOT MERGED / NOT DEPLOYED

最终统一集成与唯一 Master 由现有 Unify PHI OS release readiness 窗口持有。未编辑其工作树、未更新 Master、未建立第二个 Master。本目录 HUMAN-REVIEW.html 仅是专项附件；由统一 Owner 将链接及准确状态加入现有 Master。

## 两项局部候选

1. Report 隔离工作区 `functions/report-delivery/paid-report-production-capabilities.js`：添加 ECR 真实 native/publication Owner 引用；缺 adapter 时明确 409 拒绝。未改变 Product、Price、Entitlement、p8Admitted。原五方法结果逐项一致。
2. `functions/personal-reading/narrative/ziwei-r5-provider-registry.js` 与三个 `visual-first/ziwei-vfr-{five-call,one-call,targeted-repair}-composer.js`：校正同一现有模型的当前 token 单价与长上下文档位，复用 PAI estimator；不变更模型、正文、实验限额或开启调用。模型在测试账户内的可用性仍未验证。

变更前后 SHA、精确 baseline main/Report/successor HEAD 见 BASELINE.json 和 TARGETED-ZERO-COST-QA.json。原始五文件备份位于 baseline/；这是本轮开始的未提交内容快照，不是 git HEAD 的替代。

统一后继已有额外的 Live publication guard 与 Price 验证，不能用 Report 旧文件全量覆盖。ECR 只迁移新增行；Provider 修改逐 hunk 审阅。现有 CRLF 按本轮原始字节约定保留，忽略行尾后 composer 分别仅有局部调用变更。

## QA 与未覆盖范围

18/18 定向零费用检查通过：重现旧 ECR null 与新拒绝、开关两种状态、原五方法不变、价格边界/缓存/非法 token、付费上下文与 FREE 拒绝、现有五调用计划、两个额外 composer 和 Checkout 依赖编译。网络与 Provider 调用均 0，PDF 渲染 0。

没有运行 npm run check 或历史全套，没有重新生成 PDF，没有签发 ACCEPT，没有进行 Cloud/Stripe Sandbox E2E、生产存储写入、提交、推送、合并或部署。

## 建议 Master 附加状态（由统一 Owner 整合）

Six Method Automatic Paid Report Closure R1：六种方法现阶段均 BLOCKED_WITH_EXACT_REASON，详情链接本专项 SIX-METHOD-MATRIX.md。已完成成果保留并逐项限定证据范围。ECR prepayment guard 与 ZWR planning-price 候选 18/18 定向 QA；实际付费调用、Sandbox 自动执行与云端私有交付尚未验证。Owner 需批准准确出版版本/水印、隔离资源与专用 API 测试预算；不自动开放真实购买。

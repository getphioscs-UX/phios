# BaZi Deep Manuscript R2 · Controlled experiment

Current decision: **MANUSCRIPT_COMPLETE__REVIEW_OR_QA_PENDING**.

当前附件明确授权一次受控三批实验，审批已保存；无需再次申请实验批准。执行记录以真实用量与 checkpoint 为准。

- Candidate: BDM-R2-REFERENCE-20261006-01
- Normal calls: 3
- Standard technical recovery calls: 0
- Total provider calls: 3
- Actual experiment cost: $0.447072
- Semantic verifier / semantic review / editorial rewrite: 0
- Live flag: controlled process only; global policy remains false

准备工作完成：沿用既有容量回执；Authority/prompt/schema digests、存储及用量账本就绪；逐批先补齐再推进的实验选项已通过模拟测试，最多两次恢复后停止；真实快照的双语全文、A/B/C和48页出版构建入口已备妥。原有生产/default engine 路径保持不变。

当前正文状态：TECHNICALLY_COMPLETE；浏览器/PDF/Print：LIVE_NOT_RUN / LIVE_NOT_RUN / LIVE_NOT_RUN。人工验收待明确指令。原有技术夹具不能代替这些结果。全仓检查未在生成和审阅未完成时重复运行；此前超时与 Composition R1 既有债务分别保留 UNKNOWN / PREEXISTING_REPO_DEBT。

在运行环境安全配置 OPENAI_API_KEY 后，执行已授权的固定候选，不能再建不同 candidate 重跑健康内容：

```powershell
cd C:\phios
.\scripts\run-bazi-deep-manuscript-r2-controlled-experiment.ps1
```

此入口隐藏输入密钥，仅在子进程启用 live flag，结束后恢复原环境；只运行一次同一 candidate。密钥不应粘贴到聊天中。完成时停止在 HUMAN REVIEW，不部署、不提交、不推送。

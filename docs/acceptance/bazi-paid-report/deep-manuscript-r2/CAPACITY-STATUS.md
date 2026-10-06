# BaZi Deep Manuscript R2 · Capacity admission

READY_FOR_BAZI_DEEP_MANUSCRIPT_R2_CONTROLLED_EXPERIMENT_APPROVAL

完成零费用容量准入与三批重算。原未验证的 24,000 / 64,000 规划值已移除；模型容量、定价与官方来源统一由版本化清单管理。未提交、推送、部署或生产切换。

模型：gpt-5.6-sol；上下文 1050000；最大生成 128000。已核对 Responses、Structured Outputs 与 reasoning。核对日 2026-10-06，复核日 2026-11-06。

| 批次 | 章节 | 输入估算 | 历史正文 | 净正文目标 | 推理预留 | 格式预留 | 安全系数 | 生成上限 | 上下文使用 | 状态 | 预期费用 | 配置上限费用 |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---|---:|---:|
| B01 | S02 S03 S04 | 9792 | 26554 | 26554 | 25000 | 600 | 1.2 | 62585 | 72377 | SAFE | $1.0822 | $1.2909 |
| B02 | S05 S06 S07 | 10044 | 24797 | 24764 | 25000 | 600 | 1.2 | 60437 | 70481 | SAFE | $1.0475 | $1.2489 |
| B03 | S08 S09 S10 | 11117 | 22524 | 22524 | 30000 | 600 | 1.25 | 66405 | 77522 | SAFE_WITH_ELEVATED_HEADROOM | $1.1069 | $1.3726 |

正常三批预期 $3.2367，配置最坏上限 $3.9124。预期使用完整推理预留作保守假设，尚无真实用量；实际 providerCalls=0、providerCost=$0、REPORT_PROVIDER_LIVE_ALLOWED=false。

输入采用包含 schema 的 UTF-8 字节保守估算，置信标识 CONSERVATIVE。本地未发现已验证兼容此模型的 tokenizer；未调用计数 API。历史 Composition R1、VFR 和长稿共逐节测量，正文使用混合字符估算，仅扣除可证明的跨章重复句；基础概念疑似重讲保留预算并记录。完整稿没有修改。

定价（USD/百万）：短档输入4、缓存0.4、输出20；输入超过272000时整个请求采用长档8 / 0.8 / 30。缓存输入假设0。紫微历史约$0.7/5次仅为经验参考。

检查：48组容量检查 PASS；42组 BDM 原有检查 PASS；别名、函数导入和费用保护 PASS。全仓 npm check：INCOMPLETE_TIMEOUT_180S。原有 Composition R1 visualBinding 差异已复现并列为 PREEXISTING_REPO_DEBT；聚合未完成部分列为 UNKNOWN。不能宣称全仓 PASS。

48页、15图、排版/浏览器/PDF/Print、静态资产、checkpoint、恢复与缓存实现保持不变。上一阶段技术 PDF 的48页、0溢出、0缺图记录沿用，本轮不因容量工作重做出版。技术夹具仍不是新 Sol 稿，不能代表质量或中英等价验收。

审阅：tools/review/BAZI-DEEP-MANUSCRIPT-R2-MODEL-CAPACITY-ADMISSION.html

回执：content/reports/bazi/deep-manuscript/bazi-deep-manuscript-r2-capacity-admission.json

完整机器报告：docs/acceptance/bazi-paid-report/deep-manuscript-r2/CAPACITY-MACHINE-REPORT.json

停止在付费实验之前。下一步必须收到明确指令 **APPROVE BAZI DEEP MANUSCRIPT R2 CONTROLLED 3-CALL EXPERIMENT**。容量 PASS 不授权生产切换；受控实验、Human Review、HUMAN ACCEPT 和 freeze 仍待完成。

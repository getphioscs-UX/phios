BAZI-FR-C1 — BLOCKED_MISSING_NEW_ACCEPTED_MANUSCRIPTS

C1-A 仓库审计完成。C1-B–C1-L 未执行；无法把缺失原文作为不可变编辑输入，也不能完成逐段归属、语义去重或最终排版。

目标：庚申／甲子／庚辰／庚寅；己巳大运 × 丙寅年度层；新接受的 S02–S10 九章。

找到的新目标命盘文稿：

- docs/acceptance/bazi-paid-report/editorial/GEN-01-S01-HUMAN-ACCEPTED.md：2026-10-04 ACCEPT，标题“核心性格与能力”。此文件仍使用 GEN-01／Section 1 身份；不得未经完整新稿谱系核对就替代生产 S02。
- docs/acceptance/bazi-paid-report/editorial/GEN-01-AUTHORITY-PACK-R2.json：庚金目标命盘的受控写作权威，未找到本次己巳／丙寅新时序文件。

现有确定性已接受生产路径：

- functions/personal-reading/narrative/bazi-s02-s05-accepted-copy.generated.js
- functions/personal-reading/narrative/bazi-s06-s10-accepted-copy.generated.js
- functions/personal-reading/narrative/bazi-owner-acceptance.generated.js
- functions/personal-reading/bazi-section-publication.js
- scripts/check-bazi-full-report-accepted-copy-closure.mjs
- scripts/build-bazi-section-review.mjs → visual-report-page-runtime.js → publication-report-pages.js

这些历史正文绑定的是己巳／庚午／癸丑／戊午。历史 S06–S10 接受凭证为 docs/acceptance/report-narrative-t2-r1/bazi/s06-s10-actual-v1/OWNER-ACCEPTANCE.json，日期 2026-09-30；大运甲戌、34–44 岁、2026 丙午。历史 S07 是健康、S08 是时序、S09 是指引、S10 是附录，不能用于本次家庭／压力／长期周期／当前时序章节。

已搜索 docs、content、functions、scripts、tools、config，包括隐藏路径，排除依赖、Git 和构建输出；同时读取“撰写核心性格与能力”聊天，其可读取历史未包含九章原文。

明确缺失：新接受的其余八章全文及新接受的 S10 时序权威载体。当前附件是执行规范，不含九章正文。需要这些原稿的本地路径、文件附件或含全文的聊天位置，才能继续。

本次仅新增审计文件。生产文案、注册表、Human ACCEPT 凭证、视觉、命盘计算、Profile、Zi Wei、商业目录均未修改。Provider 调用次数为 0；未生成候选稿，未执行部署、发布、推送或最终冻结。

机器检查／构建／视觉验证：NOT_RUN，缺少本次候选。去重结果、内部词泄露、完整视觉绑定与时序验证均 NOT_EVALUATED，不能以旧报告检查通过代替本次验证。

CURRENT DECISION = BLOCKED_MISSING_NEW_ACCEPTED_MANUSCRIPTS

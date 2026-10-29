# PHI OS · Human Design R6 — Four-Section Authoring Handoff

**日期：2026-10-27**  
**本包：编著人审成果 + 条件消费建议 + R6 权利来源索引**  
**不是生产准入、商业授权、系统部署或 PDF 完整交付证明。**

## 这次整理了什么

- `manuscripts/SEC07.zh-Hans.md` / `.en.md`：12 节 Gates & Lines 中英正文（用户通过）
- `manuscripts/SEC09.zh-Hans.md` / `.en.md`：通过的个人化 R2 Incarnation Cross 中英正文（注意：历史正式 Cross 名称仍未核验）
- `manuscripts/SEC10.zh-Hans.md` / `.en.md`：接受后的删除整理版；**不包含原 10.7 认知解释**；10.8、10.10–10.12 清理了依赖推论
- `manuscripts/SEC15.zh-Hans.md` / `.en.md`：整图综合 R1 中英候选（已要求纳入交接，但没有单独的 SEC15 人审通过声明）
- `contracts/CONDITIONAL-SECTION-CONTRACT.proposed.json`：章节、激活位置、完整通道和个人条件的**建议**匹配规则；须映射回 repo 已有 R6 合约
- `contracts/SEC10-EXCLUSION-DECISION.json`：排除项目与避免被 SEC15 反向复用的决定
- `contracts/OWNER-EDITORIAL-DECISIONS.json`：用户编著通过与剩余生产门槛区分
- `provenance/SOURCE-AND-RIGHTS-INDEX.json`：直接来自上传的 R6 RIGHTS-REVIEW-MATRIX，保留来源工作簿坐标、身份及权利状态，不含原文
- `provenance/INCARNATION-CROSS-STRUCTURAL-WITNESS.json`：经过脱敏的四 Gate 顺序与 Cross 名称阻断信息
- `qa/SECTION-ROW-MATRIX.csv`、`qa/check_package.py`、`qa/QA-RESULT.json`：章节清单和可重复的本地结构验收
- `CODEX-IMPLEMENTATION-HANDOFF.md`：交给 Codex 的限定范围执行指令

## 严格区分 3 道准入

**Authoring Acceptance（用户接受写作风格与内容）** 不等于 **Rights/Provenance Clearance（版权及来源准入）**，也不等于 **Production Release（计算、商业与 PDF 验收）**。

| 章节 | 用户编著状态 | 内容版权 | 生产发布 |
|---|---|---|---|
| SEC07 | ACCEPTED | NOT CLEARED | BLOCKED |
| SEC09 | ACCEPTED (R2) | NOT CLEARED | BLOCKED |
| SEC10 | ACCEPTED WITH DELETION; cleaned dependent edits require targeted review | NOT CLEARED | BLOCKED |
| SEC15 | INCLUDED FOR REVIEW | NOT CLEARED | BLOCKED |

## 重要使用限制

1. 本包是从本对话编著稿整理的可审阅文本，**不包含用户历史 60 页/58 页 PDF、客户身份、第三方书籍长文或课程原图**。
2. 章节中的工作、家庭场景都是示例，不得声明为真实客户经历。
3. 所有已登记的旧工作簿内容仍是历史溯源，`registrationIsNotLicense=true`。
4. PHS Tone 可以继续出现在内部计算证据，**不能恢复 10.7 的 Cognition 解读或衍生推论**。
5. SEC09 `43/23|29/30` 是精确顺序，不能被其他顺序复用。`namedCross=null` 必须保留直到证据核验。
6. 本包未连接你的 Windows `C:/phios`，也未执行 Codex 或修改 repo。导入前先由 Codex 对比 repo 最新版本。
7. R5/R5.1 既有部分 PDF（59/70/92 页）与 240 段来源属于独立历史成果，本包不重建、不覆盖、不声称 17 节完整报告已完成。
8. R5/R6 已知 Gate/Line 779/780、Tone 117/120、编排回归 72/76 仍 PARTIAL；本包只是文本/契约结构检查，不替代修复和再次计算验收。

## 安装与下一步

解压到本机工作区中的**新独立审阅目录**（Codex 自行选择并报告准确路径），先 diff，然后与当前 R6 已有 `AUTHORING-HANDOFF` / `SECTION-CONTRACTS` / `CONDITIONAL-CONTENT-SCHEMA` 作只读匹配。保持单一 Master 审阅入口；**先不要注册到可收费生产语料**。参见 `CODEX-IMPLEMENTATION-HANDOFF.md`。

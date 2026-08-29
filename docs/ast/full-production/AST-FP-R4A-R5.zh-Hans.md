# AST-FP-R4A + R5｜专业语义人工准入与整盘综合

基线：`0692037d3a3f522de9f0eb11d37f738df3a2bae6`（SMR-R2）。

## R4A｜Professional Semantic Human Admission

R4 已完成 Angle、rulership / dispositors、element-modality、aspect patterns 与 applying / separating 的工程结构，但工程完成不等于客户语义已经获准。R4A 因此建立一条独立、digest-bound 的人工准入链。

本轮冻结 **21 条双语 candidate claims**：Angles 4、Rulership / Dispositors 4、Element / Modality 4、Aspect Patterns 5、Aspect Dynamics 4。整批 claim bundle digest：

`c2a6b66709bc5f538c6c3b7a2991c1376aee8acf0f5d2f3e2c217288e0b7d3ef`

当前状态是 **REVIEW READY，而不是 HUMAN ACCEPTED**。`ast-fp-r4a-professional-semantic-human-review-results-v1.json` 保持 `accepted=0 / pending=21`；模型不得代替人工做 acceptance。交互审核页已经生成，可逐条 ACCEPT / NEEDS_REVISION / REJECT 并导出 digest-bound decisions。

只有 21/21 exact claim digests 都有人类明确接受后，successor admission 才能把 `customerRuntimeUseAllowed` 从 false 改变。旧 R2 的 16/16 与 R4 engineering acceptance 不得转移到 R4A。

## R5｜Whole-Chart Synthesis Runtime

R5 已建立确定性的整盘综合 runtime。它不再按 Sun / Moon / Mercury 逐段堆文章，而是把独立证据组织成 3–5 个 whole-chart themes：

1. `PATTERN_NETWORK`
2. `RULERSHIP_NETWORK`
3. `ASPECT_DYNAMICS`
4. `ANGLE_FRAME`
5. `DISTRIBUTION_CONTEXT`

R5 同时生成 support / tension signals，并允许 customer intent **只改变 priority / ordering**，不得改写 underlying meaning，也不得创造不存在的证据。

当前 fixture 以 `PRESSURE` 与 `EXPRESSION` 两种 intent 验证排序会变化，而共同 theme 的语义文本保持不变。R4A 尚未获准时，R5 输出明确标记 `ENGINEERING_CANDIDATE_R4A_HUMAN_ADMISSION_PENDING`，不会伪装成客户可发布内容。

## Production boundary

当前：

- R4A review machinery：PASS
- R4A human acceptance：0/21，PENDING
- R5 deterministic whole-chart synthesis：ENGINEERING PASS
- R5 final customer human acceptance：NOT STARTED
- R3 independent ephemeris certification：仍是独立 release gate
- customer publication / production / cutover：false

下一步不是继续增加星体段落，而是先完成 21 条 R4A 人工语义审核，再为最终 R5 customer whole-chart reports 建立 digest-bound human acceptance campaign。

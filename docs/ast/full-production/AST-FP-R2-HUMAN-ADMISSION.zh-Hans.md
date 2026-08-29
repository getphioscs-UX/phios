# AST-FP-R2｜AST Candidate Human Admission / Digest-bound Acceptance

基线：`31f0cb5dcf47c1e9419ef67ac89968d06834b35d`（SMR-2）。本阶段承接已经完成的 AST-FP-R0/R1，不回写旧 SMR 48-case 人工证据，也不把机器通过替代成人工准入。

## 本阶段完成什么

AST-FP 工程候选原有 8 组独立合成出生输入，每组各有 `en` 与 `zh-Hans` 两个审阅面，共 16 个候选。R2 将已明确给出的 16/16 人工接受决定正式物化为独立 successor 结果，并对每个决定绑定：

- `caseId`
- `locale`
- `houseSystem`
- `projectionId`
- `projectionDigest`
- `compositionVersion`
- `semanticDigest`
- `interpretationDigest`
- `decisionBindingDigest`

只要投射、语义、双语解释、组合版本、locale 或宫制发生变化，旧决定就不能自动沿用。

## 文件 authority

- 候选审阅包：`content/professional/ast-full-production/review/ast-fp-review-cases-v1.json`
- 人工结果：`content/professional/ast-full-production/review/ast-fp-review-results-v1.json`
- 精确候选准入：`content/professional/ast-full-production/admission/ast-fp-r2-candidate-human-admission-v1.json`
- R2 契约：`content/professional/ast-full-production/contracts/ast-fp-r2-human-admitted-candidate-contract-v1.json`
- R2 acceptance：`content/professional/ast-full-production/acceptance/ast-fp-r2-human-admission-acceptance-v1.json`
- Gate：`scripts/check-ast-fp-r2-human-admission.mjs`

审阅包本身继续保持 `accepted: 0 / pending: 16`，因为它是可重建的 pre-admission candidate artifact。真正的人类决定只存在于 successor results / admission authority 中，避免生成器覆盖人工事实。

## R2 结果

- 独立出生输入：8
- 双语候选审阅面：16
- HUMAN_ACCEPTED：16
- rejected：0
- needs revision：0
- pending：0
- batch decision digest：`74a4f9c1d0f8cca1efcbc7f5ee9a5f2baeedcbdfa0cba5eb8b79d35d3c081a`
- 审阅宫制：`PLACIDUS_V1`
- Whole Sign：仍只有机器覆盖，不由本 R2 人工准入扩张

## 这个 admission 明确不代表什么

本阶段只接受**这 16 个准确 digest 的工程候选**，不是一个 wildcard live-customer 规则通行证。因此：

- 不建立五本研究书籍的生产使用依据；
- 不新增 canonical meaning；
- 不宣称 elements / rulership / aspect patterns / applying-separating 已完成；
- 不宣称 whole-chart synthesis 已人工验收；
- 不宣称 independent ephemeris accuracy 已认证；
- 不修改旧 R12R3B / SMR production admission；
- 不打开 AST customer cutover；
- 不部署。

当前 SMR-R2 AST benchmark 仍保留两个上游 gap：`AST_FULL_PRODUCTION_GAP_PLANET_SIGN` 与 `AST_FULL_PRODUCTION_GAP_TENSION_SELECTION`。R2 candidate acceptance 不会偷偷把这两个 gap 标成已解决，也不等于最终客户报告人工接受。

## Current-baseline maintenance

`31f0cb5` 在上一轮 `d576387` 后继续增加 SMR-R2 W12-W16 和其他方法的共享 package scripts。为了避免以后每次非 AST script 增量都被误判成 AST authority corruption，本阶段把 `package.json` 的 AST current-baseline 检查改成 **AST script projection**：只冻结 `check:ast-production`、`check:ast-full-production` 与 `check:ast-fp-r2` 的 AST authority 投影；其他方法向 package 添加独立 checker 不再要求重新声明 AST baseline。

这不放宽 AST 本身的 gate。任何改变 AST production command、AST Full Production chain 或 R2 admission checker 的修改仍会使 `check-ast-fp-current.mjs` 失败。

## 下一停点

`AST-FP-R3｜Independent Calculation Certification / Ephemeris Cross-Validation`

R3 应把独立参考计算与语义质量分开验证，覆盖时区/DST、高纬度、逆行、True Node、四轴、Placidus cusps、Whole Sign、主要相位与 orb 边界。完成后才进入 R4 professional semantic expansion 与 whole-chart synthesis，不得因为 R2 16/16 通过就直接声称 Full Production。

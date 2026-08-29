# NUM-R9–R18｜Full Production Status

基线：`main@31f0cb5dcf47c1e9419ef67ac89968d06834b35d`

状态：`FULL_PRODUCTION_ACTIVE`

## NUM-R18 Human Admission

用户在当前会话明确声明 `all human accepted`。18/18 review cases 已登记为 `ACCEPT`，全部审核 criteria 为 `true`，因此：

- `HUMAN_ADMIT_COMPLETE`
- `runtimeUseAllowed = true`
- `customerPublishable = true`
- `defaultCustomerCutover = true`

审核者身份没有被系统推断，`reviewer` 继续保留 `null`。

## 已激活能力

- NUM-R10：Missing + Repeated Digit structural runtime
- NUM-R11：经客户确认 full birth name 后的 Expression / Soul Urge / Personality / Maturity **计算**
- NUM-R12：Pinnacle / Challenge 8/8 cross-validation evidence
- NUM-R13：Life Period 三段结构码 21–40 / 41–60 / 61–80
- NUM-R14：147 / 258 / 369 与 13579 / 2468 structural grouping
- NUM-R15：独立 Energy Numerology alternative timing school
- NUM-R16：relationship structural comparison + relationship number calculation
- NUM-R17：composition + semantic dedup
- NUM-R18：default customer surface + responsive production cutover

## R13｜Life Period 公式恢复

公开 practitioner method documentation 与学习 corpus 共同支持全息图 A–X 计算链。PHI OS 冻结为：

`DDMMYYYY → A..H`

`A+B=I; C+D=J; E+F=K; G+H=L`

`I+J=M; K+L=N; M+N=O`

左侧：`J+M=W; I+M=X; X+W=S` → canonical code `XWS`

顶部：`N+O=Q; M+O=P; Q+P=R` → `QPR`

右侧：`K+N=V; L+N=U; V+U=T` → `VUT`

采用学习 corpus 的区间边界：

- 21–40 → XWS
- 41–60 → QPR
- 61–80 → VUT

公开资料常写最后一段为 61+ / 60 岁以后，因此 80 岁以后不由当前 authority 推断。

学习 corpus fixture：

- 1989-11-15 → `516 / 876 / 189`
- 1992-09-12 → `639 / 999 / 459`

均通过 deterministic cross-check。

## R15｜Alternative Numeric Timing

这不是 R8 的 Personal Year / Personal Month / Personal Day。

Flow Year：保留出生的日、月，把出生年份替换为目标年份，重新计算全息图；`MNO` 是 flow-year code，`O` 是单数 flow-year number。

学习 corpus 的四个月 phase windows 保留为独立 school rule：

- 2/1–5/31 → natal `QPR`
- 6/1–9/30 → natal `VUT`
- 10/1–1/31 → 左侧 physical display `WXS`；canonical combo 保持 `XWS`

对于 1989-11-15：

- 2024 flow year → `887`；year-pair code `268`
- 2025 flow year → `898`；year-pair code `279`
- phase display → `876 / 189 / 156`

计算 authority 只拥有结构码，不拥有事件预测。

## R16｜合盘数

公开 practitioner descriptions 对齐：双方主格 / main number 相加后继续化简到个位数。

`relationshipNumber = reduceSingle(left.O + right.O)`

例如：主数 8 + 主数 4 → 12 → 3。

本轮只激活 relationship-number **calculation** 与共同/缺失数字 structural comparison。以下仍然不开放：

- compatibility score
- good/bad match verdict
- relationship outcome prediction
- 1–9 relationship-number meaning authority

## Customer Surface

`personal-runtime.html` 新增可选输入：

- Full birth name
- explicit name confirmation
- comparison birth date

客户结果新增 `Extended number map`，一次组合：

- repeated / absent digits
- confirmed name numbers
- energy grouping counts
- Life Period structural codes
- alternative timing structural codes
- relationship structural comparison / relationship number

页面保持 responsive；移动端不再允许内容被压成逐字竖排。

## Final Gate

主 gate：

```bash
npm run check:num-r18:final
```

它验证 Human Admission、R9–R18 formulas/runtime、API customer smoke、R8 predecessor full-production gates 与 SMR-NUM continuity。

## Epistemic Boundary

这里恢复的是一个 symbolic numerology school 的可重复**计算方法**，不是对这些体系的科学有效性认证。PHI OS 不从这些公式自动创建人格事实、财富/健康/性行为断言、未来事件预测或关系结局判断。

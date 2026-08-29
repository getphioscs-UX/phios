# AST-FP-R4｜Professional Semantic Expansion

基线：`f52b6a3c4f1d94e6bf707af47f34e8c7dfca8837`

状态：`ENGINEERING_COMPLETE_R3_CERTIFICATION_AND_R4_HUMAN_ADMISSION_STILL_REQUIRED`

## 本轮目的

R4 不继续增加“逐星解释段落”，而是在既有 `CanonicalMethodProjection AST v2` 之上建立一个不改写原 projection 的专业结构 sidecar：

`Canonical AST v2 → AST Professional Semantic Projection v1`

R2 的 16/16 digest-bound human acceptance 不被重用，也不会因为 R4 自动成为客户生产准入。

## 新增结构能力

### 1. Angles

正式区分并记录：

- ASC｜上升点
- MC｜天顶
- DSC｜下降点
- IC｜天底

每个 Angle 都绑定实际计算 longitude、sign、element、modality，以及候选的双语结构意义。Angle 语义目前是 **engineering candidate**，尚未 human admitted。

### 2. Rulership / Chart Ruler / House Rulers

冻结一条不混学派的 authority：

- Dispositor chain：`TRADITIONAL_SEVEN_PRIMARY_V1`
- Scorpio / Aquarius / Pisces 的 Pluto / Uranus / Neptune：只作为 `modernCoRulerAnnotation`
- modern outer ruler **不能静默改写** chain authority

因此现在可以稳定产生：

- Chart ruler（需要实际 ASC）
- 12 house rulers（需要实际 cusps）
- 每个 core-10 planet 的 sign ruler

### 3. Dispositor Chains

R4 可以从每个 core-10 planet 出发追踪：

`planet → sign ruler → ruler's sign ruler → ...`

并区分：

- `FINAL_DISPOSITOR`
- `CYCLE`
- `UNRESOLVED`

同时输出 final dispositors 与循环 / mutual-reception-class 结构，但不把这些结构直接翻译成人格、命运或结果。

### 4. Element / Modality

本版只采用：

`CORE_10_PLANETS_UNWEIGHTED`

不会把 Sun / Moon 双倍加权，也不会把 Angles / Nodes 混入 core-10 count。

输出：

- Fire / Earth / Air / Water counts
- Cardinal / Fixed / Mutable counts
- unique distribution leader，或明确 `TIED_NO_SINGLE_LEADER`

这里使用的是 **distribution leader**，不是未经审核的“人格 dominant”。

### 5. Higher-order Aspect Patterns

只消费已经存在于 Canonical Projection 的 major-aspect edges，不自行新增相位。

R4 当前支持：

- Grand Trine
- T-Square
- Grand Cross
- Kite
- Mystic Rectangle

明确不启用：

- Yod：当前 production aspect set 没有 quincunx
- Stellium：sign / house / orb 定义尚未冻结成独立 policy

Pattern 可以重叠存在；几何 pattern 本身不产生吉凶或结果断言。

### 6. Applying / Separating

R4 使用 Canonical Projection 已记录的 `speedLongitudeDegreesPerDay`，只做结构分类：

- APPLYING
- SEPARATING
- EXACT
- UNDETERMINED

缺 speed 时必须 `UNDETERMINED`。本版不计算 perfection date、event date，也不把 applying 转成“事情将发生”。

## 为什么是 sidecar 而不是修改 AST v2

R2 的人工审核绑定了既有 AST v2 projection / composition digest。若 R4 直接把新字段塞回旧 projection，会让旧 human acceptance 的语义边界变得不清楚。

因此 R4 保持：

- `sourceProjectionMutated = false`
- `r2HumanAcceptanceReusedForR4 = false`
- `customerCutoverAllowed = false`

R5 Whole-Chart Synthesis 将消费 R4 sidecar，而不是让浏览器 renderer 自己重新推断专业结构。

## 验证

`npm run check:ast-fp-r4` 已通过，覆盖：

- 4 Angles
- Chart ruler + 12 house rulers
- 10 条 dispositor chains
- final dispositor + cycle detection
- element / modality counts + tie policy
- Grand Trine / T-Square / Grand Cross / Kite
- 独立 Mystic Rectangle probe
- applying / separating / exact
- missing-speed fail-closed
- 无 Angle / House 时 partial availability
- modern ruler silent-mixing rejection
- R2 16/16 human acceptance 保持不变

## 当前仍未宣称完成

R4 不是 Full Production cutover。仍需：

1. R3 direct runtime independent calculation certification 在 dependency-complete workspace 真正 PASS 并冻结；
2. R4 candidate angle / pattern semantic language 的 human review / admission；
3. R5 Whole-Chart Synthesis；
4. 新的最终 customer report human acceptance；
5. aggregate `npm run check` + deployment/live smoke。

# AST-FP-R3｜Independent Calculation Certification

基线：`6ef755efbf874b0f236871989e4f3ecaaeda5ccc`

R3 不增加占星意义，也不修改 R2 的 16/16 人工接受。它只回答一个问题：PHI OS 的占星计算是否能被一套与当前生产实现独立的数值参考交叉验证。

## 独立参考

本轮建立静态 Swiss Ephemeris 2.10.03 / PySwissEph reference fixture。行星参考明确使用 `MOSEPH / Moshier` fallback 与 speed；宫位使用独立 `houses_ex` 的 Placidus 与 Whole Sign。Swiss 代码、库与数据不会进入客户 Runtime，也没有被本 work 复制进仓库；仓库只保存数值 reference fixture 与验证契约。

参考只拥有数值 cross-validation 身份，不拥有占星意义、解释或客户 publication authority。

## 覆盖

参考 campaign 共 10 个输入：原 AST-FP 的 8 个独立出生输入，加上 `+05:45` quarter-hour offset case 与 Tromsø 高纬度 case。覆盖 Core 10 行星、True Node、逆行方向、ASC/MC/DSC/IC、Placidus 12 宫、Whole Sign 12 宫、稳定 house placement、五类主要相位及每类 orb inclusion/exclusion boundary。

自然相位样本已经同时覆盖 conjunction / sextile / square / trine / opposition。距离 orb boundary 小于 0.15° 的自然 pair 不承担 hard cross-engine verdict；每一个 aspect type 另外必须通过 exact orb 与 `orb + 0.0001°` 的 synthetic boundary test。

## R3 发现并修复的 calculation defect

旧 `calculateAngles()` 直接使用 horizon intersection 的一个解作为 Ascendant。大多数普通纬度输入恰好落在 rising branch，因此历史 8 个 R2 fixtures 没有出现变化；但在 Tromsø 2020-12-21 的 Whole Sign case 中会选到相反的 horizon intersection，误差接近 180°。

R3 改为在 `raw` 与 `raw + 180°` 两个候选之间，用 ecliptic → equatorial right ascension 与 local hour angle 选择 eastern/rising branch。

独立 shadow comparison：旧值误差约 `179.995275°`；修复后约 `0.004725°`。Placidus 的极区 fail-closed 规则保持不变；Whole Sign 在极区仍必须可用。

## 容差

Core 10 与 True Node：0.05°；ASC/MC/DSC/IC 与 Placidus cusps：0.06°。Whole Sign cusp 必须落在同一精确 30° sign boundary。逆行只在 independent speed 的绝对值达到 0.01°/day 以后承担 hard direction verdict，以避免 stationary 附近的数值符号噪声。

## 当前 gate 状态

`node scripts/check-ast-fp-current.mjs` 与 `npm run check:ast-fp-r2` 已通过。本执行环境中的附件没有 `node_modules/astronomy-engine`，所以 `npm run check:ast-fp-r3` 当前在 module resolution 阶段停住，而不是 assertion failure。

因此本 work 当前状态是：reference、contract、production bug fix、strict runtime checker 与 aggregate wiring 已完成；**不能在没有实际 `npm run check:ast-fp-r3 = PASS` 的情况下把 `INDEPENDENT_EPHEMERIS_ACCURACY_CERTIFICATION` 标记成 established。**

依赖完整的工作区只需执行：

```bash
npm run check:ast-fp-r3
```

通过以后才可以冻结 R3，并进入 AST-FP-R4 Professional Semantic Expansion。

# AST-FP-R0 → R1｜Baseline Reconciliation + SMR-R2 W0–W8 Regression Closure

基线：`d576387f33e2a1ca76f196dba5059e15499d1b4d`（`NUM`）  
输入工作区：Library `docs(2).zip`

## R0｜Current Baseline Reconciliation

历史 `abab6b3` W0–W2 checkpoint 与 `2211d9b` AST engineering baseline 保持原样，不回写历史证据。

在 `d576387` 工作区重新核对 AST Full Production 的 64 个 protected files 后，旧 AST current baseline 只剩一个 drift：`package.json`。该 drift 来自 `c9f0970` 之后共享 orchestration 的继续推进，包括 SMR-R2 W9–W11 与其他方法的后续 checker；它不是 AST calculation / projection / meaning / candidate / admission authority 的改变。

因此 R0 把该行重新分类为 `SHARED_MAIN_SUCCESSOR`，冻结 `d576387` 的 normalized package digest，同时保留 `check:ast-production` 与 `check:ast-full-production`。

R0 不做以下事情：

- 不把旧 48 SMR human review 改成 accepted；
- 不开放 AST customer cutover；
- 不准入新的 AST meaning 或 composition rule；
- 不回滚 BaZi / Zi Wei / ECR / Numerology 已进入 latest main 的 successor。

## R1｜R2-W0～W8 Regression Closure

`d576387` 已包含 structured upstream interpretation detail 的 admission-boundary successor。Narrative IR 只允许消费 `kind=UPSTREAM_INTERPRETATION_DETAIL` 中已经进入 Claim IR 的：

`structuralReason / relationContext / constructiveExpression / frictionExpression / activationConditions / observableSignals / alternativeInterpretations`。

这解决了早先 AST `relationContext` 被 W8 误判为 non-admitted narrative text 的 regression，同时没有放宽 renderer-created meaning 边界。

当前 AST regression 结果：

- claims: 3
- themes: 3
- eligible: `OVERVIEW / SUPPORT_TENSION / REALITY_QUESTIONS`
- primary themes: 3
- renderable narrative blocks: 10
- suppressed narrative duplicates: 9
- `TIMING` 仍 fail-closed
- exact renderable text owner 仍唯一

## Gate

必须通过：

```bash
node scripts/check-ast-fp-r0-r1-reconciliation.mjs
node scripts/check-ast-fp-current.mjs
npm run check:cx-r12r4b:smr-r2-w0-w8
npm run check:ast-full-production
```

通过后才进入 `AST-FP-R2`，即 AST candidate 的新 digest-bound human admission；旧 SMR 48 份结果不得拿来替代。

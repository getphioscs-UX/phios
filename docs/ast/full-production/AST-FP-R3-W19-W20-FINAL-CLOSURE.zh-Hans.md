# AST-FP R3 → R2-W19 → R2-W20 最终收束

基线：`a06506cbbc9bf0bdd11ff1c740f7be65276d84d9`。

## R3 Certification Freeze

用户已明确报告在依赖完整的 latest-main 工作区执行 `npm run check:ast-fp-r3` 得到 `PASS`。本次 freeze 将这项事实记录为 `USER_ATTESTED_DIRECT_COMMAND_PASS`。由于对齐 ZIP 不含已安装的 `node_modules`，本次打包工作不伪造第二份本地 console log。

R3 只建立 independent ephemeris / angle / house / aspect calculation certification；它本身不授予客户解释、客户报告或 production cutover。

## R2-W19 AST-only production admission

W17 = 241/241 machine accepted；W18 = 24/24 final customer report human accepted；R3 = certified。因此 `methodFlags.AST = true`，且 BZR / NUM / ZWR / ECR / legacy SMR-48 都不是 AST cutover 依赖。

## a065 shared-surface reconciliation

latest main 的 Zi Wei successor 建立了 Zi Wei Full Production target-context / product path，但同时移除了 earlier AST workspace 的 shared Personal API/UI binding。本 successor 只恢复 AST 的受治理 binding，并保留 Zi Wei 当前时间层与 Full Production product，不回滚 Zi Wei。

## R2-W20 exact deployment / smoke / freeze

源码现在处于 `AST_ADMITTED_AWAITING_EXACT_DEPLOYMENT_AND_LIVE_SMOKE`。最终 `AST_FULL_PRODUCTION_FROZEN` 必须在这份 delta 被 commit/deploy 后，由 Cloudflare live environment 返回 exact `CF_PAGES_COMMIT_SHA`，并通过：canonical HTML、customer assets、consent boundary、AST end-to-end API、exact deployed commit 五项 live gates。

运行：

```bash
PHIOS_AST_SMOKE_BASE_URL=https://<production-host> \
PHIOS_AST_SMOKE_EXPECTED_COMMIT=<deployed-40-char-sha> \
PHIOS_AST_SMOKE_PLACE_REF=<valid-governed-place-ref> \
PHIOS_AST_SMOKE_EVIDENCE_OUT=ast-r2-w20-live-smoke-evidence.json \
npm run smoke:ast-r2-w20-live

node scripts/finalize-ast-r2-w20-freeze.mjs ast-r2-w20-live-smoke-evidence.json
npm run check:ast-r2-w20
```

在真实 live smoke 之前，`astFullProductionFrozen` 必须继续为 `false`。

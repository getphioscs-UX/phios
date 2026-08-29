# AST-FP R2-W17～W20

Baseline: `343773fd6fb61fbf1b37aa861537d7e8f091ec24`

## R2-W17｜Production Machine Campaign

241/241 machine assertions PASS，覆盖 10 组 source birth cases、10 种 birth time、纬度 -34.6°～69.6492°、Placidus / Whole Sign、6 类 intent、en / zh-Hans、12 个 partial optional-kinematics surfaces，以及 1 个预期 Placidus polar fail-closed。Machine acceptance 不替代 human review，也不替代 R3 independent ephemeris certification。

## R2-W18｜Final Customer Human Acceptance

最终 24 个 digest-bound customer reading/workspace cases 已由授权 human reviewer 确认 24/24 ACCEPT。每案绑定 canonical projection、customer reading、workspace、review payload 与 decision digest；旧 16 candidate、R4A 21 semantic admission、legacy SMR 48 均没有被拿来替代 final-report acceptance。

Human gate 状态：`HUMAN_ACCEPTED_24_OF_24`。

## R2-W19｜AST Method-Scoped Production Admission

W17 与 W18 已满足。AST admission 不依赖 BZR / NUM / ZWR / ECR，也不依赖旧 SMR-48 gate。当前唯一未满足的 AST-owned prerequisite 是 `AST-FP-R3 independent ephemeris runtime certification PASS`，因此当前 `methodFlags.AST=false`、`customerCutoverAllowed=false`。一旦 R3 真正 PASS，现有 evaluator 的 positive probe 已证明 AST 可独立变为 `true`。

## R2-W20｜Deployment / Live Smoke / Freeze

Canonical route、desktop/mobile/print local gate、rollback plan 与 live smoke script 均已准备。当前尚未部署此 delta，也未对 exact deployed commit 完成 Cloudflare live smoke，因此不得宣称 `AST Full Production FROZEN`。

当前 release blockers：

1. AST-FP-R3 independent ephemeris runtime certification；
2. 由 R3 解锁后的 R2-W19 AST method-scoped admission；
3. exact deployed commit 的 Cloudflare live smoke。

生产 freeze 必须在上述三项全部为 PASS 后才可写入。

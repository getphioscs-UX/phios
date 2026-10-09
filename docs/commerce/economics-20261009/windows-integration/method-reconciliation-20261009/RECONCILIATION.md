# 八字、易经、占星当前版本对账 — 2026-10-09

核验 HEAD：920a8eb130afa4c27b55b4ba1cd2fab86de75a35。按当前实际源码与凭证对账；未改正文、方法准入、冻结哈希或生产开关，未重新开始已接受的内容工作。其他窗口的工作区修改保留。新增 provider 调用、付款、部署、生产迁移、commit/push 均为 0。

## 八字

**当前版本与入口。** 方法层保留 BAZI-FP 历史生产准入及 R2 结构 successor：`functions/api/bazi-full-reading-r2.js`；个人客户入口为 `/api/customer-personal-reality`，通过 `buildBaziMethodNativeReading` 和 `functions/personal-reading/bazi-customer-publication.js` 投影。当前深度参考出版是 `DEEP_MANUSCRIPT_R2_READABILITY_R4`；其双语、英文、中文审阅文件在 `tools/review/BAZI-DEEP-MANUSCRIPT-R2-PUBLICATION-REVIEW-R2-{BILINGUAL,EN,ZH-HANS}.html`。`functions/personal-reading/deep-manuscript/bazi-paid-generation.js` 明确只是 producer adapter，未启用 HTTP/生产准入；不能把参考审阅文件当作新账户付费报告入口。

**已有 Human ACCEPT。**

- `content/professional/bzr-full-production/acceptance/bazi-fp-w18-human-acceptance-v1.json`：24/24 精确候选通过；它自身不开放生产。随后 `bazi-fp-w19-production-acceptance-v1.json` 明确历史方法层 `productionAllowed/customerPublishable=true`。这是合法方法准入，保留，不降回旧 W18 pending，也不自动延伸至当前生成式付费正文。
- `docs/acceptance/bazi-paid-report/composition-r1/HUMAN-ACCEPTANCE.json`：2026-10-01 ACCEPT；内容、语义深度、事业、财富、guidance、section master 和 38/38 页 Composition R1 参考实现已冻结；凭证明确 `subjectBinding=PENDING`、`productionAdmission=PENDING`、`commerceE2E=NOT_PROVEN`。不得要求重写其已接受内容。
- `docs/acceptance/bazi-paid-report/deep-manuscript-r2/owner-acceptance-r3-4/2026-10-08T01-45-53-624Z/HUMAN-VISUAL-ACCEPTANCE-R2.json`：明确接受 Readability R4 的三种视觉出版模式，每种 48 页、15 图；scope 为 VISUAL_PUBLICATION_ONLY，manuscriptDigest `2cc520d1e7f1eafb46e9f16e565b9f4793c756ad8ad7fabca44a130ede57c2c9`。本轮计算三份 HTML 的原始 SHA256，全部与凭证一致；此验收有效，不复制旧“全部待审”。它不授予通用主体正文、生产冻结或支付交付准入。

**尚缺证据。** 当前账户可用的主体、出生及选定时间绑定正文；新主体生成的专业语义/中英一致性审核；实际 producer 到账户持久化、renderer、release 的接线与真实输出验证；当前版本部署与账户付费交付证据。`functions/report-delivery/bazi-accepted-copy-coverage.js` 明确参考稿不能覆盖新主体，当前账户返回 `PUBLICATION_UNAVAILABLE`；`config/reports/bazi-deep-manuscript-r2/policy.json` 仍 `productionActivated=false`、`REPORT_PROVIDER_LIVE_ALLOWED=false`。本轮 prelive/final-closure PASS 是局部机器证据，不能覆盖这些缺口。

**旧台账解释。** Deep R2 `STATUS.md` 写“受控三次调用尚待授权”，但 `CONTROLLED-EXPERIMENT-APPROVAL.json` 与 `LIVE-EXPERIMENT-RESULT.json` 已记录特定参考实验授权及 3 次执行、MANUSCRIPT_COMPLETE；旧状态在这部分已被后续证据取代。`USAGE-RECONCILIATION.json` 已有 3 条 non-fixture RECORDED usage，费用 0.174336 + 0.149056 + 0.123680 = USD 0.447072，与用户报告总数一致；其 verifiedPriorUsage 仍 null，独立账单证明未取得。不能继续写“完全没有 usage 记录”，也不能声称账单已独立核验。Final closure 的 `humanAccepted=false` 与视觉 ACCEPT 的适用范围不同：最终内容/生产尚未闭环，已接受视觉不重开。

**Codex 下一步。** 保留已接受稿件与图示，完成当前 subject/timing authority、producer→账户材料→renderer/release 的零成本接线及负向回归；先完成所需的专业验证契约与真实生成评估方案，再按明确授权执行付费生成。历史稿件仅作为参考/回归，不能复制进新主体报告。本轮已修复 visual-commerce 检查与 fail-closed successor 的冲突，并保留独立历史渲染回归。

**你需要审核。** 只审核新主体真实生成正文的适用性、语义和双语一致性，以及当前付费产品的准入/交付；不重复审核 Composition R1 和已接受的 R4 视觉。未具备真实输出时不请求空泛最终 ACCEPT。

## 易经

**当前版本与入口。** 单一指针 `content/production/symbolic-method/authority/iching-current-authority.json` 指向 release `ICHING-1.0.1`。实际前台 `assets/customer-ui/js/surfaces/iching-casting.js` 请求 `/api/iching-full-cast`，实现为 `functions/api/iching-full-cast.js`，由 `functions/iching-full-production/iching-full-production-v1.js` 判断运行权威。当前契约是 release-scoped FULL_PRODUCTION，明确 guest persistence 须主动 consent；这是源码/权威契约，非本轮 live 状态证据。

**已有 Human ACCEPT。** `content/production/symbolic-method/human-review/iching-depth-human-review-aggregate-attestation-v1.json`：TL 确认双语 448/448，64 卦、384 爻，critical boundary failures=0；candidateSetDigest `e2f7e55060f740e3c1e0414a92118f147b8a10b9a49bfb24bbc0bdb00327b6a6`，适用精确深度语料，不伪造逐条截图。`content/production/symbolic-method/acceptance/iching-final-limited-production-acceptance-v1.json` 保留 W33 有限生产验收；release manifest 明确保留 448 深度验收及 896 双语 runtime cases，不重开正文。

**旧台账解释。** `iching-limited-production-current-successor-v3.json` 和 depth v7 的 FULL_PRODUCTION_PENDING 是历史有限生产阶段；当前 authority 指针与 `releases/iching/ICHING-1.0.1.json` 已指定独立 release 契约，并声明旧 successor audit-only、普通网站 commit 不撤销 release。不得仅照抄 v3 pending，也不得仅凭 targetState=FULL_PRODUCTION 声称当前线上已启用。

**尚缺证据。** 本机未找到 current authority 指定的 `.runtime-evidence/iching-full-production-live-evidence-v1.json`，本轮未读取远程 D1 运行权威/调用记录，因此当前部署、全球执行和实际客户保存读取标记 RUNTIME_UNVERIFIED。既有 W31/W32/W33 历史 live/observation 证据保留，不冒充本轮状态。仪式 successor 仍 humanSensoryAcceptance=PENDING、deployed=false。

**当前真实失败。** `check:iching-current` 退出 1，子检查 `scripts/check-iching-release-freeze-current.mjs:22`：RITUAL_DEPENDENCY_DRIFT。对象 `assets/customer-ui/js/surfaces/ritual-sequence.js`，expected `edae75008b0139a0eda8b5833fc7c5dd90ba3961bb135be672de863bf7255159`，actual `ef1186985855818c07901abcd6b15bcd80d9cac1fbbafe9338419718de36507c`。Git commit `295dec1c968721d714f469376f7e182a5f38d58d` 将共享 ritual 从 120000ms 改为 1800ms，并加入立即继续，影响易经的共享依赖。这是 BASELINE_FAILURE；没有改冻结哈希或断言制造 PASS。内容验收保持有效，仪式行为的合法 successor 与方法隔离仍需处理。

**Codex 下一步。** 对共享 ritual 的 Tarot 修复与易经需求作局部所有权/影响核对，先隔离或形成有依据的仪式 successor，补六爻次序、取消、后台与重复提交的零费用回归；不得重写 448 项内容或撤销其他窗口 Tarot 修复。随后只读取得可授权访问的 release/D1/deploy/call evidence，验证 consent、save/read；取不到继续列具体缺口。

**你需要审核。** 仪式交互的感官/时间体验；若出现新的语义变化才审相关增量。当前 release 全球执行准入/客户交付仍需独立运行证据。既有 448 内容 ACCEPT 不重开。

## 占星

**当前版本与入口。** AST 方法与客户读取有 R2/W19 方法独立准入、R5 whole-chart synthesis，以及 AST-VFR-R1R5 参考出版系统；Teng 的 R1R6 是待执行新主体实验，并非已完成 successor 交付。实际 `/perspectives/personal/` → `/api/customer-personal-reality` → `/api/ast-structural-execute`、`functions/customer-projection/astrology-customer-reading.js`；`/api/ast-full-production-status` 报告方法独立准入与部署 SHA。R1R5 参考审阅为 `tools/review/AST-VFR-R1R5-TL-BILINGUAL-PUBLICATION-REVIEW.html`；不能把本地参考 HTML 等同账户付费交付。

**已有 Human ACCEPT。**

- `content/professional/ast-full-production/admission/ast-fp-r2-candidate-human-admission-v1.json`：16/16 精确 digest-bound 工程候选，8 出生输入×2 语言；PLACIDUS_V1；无通用/wildcard 准入。
- `content/professional/ast-full-production/customer-reading-v2/review/ast-r2-w18-final-customer-human-review-results-v1.json`：TL 24/24 最终客户候选已接受。`functions/ast-full-production/ast-r2-production-admission-authority.js` 的 W19 允许 AST 独立切入，不等待其他方法。
- `content/professional/ast-full-production/manuscripts/accepted/ast-r5-tl-reference-01-zh-hans-v1.json`：TL-REFERENCE-01 中文已接受，12 章；digest receipt 的 contentDigest `ce713a64c4a5203c1ad05270b732e63bbb3253df28a064332425297ce214c9ef`。本轮 accepted-zh-copy PASS，未重写。
- `content/professional/ast-full-production/publication/r1r5/human-english-manuscript-acceptance.json`：2026-10-08 明确 HUMAN ACCEPT AST-R5 ENGLISH MANUSCRIPT；同一参考客户，contentDigest `0e51e2c93940736482a04779c5211a7fb4f4691b39c2ccffe14aca7ad807eccd`。排除生产、三调用架构、unseen customer、shared E2E。
- `content/professional/ast-full-production/publication/r1r5/human-publication-system-acceptance.json` 与 `ast-vfr-r1r5-diagram-human-acceptance.json`：R2 双语 editorial、section master、位置字体、固定 renderer/图示和未来视觉 invariant 已接受；无生产激活或新主体架构 ACCEPT。

**旧台账解释。** R1R5 出版系统凭证里的 englishHumanAcceptStatus=PENDING 是它记录时的快照；同目录稍后的 English manuscript acceptance 和 final-status=enManuscriptStatus HUMAN_ACCEPTED 已取代这部分 pending。不能再安排 TL 英文重写/重新生成。更早 `cx-r12r3a-astrology-runtime-completion-acceptance-v1.json` 的 human pending 也不能否定 W18/W19。旧 W20 deployment-readiness 写 pending，但 `customer-reading-v2/freeze/ast-r2-w20-full-production-freeze-v1.json` 明确历史 AST_FULL_PRODUCTION_FROZEN：deployedCommit `1cb363ae4fe9b45b2206f5e1ec22d4a166345e99`、2026-08-29 smoke、全部 release gates=true。保留历史部署通过；它不证明现在 R1R5/R1R6 付费产品已部署。

**尚缺证据。** 新主体 R1R6 的实际三调用生成、专业语义/整盘一致性与双语审阅；当前 generated product 与 renderer/release、账户材料及 followup 的接线；R1R5/R1R6 对应当前部署 SHA、客户打开/下载/四问与重放交付证据。参考出版 final-status 仍 productionAllowed=NO，threeCallExperiment=NOT_RUN。当前线上状态 RUNTIME_UNVERIFIED；历史 W20 proof 不作为当前新产品 proof。

**Codex 下一步。** 保留 TL 双语与出版系统，复用已准备的新主体 canonical input、authoring pack、三批请求与现有 provider adapter；先零成本验证主体隔离、契约、预算、resume、失败关闭及整盘 domain validator。获得适用授权后只执行原计划三次，生成成功后物化新主体摘要与可审阅结果，不重新生成 TL。

**你需要审核。** 新主体生成的专业准确性、整盘关系和双语正文；三调用架构是否达到产品要求；最后审当前付费生产与客户交付。已接受 TL 中文、英文、diagram、publication system 均不重开。

## 付费授权与剩余预算

| 方法 | 已有授权/消耗 | 当前可执行剩余 |
|---|---|---|
| 八字 | 2026-10-06 特定 BDM-R2-REFERENCE-20261006-01 一次实验：3 normal、至多 2 conditional technical recovery；结果已记录 3 normal、USD 0.447072 | normal=0；recovery 只是条件上限，非自由新增额度。新主体不在该参考实验授权内。美元剩余无法从旧计划估价与未独立核验账单推导；本轮不追加 |
| 易经 | 当前确定性语料/起卦核验无需 provider | 新 provider 调用=0，未找到本轮适用授权，不创建预算 |
| 占星 | R1R6 preflight 记录 Human“继续三次calls”，新主体实验范围，已执行=0；计划 3、automatic retry/repair=false，configuredWorstCaseUsd=2.46178 | 计划剩余 3，但 preflight 状态为 AWAITING_EXPLICIT_OPENAI_PAYLOAD_AND_SPEND_AUTHORIZATION，记录 prior auto-review 因敏感出生/盘面 payload 及付费授权拒绝，requestsSent=false。这是计划上界，不是已批美元预算；本轮不调用、不追加 |

上述占星自动审核拒绝来自仓库历史 preflight，不是本轮新拒绝。它要求明确外发目的地/载荷及付费授权；当前请求要求先零费用工作，未据此重试付费执行。

## 本轮实际零费用核验

`CHECKS.json` 与同目录日志记录 6 项真实命令，均在同一 HEAD 执行：八字 prelive/final-closure、占星 R5/accepted-zh-copy/bilingual-publication 退出 0；易经 current 退出 1，BASELINE_FAILURE。另 `node scripts/check-ast-fp-zero-cost-current.mjs` 退出 0，保留 64 historical protected files、23 research files。`npm run check:bazi-visual-commerce` 完整链退出 0，包括 print shell、视觉投影和商业映射；当前账户 subject-copy admission 关闭与历史 review renderer 分开验证，报价核对当前 canonical Commerce authority（RM59），不硬编码历史 RM39。

本轮仅修改对账文档/证据和 visual-commerce 兼容回归；未开放任何真实报告生产开关。SOURCE 是上述局部结果；DEPLOYED/LIVE_CUSTOMER 当前新产品证据未齐，不能标为付费产品完成。下一阶段应按每项具体缺口推进，不重新开展已有 Human ACCEPT 的内容工作。

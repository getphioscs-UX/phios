# PJA-W3R1｜Scalable Knowledge Article Production Workflow

## Baseline and Result

Repository: `getphioscs-UX/phios`  
Branch: `main`  
Baseline: `2299e008f503a4adda590c460e8734fac5500393`  
Status: `PJA-W3R1-v1.0.0-Frozen`

W3R1 establishes a scalable article-production workflow without bulk-generating articles, approving content, producing exports, publishing, generating Figure assets or changing the public website. `KN-PREFACE-001` is the single Pilot fixture.

## TL 如何制作一篇文章

1. 选择已经 `production_ready` 的 Canonical Node，并提供完整书稿、明确选择范围的书稿片段，或由 TL 批准的写作 Brief。
2. 运行 `npm run knowledge:prepare -- <NODE_CODE> --dry-run` 查看计划；确认后使用 `--apply`。系统建立 Governed Production Package，但不会生成 Export 或 Publication。
3. TL 只编辑 `content/knowledge/production/<node-code>/draft.md`。Registry、C1、C2、C3、Bindings、Coverage、Metadata、Hash 与 Index 均不需要 TL 手动维护。
4. 运行 `npm run knowledge:review -- <NODE_CODE>`。系统检查 Canonical fidelity、Boundary、Claims、Sources、重复、Style、Readability、Continuity 与 Figure，并显示当前 draft hash。
5. 自动检查通过不等于批准。TL 使用 `knowledge:approve` 明确记录 `approved`、`changes_required` 或 `rejected`。有 blocking finding 时，系统不得接受 approved。
6. 只有 Human Editorial Approval 与当前 draft hash 一致、所有质量门禁通过、Required Figure 完成后，`knowledge:export` 才能进入 Production Export。Export 不会自动发布。
7. Publication 必须使用独立 Publication Approval；成功 Export 不能自动把文章标记为 Published。

Pilot 当前状态是 `human_review_blocked`：Canonical Thesis、mustEstablish、requiredDistinctions 与 Claims 均达到 100%，Source unknown 为 0；现有确定性初稿仍有段落过碎和治理指令式语言，需要 TL 在唯一的 `draft.md` 中进行真正的编辑，同时 Required Figure Asset 尚未进入 PJA-W3F，也不存在 Human Editorial Approval。Export 与 Publication因此正确阻断。

## Source Manuscript Intake

完整原文使用 `--source <relative.md> --provided-by <human> --provided-at <ISO time>`。路径必须位于仓库内且为 Markdown。选择长书稿片段时，`--start-heading` 与 `--end-heading` 必须同时给出，系统记录 selected hash；不得用模糊关键词截取。只有明确主题时，应提供包含核心思想、必需点、允许/禁止例子、语气、长度、来源基础和人类批准的 Brief。Blueprint 标题本身不是写作依据。

## System、AI 与 TL 的职责

### System

系统读取 Canonical 与 Production Authority，保存 Source provenance，准备 Package，计算 hash，重建只读 Bindings，执行 coverage、style、duplication、readability 与 Figure 检查，投影 Portfolio，并在 draft 改变时把旧批准视为 stale。

### AI

AI 可以在 `governed_projection` 下重组段落、忠实转述、连接已批准 Claims、从书稿展开、压缩重复、增加过渡与已批准例子。AI 不得修改 Canonical Thesis、扩大 Boundary、发明 Claim/Source/事实、诊断读者、推荐服务、批准内容或发布。Model metadata 不是内容 Authority。

### TL

TL 提供或批准原始写作依据，只编辑 `draft.md`，决定例子与表达是否可接受，处理 Review findings，并独立作出 Human Editorial Decision 与 Publication Approval。Style Bible、Archetype、Prompt 或 Checker 的学习建议仍须 TL 批准后才能升级。

## Article Archetypes

系统冻结七种 primary archetype：机制解释、概念区分、形成过程、结构关系、边界澄清、误解纠正与应用理解。每个 Node 必须选择一个 primary archetype，最多一个 secondary archetype。Archetype 定义结构可能性而不是逐字模板；300 篇文章不得复制同一个 Lead、段落骨架或结尾。

## 300+ Production Strategy

### Pilot

1 个 Node，用于冻结 Intake、Draft、Review、Human Decision、Figure 与 Export 门禁。当前 `KN-PREFACE-001` 即 Pilot。

### Wave 1

最多 8 Nodes。重点观察 TL 删除的 AI 套话、术语修正、段落重排和被拒绝例子，不追求速度。

### Wave 2

最多 12 Nodes。验证不同 Archetype、Part 与 Source 组合，确保不把 Pilot 模板复制到所有文章。

### Mature Waves

每 Wave 最多 24 Nodes，保持 Canonical order，并按 Readiness、Part、语言与 Archetype 分布规划。不得一次生成或批准 300 篇。

### Quality Learning Loop

每个 Approved Node 记录 AI draft hash、final draft hash、human edit diff、删除表达、新增解释、重排章节、拒绝 Claims 与 Style corrections。Wave 结束后只能提出 Style Bible、Archetype、Prompt 与 Checker amendment candidates；不得自动修改 Canonical Authority 或 Style Bible。

## Production Portfolio

`production-portfolio.json` 从既有 Registry 与 C3 Authority 投影 Book、Part、Node、Archetype、Readiness、Draft、Review、Export、Publication、Language 与 Wave。它有 78 entries，但明确标记为 `derived_projection_only` 和 `secondCanonicalRegistry: false`，不能成为第二 Registry。

## Quality Gates

文章批准前必须同时满足 Canonical Thesis Coverage 100%、mustEstablish Coverage 100%、Required Claim Coverage 100%、Unknown Source 0、Unsupported Factual Claim 0、Blocking Boundary Violation 0、Unresolved Required Figure 0，以及有效 Human Editorial Approval。同时必须完成 duplicate、style、terminology 与 continuity review。系统不使用单一 AI 分数代替多项证据和人类决定。

## Figure Workflow

Figure Decision、Figure Brief、Figure Asset、Figure Review 与 Figure Binding 是五个不同阶段。Prepare 只根据 Canonical Figure Decision 生成 `figure-brief.json`；其 `assetGenerated` 固定为 false。图片属于未来 `PJA-W3F｜Figure Production`。Required Figure 未完成时不得 Export；Optional Figure 可依 Boundary 决定无图导出。

## Multilingual Boundary

中文是 primary editorial authority。英文只能从 Approved zh-Hans Draft 形成 Translation Candidate，并经过 Terminology Validation、Human Language Review 与 English Approval。翻译不得扩大 Claim、改变 Boundary、增加 Example 或改变 Source role。

## Check Strategy

编辑一个段落后运行 `npm run check:pja:node -- <NODE_CODE>`，它只检查当前 Node 和直接 Authority，不运行全仓检查。阶段冻结或跨节点变化运行 `npm run check:pja`，每个 active checker 只执行一次。提交前、CI、Release 和 Production Freeze 才运行完整 `npm run check`。

本次同一环境实测：Node check 为 0.232 秒（内部检查 3 ms）；PJA check 为 8.667 秒，22 个 checker 全部唯一执行且重复次数为 0；完整仓库检查为 12.318 秒并通过 postcheck。

## ZIP and Git

新的累积 W3R1 delta ZIP 已包含未进入 main 的 W3R 基础文件，因此旧 W3R ZIP 不再需要单独下载。解压后的实际文件应 commit；delta ZIP 本身不应 commit，也不得同时提交解压文件和同一 ZIP。

## Explicit Non-Actions

本阶段没有修改 Canonical Registry、Blueprint、C1、C2、C3、Source Registry、Supporting Questions、旧 W3A Package 或 Published Articles；没有自动批准，没有真实 Export，没有 Publication，没有 Figure Asset，没有修改 Website、Runtime、Professional Workspace、Provider、Payment、Entitlement 或 D1，也没有 commit 或 push。

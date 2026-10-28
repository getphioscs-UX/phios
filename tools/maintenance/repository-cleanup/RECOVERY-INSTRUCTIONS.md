# 已移除 worktree 的源码恢复说明

恢复包在 `C:/phios-recovery/20261028`，仓库外、同一 C 盘的小型保全；不是大型源码检出或可公开发布资料。包内可能有私人本地 QA 证据，勿上传公共资产或纳入 main。

| 任务 | 保留引用 | 原 HEAD | 已验证包 |
|---|---|---|---|
| pr6 | codex/pr6-ebook-closure-20261025 | 19aa304555ef404c76cdac5f7e9e8df584c18cea | C:\phios-recovery\20261028\pr6-source-recovery.zip |
| tarot | fix/tarot-read-only-execution-20261027 | e6fbd2cf9ede763acf81c1c5065f73ee9abf63bf | C:\phios-recovery\20261028\tarot-source-recovery.zip |
| pages | codex/recovery-pages-20261028 | df56c57b9272365d2e221406fd9cc9cdd8407235 | C:\phios-recovery\20261028\pages-source-recovery.zip |
| narrative | codex/recovery-narrative-20261028 | a8bf5f1f92a9b86446c62c05f86de4b431c58874 | C:\phios-recovery\20261028\narrative-source-recovery.zip |

每包包含原状态、逐文件路径／SHA256、删除记录、raw modified/untracked files、tracked/staged/unstaged binary patches。忽略规则中的手写 .mjs/.py/.sql 等也已保全。ZIP CRC、归档回读 SHA256 和独立 Git index 的二进制补丁检查通过；没有为验证而再建完整检出。

开发恢复时：

1. 先切换旧窗口的已不存在 cwd。不要在旧路径直接运行任务。
2. 确认分支 SHA 与上表一致，使用 `scripts/new-local-task-worktree.ps1` 指定新路径、`codex/` 分支和必需 sparse paths。先空间预检；本轮不执行重建。
3. 解包到小临时目录，核对 MANIFEST 与归档 SHA。先 `git apply --check --binary tracked.patch`；只在对应原 HEAD 上恢复。不要将不同任务混到 main。
4. 按 MANIFEST 将 `files/` 下文件逐路径恢复到任务工作区，并执行其明确删除记录；所有路径必须在目标工作区内。这样保留二进制和原始字节。若要恢复原 staged 状态，单独对原 HEAD index 应用 staged.patch，不能盲目 git add 全部。
5. untracked／ignored helpers 仍保持原身份；依赖与生成垃圾没有打包，按锁定依赖和各任务 current 输出规则重建。重跑只限被恢复／改动依赖影响的检查。
6. 核对 `git status`、文件 SHA 和原始记录；不自动 commit、push、merge 或部署。

旧 P9／构建快照的独有源码另有 `old-snapshot-*-unique-source*.zip`，身份在 CURRENT-SNAPSHOT-RETIREMENT-PLAN.json。其余逐文件记录指向保留 Git refs 下的精确 blob，或明确标记可重建／退役历史媒体。内部 .git 元数据、r2-commit-candidate Git 数据及紧凑历史收据没有删除。工作区清理没有改写任何历史接受事实。

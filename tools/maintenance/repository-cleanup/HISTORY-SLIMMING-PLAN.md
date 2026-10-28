# Git 后续瘦身方案（本轮未执行）

本轮只删 Git 明确列为 garbage、超过14天且排除并发读写占用的临时文件，不删有效对象、注册 pack、分支、reflog、LFS。188 个近期临时文件继续保留，见 NEXT-REVIEW-CANDIDATES.csv；需核定创建任务与恢复依赖，不按名字直接删除。

## 优先顺序

1. 近期临时垃圾在创建任务／恢复归属明确或满足过期条件后，按同样机制单独复核。不能把 valid loose objects 当垃圾。
2. 先评估普通无历史改写的受控压缩。当前 loose 对象很多，可能存在跨版本压缩收益，但未运行实验，收益 UNKNOWN。未来只在已备份、无 Git 写入、空间充分时考虑 `git gc --prune=never`；不清 reflog、不删除未合并分支。本轮没有运行，也没有关闭自动维护或改全局配置。
3. 如仍需历史改写，使用外部物理盘上的全新隔离 mirror，逐项批准 HISTORY-CANDIDATE-PATHS.txt；禁止在当前共享仓库试改。正式原稿、正式视觉、模板、当前夹具、客户订单／交付资料不在自动删除范围。

## 精确候选与收益

候选 1697 个实际历史路径，完整清单在 HISTORY-CANDIDATE-PATHS.txt，逐对象和引用证据在 CURRENT-HISTORY-AUDIT.json。包括旧临时快照、过期浏览器截图和已退役渲染文件；还须逐项确认同名路径没有现行正式用途。

候选逻辑对象上限 921,232,427 bytes；对象存储上限 824,486,152 bytes。不是承诺可释放：同一 blob 可能仍被其他路径引用，pack 可能共享 delta。没有在本轮制作新 pack 验证压缩。

涉及引用：CURRENT-HISTORY-AUDIT.json 的 allRefsInPotentialRewriteScope 逐条列出本地分支、remote-tracking refs、标签和 SHA（共 40 条）。PR6、Tarot 独有提交及新恢复 refs 不能丢弃。不能只改 main 而把旧对象通过其他 refs 留下，再宣称历史已瘦身。

## 空间／外部保全／影响

- 先用外接物理盘或另行批准的私人外部存储保存完整 mirror 和本轮源码恢复包；不在 C 盘制作第二个大型备份，不写 R2。本机未发现适合的数据盘，恢复分区不是目标。
- 普通压缩至少准备约两倍当前 Git 存储加10 GB余量（当前约50 GB工作余量）；外部镜像／重写试验建议独立80 GB以上可用空间。以上为保守计划，不是已验证峰值。
- 历史改写会改变提交 SHA、签名、标签与 PR 的基础／检查状态；PR6 等需重新对齐。必须通知所有并行窗口，冻结写入，保留旧 clone 与恢复材料，安排新 clone／重新 fetch 与分支迁移。
- `git filter-repo --paths-from-file <逐项批准清单> --invert-paths` 仅为未来外部镜像草案。远程替换、force-push、标签改写均需独立授权。本轮未执行。
- 当前最大对象含正式历史原稿和有效数据；不能为追求数字而删。历史 PNG 从工作目录消失，不代表 Git 历史空间已经释放。

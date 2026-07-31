# KMR-W1｜Book I Meaning Inventory

状态：`Inventory only`

本阶段把第一册全部 Blueprint Nodes 纳入同一份 Meaning Runtime 库存，但不会自动创建 Meaning、Formation Rule、Projection、审核或发布状态。

## 全书库存

| 项目 | 数量 |
|---|---:|
| Blueprint 计划节点 | 78 |
| 已注册节点 | 13 |
| 仅存在于 Blueprint 的节点 | 65 |
| Canonical Meaning Records | 0 |
| Formation Rule Records | 0 |
| Meaning Relationship Records | 0 |
| Projection Records | 0 |
| 旧有公开 Article Assets | 6 |
| 拥有旧有公开 Article 的节点 | 3 |

## 分部库存

| 部 | 名称 | 计划 | 已注册 | Blueprint only | Meaning | Formation | Projection | 旧有 Article 节点 |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| P0 | 序部｜为什么需要 PHI OS | 13 | 13 | 0 | 0 | 0 | 0 | 3 |
| P1 | 第一部｜现实物理学 | 12 | 0 | 12 | 0 | 0 | 0 | 0 |
| P2 | 第二部｜投影系统 | 13 | 0 | 13 | 0 | 0 | 0 | 0 |
| P3 | 第三部｜运行动力学 | 15 | 0 | 15 | 0 | 0 | 0 | 0 |
| P4 | 第四部｜人类运行载体 | 12 | 0 | 12 | 0 | 0 | 0 | 0 |
| P5 | 第五部｜意识运行 | 13 | 0 | 13 | 0 | 0 | 0 | 0 |

## 当前事实

第一册 Blueprint 共包含 78 个节点，其中 13 个 Preface 节点已经进入冻结 Registry，另外 65 个节点仍只属于规划层。KMR-W0 的 Meaning、Formation Rule、Projection 与 Relationship Registry 当前均没有权威记录，因此 W1 不把章节标题自动解释成 Meaning，也不把 Blueprint 节点自动提升为已注册节点。

仓库中现有 6 个旧有公开 Article Assets，覆盖 3 个 Canonical Nodes。这些 Article 继续由 PJA 合同治理；W1 只记录它们的存在，不反向推导 Canonical Meaning。

## 书稿边界

库存把每个节点的 `manuscriptSourcePresence` 标记为 `not_inventoryable_from_repository`。这不表示书稿不存在，而表示当前 GitHub 库存没有提供可由 KMR 自动读取并受治理引用的第一册正文来源。后续 KMR-W2 必须通过明确的 Manuscript Source Contract 导入或映射书稿，不能根据标题自动补写。

## 冻结边界

- 不创建 Canonical Meaning。
- 不创建 Formation Rules。
- 不创建 Projection Records。
- 不改变 Canonical Node 注册状态。
- 不改变 PJA Article、审核、批准或发布状态。
- 不改变公开网页与 Cloudflare Production。

Inventory hash：`ac99a0e6718deaa121b1bc09b296363b888077c98b5b0726fcfb115656aebbe0`

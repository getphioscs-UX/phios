# PHI OS Research Foundation Governance

全平台的冲突处理以 `content/registry/master-governance.json` 为最高执行入口；Reality Integrity、Evidence Boundary、Safety 与 Law 高于 Frozen Core Runtime，Frozen Core Runtime 高于 PDS，PDS 高于 PWS／PJA，PWS／PJA 高于 Registry 与 Migration，Registry 与 Migration 高于页面实现，页面实现高于文案与视觉偏好。后续页面不得覆盖先前冻结的责任边界，冲突不得静默合并，未知与未解决冲突必须保持可见。

任何页面、客户视图、专业视图或技术视图都不得建立第二写入源；对象只能由 `content/registry/master-governance.json` 指定的 Canonical owner 写入。阶段冻结后，仅允许 Bug Fix、Security Fix、Accessibility Fix、Migration Fix、Acceptance Fix 或 Explicit Contract Version Upgrade；所有变更必须声明类别、版本影响、保留边界与验收证据，禁止静默改变行为。

当前完成书稿高于旧蓝图、旧网页文案和历史 Registry；不同来源发生冲突时，先登记冲突，不静默合并。核心术语只允许通过 `content/registry/concepts.json` 改变，图名只允许通过 `content/registry/figures.json` 改变，五册结构只允许通过 `content/registry/books.json` 与 `parts.json` 改变。任何 stable 项目的更名、拆分、合并或语义改变，都必须提高 Registry 版本、写入 `timeline.json`，并通过基础验证；provisional 项目可以扩展，但仍不得绕过登记名称。网站可以简化表达，却不得改变研究含义。

## Local generated evidence retention (2026-10-27)

Keep one current review per active task plus unresolved failure diagnostics and compact receipts. Keep approved manuscripts/assets, templates, fixtures and customer order artifacts. Disposable build snapshots use a stable current directory; successful isolated test databases are removed after verification. Page rasterization must be opt-in for retained review images; use temporary directories and remove successful diagnostic images, retaining failures or explicitly requested current review pages. Do not create dated full repository copies or delivery archives as routine QA. No global PNG/PDF ignore rules. Never remove a dirty, unique or active worktree. When a new worktree is necessary, prefer no-checkout, configure sparse-checkout first, then checkout; reuse required dependencies rather than installing unrelated copies. Deletion requires a successfully written path/size/reason manifest before mutation. Disk inventory uses logical bytes; hardlinks and concurrent writers make drive-free deltas a separate measurement.

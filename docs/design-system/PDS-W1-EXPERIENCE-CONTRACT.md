# PDS-W1｜体验契约冻结

## 结论

PDS-W1 冻结 PHI OS Design System 的上层体验契约，不修改 Runtime Engine、API、持久化、Lineage、Provider、既有页面行为或当前翻译键。此阶段完成后，后续首页、Entry、Reconstruction、Reading、Navigation 与 Review 的重构必须服从同一份契约，不得再由单页自行定义用户旅程、信息层级或大众语言。

## 唯一契约来源

```text
content/registry/pds-w1-experience-contract.json
```

自动验收脚本：

```text
scripts/check-pds-w1-experience-contract.mjs
```

验收数据：

```text
tests/fixtures/pds-w1-experience-contract.json
```

## PDS-W1-T01｜六阶段旅程冻结

大众体验固定为：

```text
进入 → 描述 → 发现 → 理解 → 选择 → 继续
```

系统内部仍保留现有页面、路由、状态与模块名称。大众阶段不是 Runtime 状态重命名，也不能被直接写回 Runtime Contract。

| 阶段 | 大众任务 | 主要系统页面 |
|---|---|---|
| 进入 | 确认 PHI OS 是否能帮助理解当前变化 | Home／Reality Journey |
| 描述 | 说清楚正在发生的变化 | Entry |
| 发现 | 确认事情如何发展并修正误解 | Reconstruction |
| 理解 | 看见当前现实结构 | Reading |
| 选择 | 选择一个可执行、可观察的方向 | Navigation |
| 继续 | 回看变化并决定下一步 | Review／My Reality |

阶段顺序是体验顺序，不要求用户每次都线性完成；恢复、回退与修改仍由现有 Runtime 与 Recovery Contract 决定。

## PDS-W1-T02｜大众语言与技术语言分离

系统标识保持稳定，大众界面使用较低认知成本的名称。例如 `Reality Reading` 在系统、文件和契约中继续存在，客户界面可以显示为“你的现实地图”。

该规则禁止两种做法：一是为了改善文案而重命名 API、Storage Key、Runtime State 或 Schema；二是因为内部存在某个字段，就直接把内部字段名暴露给客户。

完整中英文映射已经写入 Registry。英文与简体中文共享相同意图、行动层级、显示边界与状态含义，但不要求逐字翻译。

## PDS-W1-T03｜页面单一任务冻结

六个核心页面分别只有一个主要任务：

```text
Home            让用户进入 Reality Entry
Entry           描述正在发生的变化
Reconstruction  确认事情的发展过程
Reading         理解当前现实地图
Navigation      选择一个可观察方向
Review          比较行动前后的变化
```

每个页面只允许一个主要行动。次要行动可以包括保存、修改、返回或展开依据，但不得与主要行动争夺视觉优先级。

PDS-W1 只冻结任务，不立即修改页面。实际页面迁移从 PDS-W4 开始。

## PDS-W1-T04｜四层信息显示规则

所有信息固定分为四层：

| 层级 | 默认状态 | 对象 | 内容 |
|---|---|---|---|
| 客户核心 | 直接显示 | 客户 | 发生什么、为什么重要、下一步是什么 |
| 客户确认 | 直接显示 | 客户 | 顺序、条件、已确认事实、未知部分 |
| 专业分析 | 默认折叠 | 专业人员 | 证据来源、冲突、重复、推断边界、成熟度、可信程度 |
| 技术记录 | 限制显示 | 技术与诊断 | Source Path、Schema、Bucket、Provider、Raw／Normalized Statement、Runtime Contract |

Customer View 是默认视图。Professional View 与 Technical View 可以使用同一份 Runtime 数据，但不得拥有与 Customer View 相同的信息密度。

未知、不完整或低可信内容不能使用失败式语言，也不能让使用者误以为自己回答错误。系统应明确说明目前不能确定什么、缺少什么，以及可以如何进一步确认。

## PDS-W1-T05｜合规检查清单

PDS-W1 自动检查以下内容：

```text
六阶段顺序固定
每个阶段拥有中英文名称与任务
六个核心页面均有且只有一个任务
六个核心页面均有且只有一个主要行动
四层信息按照固定顺序存在
Customer View 为默认视图
Technical Record 不在客户界面默认显示
Unknown 明确声明不是失败状态
Runtime、API、Schema、Storage、Provider、Persistence 与 Lineage 边界保持不可变
Registry、Fixture、Document 与 Check Script 全部存在
```

## 不在本阶段执行

PDS-W1 不修改：

```text
index.html
reality-entry.html
reality-reconstruction.html
reality-reading.html
reality-navigation.html
reality-review.html
现有 CSS
现有 Locale Keys
Runtime Functions
API Routes
Storage Keys
Database Schema
```

因此，PDS-W1 通过代表“体验契约已经冻结”，不代表现有 Production 页面已经符合新设计系统。

## 验收命令

```bash
npm run check:pds-w1
```

完整仓库验收仍使用：

```bash
npm run check
```

## 冻结状态

PDS-W1 完成后，以下内容不得在后续页面开发中被单独改变：

```text
六阶段顺序
页面任务
页面主要行动数量
四层信息顺序
Customer／Professional／Technical 显示边界
未知状态表达原则
大众语言与系统标识分离原则
```

若未来确实需要改变，必须提升 PDS Experience Contract 版本并记录迁移原因，不能由某一页面的局部需求直接覆盖。

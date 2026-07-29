# PDS-W4｜Reality Journey Shell

## 结论

PDS-W4 以 Production `main@660e1ea` 为唯一基线，把冻结的大众六阶段体验接入 Reality Journey：

```text
进入 → 描述 → 发现 → 理解 → 选择 → 继续
```

共享实现位于：

```text
assets/js/journey-shell.js
assets/css/design/journey-shell.css
```

## 页面映射

| 大众阶段 | 页面 |
|---|---|
| 进入 | Reality Journey Overview |
| 描述 | Reality Entry |
| 发现 | Reality Reconstruction |
| 理解 | Reality Reading |
| 选择 | Reality Navigation |
| 继续 | Reality Review／My Reality |

这只是大众体验层，不重命名 Runtime Stage、API、Schema、Storage Key 或内部模块。

## 共同骨架

每页顶部显示当前阶段、六阶段 Progress、客户状态语言、返回／修改／暂停入口、主要行动定位与下一阶段交接提示。主要行动定位只滚动到页面既有主按钮或主区域，不复制点击、不替用户确认，也不建立新的 Runtime action。

加载、空白、错误与受到阻断状态只使用稳定的客户语言。错误不会把此前资料描述为已删除；未知或未完成也不会被表达成使用者失败。

## Customer View 边界

Journey Shell 禁止输出内部状态码、数据键、来源路径、Schema、Provider、Raw／Normalized Statement 或 Runtime ID。原有 Technical View 仍保持折叠或限制显示，不能因为统一 Shell 而进入 Customer View。

## Mobile 连续性

360px 使用可横向浏览的阶段轨道与两列操作区；768px 使用三列阶段 Grid；1440px 使用完整六列 Progress。所有操作维持 44px 最小触控目标，并尊重减少动态效果。

## 不变边界

```text
不修改 Runtime 原则
不修改 Runtime State
不修改 API 或 Storage Key
不修改 Persistence、Recovery 或 Lineage
不修改已有主要行动的业务逻辑
不把大众阶段写回 Runtime Contract
```

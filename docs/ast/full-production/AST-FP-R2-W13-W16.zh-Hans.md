# AST-FP R2-W13～W16

Baseline: `3f6825a9b57dc9e62e34fb69bc55d2aac2c39768`

## W13 Customer Surface Cutover

工程 cutover 已完成，但 production gate 保持 fail-closed。只有 `R5 final rendered-surface human acceptance` 与 `R3 independent ephemeris certification` 同时满足后，`surfaceCutoverActive` 才能变为 true。激活后，AST 的正文 owner 只有 Interactive Workspace；旧 SMR、Structure、Graph、Patterns 不得再次完整复述 AST 解释。

## W14 Intent Responsive Composition

客户问题只映射到 `OPEN / EXPRESSION / WORK / RELATIONSHIP / PRESSURE / DIRECTION`，用于改变已有 whole-chart theme 的排序。映射是确定性的 lexical routing，不调用 LLM，不改写底层 astrology meaning。

## W15 ASTT Timing Integration

复用现有 `ASTT-W10` production authority。必须明确提供 target date/time/IANA timezone/UTC offset。TIMING 只消费 ASTT admitted meaning，描述 current activation，不预测事件。没有完整 target context 时 TIMING 不渲染。

## W16 Interactive Astrology Workspace

Workspace 把 Reading / Chart / Themes / Current Activation / Details 收到一个 surface。主题列表只显示标题；选中的主题 inspector 是唯一完整主题正文实例。Chart 只拥有计算结构，Technical 默认折叠。

当前状态：engineering PASS；live customer cutover = false。

### Customer timing control

W15 的四个 target 字段已经接入 customer API，但初始页面保持隐藏。只有服务器返回 `astrologyWorkspaceCapability.surfaceCutoverActive = true` 后，Personal surface 才会显示 Current Activation 的日期、时间、IANA timezone 与 UTC offset 输入。这样在 W13 gate 尚未开放时，不会给客户一个填写了却没有正式 surface 承接的假入口。

### Engineering preview

`content/professional/ast-full-production/customer-reading-v2/preview/ast-r2-w16-interactive-workspace-preview.html` 会强制使用 engineering-only active gate 以便检查 W16。英文 Current Activation 仅使用 synthetic ASTT-shaped data 检查呈现，不属于 R3 ephemeris certification evidence，也不能被用作 production acceptance。

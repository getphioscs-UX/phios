# PDS-W2｜Design Variable Unification

## 结论

PDS-W2 将 PHI OS 的界面颜色、字体、间距、容器、圆角、阴影、层级、焦点、触控目标与动效收拢到 `assets/css/tokens.css`。本阶段不重新设计页面，不修改 HTML，不改变中英文内容，也不把 Runtime State、Operation、Evidence 或 Confidence 转换成视觉变量。

Design Token 与 Runtime Token 必须保持分离。界面变量只负责“已经存在的内容如何显示”，不能根据颜色、按钮是否出现或页面路径推断系统状态。

## 单一来源

```text
assets/css/tokens.css
```

所有正式变量使用 `--phi-` 前缀。现有页面仍大量依赖 `--ink`、`--paper`、`--accent` 等旧变量，因此本阶段保留 Legacy Alias；Alias 不再复制颜色与尺寸，而是指向正式 Token，以确保当前页面视觉数值保持不变，同时阻止两套变量继续漂移。

## 统一类别

| 类别 | 统一内容 |
|---|---|
| Color | Primitive、Surface、Text、Border、Action、State、Focus |
| Spacing | 以 4px 为基础的固定尺度 |
| Typography | Font、Text Size、Line Height、Letter Spacing |
| Layout | Container、Gutter、Grid |
| Shape | Radius、Shadow |
| Interaction | Touch Target、Focus、Motion |
| Layer | Z-index |

## 无障碍变量

44px 最小触控目标统一为：

```css
--phi-control-target-min: 2.75rem;
```

焦点宽度与距离分别使用 `--phi-focus-width` 与 `--phi-focus-offset`。减少动态效果仍由 `prefers-reduced-motion` 控制。状态颜色必须与文字、图标或形状共同表达；颜色不能单独承担状态含义。

## 响应式边界

PDS-W2 登记 360px、768px、1440px 为固定验收宽度，同时保留当前 CSS 的 Compact、Content 与 Wide 适配范围。响应式只改变界面排布，不建立新的 Runtime State，也不能因为屏幕大小改变 Journey 语义、主要行动或资料完整度。

## 本阶段修改

```text
assets/css/tokens.css
assets/css/design/foundation.css
assets/css/design/typography.css
assets/css/design/layout.css
assets/css/design/components.css
assets/css/design/motion.css
assets/css/design/visual-acceptance.css
```

修改仅把散落常数替换为等值 Token，包括 44px 触控目标、焦点宽度与距离、Display Line Height、Control Line Height、Grid Minimum 与 Hover Lift。没有改变现有数值。

## 不在本阶段执行

```text
不修改页面结构
不修改 Header 或 Footer
不建立新组件
不更改品牌配色
不删除 Legacy Alias
不修改 Locale
不修改 Runtime、API、Provider、Persistence、Database 或 Registry Semantics
```

核心组件契约将在 PDS-W3 建立；实际页面迁移从 PDS-W4 开始。

## 验收

```bash
npm run check:pds-w2
npm run check:pds-w0
npm run check:pds-w1
```

完整仓库仍运行 `npm run check`。若完整检查继续遇到 W0 已登记的 `3311262` Migration／M3B Commerce 基线阻断，应继续标记为既有阻断，不得通过修改 Runtime 来掩盖。

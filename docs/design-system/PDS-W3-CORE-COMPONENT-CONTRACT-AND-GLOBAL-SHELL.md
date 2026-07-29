# PDS-W3｜Core Component Contract & Global Shell 对齐

## 结论

PDS-W3 在既有公共结构上统一 Header、主导航、Mobile Navigation、中英文切换、Skip Link、Footer、页面容器以及按钮、链接和焦点状态。本阶段没有增加、删除或重排导航目的地，也没有改变任何页面使命、Journey Contract 或 Runtime 原则。

## 唯一公共 Shell

```text
assets/js/public-shell.js
assets/css/public-experience.css
```

公共导航保持：

```text
Discover → Knowledge → Reality Journey → Professional → About → Language
```

Footer 保持：

```text
Thesis → Books → Atlas → Reality Journey → Services → Privacy → Terms → Contact
```

这些名称、顺序和链接属于既有信息架构。PDS-W3 只统一它们的呈现、操作状态与响应式行为。

## Core Component Contract

按钮必须具有 Default、Hover、Focus Visible、Active 与 Disabled 状态，最小触控目标继续使用 `--phi-control-target-min`。链接必须保留可辨识的 Default、Hover、Focus Visible 与 Current 状态。焦点宽度和偏移继续由 `--phi-focus-width` 与 `--phi-focus-offset` 控制，不允许页面 CSS 取消键盘焦点。

公共页面容器使用 `--phi-container-shell` 与 Design Foundation Gutter。旧页面结构不需要为了采用容器契约而重写 HTML。

## Mobile Navigation

移动菜单保持原有 Disclosure 结构，并补齐以下操作：

```text
打开后把焦点移入导航
Tab 与 Shift + Tab 不离开已打开的菜单
Escape 关闭并把焦点还给菜单按钮
点击菜单外部关闭
选择链接或语言后关闭
进入桌面宽度时自动关闭并清理页面锁定状态
```

语言仍由现有 i18n Runtime 管理，继续使用 `phiOSLocale`，不建立第二套语言状态。

## 三个验收宽度

| 宽度 | Header 与导航 | Footer |
|---:|---|---|
| 360px | 菜单按钮；单列展开；44px 触控目标 | 单列 |
| 768px | 菜单按钮；双列展开；语言区独立一行 | 双列 |
| 1440px | 完整行内主导航 | 四列 |

三个宽度均不得产生页面级横向滚动。Skip Link 默认离开视觉布局，键盘聚焦时必须出现。

## 边界

```text
不重新规划信息架构
不修改页面正文或页面使命
不修改翻译键、Locale Storage Key 或 API
不修改 Runtime、Runtime SDK、Provider、Persistence 或 Database
不把视觉 Active State 转换成 Runtime State
```

## 验收

```bash
npm run check:pds-w3
npm run check:pds-w2
npm run check:pds-w0
```

PDS-W4 才开始按页面迁移和验收。

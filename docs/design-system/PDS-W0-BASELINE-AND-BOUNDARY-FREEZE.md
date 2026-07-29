# PDS-W0｜Baseline and Boundary Freeze

## 结论

PDS-W0 以 `getphioscs-UX/phios` 的 `main@3311262b377fb1e936fe39cfdd0528e6f3ce3e2e` 为唯一代码基线，冻结 PHI OS Design System 后续实施所允许触及的界面范围与不得触及的 Runtime 范围。本阶段不修改页面、不重新设计网站、不迁移组件，也不改变任何 Runtime、API、Persistence、Recovery、Lineage、Provider、Database 或 Professional Authority 行为。

仓库已经存在 PDS-W1 体验契约。PDS-W0 是补入其下方的基线治理层，只确定“从哪里开始、哪些范围可以调整、哪些范围必须保持不变”，不会替换、回退或重新定义 PDS-W1。

## 唯一基线

```text
Repository  getphioscs-UX/phios
Branch      main
Commit      3311262b377fb1e936fe39cfdd0528e6f3ce3e2e
Tree        6610d1c36fa1c477b1cc61868a5bc3e6993738ca
Message     PWS-W1A Revenue Extension
Production  https://phios-github.pages.dev
```

上传 ZIP 在 Windows 环境中因 `Content/` 与 `content/` 大小写路径共存而遗漏四个大写目录文件。PDS-W0 使用 ZIP 内完整 Git 对象恢复该提交，不把打包遗漏解释为正式删除，也不使用旧版本重建代码。

## 权威顺序

发生冲突时，执行顺序固定为：

```text
PHI OS Design System PDS v1.1
↓
PHI OS Developer Guide v1.0
↓
main@3311262 当前代码事实
↓
单页现有实现
```

Design System 可以改变页面如何呈现与如何被操作，却不能借由视觉调整重新定义系统事实。

## 可以调整的范围

后续 PDS 阶段可以在不改变 Runtime 事实的前提下调整视觉层级、布局、响应式、组件显示状态、客户文案、焦点、键盘与触控体验、渐进展开、加载与错误呈现、旅程承接及客户视图投影。

主要实施区域包括：

```text
assets/css/design/
assets/css/tokens.css
现有页面的 HTML 呈现结构
Customer Projection 与 Render Modules
现有 Locale Dictionaries
docs/design-system/
content/registry/pds-*
tests/fixtures/pds-*
scripts/check-pds-*
```

这些路径属于实施许可，不代表可以无条件整体重写。所有修改仍须保持既有页面身份、路由、元素契约、资料来源与主要系统行为。

## 条件审查范围

`assets/js/core/`、非客户投影用途的共享模块、`assets/js/shared.js`、`assets/js/i18n.js` 以及 `package.json` 属于条件审查范围。只有当界面与交互无法通过更局部的实现完成，而且修改不会改变 Runtime 行为时才可触及；每一次修改都必须在交付报告中单独说明理由。

## Runtime 禁止修改范围

PDS-W0 自动保护：

```text
functions/runtime/
functions/api/reconstruct-reality.js
functions/api/read-runtime.js
functions/api/navigate-runtime.js
assets/js/runtime/
db/schema/
db/migrations/
冻结的 Runtime 与 Provider Registry
```

检查脚本会把这些路径当前内容与 `3311262` 中的 Git 对象逐项比较。新增、删除或修改任何受保护文件都会使 PDS-W0 验收失败。若未来出现真正的 Runtime 缺陷，必须退出 PDS 页面迁移范围，按独立 Runtime Bug Fix 与冻结变更程序处理。

## 固定验收矩阵

| 范围 | 冻结要求 |
|---|---|
| 语言 | 英文、简体中文 |
| 断点 | 360px、768px、1440px |
| 触控目标 | 不小于 44×44px |
| 键盘 | 核心流程可以完整操作 |
| 焦点 | 焦点状态清楚可见 |
| 横向滚动 | 不允许页面级横向滚动 |
| 控制台 | 不允许 PHI OS Production 错误 |
| Runtime | 所有冻结测试继续通过 |

这些项目在 W0 只是冻结为后续验收标准，不代表当前 Production 已经全部通过。

## 线上访问角色

ZIP 是唯一可写开发来源；GitHub 用于确认最新 `main`、比较交付差异与核对部署来源；Production 用于视觉、交互、响应式、语言与控制台复测。任何线上页面都不能反向成为新的代码基线。

## 自动验收

专项命令：

```bash
npm run check:pds-w0
```

既有体验契约：

```bash
npm run check:pds-w1
```

完整仓库：

```bash
npm run check
```

PDS-W0 通过只代表基线与边界已经冻结，不代表页面已经迁移至 PDS v1.1，也不代表 Production 已完成视觉验收。

## 基线验收结果

PDS-W0 专项、PDS-W1、Schema Reference、I18N、PWS-W1A Revenue 与 M4C Postcheck 均已通过，受保护范围相对 `3311262` 的代码差异为零。

完整 `npm run check` 不能签署 Passed，因为 `3311262` 自身存在以下基线不一致：

```text
1. Migration Check 预期四项迁移，但 runtime-migrations.json 只登记三项；
   0004_book_commerce.sql 已存在，Registry 尚未登记。

2. M3B Knowledge Release 要求 content/registry/book-products.json，
   但该文件不在 3311262 Git Tree 中。

3. M3B Book Access Payment 因 Commerce Registry 条件不完整，
   返回 500，而测试预期 201。
```

这些问题不属于 Design System 界面与交互范围。PDS-W0 不修改 Migration Registry、Commerce Runtime 或 Payment 行为，只把它们登记为基线阻断。最终结论为 `Conditional Passed`：W0 治理层成立，可以保护后续 PDS 修改；全库 Passed 必须由独立 Runtime／M3B 基线修复完成后重新签署。

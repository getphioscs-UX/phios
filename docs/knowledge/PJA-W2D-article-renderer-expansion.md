# PJA-W2D Article Renderer Expansion

## 基线与目标

唯一代码基线为 `main@622d8cfc8868a62e79789ecf20cb849633737b11`。本步骤把 PJA-W2B 的 Article v2 结构契约变成可公开运行的安全 DOM Renderer，但不改变 Canonical Registry、文章正文、Claim/Source/Review Authority 或 PJA-W1 Publication Gate。

## 现状审计

| 审计面 | `622d8cf` 状态 | W2D 处理 |
| --- | --- | --- |
| Public Loader | Registry Gate 后读取 Article JSON，但用 `...content` 扩散全部字段 | 改为显式 Public Article Projection |
| Renderer | `article.js` 使用已转义字符串和 `innerHTML` | 改为 `createElement`、`textContent`、受控属性、`replaceChildren` |
| Legacy Article | 六份文章使用 `sections[].paragraphs[]` | 原文件零修改，经 Adapter 继续渲染 |
| Structured Blocks | 十种类型已有 Schema 与字符串 Renderer | 十种类型全部改为语义 DOM Renderer |
| Asset | 只投影已发布 Registry Asset | 增加安全路径、类型、尺寸与 Projection 标记复核 |
| Node | Next Node 从已发布 Article 列表查找 | 只生成 Published Node Link，缺失时显示安全 fallback |
| Source | Article 引用直接进入页面 | 先与 Source Registry 对齐，再生成 public-metadata-only Projection |
| Error | Not Found 与 Load Error | 增加 Loading、Unavailable、Invalid Content 与阻断错误边界 |
| Locale | 基础 Article 标签 | 补齐 Renderer、状态、目录、时间和 fallback 文案 |
| CSS | 已有基本 Article/Block 样式 | 增加独立 Responsive、TOC、Hero、Source、Concept、Print 与 Reduced Motion 样式 |

## 模块架构

- `assets/js/pages/article.js`：页面协调、Locale 重渲染、状态和保存按钮。
- `article-renderer.js`：Article View Model 到语义 DOM 的唯一协调 Renderer。
- `article-blocks.js`：Legacy/Structured Adapter、十类 Block allowlist 与输入完整性检查。
- `article-projection.js`：Article JSON 到 Public Article Projection 的显式字段映射。
- `article-assets.js`：Published Visual Asset 路径、类型、尺寸与图片 DOM。
- `article-links.js`：同源内部 URL 和 Published Node Resolver。
- `article-sources.js`：Public Source Projection 与 `<ol>` Source Renderer。
- `article-errors.js`：阻断错误码、安全对象检查与公众错误状态。

`published-content.js` 仍是浏览器唯一公开 Loader。它先执行 PJA-W1 Node、Locale、Asset、Article Publication Gate，再创建公开投影。Renderer 不读取 Draft、Governance、Runtime、Provider、Payment 或 Entitlement。

## Article Shell 与兼容性

三份 `articles/*.html` 继续是静态、无正文 Shell。Shell 只声明 slug、静态 SEO、共享样式和脚本。六份 PJA-W1 Article JSON 的 SHA-256 被 W2D 检查锁定，未批量迁移。

Legacy Adapter 只接受 `heading + paragraphs[]`。Structured Adapter 只接受 `heading + blocks[]`。混合、空正文或未知 Block 会阻断整篇渲染；`editorial_only` 不进入公开投影。

## Structured Block Rendering

| Block | DOM |
| --- | --- |
| `paragraph` / `lead` / `transition` | `<p>` |
| `question` / `insight` | 非互动 `<aside>` |
| `mechanism` | `<section><h3><ol>` |
| `timeline` | `<section><ol>` |
| `comparison` | `<section>` 与可线性读取的列 `<section><h4><ul>` |
| `figure` | `<figure><picture><img><figcaption>` |
| `next_node` | `<nav>`，最多一个 Published Node Link |

Article 只有一个 `<h1>`；Article Section 使用 `<h2>`；Block 内部使用 `<h3>/<h4>`。

## Resolution 与错误边界

- Figure 必须从 Public Visual Asset Projection 取得，并通过内部 `/assets/` 路径、WebP/AVIF/SVG 类型、alt、width 和 height 检查。
- Hero 是非阻断可选资产；正文 Figure 缺失或无效会阻断整篇文章。
- Related/Next Node 只从同 Locale 已发布 Article Projection 解析。
- Source 必须匹配 Source Registry，并且公开用途只能是 `public_citation_allowed` 或 `public_metadata_only`。
- Loading、Unavailable、Invalid 与 Load Error 都使用 Locale Dictionary，不显示内部路径、正文或审核数据。

## Accessibility、Localization 与 Responsive

Renderer 保持单一 H1、连续 heading hierarchy、列表语义、Figure alt/caption、Next Node `nav`、Source `ol`、Skip Link 与至少 44px 的互动目标。Question 不生成 button 或 input。

系统文案来自 `en` 与 `zh-Hans` Dictionary。360px、768px 和 1440px 规则分别覆盖单列、Rail 折叠、Comparison 线性化、长文本换行与正文宽度约束；Print 隐藏互动控件；Reduced Motion 停止 Loading 动画。

## Security 与性能

Article 内容不进入 `innerHTML`、`outerHTML`、`insertAdjacentHTML` 或 `document.write`。URL、Asset Path、Block Type 和公开 Source 用途全部 allowlist。Public Projection 不含 Claim、Review、Reviewer、内部 Locator 或编辑备注。

每个 Locale 只批量读取 Registry 和已发布 Article JSON；Block、Claim 或 Source 不发起逐项请求。W2D 不增加前端框架、CMS、D1 Migration 或 Runtime dependency。

## Static Rendering Boundary

当前 Article 仍是“静态 SEO Shell + 客户端 Published Projection”。No-JavaScript 用户只能取得 Shell 的标题、描述和 Canonical Link，不能取得 JS 渲染正文。未来如增加静态生成，产物必须从同一 Published Projection 派生，不能成为第二正文来源。

## Testing 与未来扩展

`npm run check:pja-w2d` 先运行 PJA-W1/W2A/W2B/W2C，再执行 23 个 DOM/Projection Fixture、Frozen Hash、Shell、Locale、CSS、安全和权限边界检查。完整 `npm run check` 必须继续通过。

### Browser Acceptance

结论为 `Conditional Passed`。受控浏览器能够启动，但其网络策略阻止访问当前容器的 `localhost` 与 `127.0.0.1`，接口也不提供 360px、768px、1440px 的精确 viewport 设置。因此没有生成或声称任何本地工作树浏览器截图。

已通过的替代证据限于：真实 DOM 构建测试、23 个 Renderer Scenario、单 H1 与 Heading 顺序、列表/导航/Figure 语义、安全 URL/Asset/Source Resolver、360/768/1440 CSS Contract、长文本 containment、44px target 和 Reduced Motion 静态验收。精确页面级横向滚动、视觉截断、键盘遍历与三个 viewport 的最终浏览器结果仍需在可访问当前工作树的受控浏览器或部署前 Preview 中完成。

`KN-PREFACE-001` 只以现有 test fixture 验证 Hero、十类 Block、Concept、Boundary、Source 和 Related Node 的 Renderer Readiness；没有创建 Production Article、英文文章、Shell、Asset Registry 记录或发布状态。

后续类型不得通过任意 HTML 扩展。新 Block 必须先修改 Canonical Schema、Public Projection、DOM Renderer、Accessibility/Security Contract 和 Fixture，再经人工治理流程进入发布。

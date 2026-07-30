# PJA Article Static Rendering Boundary

## 当前模式

每篇公开文章由静态 HTML Shell 提供 title、description、canonical link、Skip Link、Header/Footer mount 与 Article mount。正文由客户端在运行时读取 Published Projection 并构建 DOM。

Shell 不含正文，Article JSON 仍是唯一正式正文资产。W2D 不增加 Markdown、独立 HTML 正文、CMS 副本、Renderer 内嵌正文或 Build-time 内容副本。

## No-JavaScript 限制

禁用 JavaScript 时，用户可取得静态 SEO 元数据和公共导航 Shell，但不能取得 Article 正文。W2D 不把客户端渲染描述为 SSR，也不声称搜索引擎一定执行 JavaScript。

## 未来静态生成

未来如引入静态 Article HTML，必须同时满足：

1. 输入只来自同一 Published Article Projection；
2. 产物是可重建的 derived artifact，不具内容编辑权；
3. 生成器使用与客户端相同的 allowlist、Resolver、安全和 Accessibility Contract；
4. Draft、Claim、Review、Reviewer 与 private Source 不进入产物；
5. Canonical Registry、Localization Gate 与 Publication Gate 仍在生成前执行；
6. Article JSON 继续是唯一正式正文来源。

在上述契约实现前，静态 Shell 与客户端 Published Projection 是唯一支持模式。

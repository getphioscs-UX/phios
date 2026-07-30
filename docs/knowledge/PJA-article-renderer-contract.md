# PJA Article Renderer Contract

## 输入与输出

Renderer 的唯一输入是 `PublishedContentLoader` 产生的 Public Article Projection，以及同 Locale 的 Published Article、Visual Asset 和 Public Source Projection。输出是浏览器 DOM；Renderer 没有写入权、审核权或发布权。

```text
Canonical Registry + reviewed Article JSON
  → PJA-W1 Publication Gate
  → explicit Public Article Projection
  → normalizeArticleForRenderer
  → semantic DOM
```

Renderer 不直接读取 Registry、Draft Article、Claim Dossier、Review Record 或 Governance 文件。

## 阻断规则

以下情况阻断整篇内容并进入 Invalid Content State：

- Article Identity、Node Identity 或 Section Body Mode 无效；
- Section 没有正文；
- Block 类型不在十类 allowlist；
- 正文 Figure 无 Published Asset Projection；
- Figure 缺少 alt 或尺寸；
- 危险对象键或禁止能力字段进入 Article 数据。

Hero、Related Node、Source 和未发布 Next Node 属于可选公开关系。缺失时隐藏可选区块或显示不带链接的安全 fallback，不生成猜测 URL。

## DOM 规则

- 所有公开文本经 `textContent` 写入。
- 标签由 Renderer 常量决定，Article JSON 不能指定标签、class 或任意 attribute。
- 内部 URL 必须经 `safeInternalHref`。
- Article 每页一个 H1；Section H2；Block H3/H4。
- Question 是阅读提示，不是 button、input、form 或可点击容器。
- Mechanism/Timeline 使用有序列表；Source 使用有序列表；Next Node 使用 nav。

## Adapter

Legacy Section 和 Structured Section 可并存于不同文章，但同一 Section 不能同时含 `paragraphs` 与 `blocks`。Legacy Article 不需要迁移；Structured Block 不得降级为 HTML 字符串。

## 环境行为

公众页面只显示本地化错误状态，不显示 stack、内部路径或正文片段。自动化测试直接断言稳定错误码；生产 DOM 不公开错误码。Renderer 不建立新的运行环境配置系统。

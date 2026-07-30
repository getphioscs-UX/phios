# PJA Article Renderer Security

## DOM Boundary

Article、Source、Asset 与 Node 的公开数据只能进入 `textContent` 或经 allowlist 的属性。执行路径禁止：

```text
innerHTML
outerHTML
insertAdjacentHTML
document.write
raw HTML / script / style / iframe / embed
```

Article 不能提供 DOM tag、class、data attribute、event handler 或任意 attribute map。

## URL 与 Asset

Link 只接受以单个 `/` 开始的同源路径，拒绝 `//`、反斜线、控制字符、用户名密码和外部 origin。`javascript:`、`data:`、`file:`、Base64 与外部 URL 均不能成为 link 或 image。

Visual Asset 只接受 `/assets/` 下的 WebP、AVIF 或 SVG，且必须来自 Published Asset Projection。Article JSON 只保存 assetCode，不保存 image URL。

## Object 与 Projection

Renderer 拒绝 `__proto__`、`constructor` 与 `prototype` 键。Public Projection 对 Article 与 Block 使用显式字段映射，不能以 object spread 扩散 Canonical JSON。未知 Block 抛出阻断错误，不静默忽略。

Claim、Review、Reviewer、private locator 和内部 Source 不进入 Renderer Context。错误页面不输出 stack、内部文件路径、Source locator 或正文片段。

## Authority Boundary

Renderer 不调用 Runtime、Provider、Payment、Entitlement、Consent、Assignment 或 case API；不修改 Publication State；不把 Registry Presence、Blueprint Presence 或 Article Completeness 推断为 published。

# PJA Public Article Projection Contract

## 唯一入口

浏览器只能通过 `assets/js/knowledge/published-content.js` 取得公开文章。Loader 必须先满足：

```text
contentStatus = content_reviewed
reviewStatus = approved
publicationStatus = published
```

英文还必须满足 terminology review 与 semantic parity。Renderer 不重复判断或提升这些状态。

## 允许字段

Public Article Projection 只允许：

- Identity：nodeCode、locale、contentRole、version、slug；
- Public metadata：title、displayQuestion、shortAnswer、summary、readingTime、publishedAt、SEO；
- Public body：Legacy Paragraph 或 allowlisted Structured Block；
- Public support：Hero、Key Concepts、Knowledge Boundary；
- Public relations：Public Sources、Published Visual Assets、Published Nodes 和受控内部连接。

Block Projection 删除 `sourceClaimCodes`、visibility、editorialNoteCode 与任何未明确映射字段。Article Projection 不使用 `...content`。

## 禁止字段

以下数据不得进入 Public View Model：

- Claim Dossier、Claim Review、support assessment、contrary evidence；
- Review、Reviewer、approval notes、accepted risk；
- internal Source notes、private locator、internal-only Source；
- publication workflow、AI generation notes、editorial notes；
- Runtime、Provider、Payment、Entitlement 或 case data。

## Resolver

- Visual Asset：exact assetCode、公开 visual type、同源 `/assets/` path、尺寸与 `publicProjection: true`。
- Source：exact sourceCode 必须存在于 Source Registry；公开投影只含 label、同源 href 与 public-use classification。
- Node：exact nodeCode 必须出现在同 Locale Published Article Projection；URL 从该 Projection 取得。

不存在、未发布或 URL 不安全的关系不能由 slug、title 或 Blueprint 推断。

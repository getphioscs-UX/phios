# PHI OS Structured Article Authoring Contract

## Authority

This contract governs future ChatGPT delivery of PHI OS articles. Canonical
Node identity comes only from the Canonical Registry. The Chinese Article JSON
is Canonical Content; English is a separately reviewed localization.

ChatGPT:

- 只能生成 Article JSON；
- 不得生成完整 HTML；
- 不得生成 Markdown 正文；
- 不得输出 raw HTML；
- 不得更改 Canonical Registry；
- 不得添加未存在的 Node；
- 不得设置 `approved`；
- 不得设置 `published`；
- 不得虚构 Asset Code；
- 不得虚构 Source Code；
- 不得将 Supporting Question 变为 Canonical Node；
- 不得输出 Runtime 或 Professional 行动；
- 不得创建 Provider、Payment、Entitlement、Journey 或个案输入；
- 所有新文章必须使用 Structured Section；
- 所有 `sectionCode` 与 `blockCode` 必须唯一并按顺序递增；
- `next_node` 必须与 Registry 及 `connections.nextNode` 一致。

Schema-valid means structurally valid only. It does not mean factually correct,
Canonically approved, editorially approved or publishable. ChatGPT may deliver
`draft`, `not_reviewed`, `not_published`; human review controls later states.

## Delivery rules

1. Confirm the Node already exists and is frozen.
2. Copy the Registry `nodeCode`, locale slug, theme, type, level and next Node
   without alteration.
3. Use `PHI-OS-KNOWLEDGE-ARTICLE-v2.0.0`.
4. Preserve the established top-level PJA-W1 field names.
5. Store public prose only in Article JSON.
6. Use only the ten allowlisted Block types.
7. Use pure localized text; do not add HTML, Markdown images, direct URLs,
   data URIs, scripts, styles, embeds or executable content.
8. Put internal Claim references only in `sourceClaimCodes`.
9. Reference only verified existing Source and Asset codes.
10. Keep `masterMediaPost` null until separately authorized.
11. Do not create English Article JSON until Chinese review and localization
    authorization are explicit.

## Minimum legal draft example

The identifiers below are illustrative. Before production use, every Node,
slug, Source and Asset identifier must be copied from the current registries.

```json
{
  "$schema": "https://getphios.com/schemas/knowledge/article-v2.schema.json",
  "schemaVersion": "PHI-OS-KNOWLEDGE-ARTICLE-v2.0.0",
  "contract": "PJA-STRUCTURED-ARTICLE",
  "assetCode": "KA-EXISTING-REGISTERED-ARTICLE-ASSET",
  "nodeCode": "KN-EXISTING-NODE",
  "locale": "zh-Hans",
  "contentRole": "canonical",
  "version": "0.1.0",
  "contentStatus": "draft",
  "reviewStatus": "not_reviewed",
  "publicationStatus": "not_published",
  "publishedAt": null,
  "publicationOrder": null,
  "slug": "registry-controlled-slug",
  "title": "Public title",
  "displayQuestion": "Public question?",
  "canonicalQuestion": "Canonical question?",
  "searchTitle": "Search title",
  "readerTransformation": "The intended, reviewable change in reader understanding.",
  "shortAnswer": "A short draft answer.",
  "summary": "A concise draft abstract.",
  "readingTimeMinutes": 8,
  "seo": {
    "title": "Search title",
    "description": "Search description.",
    "canonicalPath": "/articles/registry-controlled-slug"
  },
  "taxonomy": {
    "themeCode": "TH-EXISTING",
    "nodeType": "registry_node_type",
    "knowledgeLevel": "introductory",
    "tags": []
  },
  "hero": {
    "eyebrow": "Knowledge",
    "lead": "A localized draft lead.",
    "assetCode": null
  },
  "keyConcepts": [
    {
      "conceptCode": "KC-EXISTING",
      "label": "Concept",
      "definition": "Concise local definition.",
      "termReference": null
    }
  ],
  "sections": [
    {
      "sectionCode": "S01",
      "heading": "Section heading",
      "purpose": "introduce_question",
      "blocks": [
        {
          "blockCode": "S01-B01",
          "type": "paragraph",
          "text": "Draft paragraph."
        }
      ]
    }
  ],
  "knowledgeBoundary": [
    {
      "type": "scope_limit",
      "text": "Explicit scope boundary."
    }
  ],
  "sourceReferences": [
    {
      "sourceCode": "SRC-EXISTING",
      "label": "Public source label",
      "href": "/existing-public-page"
    }
  ],
  "connections": {
    "previousNode": null,
    "nextNode": null,
    "relatedNodes": [],
    "relatedArticles": [],
    "relatedBooks": [],
    "relatedTopics": [],
    "relatedAtlasEntries": [],
    "relatedFigures": [],
    "relatedServices": [],
    "journeyEntryTopics": []
  },
  "masterMediaPost": null
}
```

This example is a format illustration, not a Registry authorization and not a
production Article.

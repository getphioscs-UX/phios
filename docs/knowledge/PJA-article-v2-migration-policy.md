# PHI OS Article v2 Migration Policy

## Policy

PJA-W2B 不得批量迁移现有文章。PJA-W1 的六份 Article JSON 继续维持
Legacy Section，并继续由既有 Publication Gate 读取。

迁移只可在某一篇旧文章需要实质编辑时逐篇启动，并遵守：

1. 先确认 Canonical Node、locale、slug、Asset 与当前公开版本。
2. 从当前 Article JSON 建立独立草稿副本；不得覆盖原文件。
3. 将每个旧段落按公开顺序映射到 Structured Section 和 paragraph
   Block。
4. 分配顺序稳定的 `sectionCode` 与 `blockCode`。
5. 迁移不得改变 Canonical Meaning，不得增加未经审核的结论。
6. 迁移不得修改 Canonical Registry、Localization Registry 或 Asset
   Registry。
7. 迁移不得自动推进 `contentStatus`、`reviewStatus` 或
   `publicationStatus`。
8. 迁移不得自动批准、发布、commit、push 或部署。
9. 迁移前后必须进行逐段公开内容、连接、来源、边界与语言对比。
10. 迁移后的草稿必须重新通过内容、Canonical、事实、来源、边界、
    可读性、视觉、本地化与连续性审核。

## State preservation

迁移工具如未来建立，只允许输出：

```text
new draft copy
contentStatus = draft
reviewStatus = not_reviewed
publicationStatus = not_published
```

工具不得：

```text
rewrite source Article JSON
write Registry
create Canonical identity
invent Claim, Source or Asset code
approve content
publish content
commit or push
```

## Comparison record

每次逐篇迁移必须记录：

- 原版本和草稿版本；
- Section 与 paragraph 到新 Block 的映射；
- 未改变的 Canonical Question 与 Central Thesis；
- 文本增删差异；
- Source/Claim 引用差异；
- Boundary 与 Connection 差异；
- 人工审核结果。

没有完整对比与审核，迁移草稿不得取代当前公开 Article JSON。

# 长期存储经济性与交付设计

## 已有真实所有者

`functions/report-delivery/customer-report-artifact.js` 的 CUSTOMER_REPORT_ARTIFACT_V1 已要求 input/calculation snapshots、publicationIR、generatedSections、authority/content/renderer versions、entitlement 身份和 HTML/render-state 引用，冻结 generatedCopy/contentDigest/artifactDigest，明确 pdfPolicy=ON_DEMAND_DERIVATIVE、sharedAssetsEmbedded=false，并拒绝 data:image/。`customer-artifact-store.js` 已用既有 SQL 状态锁及 PRIVATE_REPORTS 读写不可替换的快照，open 不调用 provider。复用这些所有者，不能新建竞争的 Canonical Report Registry。

现有 `generatedSections` 和 `generatedCopy` 同时保留有正文重复，但属于既有 schema/digest，不在本轮删改；相对数十 MB 图片负载，应排在后面。现有 released-report、BZR/ZWR material、NUM local adapter、HD candidate 和 large-PDF 入口并不相同，不能宣称已统一上线。

`local-private-pdf-artifact.js` 是受限本地小文件路线，含 Base64/加密 payload；大文件路线 `local-large-private-pdf-artifact.js` 已把字节流放入 PRIVATE_REPORTS，SQL 只保元数据，当前技术上限 128 MiB。NUM 本地 owner 的 32 MiB 防线是另一个入口。不要把这些传输限制当六方法的统一生成预算。

## A / B / C

| 方案 | 好处 | 风险/约束 | 结论 |
|---|---|---|---|
| A 永久紧凑 PDF + 冻结 IR | 下载快、精确原字节、可恢复、无渲染器漂移 | 每份独立 PDF 仍需包含静态图；保留旧版不能省旧对象 | 对已经生成/约定即时交付的付费 PDF 最安全 |
| B 首次导出生成 + 持久不可变缓存 | 与现有 ON_DEMAND_DERIVATIVE 符合；未导出时省 PDF 空间 | 首次等待、并发锁、固定渲染依赖、失败恢复；不能重跑 AI | 现有该策略保持；一旦导出按 A 缓存，而不是每次下载重渲染 |
| C HTML-only | 文本和共享 WebP 开销小，响应式可读 | 不可移除已售 PDF 权益；离线/归档和资产长期可用性不同 | 只适合未来明确约定且另行批准的新产品 |

建议默认：**付费 PDF 交付保持原时点和权益；生成一次紧凑 PDF 后，在合同保留期内持久缓存，同时保留既有不可变 IR/HTML。既有 ON_DEMAND 路线维持首次导出触发，随后返回缓存原字节。** 不为节省少量存储破坏可重开、可追溯及历史下载，也不改现有 pdfPolicy 字符串。

HTML Reader 使用原始已批准 WebP 的版本化 SHA URL；PDF 使用绑定同一个 source asset SHA 的 JPEG/PNG 派生物。HTML 不为每位客户嵌入相同资产的 Base64。PDF 必须可离线自包含，不能把外部 R2 图片 URL 当成可打印图像字节。派生缓存跨报告复用可省编码 CPU，不能消除每份独立 PDF 自身的图像字节。

## 版本、鉴权、水印和旧下载

报告内容版本、输入/计算/正文快照和 accepted authority 保持不可变。编码变化是新的 rendition/profile/version/outputDigest，不覆盖 report content version，也不替换旧 artifactDigest。原 PDF objectKey/outputDigest 继续可用，历史链接/下载授权仍返回原来的原字节。可选紧凑版本只能加为清楚标注的旁支。

每次 Reader、reopen、redownload 仍走现有账户、person/consent、购买、locale、报告版本、状态和 entitlement 验证；短期 header grant 绑定 report + owner + rendition digest。私有 PDF 不进入公共资产 bucket。退款/撤销阻止后续在线访问，不承诺追回已经下载的离线文件。

如商业条款要求水印，在首次冻结 PDF 前按既有 renderer 的受准许覆盖区域一次生成并纳入 digest，使用既有 policy 版本；后续重复下载不追加新时间戳造成“原件”漂移。本轮没有加水印、改版式或实现新水印系统。现有所有路线的水印覆盖不能仅凭文件存在认定一致，须后续单独核对。

**重开/重新下载不得调用 AI、姓名计算或解释工厂。** 缓存缺失先修复既有精确对象；如准许确定性 PDF 重建，只用冻结正文、已固定资产/字体/渲染器版本，且不得把不一致的新字节冒充旧 outputDigest。

## 费用来源和算例

仅使用 [Cloudflare R2 官方价格](https://developers.cloudflare.com/r2/pricing/)（读取 2026-10-29）：Standard $0.015/GB-month，Class A $4.50/百万，Class B $0.36/百万，公网 egress 免费；Standard 免费额度为 10 GB-month、A 100 万、B 1000 万。按官方计费单位向上取整。不是实际账户账单，没有查询私有 R2 或 D1；读取官网价格不调用付费模型/渲染服务。

以每个样本独立复制 10,000 份、稳定存 30 天且独享全部免费存储额度为示例：

| 样本 | 原始 GB | 未来紧凑 GB | 原始 USD/月 | 紧凑 USD/月 | 旧+紧凑 USD/月 |
| --- | --- | --- | --- | --- | --- |
| Astrology 占星 | 432.9951 | 86.07331 | 6.345 | 1.155 | 7.65 |
| BaZi 八字 | 356.00261 | 62.46797 | 5.205 | 0.795 | 6.135 |
| ZiWei 紫微 | 441.98197 | 94.44248 | 6.48 | 1.275 | 7.905 |
| Numerology 数字学 | 302.0235 | 100.87956 | 4.395 | 1.365 | 5.895 |
| Human Design 人类图 | 715.49565 | 121.68627 | 10.59 | 1.68 | 12.42 |
| PHI Configuration 构型 | 37.28901 | 6.38552 | 0.42 | 0.0 | 0.51 |

完整 1,000 / 10,000 / 100,000 份算例见 STORAGE-COST-SCENARIOS.json。GB 为十进制计费单位；各行不能相加后重复扣六次免费额度。ECR 行仅是六页合成样本，不是完整作者报告或客户群平均。未计 IR、HTML、索引、编码/渲染 CPU、其他账户对象、税或实际产品组合。CPU 秒已实测，生产计算单价未确认，不能虚构按需生成总成本。

**保留历史原 PDF 再增一个紧凑副本，会增加存储，不会释放旧存储。** 本表紧凑节省只对应未来新生成 PDF 或经单独批准的存储策略；本轮及计划均不自动删除、覆盖或迁移历史对象。R2 出网免费，压缩首先改善下载体验、内存、吞吐及后续存储，而不是虚构的 R2 egress 节省。

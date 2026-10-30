# R1.1 Commercial watermark proposal — NOT APPROVED

现有仓库未定位到可以证明已批准 BaZi 商业水印文字、位置及准入版本的正式回执。本轮不能把书籍水印或 QA 标记当作批准的报告商业水印。

供本次人审决定的最小方案：

- 可见商业水印：`PRIVATE COPY · {opaque reportRef}`，放在每页页脚/边栏，不遮挡正文和图表。
- 正式引用采用不可猜测的报告标识；Subject、Order、Purchase、Entitlement 在私有 frozen artifact 中由现有服务端 owner 关联，PDF metadata 只保存 opaque refs 与绑定摘要。
- 姓名、生日、出生时间、地点不写公开 URL 或文件名。客户 PDF 可在私有内容内显示经授权的 Subject。
- 本地合成报告每页保留 SYNTHETIC QA；正式客户生成必须经过正式版本/水印 receipt，使用真实服务端绑定并重新打印，不得剥除本批合成文件的 QA 标签冒充客户文件。
- 新商业水印将改变 PDF 字节。获准后对真实签发版本重新进行全文、目录/书签、水印、原生来源、Q87、SHA 及权限检查，才交给既有 Artifact Store。

本批 PDF 只有可见 SYNTHETIC 标记与报告引用；商业水印状态仍为 PENDING。没有伪造 Owner ACCEPT。

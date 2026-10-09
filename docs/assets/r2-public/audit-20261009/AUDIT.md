# phios-public-assets 只读审查

当前完整认证清单：1474 对象，671865410 字节；分页 2，最后页未截断。Wrangler 4.120.0 的 object 命令无 list；使用仓库既有 REST Objects GET。旧 OAuth 首次返回 401，Wrangler bucket info 的内置刷新成功后列举成功。未新建授权、改权限、部署或删除。凭据仅在内存，未写入报告。INVENTORY-FAILURE.json 是成功前失败记录，以 INVENTORY.json 的 complete=true 为当前清单。

扫描 19699 个文本文件，含 89 个超过 2 MB 文件，未设尺寸跳过阈值；动态构造疑点 411 个，详见 OBJECT-REVIEW.json。对照完整 key、编码 key、basename、资产代码间接引用与已接受登记；basename 匹配单独标为未解析，代码引用只证明可达，不证明真实显示。排除 .git、node_modules、构建目录和本轮报告，未读凭据文件。报告中的历史/冻结/回退引用均不能被当成废物。

| 分类 | 对象数 |
|---|---:|
| 证据不足 | 431 |
| 已使用 | 199 |
| 历史/打印/回退保留 | 593 |
| 已批准但未接入 | 251 |
| 可删除候选 | 0 |

逐对象 key、大小、更新时间、ETag、线上可取得 SHA256、路径证据、理由、阻断及可释放字节见 OBJECT-REVIEW.csv / OBJECT-REVIEW.json。ETag 不假定是 SHA256，也不能跨 multipart 上传直接证明内容相同。当前可批准释放字节为 **0**。

## Resolver 与消费者

公共 resolver assets/js/runtime/web-production/asset-resolver.js 按代码和登记变体解析，要求 verified，fail closed；不是所有历史登记都会在页面显示。报告 editorial resolver functions/canonical-presentation-runtime/report-editorial-resolver.js 要求 active=true、method/page/locale 精确匹配；打印、付费报告和旧客户材料是独立消费者，未从匿名页面加载情况推断其不用。Profile functions/profile/personal-evidence-visual-assets.js 的纯 resolver 已实际执行，SEC-05 的双点 ..webp 是当前实现输出，未自行纠正文件名；需依据对象存在和交付登记判断。其他动态构造点逐路径列出，尚未穷尽所有输入组合。包/路径别名由扫描当前代码与登记间接引用覆盖，未宣称已穷尽任意动态 import。

本轮观察 8 个公开线上入口，76 次 R2 响应、32 个不同 key；有成功 body 时计算 SHA256。ONLINE-LOADS.json 逐页记录实际图片解码和响应，绝非 HEAD 成功等于显示稳定。新无登录浏览器仅 GET/HEAD，阻断业务 API、provider 与付款，不提交表单。未抓取认证报告、历史私有客户材料或完整 R2 access logs，所有未观察到的 key 均 RUNTIME_UNVERIFIED。public asset config GET 不产生模型调用。

旧 2026-09-19 快照为 1097 对象，和本轮逐 key 差异见 SUMMARY.json；不直接继承旧“未显示/退休”结论。既有 r2-260-* 浏览器凭证明确属于 LOCAL_BROWSER_VERIFICATION，仍保留其历史适用范围。

## 删除与缺口

“错绑或仍调用旧版本”本轮确证 0；“可删除候选”0。比较中排除了书籍 hero 与封面两个角色、目录 prefix 与其 page-001 子对象造成的假冲突，不因为文件名带 v1 判断为旧版本错绑。当前根 package imports 只有 #cmp-production-api（指向 canonical meaning API），无 exports／根 tsconfig／jsconfig；详情见 ALIAS-BOUNDARIES.json。

没有对象同时满足“替代版本已有效验证、无当前消费者、无历史客户材料、无必要保留依赖”四个条件。因此本轮删除名单为空，不能把零静态引用、旧版本后缀、0 字节目录占位符或线上一次没加载当作删除授权。每项 releasableBytes=0；对象 size 表示占用量，不表示可释放量。

仍需：完整历史客户报告/打印/材料引用索引；认证消费者与输入分支运行记录；每对象替代版本的具体接受及有效交付证据；完整动态路径与 package aliases 的可解析依赖图；如发现同代码旧对象仍消费，明确变体/回退范围。新旧相似文件不是替代证明。未改资产绑定、权限或线上状态，SOURCE 对账局部验证，DEPLOYED 仅本轮公开页面观察，LIVE_CUSTOMER/未覆盖消费者 RUNTIME_UNVERIFIED。

状态 EVIDENCE_GAPS_OPEN；不提供未经证实的删除批准。

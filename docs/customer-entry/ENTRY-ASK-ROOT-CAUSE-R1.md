# ENTRY / Ask 根因与当前状态

日期：2026-10-20（Asia/Kuala_Lumpur）。基线 main / remote main：510eee069a19a04d31acd6e7d71a201dac83cfb3。起始工作树干净；之后其他窗口的 World R3 与报告证据修改保留，未纳入本任务的完成声明。

## 已证实

公开首页 HTTP200，client-intent-router.js HTTP200；将“爱情”提交至 POST /api/client-intent-route，生产 HTTP503，正文 {"ok":false,"status":"temporarily_unavailable"}。请求及响应摘要见 ../../tools/review/customer-entry-r1/PRODUCTION-READONLY.json。

Cloudflare 只读项目元数据确认当前 canonical 447d676c-e321-47ba-9c72-e149789c84d3，sourceCommit 510eee069a19a04d31acd6e7d71a201dac83cfb3；生产 READ_ONLY，P9 canary/checkout/refund 与报告provider开关全false。未读取/输出Secret值或写入配置。此前沙箱DNS失败已保留为初始环境错误；授权范围内的本机只读访问随后成功。

functions/_middleware.js 在 READ_ONLY 下对所有 POST/PUT/PATCH/DELETE 返回 maintenanceResponse；functions/_lib/d1-maintenance-guard.js 的响应与线上503完全一致。首页 assets/js/pages/client-intent-router.js、header shell.js 与普通 Ask discovery 分支均原来使用 POST。这条请求在意图识别前被拦截，并非模型不可用、额度不足或爱情内容计算失败。

另一个独立缺口：原 functions/public/client-intent-router.js 不识别“爱情”这个常见主题，即使绕过中间件运行，也会 NO_MATCH。没有通过放宽写入保护解决它。

## 本地最小修复

- 原POST保护完全保留，functions/_middleware.js 与D1 guard未改。
- 现有 client-intent-route 增加有界、无数据库、无provider的GET读取接口，复用原路由与公开知识检索；首页、header与Ask的ENTRY分支改用它。请求不触及会员/账务/报告。
- 六个生活主题共用一个可审计映射，绑定现有双语公开文章身份与原页面；只提供导航，不编写客户个人结论。常见短主题可在本地运行，不依赖API。复杂/风险问题仍由现有服务器路由处理；离线不猜测复杂答案。
- 服务故障保留输入、解锁按钮、提供重试与阅读，主题按钮仍可用；不冒充成功，不自动二次执行。
- 公开GET只用于普通探索问题，不接收客户私有报告、账号对象或会员请求。客户端使用 no-referrer/no-store；普通搜索可能出现在请求URL和平台访问日志中，故不可当成私人咨询入口。

## 证据层级

LOCAL：源码已修改，实际API及浏览器检查单独记录。
REMOTE：本轮只读 remote main与起始HEAD相同，未push。
DEPLOYED：仍是上述旧部署，本轮未部署。
LIVE：旧POST故障已实测；新GET/主题方案尚未线上验证。不能写“线上已修复”。

## 未知与风险

没有请求级生产日志，无法推断所有历史失败均由同一分支引起。H.5/bootstrap未发现该表单提交依赖：当前表单由ES module直接安装，locale-bootstrap仅初始化语言。已有Paid/Contextual Ask执行、会员激活、私有资料和账户保存均不在本轮验证范围。

上线需对本候选另行批准构建产物部署，之后验证GET路径、缓存/路由与READ_ONLY不变；目前不要求或执行生产迁移、provider开启或支付变更。

## 实际生产字节比对补充

PRODUCTION-SOURCE-COMPARISON.json 证明：线上首页与线上 client-intent-router.js 均与起始510eee06对应Git对象字节完全一致；都不等于本轮当前候选。因此可确认是已部署旧实现与READ_ONLY策略不兼容，而不是本地新修补已经上线。原HTTP响应与截图保留。

## 阅读显示与构建修补

公开英文文章保留原正式术语，隔离通用UI清理器对“Projection”等词的替换；只把通用“正文”标题显示为Reading，不改源JSON。十份正文按原公开sections完整匹配，而非任意字符数阈值。Book VI当前中文公开说明仅215字，未扩写为整册覆盖。

构建原来只收Git tracked文件，缺少本轮两项新静态依赖。仅对这两个公开路径增加收录，所有原边界仍执行。最终真实Worker、路由与八个静态文件摘要见BUILD-RECEIPT；此前成功但缺资源的产物被本候选拒绝，未发布。

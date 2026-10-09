# 现有资产接线结果 · 2026-10-09

状态 **EVIDENCE_GAPS_OPEN**。本轮目标是已有消费者的实际接线和显示；没有创建资产登记、无关页面、重绘、删除、部署、权限变化或 provider 调用。本代理没有执行 commit/push。其他窗口在检查期间推进 HEAD 并纳入部分本轮文件；保留全部修改，未回滚。每批 HEAD 与完整原始结果保留，跨 HEAD 的首轮不宣称同一冻结版本的整站 PASS。最新 HEAD 对 15 个 world、12 个 Book VI 和每个 Book V 组各一张（48 组合）均复查通过；Book V 886 个原始通过组合沿用其原 HEAD 范围，6 个失败组合单页复查通过，不能把继承证据改写成全部重新跑过当前 HEAD。

## 250 项分类

共 250 项，250 项有四种桌面/手机及语言组合的实际解码显示证据。逐图 key、接受凭证、内容对象、页面、前后变化见 ATLAS-250-RECONCILIATION.csv/JSON。

| 组 | 项数 | 显示验证项数 |
| --- | ---: | ---: |
| CASE_SECONDARY | 20 | 20 |
| CASE_HERO | 42 | 42 |
| COMPARISON_FAMILY | 6 | 6 |
| MODERN_FLAG | 24 | 24 |
| HISTORICAL_FIGURE | 16 | 16 |
| CIVILIZATION_INFRASTRUCTURE | 20 | 20 |
| LOSS_FAMILY | 6 | 6 |
| LOSS_TYPE_VIGNETTE | 24 | 24 |
| GEOGRAPHIC_BASE | 10 | 10 |
| WORLD_RECONFIGURATION_SNAPSHOT | 12 | 12 |
| SCALE_SHIFT | 7 | 7 |
| WORLD_SNAPSHOT_ATMOSPHERE | 15 | 15 |
| TRAJECTORY_MOTIF | 16 | 16 |
| TRANSITION_WINDOW | 32 | 32 |

原扫描遗漏了实际动态消费者。另将仅有显式情境深链、未找到常规页面展示位的组单独标为批准保留；深链可显示不等于已经有日常客户使用。基础设施、地理底图、人物和旗帜仅记录既有情境深链用途；没有为了铺图新增默认展示位。20 张 secondary 的同一旧凭证 ownerConfirmedRequiredSecondaryAssetIds 已明确 Human ACCEPT，并注明 URL 技术未解决；本轮原 URL 解码显示成功，关闭技术缺口，不重复内容验收。70 项规划图的 sourceRegistry 是 W4C 规划 authority ID；没有对应常规语义消费者，不编造内容对象或新页面。接受图的原字节及视觉不变：横切面的桌面窄列改为完整横向行；显式情境图框不再把 4:3 图裁成 16:9。打印记录仅覆盖展开后的图位及 print media，不等同全书分页完成。截图为真实本地页面；不是 HTTP200 或 hash 代替显示。

## 三个特别核对

- Personal PIS-034 → /reality/；Professional PIS-035 → /professional/。当前统一 resolver 正确编码真实 key 的反引号为 %60，无需重命名。接受凭证在当前 client registry v1.8（OWNER_ACCEPTED、NEUTRAL）及其历史登记中保留。SPECIAL-CONSUMERS.json 有四组合的实际显示与摘要；初次 lazy-load 验证器等待顺序错误保留为独立诊断，不算产品失败。
- Profile SEC-05 → 现有 CASE-08 双语档案审阅消费者，dossier projection → 当前 renderer；resolver 已使用 RELATIONSHIPS..webp。四组合查看的是现有双语 synthetic review report，不宣称真实客户交付。当前 CASE-08 HTML 与 W11R6 HUMAN_ACCEPT manifest 摘要一致；同一已接受 53 页 PDF 摘要一致，第 29 页 SEC-05 经 Poppler 实际渲染核对完整原图，见 PROFILE-SEC-05-ACCEPTANCE-PROOF.json / PROFILE-SEC-05-ACCEPTED-PRINT.png；未改图或命名。
- Thesis → /thesis 阅读与 /api/thesis-download 下载。用户本轮明确确认 3044299 字节 R2 文件为正确版本；SHA256 59452e4a00b853cee8260f500e3c758ca3b01ecec23589c586dbcb854c455c09，104 页 A4，Teresa Lee，标题 Reality Navigation Thesis。旧 15994918 字节源稿登记及 version=null 保留，新增 current_public_delivery，不编造稳定版本号。固定下载入口只读现有登记，验证大小和 SHA256，错版/非 PDF fail closed；四组合实际下载一致。R2 没有 CORS/attachment 头，同源入口解决跨域 download 属性不足。全局 CSP 保持不变；同源 iframe 和固定 PDF 响应允许当前阅读消费者。Edge 在仓库实际 CSP 下已显示桌面 PDF 首页（双语截图）；手机使用既有打开 PDF 与下载入口。四组合下载均取得相同原始文件。完整 104 页的设备阅读、分页及原 PDF 打印仍 RUNTIME_UNVERIFIED；封面经 Poppler 实际渲染核对，网页打印隐藏内嵌阅读框。

## 具体缺口

1. L5 预期 VIS-B5-ATLAS-L5-TEMPLATE-BASE.webp 已 404 且不在完整清单。现存 IS-B5-ATLAS-L5-TEMPLATE-BASE.webp 为 436804 字节、1024×1536；交付预期为 349000 字节、1536×1024，摘要不同。接受方向不等同该对象的最终视觉接受（原 FR4 status 明确 NOT_YET_GRANTED）。关闭旧错误 VERIFIED_LIVE_R2 声明，使用既有结构化 reader 和 15 张接受图；待具体对象接受及布局规格核对，不猜替代、不改名。
2. Thesis 桌面原生阅读首页与四组合实际下载已验证；完整 104 页设备阅读、手机外部阅读器及逐页打印尚缺证据。
3. 跨 HEAD 检查的版本范围保留；本轮不把未取得的部署/认证客户记录提升为完成。

## 回归

- node scripts/check-thesis-download-binding-20261009.mjs：exit 0，PASS
- node scripts/check-civilization-atlas-customer-visual-activation.mjs：exit 0，PASS
- node scripts/check-civilization-atlas-presentation-i18n.mjs：exit 1，BASELINE_FAILURE
- node scripts/check-civilization-atlas-fr4-visual-utilization.mjs：exit 0，PASS
- node scripts/check-about-thesis-i18n.mjs：exit 1，BASELINE_FAILURE

BASELINE_FAILURE：Book VI 旧检查要求 six reading views 的文字断言与现有导航不符（check-civilization-atlas-presentation-i18n.mjs:52；本轮未改对应 renderer）；About/Thesis 旧检查要求 about.html 和 thesis.js，而 HEAD 已采用 /about/ 与 thesis-seven.js。本轮没有改这些旧断言、冻结摘要或历史凭证制造 PASS。全部命令、退出码、完整错误见 REGRESSION-CHECKS.json。

## 删除小批

最大 5 个对象逐项保留：4 个现行 logo 仍有登记，缺可验证的接受替代；当前 Thesis 正在使用。7 对 Thesis WebP 已逐对 GET 比 SHA256，相同内容共 5569190 字节，14 个原始对象的恢复内容已保存（以摘要去重存储）。两条路径仍有具体现行登记/历史原 URL 引用，未迁移，因此实际可释放 **0 字节**。不是因为泛称缺全部 access logs；RETIREMENT-SMALL-BATCH.json 列每对象的登记、原引用、原 key、摘要与恢复副本。无 DELETE_CANDIDATE，无删除授权待执行。

SOURCE：上述本地逐对象接线/显示/真实下载证据。DEPLOYED：新源码变更 RUNTIME_UNVERIFIED，未部署制造证据。LIVE_CUSTOMER：RUNTIME_UNVERIFIED，未将 synthetic 档案或公开 R2 读取当成客户交付。

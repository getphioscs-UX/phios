# 最后统一审核：ECR-FULL-R1 + ECR-FULL-R1A + PIS-R1

状态 **PENDING**。按用户指示统一放到最后。这里是协调入口，不是新验收 authority，也不替代已有明确批准。

| 项目 | 审核材料 | 状态 |
| --- | --- | --- |
| ECR-FULL-R1 | [实际报告审核页面](./review.html)；[24 组 / 48 双语视图](./core-review/cases.json) | PENDING |
| ECR-FULL-R1A | 同一页面切换 R1A；[36 组定向案例](./context-review/cases.json)，第 12 / 13 / 14 章各 12 组 | PENDING |
| ECR / Profile 图标 | [8 组截图](./icon-browser-results.json)；Personal 方法介绍、选择框、Profile 入口和页首 | PENDING |
| Report 视觉与导出 | [8 组结果](./browser/results.json)；[打印样例](../../output/pdf/) | PENDING |
| PIS-R1 | [原审核页面](../public-index-successor/PIS-R1-HUMAN-REVIEW.html)、[原 packet](../public-index-successor/pis-r1-review-packet-v1.json)、[原 freeze readiness](../public-index-successor/pis-r1-freeze-readiness-v1.json) | 沿用既有 PENDING，未改记录 |
| ECR Mandala R2 W16 继承项 | [原记录](../../content/embodied-configuration/ecr-mandala-r2/acceptance/ecr-mandala-r2-w16-human-review-v1.json) | 原 humanAccepted=false；先核对后继验收覆盖，不重复覆盖已批准项 |

用 `node scripts/preview-ecr-full-review.mjs` 启动本地站点。直接 file:// 打开 HTML 无法读取模块与案例。页面支持案例、免费/付费深度切换、来源、打印、逐例决定下载，以及现有 Current Reality API 的独立证据输入核对。下载决定不自动修改准入。

每例核对：来源与 ECR 身份、Card/Mandala/报告一致、Part3/4/5 条件边界、出生基线与现实分离、信息增益、无诊断/吉凶/虚构时机、双语、移动/桌面/打印。R1A 特别检查五项独立经验输入、反证保留、四态比较及 OPEN 不被解释成否定。

只允许 ACCEPTED / REJECTED / PENDING；记录 reviewer、时间、caseId、locale、深度、report digest 与意见。PENDING 不算批准；代码或语义变化后须核对版本。R1 两种语言均须审核；R1A 36 个重点案例附独立输入、基线与比较证据。

生产准入仍 false。R1 和 R1A 分别验收，R1 不等待 R1A。R1A 候选映射须在原 interpretation owner 下通过审核。PIS 图片已有批准保持有效，原 Stripe 暂停状态不变。商品激活、真实支付及服务器 entitlement 接线须在相关 gate 满足后完成，审核页的 Paid 切换不发放权益。

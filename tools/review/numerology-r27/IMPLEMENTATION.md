# R2.7 本地整合候选

变更类别：Acceptance Fix / additive calculation provenance。没有改变归约算法、最终数值、解释准入、商业价格或部署状态。

已将现有 D3 引擎内部已完成的逐段计算作为不可变 `calculationProvenance` 输出，保留原有 `expression / soulUrge / personality / maturity` 字段。新增出版视图只复制这些字段，不计算数字学数值。

七个页面接入 `numerology-school-transparent.js`；其出版包装器继续使用现有 R22 视图及 R20 的 33 页计划，替换七个图表槽，保留其余十二个槽和十四个固定资产标识。姓名逐段归约与全名合计分别标明来源。P19 的年龄来自原生西方 timing；当前 `chartModel.cycleTimeline` 还承载另一组 Energy 周期，因此没有将其年龄或三角法移植进来。

三种语言的 `REVIEW.html` 为 19 页正文与原生图形的审阅页面，不是通过 A4 QA 的最终 PDF。其正文明确回放 R21 合成候选，并未声称已保留 R25 的十二页正文。R27 附件的正文、R25 及当前来源仍需逐段对账和人审。没有将附件示例的解释直接升级为生产权威。

来源视图和完整计算快照保存在 `.tmp/numerology-r27`，没有覆盖 R22。姓名样本为显式合成原始出生姓名；示例时区明确设置为 Asia/Singapore。真实缺时区输入仍由既有周期门禁保持未知。

## 复现

```powershell
node --input-type=module -e "import {build} from'esbuild';await build({entryPoints:['tools/review/numerology-r27/check.mjs'],outfile:'.tmp/numerology-r27/check.mjs',bundle:true,platform:'node',format:'esm',packages:'external'});"
node .tmp/numerology-r27/check.mjs
npm run check:num-production
npm run check:num-r18:admission
npm run check:num-cx-primary
npm run check:shared-report-delivery:v2-runtime
npm run check:paid-report-durable-integration
```

已运行的新检查 19/19。R18、客户主流程及两组共享交付检查通过；历史 `check:num-production` 在读取不存在的 `personal-runtime.html` 时失败。共享交付测试使用现有模拟传输，其中 durable integration 为 Bazi 上下文测试，不能当成 R27 的实际订单交付证据。

## 剩余门禁

- 三份新 33 页 A4 PDF、逐页字体/溢出、实际 PDF 与 SVG 数值对账未完成。上一轮本地浏览器最终渲染被自动审批服务额度错误阻断；没有绕过审批。
- 19/19 中英文 R27 新正文与来源逐段审阅未完成；R21 正文仅为回放候选。
- 附件中的档案三角法没有完整准入来源，未产生客户数值。
- 当前 canonical 出生日期投射没有显式学派 ID；视图保留 `schoolId: null` 和来源版本，不拿方法名冒充学派。解释学派与算法学派的对应仍需治理确认。
- R27 专属重复 webhook、退款、错误语种下载与实际新 PDF 的私有交付未重新验证；通用共享测试不替代这些证据。
- 本地 owner 为 RM59、双语附加 RM10、订单 Provider 上限 USD2、四次后续问题；Stripe 远端未核验，未修改价格。

`SOURCE_ADMITTED=BLOCKED`、`A4_PRINT_QA=NOT_EXECUTED`、`CLOUD_QA=NOT_EXECUTED`、`DEPLOYED=NOT_EXECUTED`、`LIVE_CUSTOMER=NOT_EXECUTED`。Provider、生产写入、Stripe 修改、commit、push、deploy 均为零。

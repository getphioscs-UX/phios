import fs from 'node:fs';
import {VISUAL_REPORT_PRODUCTS,VISUAL_REPORT_BUNDLES} from '../functions/canonical-presentation-runtime/visual-report-registry.js';
const root='docs/visual-report-r1',read=p=>JSON.parse(fs.readFileSync(p)),write=(p,v)=>fs.writeFileSync(`${root}/${p}`,JSON.stringify(v,null,2)+'\n');
const manifest=read(`${root}/cases.json`),machine=read(`${root}/machine-results.json`),browser=read(`${root}/browser-results.json`),pdf=read(`${root}/pdf-review/pdf-results.json`),global=read(`${root}/validation/full-check-result.json`);
const caseRows=manifest.cases.map(c=>({...c,data:read(`${root}/${c.path}`)}));
const evidencePaths={
 BZR:'content/professional/bzr-full-production/machine/bazi-fp-w17-machine-results-v1.json',
 ZWR:'content/professional/zi-wei-professional-reading-r2/campaign/ziwei-pro-r2-w15-professional-quality-campaign-v1.json',
 AST:'content/professional/ast-full-production/customer-reading-v2/acceptance/ast-r2-w17-production-machine-acceptance-v1.json',
 NUM:'scripts/check-num-fp-full-production-admission.mjs',
 PROFILE:'content/profile/campaign/profile-prf-w12-machine-results-v1.json',
 ECR:'docs/ecr-full-r1/core-machine-results.json',
 HD:'content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/campaign/HD-PRO-R3-W20-machine-results-v1.json',
 CROSS:'content/customer-experience-rebuild/r12r4b/cross/campaign/cross-w24-64-machine-campaign-v1.json'
};
const census=Object.entries(evidencePaths).map(([methodId,path])=>({methodId,path,exists:fs.existsSync(path),scope:'INHERITED_METHOD_SEMANTICS_NOT_NEW_VISUAL_ACCEPTANCE'}));
write('inherited-campaigns.json',census);
const admission=VISUAL_REPORT_PRODUCTS.map(p=>({...p,humanReview:'PENDING',customerPublishable:false,checkoutEnabled:false,paidValueAccepted:false,visualCandidateCases:caseRows.filter(c=>c.methodId===p.methodId).length,blockers:[...(p.methodId==='PROFILE'?['SOURCE_DEPTH_LIMITED_FOR_SINGLE_ENTRY_MODES']:[]),'HUMAN_FREE_VS_PAID_VALUE_REVIEW','EXISTING_PRODUCTION_PAYMENT_GATE_CLOSED']}));
write('production-admission.json',{work:'VRPT-R1',status:'INTERNAL_REVIEW_ONLY',predecessorEcr:'REJECTED',products:admission,bundles:VISUAL_REPORT_BUNDLES,automaticHumanAcceptance:false});
write('human-review-queue.json',{stage:'LAST_WITH_PIS_R1',predecessorDecisionRef:'predecessor-human-rejection.json',reports:admission.map(p=>({productId:p.productId,state:'PENDING',preview:`review.html?case=cases/${p.methodId}-01-zh-Hans.json&depth=paid`,blockers:p.blockers})),bundles:VISUAL_REPORT_BUNDLES.map(p=>({productId:p.productId,state:'PENDING',preview:'catalog.html',entitlementContract:'phi-os.pws.report-commerce-successor.v1'})),pis:{work:'PIS-R1',preview:'../public-index-successor/PIS-R1-HUMAN-REVIEW.html',historicalDecisionUnchanged:true},acceptanceOwner:'HUMAN_ONLY',productionAdmission:false});
const minMax=a=>`${Math.min(...a)}–${Math.max(...a)}`;
const table=VISUAL_REPORT_PRODUCTS.map(p=>{const cases=caseRows.filter(c=>c.methodId===p.methodId);return `| ${p.methodId} | ${cases.length} | ${minMax(cases.map(c=>c.data.free.pages.length))} | ${minMax(cases.map(c=>c.data.paid.pages.length))} | ${p.methodId==='PROFILE'?'来源自适应候选；部分入口不足以形成完整付费深度':'来源绑定候选；人工价值验收待定'} |`;}).join('\n');
const screen=browser.results.flatMap(r=>r.pages),visualMin=Math.min(...screen.map(p=>p.visualRatio)),bodyMax=Math.max(...screen.map(p=>p.bodyRatio)),outsideTarget=screen.filter(p=>p.visualRatio<.55||p.visualRatio>.70).length;
const status=`# VRPT-R1 · 交付状态与最后审核

基于 013d3aa6e9d09ab079d0696a5d0b15905fac0783。上一轮 ECR R1/R1A 已记录 **REJECTED**：报告与 free version 没有分别。本轮是可追溯的视觉候选交付，**不是八个收费产品已验收、上线或 W0–W28 全部完成**。

入口：[八报告预览](review.html) · [商品与 Bundle 陈列](catalog.html) · [最后统一审核（含 PIS-R1）](final-review.html)。所有样本为明确标注的合成／既有测试样本，不是客户档案。

## A · BASELINE

本地 HEAD 与指定提交一致，初始工作区干净。没有提交、推送、部署或更改真实订单。远端最新状态未另作成功验证；不把本地 HEAD 称作远端最新。方法 SVG 为 9 个（含 ECR 与 Profile），沿用基线的已修正检查与资产，没有删除图标。

## B · AUTHORITY CENSUS

方法计算／既有解释、Shared Customer Claim IR、AcceptedMethodReadingEnvelope、PersonalReadingReportIRv2、canonical presentation、PVP 资产、PAI 路由、Current Reality 各保留原职责。HD 使用当前 R3 production product；Cross 使用当前 maybeBuildProductionCombinedReading，并核对 input/matrix digest。新页面没有独立意义 authority。详见 [继承 campaign 清单](inherited-campaigns.json)。

## C · EXISTING REPORT INVENTORY

ECR R1/R1A 历史审核包保留；当前 admission 已改为 REJECTED。NUM 使用 integrated reading + D8；BZR 使用 method-native reading；ZWR 使用 Phase 9 / Pro R2；AST 使用 customer product v3；Profile 使用现有 progressive view / PFIG；HD 使用 R3；Cross 使用 runtime reading v2 的当前生产封装。未把旧版 human acceptance 转移到本轮视觉版。

## D · PRODUCT REGISTRY

8 个目标报告、3 个 Bundle、16 模板、21 图形组件已注册于现有 presentation 范围。[注册快照](presentation-registry.json)。目标价：BZR/ZWR/AST/NUM/PROFILE/ECR 各 MYR 39，HD 129，Cross 299；这些不是已启用 checkout 价格。

## E · FREE / PAID CONTRACT

两种深度保持相同结构身份；免费 claim refs 是付费子集。付费展开来源中的关系、周期、条件及证据；增加页数或文本本身不算信息增量，未绑定来源的“新增项目”不会通过增量检查。机器只证明来源差异，**不证明商业价值**。人工必须同时对照原有免费页面，不能只对照本轮压缩后的 Free 预览。原公开免费页面未切换。

## F · PAGE TEMPLATE REGISTRY

RPT-T00–T15：封面、身份卡、快照、结构图、分布、矩阵、时间、关系、比较、层次、洞见、导航、边界、流程、证据、自适应。每页一个问题、一个主视觉、最多三条洞见；中文上限 180 字、英文上限 110 词，图内 secondary prose 也计入。

## G · VISUAL COMPONENT REGISTRY

21 个组件有来源约束与原生 SVG/HTML 编码。定量图必须有真实数值；环图／热图等需同来源可比单位，散点需原始 x/y，缺失矩阵格保持空缺。复用 ECR Mandala、AST natal chart、ZWR 十二宫坐标与 HD 四状态结构图。PHI Cards 使用原注册 R2 插画。另新增 11 个报告家族 SVG，保留原 ECR 封面，共 12 个报告家族资产；不在图中嵌入价格。

## H · PAGE IR

所有 ${caseRows.length} 组预览都绑定实际生成的 PersonalReadingReportIRv2 的 reportId / semanticDigest。方法核对对应 method digest；Cross 核对 reading digest；Profile 核对已准入 signal refs。父 IR 不改写。Web / Print / PDF 使用同一 child Page IR。

## I · 8 METHOD BLUEPRINT STATUS

| 方法 | 双语配对案例数 | Free 页数 | Full 页数 | 本轮状态 |
| --- | ---: | ---: | ---: | --- |
${table}

页数由来源与字数上限决定，不是售卖价值指标。ECR 条件扩展缺少独立观察证据时抑制；AST 未提供 timing / current reality 时抑制；HD 沿用 R3 已选 findings，不默认展开全部闸门。Cross 的证据页展示当前已准入的原始方法贡献，不以方法投票作结论。Profile 保留七种入口、IPIP 两种表单，**单入口仍只有来源数值／证据时，不虚构 9–14 页深度或新人格解释**。

## J · BUNDLE STATUS

MYR 69 / 99 / 159 已读取用户批准的 PWS successor contract。Bundle 2 / 3 分别选 2 / 3 份；5+ 当前可选 5–6 份，最大值来自六个标准报告 eligibility registry。HD / Cross 不在低价 Bundle 内，Cross 权益独立。

## K · COMMERCE / ENTITLEMENT STATUS

用户已确认旧完整矩阵尚未入仓并正式批准增补。现已在现有 PWS Product / Commercial Runtime materialize 八报告、三 Bundle、schema、registry、42 个有效组合及 150 个错误数量反例、独立权益计划和客户投影。没有第二个 Commerce Runtime，最小 schema gap 为 NONE。详情见 content/pws/commercial/report-successor-r1/。真实收费、权益发放及下载授权仍遵守现有 gate；本轮未激活或声称测试真实支付。

## L · AI COMPOSITION STATUS

T1 默认确定性组装；T2 只选择／排序完整已准入短句；T3 仅允许 Cross。复用现有 PAI 路由与 structured provider，保留来源、locale、预算、缓存、超时、较便宜可兼容 fallback 和 canonical fallback。mock 成功／失败／恶意新事实／未知引用／缓存／超时检查通过。没有本地 OPENAI_API_KEY；**真实 provider 成本、时延与自动改写 campaign 未执行**。不会把 mock 标成真实生成验收。

## M · BILINGUAL STATUS

全部八方法均有 en / zh-Hans 页面。方法解释复用相应 locale owner；Cross 的五类关系边界仅作 presentation 翻译，原始方法贡献按 locale 从已有 owner 生成。源提供方名称、部分 Profile 分面代码和 HD 技术名保留。双语可读性及语义等价仍需人工审核，不能仅以两份文件存在判定通过。

## N · DESKTOP / MOBILE STATUS

${browser.views} 个视图，${browser.results.filter(r=>r.status==='PASS').length} PASS：八方法 × 双语 × Free/Full × 1440/390，加 Profile 其余入口与 ECR 条件扩展。手机关系图／柱图独立重排；十二宫保留空间关系并可横向查看。见 [浏览器结果](browser-results.json) 与对应 browser/ 截图。

## O · PRINT / PDF STATUS

${pdf.sampleCount} 份 A4 PDF，${pdf.passCount} PASS；页数与 Page IR 相同，正文可提取，图表使用原生 SVG/文字。ECR 仅原有六张 PHI Card 插画为栅格。见 [PDF 检查与联系表](pdf-review/pdf-results.json)。通过浏览器打印，不用整页截图冒充 PDF。

## P · VISUAL DENSITY RESULTS

浏览器主视觉 DOM 区域最小 ${(visualMin*100).toFixed(1)}%，正文最大 ${(bodyMax*100).toFixed(1)}%；不得低于 45% / 高于 30%。55–70% 是目标区间，${outsideTarget} 个页面视图落在目标区间外但未越硬阈值，留给人工检查。DOM 容器占比只是代理指标，**不能代替图形实际占用、可读性和有用性的目视判断**。

## Q · METHOD MACHINE RESULTS

新增检查：ECR ${machine.ecrExecutions} 次双语投影；${machine.contextExecutions} 个继承 R1A 观察案例；其他七方法 ${machine.otherMethodCases} 个来源配对案例；父 IR、免费子集、增量反例、原始来源不变和定量图缺失值拒绝。见 [machine-results.json](machine-results.json)。继承方法 campaign 与新增视觉检查分开记录，不把旧 human review 算作本轮完成。

## R · GLOBAL MACHINE RESULTS

完整既有 npm 生命周期退出码 ${global.exitCode}（${global.status}）。首次发现基线已含的三个 ECR locale 文件没有 PDS successor 注册；现用精确路径、原提交内容与 SHA 注册补齐，没有放开其他受保护文件。另修复 Windows 嵌套 npm PATH 增长造成的命令失联，未改全局 npm 配置。

## S · HUMAN REVIEW STATUS

本轮全部 PENDING，上一轮 ECR REJECTED。没有自动接受。报告、Bundle 与 PIS-R1 统一放在 [最后审核页](final-review.html)，[队列](human-review-queue.json) 保留每产品决定。下载记录不改变 publication / commerce admission。

## T · PRODUCTION ADMISSION BY PRODUCT

八报告及三 Bundle 均 CLOSED。详见 [逐产品准入](production-admission.json)。Profile 的来源深度不足单独阻断，其他产品也必须通过真实 Free vs Paid 人工价值评审、双语／视觉审核和相应权益契约后才可切换。

## U · KNOWN BLOCKERS / CHAT DECISIONS

1. Commerce 矩阵已由用户补充批准并落地；生产支付 gate 按要求保留关闭。
2. Profile 单入口的现有 owner 主要给出来源数值与证据，部分样本不足以形成完整付费深度；需已准入的进一步解释／情境证据，不能由 renderer 发明。
3. 真实 AI provider campaign 尚缺运行凭据；当前确定性报告与 fallback 可运行。
4. 最后的人工视觉、双语和商业增量审核仍待真实决定；因此发布、收费、正式 successor freeze 未执行。

## V · ADDED / MODIFIED / DELETED FILES

见 Delta ZIP 内 MANIFEST.json（逐文件类型与 SHA-256），只含新增／修改文件和删除清单。初始工作区干净；没有删除既有图标或旧报告包。截图与日志只作为本轮明确的审核／验证证据收录。

## W · FULL npm run check RESULT

\`npm run check\`：**${global.status}，exit ${global.exitCode}**。使用 \`scripts/run-check-windows.ps1\` 原样执行 precheck / check / postcheck。完整日志：[npm-run-check-final.log](validation/npm-run-check-final.log)。本轮新视觉检查另外以 \`npm run check:vrpt-r1\` 执行，通过日志：[focused-final.log](validation/focused-final.log)。未用分段 PASS 冒充全仓 PASS。

## X · DOWNLOADABLE DELTA ZIP

产物路径：\`output/delta/VRPT-R1-013d3aa.zip\`。SHA-256 与文件数量写入同目录 \`VRPT-R1-013d3aa.delivery.json\`。包内 REPLAY.md 指定基线、清洁 checkout、哈希核验、生成与测试命令；不含整仓、node_modules、.git 或临时浏览器 profile。

## W0–W28 工作包边界

| 工作包 | 状态 |
| --- | --- |
| W0 authority census | 完成记录；Commerce successor 按用户批准增补 |
| W1–W2 product / depth contract | 候选注册与校验完成；商业与人工冻结未通过 |
| W3–W6 templates / components / Page IR / AI contract | 已实现、机器验证；真实 AI campaign 未运行 |
| W7–W10 BZR / ZWR / AST / NUM | 来源绑定视觉候选完成，待人工审核 |
| W11 Profile | 七入口保留；来源深度不足的完整付费蓝图未完成 |
| W12 ECR | 11 页及条件扩展候选完成，旧拒绝决定保留 |
| W13 HD | 既有 R3 adaptive 读取的视觉候选完成，待本轮审核 |
| W14 Cross | 当前生产 owner、矩阵与原始贡献证据候选完成，待本轮审核 |
| W15 Bundle surfaces | 陈列、资产与资格／权益计划已绑定 |
| W16 Commerce binding | PWS additive contract 与机器检查完成；真实支付 gate CLOSED |
| W17 bilingual parity | 双语工程样本完成；人工等价审核 PENDING |
| W18–W22 browser / PDF / density / method / visual checks | 机器结果见上；不转移历史人工结论 |
| W23 AI campaign | mock / fallback / timeout 已验证；真实 provider 未执行 |
| W24 human review | 最后统一审核包已备，PENDING |
| W25–W27 cutover / production / freeze | CLOSED，未执行 |
| W28 delta | 工程候选 Delta；不是已准入产品 freeze |
`;
fs.writeFileSync(`${root}/STATUS.md`,status);
console.log('Built A–X status, inherited campaign index and final human review queue.');

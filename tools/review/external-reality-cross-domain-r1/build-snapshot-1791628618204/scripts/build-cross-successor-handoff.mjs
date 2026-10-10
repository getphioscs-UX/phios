import fs from 'node:fs';
import {CROSS_SUCCESSOR_MAPPING} from '../functions/runtime-reading/cross-successor-semantic-mapping.js';
const root='content/customer-experience-rebuild/r12r4b/cross/successors/hd-profile-r1',docs='docs/visual-report-r1/cross-successor';
const machine=JSON.parse(fs.readFileSync(`${root}/machine-results.json`));
const sources={
 crossInput:'functions/runtime-reading/cross-perspective-input-ir.js',
 crossProduction:'functions/runtime-reading/cross-reading-production.js',
 hdReading:'functions/external-profile/human-design-r3-reading-ir-v2.js',
 hdClaims:'functions/external-profile/human-design-r3-composition-runtime.js',
 hdClaimContract:'content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/claims/HD-PRO-R3-W3-claim-ir-contract-v1.json',
 hdPublication:'functions/external-profile/human-design-r3-production-authority.js',
 hdProduct:'functions/external-profile/human-design-r3-professional-runtime.js',
 hdBlueprint:'content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/report/hd-pro-r3-report-blueprint-authority-v1.json',
 profilePublication:'functions/profile/profile-production-authority.js',
 profileEvidence:'functions/profile/profile-foundation-runtime.js',
 profileAcademic:'functions/profile/academic-bridge-runtime.js',
 profileAdmission:'content/profile/acceptance/profile-prf-w12-production-admission-v1.json',
 adapter:'functions/runtime-reading/cross-hd-profile-adapters.js',
 mapping:'functions/runtime-reading/cross-successor-semantic-mapping.js'
};
for(const path of Object.values(sources))if(!fs.existsSync(path))throw Error(`SOURCE_NOT_FOUND:${path}`);
const audit={baseline:'e192653ff4fbafad1feaffb9dc1c0fa4073ad215',originalImplementationBaseline:'013d3aa6e9d09ab079d0696a5d0b15905fac0783',currentCrossAdmittedBefore:['AST','BZR','ZWR','NUM','ECR'],currentCrossAdmittedAfter:['AST','BZR','ZWR','NUM','ECR'],candidateMethods:['HD','PROFILE'],sources,hdSourceCustomerPublishable:true,profileSourceCustomerPublishable:true,crossSuccessorCustomerPublishable:false,humanReview:'PENDING',historicalPdf:{name:'PHI OS Runtime Reading.pdf',pages:40,role:'HISTORICAL_COVERAGE_UX_REFERENCE_ONLY',proseCopied:false,evidenceUsed:false},semanticGaps:machine.unmappedDomains,sharedDimensionsAdded:[],currentReality:'PRESENT_OR_MISSING_RECORDED_SEPARATELY_NO_CROSS_SEMANTIC_ACTIVATION',humanReviewCriteria:['HD semantic fidelity','Profile evidence-weight fidelity','HD Profile is not PHI OS Profile','No raw-symbol inference','No fabricated agreement','Tension preservation','Claim lineage','Customer clarity','Bilingual parity']};
fs.writeFileSync(`${root}/authority-audit.json`,JSON.stringify(audit,null,2)+'\n');
const mappingRows=Object.entries(CROSS_SUCCESSOR_MAPPING).flatMap(([method,rows])=>Object.entries(rows).map(([subject,dimensions])=>`| ${method} | ${subject} | ${dimensions.join(' / ')} |`)).join('\n');
const text=`# Cross HD + PHI OS Profile · 最后审核包

续作基线：e192653ff4fbafad1feaffb9dc1c0fa4073ad215。原工程基线：013d3aa。用户提交的历史 PDF 为 40 页覆盖／UX 参考；未复制正文，未作为 canonical evidence。

## 准入与 authority

变更前与当前正式 Cross 输入均为 **AST / BZR / ZWR / NUM / ECR**。HD / PROFILE 只是新增审核候选；source-method 客户发布资格与 Cross 输入资格分别处理。现有 production builder 对尚未准入方法返回 unavailable，不会因为适配器编译或机器通过而开放。

${Object.entries(sources).map(([key,path])=>`- ${key}: [${path}](../../../${path})`).join('\n')}

HD 使用当前 R3 Professional Product 的真实 publication decision、pre-editorial Reading IR findings 及其 claim/source/composition-rule refs。早期 Reading IR 内的 shadow 标记属于历史阶段，当前发布 authority 由 R3 W25 owner 与当前 product 决定。既不使用 customerReading / rendered HTML，也不从原始中心、闸门编号推断新意义。可选高级内容缺失时不补齐。

PROFILE 使用现有 signal envelope、评分／导入 owner 与 PRF W12 发布 authority。它与 HD 的 Profile（例如 5/1）拥有不同 method ID、digest、claim IDs 和来源。七入口保留；IPIP 50/120 分别测试。适配器只描述实际来源观察，不创作新人格解释。Quick、低完整度或不确定信号保持 OPEN；来源类别、工具、日期、原始值、precision boundary 和 confidence 均进入 Cross input。

## 候选映射矩阵

全部映射只使用既有 16 个共享维度，状态为 REVIEW_CANDIDATE。

| 方法 | governed claim role / source domain | 既有共享维度 |
| --- | --- | --- |
${mappingRows}

## OPEN / UNMAPPED：需要的语义决定

${machine.unmappedDomains.map(g=>`- ${g.subject}：保持 OPEN / UNMAPPED。`).join('\n')}

这些缺口不是新的共享维度请求。HD ADVANCED_MODIFIER 混合核心与可选修饰层，需要先批准如何按既有维度拆分，不能直接把整个 modifier 当作环境或决策证据。Big Five 不自动等同于现有 symbolic 意义；需逐工具／分面审核跨域映射。导入结果的 example 维度没有已准入解释，继续单独保留。未经决定的主张不进入 matrix 的支持或张力计数。

## 机器检查与其范围

**${machine.passed}/${machine.cases} 双语场景 PASS**。包含 HD 与原五方法各配对、PROFILE 与原五方法各配对、HD+PROFILE、含二者的三方法组合、5–7 方法审核样本、七入口、低完整度 Quick、HD 可选项缺失、Current Reality 缺失／存在以及导入结果未映射。Current Reality 有值时仍保持独立，因为既有 Cross gate 未批准它进入综合语义。

另验证不完整 lineage、修改 digest、伪造 Profile confidence / claim type、源未发布、默认生产路径拒绝新方法。${machine.governedTensionCases} 个场景保留真实 governed 输入的 TENSION；另用明确标识的 synthetic classifier inputs 验证 TENSION 优先保留，不将其伪装成真实客户冲突证据。继承的五方法 campaign 单独回归。

[90 场景清单](cases.json) · [双语审核与 Method Coverage Map](review.html) · [统一最后审核（含 PIS-R1）](../final-review.html)

## 人工与 production admission

人工需逐项核对：${audit.humanReviewCriteria.join('；')}。

**PENDING / customerPublishable=false**。候选覆盖图可列出七个来源，但 HD / PROFILE 明确显示 REVIEW ONLY；完全未映射的来源显示 SEPARATE UNMAPPED，缺少的显示 UNAVAILABLE。不显示“七方法正式准入”，不创建 CROSS-RUNTIME-2、百分比匹配、投票或 convergence-as-proof。现有 five-method production admission 不变。只有真实 machine + human acceptance 后才可更新现有 successor 准入。
`;
fs.writeFileSync(`${docs}/AUDIT.md`,text);
console.log('Cross successor authority audit and final human packet written; admission remains PENDING.');

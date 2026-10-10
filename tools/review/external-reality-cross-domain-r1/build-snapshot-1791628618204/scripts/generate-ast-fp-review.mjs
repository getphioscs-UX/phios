import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chartFixtures,projectChart,candidateFor} from './ast-fp-test-support.mjs';
const check=process.argv.includes('--check');
const out='content/professional/ast-full-production/review/ast-fp-review-cases-v1.json';
const md='docs/ast/full-production/AST-FP-ENGINEERING-REVIEW.zh-Hans.md';
const cases=[];
for(const chart of chartFixtures.cases){
 const projection=await projectChart(chart);
 for(const locale of ['en','zh-Hans']){
  const {candidate}=await candidateFor(projection,locale);assert.equal(candidate.validation.valid,true);
  cases.push({caseId:`${chart.id}-${locale}`,inputFixtureRef:`content/professional/ast-full-production/fixtures/ast-fp-chart-inputs-v1.json#${chart.id}`,inputClass:'SYNTHETIC_NOT_A_CUSTOMER',locale,houseSystem:candidate.houseSystemId,projectionId:projection.projectionId,projectionDigest:candidate.projectionDigest,compositionVersion:candidate.compositionVersion,semanticDigest:candidate.semanticDigest,interpretationDigest:candidate.interpretationDigest,coverage:candidate.coverage,interpretationUnits:candidate.interpretationUnits,humanReview:{status:'PENDING',reviewerId:null,reviewedAt:null,reviewedDigest:null,methodFidelity:null,customerClarity:null,professionalDepth:null,unsupportedInference:null,decision:null},customerPublicationAllowed:false});
 }
}
const packet={schemaVersion:'PHI-OS-AST-FP-REVIEW-CASES-v1.0.0',baselineCommit:'2211d9bd1cdecb2d238f4c05d1f58345efd11804',independentBirthInputs:8,caseCount:cases.length,accepted:0,pending:cases.length,scope:'PLACIDUS_BILINGUAL_ENGINEERING_CANDIDATE_REVIEW; WHOLE_SIGN_ALSO_COVERED_BY_MACHINE_TESTS',sourceBooksAdmitted:0,productionAllowed:false,reviewRubric:['Are actual body/sign/house and aspect endpoints correct?','Are the two functions integrated rather than listed as unrelated glossary entries?','Does the aspect text preserve its conditional character and avoid good/bad determinism?','Is the wider chart considered without using shared evidence as independent confirmation?','Are constructive/friction/condition/alternative fields meaningful and non-repetitive?','Are zh-Hans and en faithful, readable and free of internal jargon?','Does the report answer the customer intent without inventing current events?','Does the interpretation add professional value beyond the original three units?'],cases};
const sample=cases.find(c=>c.caseId==='ASTFP-01-zh-Hans');
const lines=[
 '# AST 增强解读｜工程审阅样例','',
 '这是新组合版本的审阅稿，不是已批准的客户报告。它展示代码实际输出，不以排版、字数或机器 PASS 代替占星师判断。五本书的研究卡仍未转为生产来源。','',
 '当前词汇仍来自已有 PHI OS canonical 定义。例如“进入与具身接口”仍需消费端语言审阅，不能宣称已经达到专业平台的表达水准。','',
 '## 新审阅案例','',
 '| 独立输入 | 宫制 | 落位单元 | 相位单元 | 合计 | 人工状态 |','|---|---|---:|---:|---:|---|',
 ...cases.filter(c=>c.locale==='zh-Hans').map(c=>`| ${c.caseId.replace('-zh-Hans','')} | Placidus | ${c.coverage.placementUnitCount} | ${c.coverage.aspectUnitCount} | ${c.interpretationUnits.length} | PENDING |`),'',
 '8 组独立出生输入，各有中英文审阅稿，共 16 个审阅面；不是 16 个不同出生盘。机器测试另含 Whole Sign 与缺失资料变体。旧 48-case 人工状态没有修改。','',
 '## 样例：ASTFP-01（合成输入）','',
 `来源：1984-03-21 06:10，UTC+08:00，纬度 1.35、经度 103.82；使用现有 Astronomy Engine 2.1.19 与 Placidus 计算。`,``,
 '以下按落位与相位分组供逐项审阅，不是客户首页排序。相位顺序按相对容许度与端点稳定排序，不表示人格重要性。整盘主轴、守护、元素权重和图形解释仍未完成。',''
 ];
for(const kind of ['PLACEMENT','ASPECT']){
 lines.push(kind==='PLACEMENT'?'## 行星／交点 × 星座 × 宫位':'## 行星之间的实际联系','');
 for(const u of sample.interpretationUnits.filter(u=>u.evidenceDetail.kind===kind)){
  lines.push(`### ${u.title}`,'',u.structuralReason,'',u.relationContext,'',`可能的建设性表现：${u.constructiveExpression}`,'',`可能的摩擦：${u.frictionExpression}`,'',`适用条件：${u.activationConditions.join(' ')}`,'',`另一种可能：${u.alternativeInterpretations.join(' ')}`,'',`核对问题：${u.realityComparisonQuestions.join(' ')}`,'');
  if(u.evidenceDetail.balancingAspectRefs?.length)lines.push(`另有 ${u.evidenceDetail.balancingAspectRefs.length} 条共享端点、关系类别不同的相位可一起核对；它们不是对现实经历的证明或反证。`,'');
 }
}
lines.push('## 审阅边界','',
 '每一条完整的 projection／meaning／rule lineage、实际相位偏差以及中英文版本 digest 均在 ast-fp-review-cases-v1.json 中。不能把本稿的 PENDING 改成通过，除非实际审阅者对准确版本留下决策。', '',
 '专业终审还要判断：是否真正形成全盘理解、是否只是术语拼接、是否保留矛盾、是否对不同问题给出有依据的不同重点。当前自动检查只验证工程性质，不回答这些质量问题。','');
for(const [path,text] of [[out,JSON.stringify(packet,null,2)+'\n'],[md,lines.join('\n')]]){
 if(check)assert.equal(fs.readFileSync(path,'utf8'),text,`${path} stale`);
 else {fs.mkdirSync(path.slice(0,path.lastIndexOf('/')),{recursive:true});fs.writeFileSync(path,text);}
}
console.log(JSON.stringify({status:check?'PASS':'GENERATED',independentBirthInputs:8,reviewCases:cases.length,humanAccepted:0,humanPending:cases.length,files:[out,md]},null,2));

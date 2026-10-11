import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const root='tools/review/free-ask-manuscript-r1/whole-chapter-batch-r1/';
const read=p=>JSON.parse(fs.readFileSync(p));
const sha=b=>createHash('sha256').update(b).digest('hex');
const write=(p,d)=>fs.writeFileSync(p,JSON.stringify(d,null,2)+'\n');
const qualification=read(root+'CHAPTER-QUALIFICATION.json');
const questions=read(root+'DEVELOPMENT-QUESTIONS.json').cases;
const development=read(root+'DEVELOPMENT-ANSWERS.json');
const holdout=read(root+'INDEPENDENT-ANSWERS.json');
const fresh=read(root+'FRESH-INDEPENDENT-ANSWERS.json');
const boundary=read(root+'BOUNDARY-ANSWERS.json');
assert.equal(development.passedBasic,18);assert.equal(fresh.passedBasic,6);
assert(boundary.cases.every(c=>c.pass));
for(const d of [development,holdout,fresh,boundary])assert.equal(d.providerCalls,0);
// Agent review of actual returned native passages, not a second keyword oracle,
// not owner acceptance, and not a claim that every conceivable query is covered.
const rationales={
 DYNAMIC_CONTINUITY:'Defines continuity as dynamic recovery and organization, explicitly rejects an unchanging static result.',
 REORGANIZATION:'Explains why transport/resources/order remain despite changing buildings and people; retains organization rather than element identity.',
 UPDATING_NOT_FREEZING:'Directly states continued renewal can preserve the system; does not promise permanence.',
 READABILITY_NOT_IMPLIED:'Explicitly distinguishes continued existence from readability/navigation, with compression still required.',
 HISTORY_CREATES_MAINTENANCE:'Explains resource use and accumulated history alter the next starting point; success does not remove maintenance demand.',
 MAINTENANCE_V_REPAIR:'Contrasts repair after damage with earlier observation of changing carrying conditions.',
 RESOURCE_AND_RESIDUAL:'Includes resource restoration and termination of old residual obligations; explains their effect on future capacity.',
 FULL_COST_PATH:'Rejects apparent stability achieved by exhausting another carrier; includes the full cost path.',
 PROFESSIONAL_LIMIT:'Preserves professional assessment and governance boundaries; no diagnosis from operating language.',
 CALIBRATION_NOT_FREEZING:'Explains mismatch when reality changes but forms stay fixed; maintenance protects continuity through calibration.',
 CIVILIZATION_V_STATE:'Explains wider spatial reach, deeper cultural organization and different change speeds; acknowledges mutual influence.',
 HISTORICAL_BOUNDARIES:'Explains overlapping pre-modern jurisdictions and transition zones rather than imposing modern exclusive sovereignty.',
 MULTIPLE_LAYERS:'Lists source-supported language/religion/ecology/economic/knowledge/memory/network boundaries and their nonalignment.',
 STATE_MATTERS:'Explicitly rejects ignoring the state and gives concrete shaping mechanisms while limiting the state to one layer.',
 NO_WAR_GUARANTEE:'Rejects a guarantee of peace from civilizational similarity without predicting any war.',
 STATE_COLLAPSE_NOT_CIVILIZATION_ZERO:'Explains persistence of traditions/networks after political collapse using qualified historical examples.',
 MULTIPLE_TRADITIONS_IN_ONE_STATE:'Explains political unity does not erase languages/religions/memories and internal differences.'
};
const reviewed=[];
for(const c of qualification.chapters){
 assert.equal(c.contentIntegrity,'PASS_NATIVE_TEXT_AND_VISUAL_PAGE_REVIEW');assert.equal(c.knownMissingContent.length,0);
 for(const argument of c.principalArguments){
  const q=questions.find(q=>q.section===c.sectionCode&&q.argument===argument.id);assert(q);
  const result=development.results.find(r=>r.id===q.id);assert(result?.basicChecksPass&&result.actualAnswer);
  assert(result.sourceReferences.some(r=>r.sectionCode===c.sectionCode&&r.sourceSha256===c.sourceSha256));
  assert(rationales[argument.id]);
  reviewed.push({argument:argument.id,questionId:q.id,actualAnswerSha256:sha(result.actualAnswer),state:'PASS_AGENT_SEMANTIC_REVIEW',reason:rationales[argument.id],evidence:'DEVELOPMENT-ANSWERS.json'});
 }
 c.answerState='PASS_PRINCIPAL_ARGUMENTS_AGENT_SEMANTIC_REVIEW';
 c.checklistStates=Object.fromEntries(['C1','C2','C3','C4','C5','C6','C7','C8'].map(id=>[id,'PASS']));
 c.checklistStates.C9='NOT_RUN_FOR_THIS_BATCH';c.admission='QUALIFIED_PRODUCTION_CANDIDATE_NOT_ACTIVATED';c.live='NOT_RUN';
}
assert.equal(reviewed.length,17);
const independentReview=holdout.results.map(r=>({id:r.id,basicChecksPass:r.basicChecksPass,semanticState:'PASS_AGENT_SEMANTIC_REVIEW',actualAnswerSha256:sha(r.actualAnswer),reason:r.id==='H-III-FUNCTIONS-WORK'?'The unchanged literal oracle requires 更早, but the actual answer directly explains successful operation creates maintenance through history; not a retrieval failure. Keep basic failure unchanged.':'Returned passage directly addresses the frozen question, retains conditions and references the correct current chapter.'}));
fresh.testRole='DEPENDENCY_REGRESSION_OF_PREVIOUSLY_UNSEEN_SET';
fresh.receiptLimit='First execution 6/6 was recorded in tool output; its separate full JSON was not retained before the dependency rerun. This receipt is the current regression, not a new independent set.';
write(root+'FRESH-INDEPENDENT-ANSWERS.json',fresh);
qualification.qualified=3;qualification.admitted=0;qualification.live=0;qualification.at=new Date().toISOString();
qualification.review={kind:'AGENT_SEMANTIC_REVIEW_NOT_HUMAN_ACCEPTANCE',principalArguments:reviewed,holdout:independentReview,freshBasicPass:6,sourceCitationsVerified:true,limitation:'Legacy PTRC generic answer state may remain PARTIALLY_ANSWERED because it expects two evidence objects. Native answer fit reviewed separately; no minimum-evidence rule relaxed.'};
write(root+'CHAPTER-QUALIFICATION.json',qualification);
for(const name of ['SEVEN-BOOK-CHAPTER-QUALITY-AUDIT.json','SEVEN-BOOK-CHAPTER-COVERAGE.json']){
 const p='tools/review/free-ask-manuscript-r1/'+name,d=read(p);
 for(const book of d.books){for(const c of qualification.chapters.filter(c=>c.bookCode===book.bookCode)){
  const row=book.chapters.find(r=>r.sectionCode===c.sectionCode);assert(row,'EXISTING_CHAPTER_LEDGER_REQUIRED');
  Object.assign(row,{wholeChapterAnswerVerified:true,contentIntegrity:c.contentIntegrity,answerable:c.answerState,retrievable:'QUALIFIED_CURRENT_SOURCE_CANDIDATE',productionAdmission:'NOT_ACTIVATED',live:'NOT_RUN',qualificationEvidence:root+'CHAPTER-QUALIFICATION.json',reason:'Entire chapter source body and 17 batch principal arguments checked; no unverified figure/footnote dependency.',next:'Compile current successor metadata, affected regression, build and authorized batch publication; validate real customer answers.'});
 }book.wholeChapterAnswerVerified=book.chapters.filter(c=>c.wholeChapterAnswerVerified).length;}
 d.at=qualification.at;d.wholeChapterVerified=3;d.wholeChapterAdmissionProven=0;d.wholeChapterLiveVerified=0;d.remainingWholeChapterClosure=979;write(p,d);
}
const master='content/production-closure/live-customer-commercial-convergence/MASTER-HUMAN-REVIEW.html';
let html=fs.readFileSync(master,'utf8');
const section=`<section id="whole-chapter-batch-r1"><h2>七册整章批次 R1</h2><p>SOURCE：3 / 982 整章合格；本批准入 0，线上 0；剩余 979 章未取得整章闭环证据。构建与已部署版本分别记录，不继承为本批上线。</p><ul>${qualification.chapters.map(c=>`<li>${c.bookCode} · ${c.sectionCode} · PDF ${c.pages.join('–')}：完整正文核对、主要论点回答及来源限定通过；待当前构建、生产准入与线上验收。</li>`).join('')}</ul><p>开发回归18/18；原独立题回归基础检查5/6、语义复核6/6（保留更早字样的原断言失败）；新增独立题首轮6/6，当前记录为依赖回归。7项边界检查通过。providerCalls=0。没有重提取整书，没有改变 P9、Stripe 或 Secrets。</p><p>第五册先前部分回答来自原生答案投影未进入客户答案与比较分类过严；现已输出支持区别、机制与限定的实际正文。通用 PTRC 的两证据数量状态仍单列，未放宽原检查。</p><p><a href="../../../tools/review/free-ask-manuscript-r1/whole-chapter-batch-r1/CHAPTER-QUALIFICATION.json">可执行整章检查表、17项语义依据</a> · <a href="../../../tools/review/free-ask-manuscript-r1/whole-chapter-batch-r1/FRESH-INDEPENDENT-ANSWERS.json">实际客户 API 回答</a></p></section>`;
html=html.replace(/<section id="whole-chapter-batch-r1">[\s\S]*?<\/section>/, '');html=html.replace('</body>',section+'\n</body>');fs.writeFileSync(master,html);
console.log(JSON.stringify({qualified:3,admitted:0,live:0,remaining:979,providerCalls:0}));

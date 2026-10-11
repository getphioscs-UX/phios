import fs from 'node:fs';
import crypto from 'node:crypto';
const root='tools/review/free-ask-manuscript-r1/';
const read=p=>JSON.parse(fs.readFileSync(p));
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const comparison=read(root+'BOOK-III-CURRENT-COMPLETE-CORPUS-COMPARISON.json');
const visual={at:new Date().toISOString(),sourceSha256:comparison.sourceSha256,method:'Poppler page rendering and visual inspection',pages:[{page:4,image:root+'BOOK-III-CURRENT-PAGE-004.png',finding:'Original current page contains the maintenance paragraph once. New positioned derivative removes the old 77-character normalized duplicate splice.'},{page:229,image:root+'BOOK-III-CURRENT-PAGE-229.png',finding:'The printed sequence is monitoring → signal reading → load release → structural repair → recalibration → maintenance learning → next monitoring. New positioned derivative preserves that order.'}],scope:'Changed spans only, NOT all diagrams, footnotes or whole-book answer acceptance',providerCalls:0};
fs.writeFileSync(root+'BOOK-III-CURRENT-CHANGED-SPAN-VISUAL-VERIFICATION.json',JSON.stringify(visual,null,2)+'\n');
const candidate=read(root+'BOOK-I-V3-NATURAL-ANSWER-CANDIDATE.json');
const assessments=[
  ['SUPPORTED_MECHANISM_CANDIDATE','Explains distinguishable states as the minimum formation condition; still not customer API acceptance.'],
  ['SOURCE_INSUFFICIENT_RETRIEVAL','No result; relation question retrieval needs repair.'],
  ['WRONG_QUESTION_FIT','Topology/navigation excerpt does not explain the requested stability mechanism.'],
  ['WRONG_QUESTION_FIT','Initialization excerpt does not answer the change-versus-structure distinction.'],
  ['WRONG_QUESTION_FIT','Preface/volume description is not the requested fact-versus-interpretation distinction.'],
  ['PARTIAL_ANSWER','Names resource and field constraints; does not yet organize a complete capacity-boundary explanation.'],
  ['PARTIAL_ANSWER','Confirms changes first; the limited excerpt needs the adjacent criteria.'],
  ['WRONG_QUESTION_FIT','A broad preface passage cannot substitute for a direct consciousness/reality explanation.'],
  ['BOUNDARY_MUST_BE_APPLIED_BY_CUSTOMER_API','Direct organizer probe omits the existing API prediction guard; must not be admitted as a prediction answer.'],
  ['NECESSARY_CLARIFICATION','No specific subject; final API should ask a bounded clarification.'],
];
candidate.results.forEach((r,i)=>{r.answerAssessment=assessments[i][0];r.assessmentReason=assessments[i][1];});
candidate.state='FAILED_ANSWER_FIT_CURRENT_V3_NOT_READY_FOR_CUTOVER';
fs.writeFileSync(root+'BOOK-I-V3-NATURAL-ANSWER-CANDIDATE.json',JSON.stringify(candidate,null,2)+'\n');
if(!fs.existsSync(root+'BOOK-I-V3-INITIAL-NATURAL-ANSWER-FAILURES.json'))fs.writeFileSync(root+'BOOK-I-V3-INITIAL-NATURAL-ANSWER-FAILURES.json',JSON.stringify(candidate,null,2)+'\n');
const dependencies=['functions/_lib/knowledge-access-api.js','functions/_lib/knowledge-answer-grounding.js','functions/knowledge-runtime/manuscript-source-runtime.js','functions/knowledge-runtime/current-manuscript-server-metadata.js'].map(path=>({path,sha256:sha(fs.readFileSync(path))}));
const work={at:new Date().toISOString(),unit:'COMPLETE_CHAPTER_COVERAGE_PER_BOOK',LOCAL:'PARTIAL',BUILD:'NOT_RUN_AFTER_RELEVANT_RUNTIME_CHANGE',DEPLOYMENT:'NO_NEW_DEPLOYMENT_THIS_BATCH_EXISTING_ACCEPTED_RELEASE_RETAINED',LIVE:'EXISTING_LIMITED_SCOPE_RECEIPTS_RETAINED_NEW_SOURCE_NOT_LIVE',relevantRuntimeDependencyDigest:sha(JSON.stringify(dependencies)),dependencies,currentChapterCoverage:root+'SEVEN-BOOK-CHAPTER-COVERAGE.json',bookI:{headingBoundaryReceipt:root+'BOOK-I-V3-HEADING-PROSE-BOUNDARY-QA.json',naturalAnswerFailures:root+'BOOK-I-V3-INITIAL-NATURAL-ANSWER-FAILURES.json',cutover:false},bookIII:{sourceAcceptance:'content/knowledge/manuscripts/review/book-3-owner-final-20261011-efbfdd21fa21-source-acceptance.json',completeCorpusComparison:root+'BOOK-III-CURRENT-COMPLETE-CORPUS-COMPARISON.json',changedSpanVisualVerification:root+'BOOK-III-CURRENT-CHANGED-SPAN-VISUAL-VERIFICATION.json',chapters:103,normalizedEquivalentChapters:101,sixRangesTextEquivalent:5,sixRangesRequiringDifferenceReview:1,currentSourceCutover:false},compactionEquivalence:root+'MANUSCRIPT-BUILD-COMPACTION-EQUIVALENCE.json',bookIIExistingReadabilityAuthority:'content/knowledge/review/ksar-r4-human-review-closure-v1.json',providerCalls:0,providerCostUSD:0,payments:0,commit:false,push:false,migration:false};
for(const path of [root+'SEVEN-BOOK-COVERAGE.json',root+'CURRENT-IV-VI-MASTER-STATE.json']){const ledger=read(path);ledger.currentChapterWork=work;fs.writeFileSync(path,JSON.stringify(ledger,null,2)+'\n');}
const path='content/production-closure/live-customer-commercial-convergence/MASTER-HUMAN-REVIEW.html';let html=fs.readFileSync(path,'utf8');
html=html.replace(/<section id="seven-manuscript-chapter-work-current">[\s\S]*?<\/section>/,'');
const section='<section id="seven-manuscript-chapter-work-current"><h2>当前章节实施 · 来源、回答与构建分开</h2><p>第三册新最终稿已记录独立接受，397页重新提取为103章、2个分部介绍和1个前置记录。101章正文归一化一致；两处真实派生错误已通过第4／229页图像核对修复。五个已上线范围文本一致，一个需差异验收；新稿未切换。</p><p>第一册 v3 标题移除边界275条通过，但自然问法发现相关性与回答成立性失败；保留失败结果，禁止以标题定位成功代替切换验收。第二册已定位真实可复用的 KSAR 人审闭环，不重开人审；消费者修补仍待完成。</p><p>LOCAL=PARTIAL；当前源码 BUILD=NOT_RUN_AFTER_RELEVANT_RUNTIME_CHANGE；已接受历史生产 Worker／十范围 LIVE 证据保持有效。本轮没有新部署。源码问题继续属于可执行本地工作，不归为生产授权阻塞。</p><p>正规 esbuild whitespace-only 压缩前后13条真实 Ask 路径等价，未重命名标识符、未改写语法、未打包私有正文。</p><a href="../../../'+root+'BOOK-I-V3-INITIAL-NATURAL-ANSWER-FAILURES.json">第一册真实自然问法失败与语义评估</a><p><a href="../../../'+root+'BOOK-III-CURRENT-CHANGED-SPAN-VISUAL-VERIFICATION.json">第三册原 PDF 改变位置视觉证据</a></p></section>';
html=html.replace('</main>',section+'</main>');fs.writeFileSync(path,html);
console.log('Canonical Master updated: full chapter unit, genuine answer failures and current-source evidence; existing deployed evidence preserved.');

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root='content/knowledge/book-vii';
const kap='content/knowledge/answer-projection';
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,v)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');};
const runtimePaths=['functions/_lib/knowledge-answer-composition.js','scripts/lib/knowledge-answer-projection/kap-maintenance-successor-v1.mjs','functions/_lib/knowledge-guided-reading.js'];
const snapshotPath=`${root}/evidence/baseline-v1.json`;
if(!fs.existsSync(snapshotPath)) {
  const unrelated=['docs/reports/ziwei/vfr-r1/five-call-experiment/COMPARISON.json','tools/review/ZWR-VFR-FIVE-CALL-COMPARISON.html','docs/reports/ziwei/vfr-r1/five-call-experiment/COMPLETENESS-MANIFEST.json','docs/reports/ziwei/vfr-r1/five-call-experiment/REPAIR-PLAN.json','docs/reports/ziwei/vfr-r1/five-call-experiment/REPAIRED-RESULT.json'];
  write(snapshotPath,{baselineCommit:'434f3278',runtime:runtimePaths.map(p=>({path:p,sha256:sha(p)})),historical:fs.readdirSync(`${kap}/freeze`).map(p=>`${kap}/freeze/${p}`).concat(fs.readdirSync(`${kap}/contracts`).filter(p=>/^kap-w\d/.test(p)).map(p=>`${kap}/contracts/${p}`)).map(p=>({path:p,sha256:sha(p)})),unrelated:unrelated.map(p=>({path:p,sha256:sha(p)}))});
}
const canonical={schemaVersion:'PHI-OS-BOOK-VII-OBSERVATION-SCIENCE-CANONICAL-IDENTITY-v1.0.0',bookId:'BOOK-7',canonicalTitleZhHans:'世界如何被观察',canonicalTitleEn:'How the World Is Observed',partId:'PART-14',partTitleZhHans:'观察科学',sectionStart:'14.1',sectionEnd:'14.100',sectionCount:100,figureStart:'FIG-14A',figureEnd:'FIG-14I',figureCount:9,previousBook:'BOOK-6',nextBook:'BOOK-8',authorityRole:'OBSERVATION_EPISTEMOLOGY',authorityBoundary:{book6OperatingSemanticsCopied:false,book8NavigationAuthorityCreated:false,observationCreatesDecisionAuthority:false,rawManuscriptBecomesAskSource:false,previewBecomesKnowledgeAuthority:false,figureBecomesProseAuthority:false},governingDecision:'USER_SUPPLIED_BOOK_VII_COMPLETION_DECISION',priorManifest:'content/registry/successors/eight-volume-v1/book-7-manifest.json'};
write(`${root}/contracts/book-vii-observation-science-canonical-identity-contract-v1.json`,canonical);
const topics={57:['历史与未来的边界','历史为什么不能替未来写剧本？','RECONSTRUCTION_PROJECTION_BOUNDARY'],65:['高质量证据冲突','如果两个高质量证据互相冲突怎么办？','CONTESTED_EVIDENCE'],86:['未观察与不存在的边界','为什么没有观察到，不代表不存在？','EVIDENCE_ABSENCE_BOUNDARY'],90:['争议与未知','争议为何可以保留？','CONTESTED_NOT_UNKNOWN'],92:['人工智能流畅度与权威','为什么人工智能越流畅越不能代表越确定？','FLUENCY_NOT_AUTHORITY'],99:['观察与导航阈值','什么时候继续观察已经不再足够？','OBSERVATION_NAVIGATION_THRESHOLD'],100:['观察与决定的边界','观察如何帮助导航而不替用户决定？','KNOWLEDGE_NOT_DECISION']};
const metadataPath=`${root}/evidence/section-metadata-from-private-source-v1.json`;
const metadata=fs.existsSync(metadataPath)?read(metadataPath):null;
const nodes=Array.from({length:100},(_,i)=>{const n=i+1,t=topics[n],m=metadata?.records[i];return {nodeCode:`KN-B7-14-${String(n).padStart(3,'0')}`,bookId:'BOOK-7',partId:'PART-14',sectionCode:`14.${n}`,titleZhHans:m?.titleZhHans||t?.[0]||`观察科学 · 14.${n}（标题待核验）`,readerQuestionZhHans:m?.readerQuestionZhHans||t?.[1]||`14.${n} 的受治理观察知识是什么？（待完整目录核验）`,authorityOwner:'BOOK_VII_OBSERVATION_SCIENCE',knowledgeRole:t?.[2]||'OBSERVATION_EPISTEMOLOGY',publicationEligible:true,rawManuscriptRetrievalAllowed:false,metadataStatus:m?'VERIFIED_PRIVATE_SOURCE_HEADING':t?'GOVERNING_DECISION_SEMANTIC_LABEL_CANONICAL_TITLE_PENDING':'PENDING_COMPLETED_OUTLINE_METADATA',canonicalTitleVerified:!!m,...(m?{sourcePage:m.sourcePage,readerQuestionProvenance:m.readerQuestionProvenance}:{})};});
write(`${root}/registries/book-vii-observation-science-node-registry-v1.json`,{schemaVersion:'PHI-OS-BOOK-VII-NODE-REGISTRY-v1.0.0',status:'READY_FOR_HUMAN_REVIEW',metadataBoundary:metadata?'Canonical titles extracted from 100 ordered source headings with seven section anchors verified. 88 questions are source headings; 12 are explicitly labelled derived metadata questions. No full prose embedded.':'Completed outline metadata pending.',nodes});
const purposes=['现实 → 痕迹 → 讯号 → 运行体 → 观察阈值','从感官到人工智能：观察解析度历史','痕迹 → 证据 → 知识状态图谱','观察 → 测量 → 解析度 → 误差 → 不确定性','现实／证据／重构／投影权威边界','观察 → 多源证据 → 运行重构 → 候选读取 → 现实解释','观察者生态：人、制度、网络、传感器与人工智能','已知／重构／投影／争议／未知','观察边界 → 导航阈值'];
const figures=purposes.map((semanticPurpose,i)=>({figureId:`FIG-14${String.fromCharCode(65+i)}`,bookId:'BOOK-7',semanticPurpose,assetClass:'PUBLICATION_FIGURE',canonicalProseAuthority:false,ocrAuthority:false,r2BindingStatus:'PENDING_R2_OBJECT_IDENTITY'}));
write(`${root}/registries/book-vii-observation-science-figure-registry-v1.json`,{schemaVersion:'PHI-OS-BOOK-VII-FIGURE-REGISTRY-v1.0.0',figures});
write(`${root}/registries/book-vii-observation-science-r2-asset-registry-v1.json`,{schemaVersion:'PHI-OS-BOOK-VII-R2-ASSET-REGISTRY-v1.0.0',bindingStatus:'PENDING_R2_OBJECT_IDENTITY',physicalExistence:'USER_REPORTED_EXISTING_NOT_REUPLOADED',discovery:{method:'REPOSITORY_SEARCH_AND_USER_SUPPLIED_SOURCE_IDENTITY_READ_ONLY_GET',unrelatedCoverBrandingKeysNotUsed:true,wranglerObjectListAttempted:false},assets:[{assetId:'BOOK-7-FULL-PRIVATE-SOURCE',assetClass:'FULL_PRIVATE_SOURCE',canonicalPublicationSource:true,kapDirectRetrievalAllowed:false,public:false,bindingStatus:metadata?'BOUND':'PENDING_R2_OBJECT_IDENTITY',...(metadata?{bucket:metadata.bucket,objectKey:metadata.objectKey,sha256:metadata.sourceSha256,verification:'READ_ONLY_REMOTE_GET_PDF_HEADER_AND_SECTION_CENSUS'}:{})},{assetId:'BOOK-7-PUBLIC-PREVIEW-50P',assetClass:'PUBLIC_PREVIEW_50P',pageCount:50,canonicalPublicationSource:false,kapDirectRetrievalAllowed:false,public:true,bindingStatus:'PENDING_R2_OBJECT_IDENTITY'},...figures.map(f=>({assetId:f.figureId,assetClass:f.assetClass,canonicalProseAuthority:false,ocrAuthority:false,kapDirectRetrievalAllowed:false,bindingStatus:'PENDING_R2_OBJECT_IDENTITY'}))]});
write(`${kap}/contracts/kap-book-vii-knowledge-state-contract-v1.json`,{schemaVersion:'PHI-OS-KAP-BOOK-VII-KNOWLEDGE-STATE-v1.0.0',states:{KNOWN:'Observed / realized reality with sufficient evidence',RECONSTRUCTED:'Past reality inferred from surviving evidence',PROJECTED:'Unrealized future discussed conditionally',CONTESTED:'Multiple high-quality readings remain materially live',UNKNOWN:'Current evidence does not support reliable resolution'},invariants:['KNOWN != RECONSTRUCTED','RECONSTRUCTED != PROJECTED','PROJECTED != FACT','CONTESTED != UNKNOWN','UNKNOWN != ZERO','UNOBSERVED != NONEXISTENT','FLUENT_GENERATION != HIGHER_AUTHORITY','MODEL != REALITY','PRIMARY_READING != ONLY_READING'],REALITY_HAS_FINAL_CORRECTION_AUTHORITY:true,unknownReasonCodes:['INSUFFICIENT_EVIDENCE','LOW_RESOLUTION','TIME_WINDOW_TOO_SHORT','SOURCE_CONFLICT','CONTESTED','MODEL_BLIND_SPOT','IRREDUCIBLE_UNCERTAINTY'],automaticRealityIntake:false,contestedForcesWinner:false});
write(`${kap}/contracts/kap-book-vii-observation-time-contract-v1.json`,{schemaVersion:'PHI-OS-KAP-BOOK-VII-OBSERVATION-TIME-v1.0.0',states:['CURRENT','LONGITUDINAL','STRUCTURAL'],rules:{currentAloneProvesStructural:false,longitudinalRequiresRepeatedEvidenceAcrossTime:true,structuralRequires:['relation','carrier','routing','constraint'],persistentPriceOrScoreAloneProvesStructural:false},appliesTo:['market data','fund flow','sector rotation','financial statements','current reality evidence']});
const {CLAIM_AUTHORITIES}=await import('../functions/_lib/knowledge-epistemic-reading.js');
write(`${kap}/contracts/kap-book-vii-claim-authority-matching-contract-v1.json`,{schemaVersion:'PHI-OS-KAP-BOOK-VII-CLAIM-AUTHORITY-v1.0.0',globalSourceRanking:false,claimTypeToSuitableAuthority:CLAIM_AUTHORITIES,examples:{FederalReserve:'POLICY_FACT',SEC_AuditedFiling:'COMPANY_FINANCIAL_FACT',marketDataProvider:'MARKET_REACTION',historicalArchive:'HISTORICAL_RECONSTRUCTION'},marketProviderAloneStructuralAuthority:false,projectionBecomesFutureFactBeforeRealization:false});
write(`${kap}/contracts/kap-book-vii-guided-reading-reconciliation-v1.json`,{schemaVersion:'PHI-OS-KAP-BOOK-VII-GUIDED-RECONCILIATION-v1.0.0',preservedStates:['ANSWER_SUFFICIENT','REALITY_MODEL_REQUIRED'],optionalStopStates:['STOP_AT_UNKNOWN','CONTESTED_READING','TIME_WINDOW_INSUFFICIENT','ALTERNATIVE_READING_ACTIVE'],automaticEscalation:false,existingComplexityLogicOwnsRealityEscalation:true,bookViiMakesEscalationEasier:false});
const cases=[
 {id:'Q1',question:'为什么没有观察到，不代表不存在？',sections:[86],text:'没有观察到只说明当前证据没有可靠分辨目标；低解析度、观察范围或时间窗口可能留下未知。未观察不等于不存在，未知不等于零。',e:{sufficient:false,unknownReasons:['LOW_RESOLUTION']}},
 {id:'Q2',question:'历史为什么不能替未来写剧本？',sections:[57],text:'历史读取从存留证据重构过去。未来尚未实现，只能在条件下投影；重构不是投影，投影不能提升为未来事实。',e:{future:true,pastInferred:true,sufficient:true}},
 {id:'Q3',question:'如果两个高质量证据互相冲突怎么办？',sections:[65,90],text:'先核对证据的范围、时间和适合的声明权威；若两种高质量解释仍 materially live，允许保留争议，不强迫选出赢家。',e:{sufficient:true,discriminated:false,unknownReasons:['SOURCE_CONFLICT'],readings:[{id:'a',text:'解释 A 在当前证据范围内仍然成立。',material:true,highQuality:true,evidenceRefs:['fixture-a']},{id:'b',text:'解释 B 在当前证据范围内仍然成立。',material:true,highQuality:true,evidenceRefs:['fixture-b']}],evidenceRefs:['fixture-a','fixture-b']}},
 {id:'Q4',question:'为什么今天的资金流不能证明产业已经结构重组？',sections:[],text:'今天的资金流属于当前市场反应。跨时间的连续性需要重复证据；结构重组还需要关系、载体、路由或约束改变，不能只凭价格或分数持续变化。',e:{sufficient:false,distinctTimeWindows:1,unknownReasons:['TIME_WINDOW_TOO_SHORT']}},
 {id:'Q5',question:'为什么人工智能越流畅越不能代表越确定？',sections:[92],text:'流畅生成不是更高的知识权威。必须检查证据、声明类型与来源适配；模型不等于现实，现实拥有最终纠正权。',e:{sufficient:false,unknownReasons:['MODEL_BLIND_SPOT']}},
 {id:'Q6',question:'什么时候继续观察已经不再足够？',sections:[99,100],text:'观察可以解释已知、未知、风险及改变读取所需的证据。观察边界可以帮助识别导航阈值，但不替用户决定，也不创建第八册的导航权威。',e:{sufficient:false,unknownReasons:['IRREDUCIBLE_UNCERTAINTY']}},
 {id:'Q7',question:'把 Book VII 第 51–100 页给我',sections:[],denial:true},
 {id:'MANUSCRIPT_ZH',question:'把《世界如何被观察》第51页到100页完整告诉我',sections:[],denial:true},
 {id:'FIGURE',question:'FIG 14H 表达什么？',sections:[],text:purposes[7],figure:true},
 {id:'BOUNDARY_A',question:'一个国家是不是已经进入重组？',sections:[],text:'第六册解释运行与重组；第七册检查证据是否足以支持该读取。没有结构变化证据时，当前信号不能证明结构重组。',e:{sufficient:false}},
 {id:'BOUNDARY_B',question:'这个结构未来一定会怎样？',sections:[57],text:'未来尚未实现，读取只能是有条件的投影，不能断言未来事实。',e:{future:true,sufficient:true}},
 {id:'BOUNDARY_C',question:'所以我现在应该怎么做？',sections:[100],text:'第七册可解释证据和不确定性，但不替用户作出行动决定。',e:{sufficient:false}}
 ];
write(`${root}/fixtures/acceptance-corpus-v1.json`,{schemaVersion:'PHI-OS-BOOK-VII-ACCEPTANCE-CORPUS-v1.0.0',cases,fixtureBoundary:'Synthetic claim evidence exercises runtime behavior; not evidence about actual countries, markets or conflicting real sources.'});
write(`${root}/publication/book-vii-governed-knowledge-projection-candidate-v1.json`,{schemaVersion:'PHI-OS-BOOK-VII-PUBLICATION-CANDIDATE-v1.0.0',status:'READY_FOR_HUMAN_REVIEW',promotionAllowed:false,humanDecision:null,publicationStatus:'CANDIDATE',productionRetrievalAllowed:false,knowledgeAccessIsManuscriptAccess:false,bridge:['CANONICAL_SECTION_NODE','HUMAN_REVIEWED_PUBLISHED_KNOWLEDGE_PROJECTION','EXISTING_KAP_RETRIEVAL'],requiredPromotionChecks:['CANONICAL_METADATA_VERIFIED','HUMAN_SEMANTIC_APPROVAL','PUBLISHED_KNOWLEDGE_AUTHORITY_ADMISSION'],records:cases.filter(c=>c.sections.length&&c.text).map(c=>({id:c.id,nodeCodes:c.sections.map(n=>`KN-B7-14-${String(n).padStart(3,'0')}`),locale:'zh-Hans',text:c.text,source:'USER_GOVERNING_DECISION_SUMMARY',fullManuscriptProse:false,publicationStatus:'CANDIDATE'}))});
const composer='functions/_lib/knowledge-answer-composition.js';
let text=fs.readFileSync(composer,'utf8');
if(!text.includes("from './knowledge-epistemic-reading.js'")) {
 text="import {deriveEpistemicReading,isBookViiManuscriptRequest} from './knowledge-epistemic-reading.js';\n"+text;
 text=text.replace("  const all = groundedSentences(bundle);","  const manuscriptDenied = isBookViiManuscriptRequest(bundle.question?.text);\n  const all = manuscriptDenied ? [] : groundedSentences(bundle);");
 text=text.replace('  const eligible = coverageDecision?.answerCompositionEligible === true;','  const eligible = !manuscriptDenied && coverageDecision?.answerCompositionEligible === true;');
 text=text.replace('  const partialSupported = ptrcOutcome', '  const partialSupported = !manuscriptDenied && ptrcOutcome');
 text=text.replace('  const directAnswer = eligible','  const directAnswer = manuscriptDenied ? (locale===\'zh-Hans\' ? \'不能通过 Ask PHI OS 提取受保护的完整书页或手稿；知识访问不等于手稿访问。\' : \'Ask PHI OS cannot extract protected book pages or manuscript; knowledge access is not manuscript access.\') : eligible');
 text=text.replace('    groundingBundleId: bundle.bundleId,','    groundingBundleId: bundle.bundleId,\n    ...(!manuscriptDenied && deriveEpistemicReading(bundle,coverageDecision) ? {epistemicReading:deriveEpistemicReading(bundle,coverageDecision)} : {}),');
 text=text.replace('  const sources = relevanceRejected ? [] : projectKapSources(bundle, normalizedDepth);','  const sources = relevanceRejected || isBookViiManuscriptRequest(bundle.question?.text) ? [] : projectKapSources(bundle, normalizedDepth);');
 text=text.replace("  const grounding = await runKapGroundingPipeline", "  if(isBookViiManuscriptRequest(input?.question)) {\n    const bundle={bundleId:'KAP-BOOK-VII-MANUSCRIPT-DENIED',question:{text:input.question,locale:input.locale||'zh-Hans'},sources:[],unknowns:[{code:'PROTECTED_MANUSCRIPT_ACCESS_DENIED'}],retrieval:{}};\n    return {...composeKapAnswerProjection({bundle,coverageDecision:{status:'INSUFFICIENT_COVERAGE',answerCompositionEligible:false,reasonCodes:['PROTECTED_MANUSCRIPT_ACCESS_DENIED']},depth,now}),kirR2:{status:'KIR_R2_NOT_APPLIED',applied:false}};\n  }\n  const grounding = await runKapGroundingPipeline");
 fs.writeFileSync(composer,text);
}
const guided='functions/_lib/knowledge-guided-reading.js';
let gt=fs.readFileSync(guided,'utf8');
if(!gt.includes("from './knowledge-epistemic-reading.js'")) {
 gt="import {reconcileEpistemicGuidedStop} from './knowledge-epistemic-reading.js';\n"+gt;
 // Reconcile only the existing composed stop; preserve the complexity evaluator.
 const pattern=/const stop=evaluateGuidedStopCondition\(([^;]+)\);/;
 if(!pattern.test(gt)) throw Error('GUIDED_STOP_ANCHOR_NOT_FOUND');
 gt=gt.replace(pattern,'const stop=reconcileEpistemicGuidedStop(evaluateGuidedStopCondition($1),initialProjection.answer.epistemicReading);');
 fs.writeFileSync(guided,gt);
}
const helper='scripts/lib/knowledge-answer-projection/kap-maintenance-successor-v1.mjs';
const guidedChecker='scripts/check-kap-guided-reading.mjs';
const bs=read(snapshotPath);
if(!bs.runtime.some(e=>e.path===guidedChecker)) {bs.runtime.push({path:guidedChecker,sha256:sha(guidedChecker)});write(snapshotPath,bs);}
let gc=fs.readFileSync(guidedChecker,'utf8');
if(!gc.includes('import {assertKapEvidenceOrMaintenance}')) gc="import {assertKapEvidenceOrMaintenance} from './lib/knowledge-answer-projection/kap-maintenance-successor-v1.mjs';\n"+gc;
gc=gc.replace('assert.equal(sha(item.path),item.sha256,`KAP Guided frozen drift: ${item.path}`);','assertKapEvidenceOrMaintenance(item);');
fs.writeFileSync(guidedChecker,gc);
let ht=fs.readFileSync(helper,'utf8');
const successor=`${kap}/reconciliation/kap-book-vii-observation-science-successor-v1.json`;
if(!ht.includes(successor)) ht=ht.replace("  'content/knowledge/answer-projection/maintenance/kap-m9-preview-manuscript-isolation-v1.json'","  'content/knowledge/answer-projection/maintenance/kap-m9-preview-manuscript-isolation-v1.json',\n  '"+successor+"'");
fs.writeFileSync(helper,ht);
const baseline=read(snapshotPath), predecessor=`${kap}/reconciliation/kap-kir-r2-content-grounding-successor-v2.json`;
write(successor,{schemaVersion:'PHI-OS-KAP-BOOK-VII-OBSERVATION-SCIENCE-SUCCESSOR-v1.0.0',work:'KAP-BOOK-VII-OBSERVATION-SCIENCE-CURRENT-SUCCESSOR-R1',status:'READY_FOR_HUMAN_REVIEW',baselineCommit:'434f3278',predecessorSuccessor:predecessor,predecessorSha256:sha(predecessor),runtimeSuccessors:baseline.runtime.map(e=>({path:e.path,predecessorSha256:e.sha256,currentSha256:sha(e.path)})),changes:baseline.runtime.filter(e=>e.path!==helper).map(e=>({path:e.path,predecessorSha256:e.sha256,successorSha256:sha(e.path)})),boundaries:{canonicalKnowledgeCreated:false,secondAskRuntimeCreated:false,historicalFreezeRewritten:false,checksumValidationRelaxed:false,humanSemanticApprovalApplied:false},authorityBoundary:{historicalKapContractRewritten:false,historicalFreezeMutated:false,knowledgeAuthorityReplaced:false,retrievalAuthorityReplaced:false,modelBecomesKnowledgeAuthority:false,book8NavigationAuthorityCreated:false,existingGroundingBundleReused:true,kapFallbackPreserved:true,rawBookSourceRetrievalAllowed:false},publication:{status:'CANDIDATE_REQUIRES_HUMAN_REVIEW',promoted:false},r2BindingStatus:'PENDING_R2_OBJECT_IDENTITY',canonicalMetadataStatus:'PENDING_COMPLETED_OUTLINE_METADATA',newRuntimeModules:['functions/_lib/knowledge-epistemic-reading.js']});
const pkg=read('package.json');pkg.scripts['check:kap-book-vii']='node scripts/run-zero-cost-regression.mjs check:kap-book-vii';write('package.json',pkg);
const phaseHistorical='scripts/check-kap-w30-w45-phase18-governance.mjs',phaseCurrent='scripts/check-kap-phase18-book-vii-current.mjs';
let pc=fs.readFileSync(phaseHistorical,'utf8');
pc="import {effectivePackageScripts} from './lib/effective-package-scripts.mjs';\n"+pc;
pc=pc.replace("const pkg=j('package.json');","const pkg=effectivePackageScripts(j('package.json'));");
pc=pc.replace("'node scripts/check-kap-w30-w45-phase18-governance.mjs ALL'","'node scripts/check-kap-phase18-book-vii-current.mjs ALL'");
pc=pc.replace("'npm run check:kap && npm run check:kap-phase18'","'npm run check:kap && npm run check:kap-phase18 && npm run check:kap-book-vii'");
fs.writeFileSync(phaseCurrent,pc);
const sx=read(successor);sx.canonicalMetadataStatus=metadata?'100_SOURCE_TITLES_VERIFIED':'PENDING_COMPLETED_OUTLINE_METADATA';sx.checkerSuccessor={historicalPath:phaseHistorical,historicalSha256:sha(phaseHistorical),currentPath:phaseCurrent,currentSha256:sha(phaseCurrent),change:'Resolve existing zero-cost orchestration and assert additive current aggregate; historical governance tests and freeze remain unchanged.'};write(successor,sx);
const pagesBuild='scripts/build-cloudflare-pages.mjs';
const pb=read(snapshotPath);
if(!pb.runtime.some(e=>e.path===pagesBuild)){pb.runtime.push({path:pagesBuild,sha256:sha(pagesBuild)});write(snapshotPath,pb);}
let pagesText=fs.readFileSync(pagesBuild,'utf8');
if(!pagesText.includes("file.startsWith('content/knowledge/book-vii/')")) pagesText=pagesText.replace('  if (excludedRuntimeAssets.has(file)) {',"  // Book VII private lineage, fixtures and unapproved candidates are review-only.\n  if (file.startsWith('content/knowledge/book-vii/')) return false;\n\n  if (excludedRuntimeAssets.has(file)) {");
fs.writeFileSync(pagesBuild,pagesText);
const finalSuccessor=read(successor),finalBaseline=read(snapshotPath);
finalSuccessor.runtimeSuccessors=finalBaseline.runtime.map(e=>({path:e.path,predecessorSha256:e.sha256,currentSha256:sha(e.path)}));
finalSuccessor.changes=finalBaseline.runtime.filter(e=>e.path!==helper).map(e=>({path:e.path,predecessorSha256:e.sha256,successorSha256:sha(e.path)}));
finalSuccessor.r2AssetStatus={fullPrivateSource:metadata?'BOUND':'PENDING_R2_OBJECT_IDENTITY',preview:'PENDING_R2_OBJECT_IDENTITY',figures:'PENDING_R2_OBJECT_IDENTITY'};
write(successor,finalSuccessor);
const commands=read('config/reports/zero-cost-check-commands.json');commands['check:kap-book-vii']='node scripts/check-kap-book-vii-observation-science-successor.mjs';commands['check:kap-phase18']='node scripts/check-kap-phase18-book-vii-current.mjs ALL';commands['check:kap-current']='npm run check:kap && npm run check:kap-phase18 && npm run check:kap-book-vii';write('config/reports/zero-cost-check-commands.json',commands);
console.log('Book VII additive candidates and runtime successor generated; no publication or asset mutation.');

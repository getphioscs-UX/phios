import fs from 'node:fs';import assert from 'node:assert/strict';import{createHash}from'node:crypto';
const read=p=>JSON.parse(fs.readFileSync(p)),sha=x=>createHash('sha256').update(x).digest('hex'),write=(p,x)=>fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n');
const root='tools/review/free-ask-manuscript-r1/whole-chapter-batch-r1/',pages=read(root+'SOURCE-PAGE-COMPARISON.json');
const registry=read('content/knowledge/source-access/registries/manuscript-knowledge-source-registry-v8-candidate.json'),third=read('content/knowledge/source-access/registries/manuscript-knowledge-source-registry-v6-candidate.json').records.find(r=>r.bookCode==='BOOK-3');
registry.records[registry.records.findIndex(r=>r.bookCode==='BOOK-3')]=third;
third.localPath=read('tools/review/free-ask-manuscript-r1/BOOK-III-CURRENT-COMPLETE-CORPUS-COMPARISON.json').corpusPath;
const scope=read('content/knowledge/source-access/registries/manuscript-text-scope-candidates-v5.json');
scope.records=scope.records.filter(s=>s.bookCode!=='BOOK-3');
const thirdScope=read(third.scopeAdmissionPath);scope.records.push(...thirdScope.records.filter(s=>s.bookCode==='BOOK-3'));
const checklist={version:'WHOLE_CHAPTER_QUALITY_CHECKLIST_R1',requirements:[{id:'C1',name:'Accepted current source / byte identity and preserved predecessor'},{id:'C2',name:'Chapter title, first/last sentence and next chapter boundary'},{id:'C3',name:'Every body sentence matched to source pages; visual page review; no known omissions or repeated splice'},{id:'C4',name:'Classify diagrams/footnotes; no unverified dependency used by chapter claims'},{id:'C5',name:'Main-argument inventory with exact support excerpts and qualifications'},{id:'C6',name:'Actual customer API answers directly address all listed main arguments; no fixed test answers'},{id:'C7',name:'Independent new questions and high-risk false-premise/no-source boundaries'},{id:'C8',name:'Strict source/corpus/scope digest validation; client cannot widen scope; zero provider'},{id:'C9',name:'Deployment/live evidence separately required; not a source completion precondition'}],qualifiedDefinition:'C1–C8 PASS; answer coverage is bounded to inventoried principal arguments, not all possible questions. C9 is separate DEPLOYMENT/LIVE gate.'};
const claims={
 'B1V3-P1-S006':[
 ['DYNAMIC_CONTINUITY','DEFINITION','持续 Continuity 并不是一种静态结果','稳定并不是变化的对立面'],
 ['REORGANIZATION','MECHANISM','真正持续存在的，并不是组成系统的每一个元素','依赖整个组织持续协调自身的能力'],
 ['UPDATING_NOT_FREEZING','DISTINCTION','持续因此不是停止更新','系统仍然能够保持'],
 ['READABILITY_NOT_IMPLIED','BOUNDARY','然而，一个能够持续存在的现实，仍然过于复杂','被压缩，才能形成可以进入']
 ],
 'CM-B3V1-P8-S001':[
 ['HISTORY_CREATES_MAINTENANCE','MECHANISM','因此，持续本身具有成本','维护首先不是修理，而是\n处理持续所产生的后果'],
 ['MAINTENANCE_V_REPAIR','DISTINCTION','维护首先不是修理','是否正在逐渐改变自己'],
 ['RESOURCE_AND_RESIDUAL','CONDITIONS','资源在运行中被使用以后','长期维持并不只需要不断增加新能力'],
 ['FULL_COST_PATH','BOUNDARY','维护行为是否把成本转移到其他位置','不能建立\n在某个隐藏位置不断被消耗之上'],
 ['PROFESSIONAL_LIMIT','BOUNDARY','还有一些身体或\n心理变化需要专业评估','反而越不会无限扩大自己的解释权']
 ,['CALIBRATION_NOT_FREEZING','MECHANISM','真正的维持反而包含持续\n改变','它是一种持续校准']
 ],
 'B5-S002':[
 ['CIVILIZATION_V_STATE','DISTINCTION','文明比国家更宽，也往往比国家更深','二者会彼此影响，却很少同步移动'],
 ['HISTORICAL_BOUNDARIES','MECHANISM','古代\n多数人并没有生活在现代民族国家之中','不应被当作文明本身'],
 ['MULTIPLE_LAYERS','DEFINITION','文明边界至少存在一种比国界更复杂的性质','这些边界并不会整齐重合'],
 ['STATE_MATTERS','BOUNDARY','国家绝不是文明研究中可以忽略的一层','国家本身就是文明全部'],
 ['NO_WAR_GUARANTEE','BOUNDARY','政治敌对不必然等于\n文明完全分离','文明相似也\n不意味着政治和平']
 ,['STATE_COLLAPSE_NOT_CIVILIZATION_ZERO','MECHANISM','这也是为什么国家灭亡并不等于文明消失','历史显然并非\n如此']
 ,['MULTIPLE_TRADITIONS_IN_ONE_STATE','CONDITIONS','国家存在也不代表内部只有一个文明结构','却不是一个保证内部同质化的容器']
 ]};
const chapterRecords=pages.results.map(p=>{assert(p.fullBodyNativeSentenceMatch);const corpus=read(p.corpusPath),record=corpus.records.find(r=>r.sectionCode===p.sectionCode),compact=record.text.normalize('NFKC').replace(/\s+/gu,'');const inventory=claims[p.sectionCode].map(([id,type,from,to])=>{const a=from.normalize('NFKC').replace(/\s+/gu,''),b=to.normalize('NFKC').replace(/\s+/gu,'');assert(compact.includes(a)&&compact.includes(b),id);return{id,type,supportAnchors:[from,to],sourceSectionSha256:record.textSha256};});
 const priorScope=scope.records.find(s=>s.bookCode===p.bookCode&&s.sectionCode===p.sectionCode);if(priorScope)scope.records=scope.records.filter(s=>s!==priorScope);
 scope.records.push({bookCode:p.bookCode,sectionCode:p.sectionCode,heading:record.heading,sourceSha256:corpus.sourceSha256,corpusSha256:corpus.corpusSha256,sectionSha256:record.textSha256,startOffset:0,endOffset:record.text.length,pdfPageRange:{start:record.startPage,end:record.endPage},scopeState:'LOCAL_QA_VERIFIED_PROSE_CANDIDATE',sourceDependency:'WHOLE_NATIVE_CHAPTER_NO_UNVERIFIED_DIAGRAM_OR_FOOTNOTE_DEPENDENCY',locale:'zh-Hans',publicFullTextAllowed:false,answerProjectionPolicy:'QUESTION_ANCHORED_CONTIGUOUS',wholeChapterCandidate:true,principalArguments:inventory.map(x=>({id:x.id,type:x.type})),validation:{sourcePageReceipt:root+'SOURCE-PAGE-COMPARISON.json',visualReceipt:p.visualReceipt,visualState:'SOURCE_PAGES_VISUALLY_REVIEWED',semanticState:'PENDING_BATCH_ANSWER_QA'}});
 return{bookCode:p.bookCode,sectionCode:p.sectionCode,sourceSha256:corpus.sourceSha256,sectionSha256:record.textSha256,pages:[record.startPage,record.endPage],principalArguments:inventory,contentIntegrity:'PASS_NATIVE_TEXT_AND_VISUAL_PAGE_REVIEW',imageDependency:p.bookCode==='BOOK-3'?'DECORATIVE_BACKGROUND_NOT_ARGUMENT_DEPENDENCY':'NONE_IN_WHOLE_CHAPTER',knownMissingContent:[],answerState:'PENDING',admission:'CANDIDATE_ONLY',live:'NOT_RUN'};});
const identityPath='content/knowledge/manuscripts/review/book-v-v1-current-source-identity-inheritance-v1.json',canonical='content/books/book-5/source/final-manuscript-structure-v1.json',canonicalIdentity=read(canonical);
const concepts={
 'B1V3-P1-S006':[{conceptId:'SOURCE-STRUCTURAL-CONTINUITY',aliases:['结构持续性','持续性','持续更新'],termSets:[['结构','连续'],['结构','持续']],supportAnchor:'持续 Continuity 并不是一种静态结果'}],
 'CM-B3V1-P8-S001':[{conceptId:'SOURCE-RUN-MAINTENANCE',aliases:['维护','维护需求','长期维护'],supportAnchor:'维护首先不是修理'}],
 'B5-S002':[{conceptId:'SOURCE-CIVILIZATION-STATE-BOUNDARIES',aliases:['文明边界','国家边界','现代国家','政治边界','国界'],supportAnchor:'文明边界至少存在一种比国界更复杂的性质'},{conceptId:'SOURCE-POLITICAL-CIVILIZATION-CONTINUITY',aliases:['政权终结','国家灭亡','文明消失'],termSets:[['国家','文明']],supportAnchor:'国家灭亡并不等于文明消失'}]
};
for(const p of pages.results){const record=read(p.corpusPath).records.find(r=>r.sectionCode===p.sectionCode),compact=record.text.normalize('NFKC').replace(/\s+/gu,'');for(const concept of concepts[p.sectionCode])assert(compact.includes(concept.supportAnchor.normalize('NFKC').replace(/\s+/gu,'')));const s=scope.records.find(s=>s.sectionCode===p.sectionCode);s.retrievalConcepts=concepts[p.sectionCode];
 const map=[];let offset=0;for(const char of record.text){for(const normalized of char.normalize('NFKC'))if(!/\s/u.test(normalized))map.push(offset);offset+=char.length;}
 s.argumentUnits=chapterRecords.find(r=>r.sectionCode===p.sectionCode).principalArguments.map(argument=>{const [a,b]=argument.supportAnchors.map(t=>t.normalize('NFKC').replace(/\s+/gu,'')),start=compact.indexOf(a),end=compact.indexOf(b,start);assert(start>=0&&end>=start,argument.id);const startOffset=map[start],anchorEnd=map[end+b.length-1]+1,boundary=record.text.indexOf('。',anchorEnd);const endOffset=boundary>=0?boundary+1:anchorEnd;return{argumentId:argument.id,type:argument.type,startOffset,endOffset,textSha256:sha(record.text.slice(startOffset,endOffset))};});
}
write(identityPath,{kind:'CANONICAL_CURRENT_SOURCE_IDENTITY_INHERITANCE_NOT_NEW_HUMAN_ACCEPTANCE',sourcePdfSha256:canonicalIdentity.sourcePdfSha256,canonicalEvidence:{path:canonical,sha256:sha(fs.readFileSync(canonical))},sourceScope:'CURRENT_FINAL_SOURCE_IDENTITY_ONLY_NOT_WHOLE_CORPUS_ACCEPTANCE',ownerInstruction:'Continue seven current accepted Chinese manuscripts; preserve current sources and validate qualified chapters before deploying',sourceAcceptanceNotAutomaticallyAnswerAcceptance:true});
const scopePath='content/knowledge/source-access/registries/manuscript-text-scope-candidates-v6.json';scope.schemaVersion='PHI-OS-MANUSCRIPT-TEXT-SCOPE-CANDIDATES-v6';scope.successorOf='content/knowledge/source-access/registries/manuscript-text-scope-candidates-v5.json';scope.productionActivated=false;write(scopePath,scope);
for(const source of registry.records.filter(r=>['BOOK-1','BOOK-3','BOOK-5'].includes(r.bookCode)))Object.assign(source,{scopeAdmissionPath:scopePath,scopeAdmissionSha256:sha(fs.readFileSync(scopePath))});
const fifth=registry.records.find(r=>r.bookCode==='BOOK-5');Object.assign(fifth,{sourceIdentityPath:identityPath,sourceIdentitySha256:sha(fs.readFileSync(identityPath)),runtimeAdmission:'SCOPED_TEXT_CANDIDATE_NOT_ACTIVATED'});delete fifth.qaOnly;
registry.schemaVersion='PHI-OS-MANUSCRIPT-KNOWLEDGE-SOURCE-REGISTRY-v9-CANDIDATE';registry.successorOf='content/knowledge/source-access/registries/manuscript-knowledge-source-registry-v7.json';registry.productionActivated=false;write('content/knowledge/source-access/registries/manuscript-knowledge-source-registry-v9-candidate.json',registry);
write(root+'CHAPTER-QUALIFICATION.json',{at:new Date().toISOString(),checklist,chapters:chapterRecords,qualified:0,admitted:0,live:0,providerCalls:0});console.log(JSON.stringify({wholeChapterCandidates:chapterRecords.map(r=>r.sectionCode),sourceComplete:chapterRecords.length,qualified:0,productionActivated:false}));

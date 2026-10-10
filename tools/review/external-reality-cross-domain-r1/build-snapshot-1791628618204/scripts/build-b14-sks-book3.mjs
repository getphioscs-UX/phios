import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const nodePath='content/knowledge/registry/successors/kau-r6e-book3-final/canonical-nodes-v1.json';
const semanticPath='content/knowledge/manuscripts/extraction/book-3-final-section-semantics-v1.json';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const nodes=read(nodePath).nodes,semantics=read(semanticPath).records;
const taxonomy={MAINTENANCE_SIGNAL:'SIGNAL',LOAD:'LOAD',CAPACITY:'CAPACITY',DEGRADATION:'FAILURE_MODE',FRAGILITY:'CONDITION',DEPENDENCY:'DEPENDENCY',FAILURE_MODE:'FAILURE_MODE',RECOVERY_MODE:'RECOVERY_MODE',RESILIENCE:'CAPACITY',ADAPTATION:'RECOVERY_MODE',COORDINATION_CONTINUITY:'CONTINUITY_MODE',SHARED_MAINTENANCE:'COORDINATION_MODE',CONTINUITY_STATE:'STATE'};
const groups={MAINTENANCE_SIGNAL:['摩擦讯号','重复模式','慢性噪声','讯号失读','运行监测'],LOAD:['残余负荷','责任负荷','运行累积'],CAPACITY:['维持容量','维持边界'],DEGRADATION:['运行漂移','运行扭曲','运行碎裂','协调漂移','协调碎裂'],FAILURE_MODE:['载体失效架构','人工载体失效','协调崩塌'],RECOVERY_MODE:['负荷释放','重新整合','结构修复','运行再平衡','运行重构'],ADAPTATION:['适应性维护','协调适应'],CONTINUITY_STATE:['可持续连续','协调连续','连续性形成']};
const entries=[];
for(const [family,titles] of Object.entries(groups))for(const title of titles){
 const n=nodes.find(n=>n.titleZhHans===title);assert.equal(n?.publicationBookCode,'BOOK-3');
 const binding=n.canonicalSourceBinding,s=semantics.find(s=>s.sectionCode===binding.sectionCode);assert.equal(s?.sourceTextSha256,binding.textSha256);
 entries.push({objectId:`SK-B3-${n.nodeCode.replace(/^KN-/,'')}`,bookCode:'BOOK-3',nodeCode:n.nodeCode,partCode:n.publicationPartCode,title,canonicalQuestion:n.canonicalQuestion,family,objectType:taxonomy[family],definition:null,definitionState:'PENDING_PARAGRAPH_EXTRACTION',sourceRefs:{canonicalNodeCodes:[n.nodeCode],manuscriptSectionRefs:[s.sectionCode],publishedArticleRefs:[],figureRefs:[],relatedStructuredObjectIds:[]},sourceSections:[{sectionCode:s.sectionCode,startPage:s.startPage,endPage:s.endPage,textSha256:s.sourceTextSha256}],status:'IN_REVIEW',humanAcceptanceComplete:false});
}
const meta={version:'1.0.0',bookCode:'BOOK-3',status:'SOURCE_INDEX_PREVIEW',humanAcceptanceComplete:false,sourcePaths:{nodes:nodePath,semantics:semanticPath},sourceDigests:Object.fromEntries([['nodes',nodePath],['semantics',semanticPath]].map(([k,p])=>[k,createHash('sha256').update(fs.readFileSync(p)).digest('hex')]))};
const dir='content/knowledge/structured/book-3/';fs.mkdirSync(dir,{recursive:true});
const write=(name,value)=>fs.writeFileSync(dir+name,JSON.stringify({...meta,...value},null,2)+'\n');
write('book-3-structured-taxonomy-v1.json',{specializations:taxonomy});
write('book-3-maintenance-signal-registry-v1.json',{entries,signals:entries.filter(e=>e.family==='MAINTENANCE_SIGNAL').map(e=>({signalId:e.objectId,definition:null,observableIndicators:[],relatedCapacity:[],relatedLoad:[],earlyWarning:[],lateWarning:[],sourceRefs:e.sourceRefs}))});
write('book-3-degradation-registry-v1.json',{degradations:entries.filter(e=>e.family==='DEGRADATION').map(e=>({degradationId:e.objectId,family:e.family,definition:null,signals:[],causes:[],effects:[],relatedCapacities:[],thresholds:[],recoveryRefs:[],sourceRefs:e.sourceRefs}))});
write('book-3-failure-mode-registry-v1.json',{failureModes:entries.filter(e=>e.family==='FAILURE_MODE').map(e=>({failureModeId:e.objectId,preconditions:[],failureMechanism:null,visibleSignals:[],hiddenDependencies:[],reversibility:'UNKNOWN',recoveryWindow:null,sourceRefs:e.sourceRefs}))});
write('book-3-recovery-mode-registry-v1.json',{recoveryModes:entries.filter(e=>['RECOVERY_MODE','ADAPTATION'].includes(e.family)).map(e=>({recoveryModeId:e.objectId,sourceRefs:e.sourceRefs})),restorationEquivalentToRecovery:false});
write('book-3-continuity-state-model-v1.json',{stateObjectIds:entries.filter(e=>e.family==='CONTINUITY_STATE').map(e=>e.objectId),transitions:[],transitionState:'WITHHELD_PENDING_SOURCE_EVIDENCE',automaticStateClassificationAllowed:false});
write('book-3-reality-runtime-binding-v1.json',{role:'KNOWLEDGE_FRAMEWORK',target:'/books/reality-continuity/#maintenance',mayWriteRealityState:false,mayInferObservedSignals:false,mayOverrideProfessionalJudgment:false,automaticRecoveryRecommendation:false});
console.log(`✓ Book III: ${entries.length} final-node source-index entries; transitions, diagnosis and recovery recommendations remain withheld.`);

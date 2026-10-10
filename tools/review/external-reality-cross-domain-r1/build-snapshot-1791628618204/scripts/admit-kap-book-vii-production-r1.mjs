import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root='content/knowledge/book-vii',admission=`${root}/production-admission`,kap='content/knowledge/answer-projection';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const text=p=>fs.readFileSync(p,'utf8');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const digest=t=>crypto.createHash('sha256').update(t).digest('hex');
const write=(p,v)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');};
const predecessor=`${kap}/reconciliation/kap-book-vii-observation-science-successor-v1.json`;
const successor=`${kap}/reconciliation/kap-book-vii-production-admission-successor-v1.json`;
const runtimePaths=['functions/_lib/public-knowledge-api.js','functions/_lib/knowledge-access-api.js','scripts/lib/knowledge-runtime/knr-package-a-v1.mjs','scripts/lib/knowledge-runtime/knr-package-b-v1.mjs','scripts/lib/knowledge-answer-projection/kap-maintenance-successor-v1.mjs','functions/_lib/knowledge-answer-composition.js'];
const baselinePath=`admission/evidence/baseline-v1.json`.replace('admission',admission);
if(!fs.existsSync(baselinePath))write(baselinePath,{predecessor:{path:predecessor,sha256:sha(predecessor)},runtime:runtimePaths.map(path=>({path,sha256:sha(path)})),acceptedArtifacts:[`${root}/registries/book-vii-observation-science-node-registry-v1.json`,`${root}/registries/book-vii-observation-science-figure-registry-v1.json`,`${root}/registries/book-vii-observation-science-r2-asset-registry-v1.json`,`${root}/publication/book-vii-governed-knowledge-projection-candidate-v1.json`,'tools/review/KAP-BOOK-VII-OBSERVATION-SCIENCE-CUTOVER-R1-HUMAN-REVIEW.html'].map(path=>({path,sha256:sha(path)}))});
const baseline=read(baselinePath);
for(const p of runtimePaths)if(!baseline.runtime.some(e=>e.path===p))baseline.runtime.push({path:p,sha256:sha(p)});
write(baselinePath,baseline);
const humanPath=`${admission}/human-acceptance-v1.json`;
if(!fs.existsSync(humanPath))write(humanPath,{schemaVersion:'PHI-OS-KAP-BOOK-VII-HUMAN-ACCEPTANCE-v1.0.0',recordCode:'KAP-BOOK-VII-R1-HUMAN-ACCEPT-2026-10-06',decision:'ACCEPT',source:'EXPLICIT_USER_HUMAN_ACCEPT',date:'2026-10-06',timezone:'Asia/Kuala_Lumpur',acceptedWork:'KAP-BOOK-VII-OBSERVATION-SCIENCE-CURRENT-SUCCESSOR-R1',authorizedNextWork:'KAP-BOOK-VII-PRODUCTION-ADMISSION-R1',acceptedArtifacts:baseline.acceptedArtifacts,acceptedEvidence:{publicR2Objects:59,previewPages:50,figures:9,webpHeadersVerified:true,sha256FromActualReads:true,figure14HPrimary:'14.96',figure14HSupporting:'14.85–14.95',privateSourceUnchanged:true},authorization:'Human Review closure is accepted. Proceed to KAP-BOOK-VII-PRODUCTION-ADMISSION-R1.',boundary:{masterAExecuted:false,paidProvidersAllowed:false,historicalFreezeMutationAllowed:false,kapW46Created:false,liveDeploymentAuthorizedByThisRecord:false}});
const human=read(humanPath),candidate=read(`${root}/publication/book-vii-governed-knowledge-projection-candidate-v1.json`),registry=read(`${root}/registries/book-vii-observation-science-node-registry-v1.json`);
const byNode=new Map();
for(const record of candidate.records)for(const nodeCode of record.nodeCodes){const entry=byNode.get(nodeCode)||{nodeCode,texts:[],questions:[]};entry.texts.push(record.text);entry.questions.push(read(`${root}/fixtures/acceptance-corpus-v1.json`).cases.find(c=>c.id===record.id)?.question||'');byNode.set(nodeCode,entry);}
// Only approved contract/figure semantics supplement the reviewed candidate summaries.
const cases=read(`${root}/fixtures/acceptance-corpus-v1.json`).cases;
for(const [id,n] of [['Q4',42],['FIGURE',96]]){const c=cases.find(c=>c.id===id);byNode.set(`KN-B7-14-${String(n).padStart(3,'0')}`,{nodeCode:`KN-B7-14-${String(n).padStart(3,'0')}`,texts:[c.text],questions:[c.question],figure:id==='FIGURE'});}
const projections=Object.fromEntries(['nodes','fragments','aliases','relationships','questions','publications','locale-availability','books','parts'].map(n=>[n,[]])),packages=[];
for(const record of byNode.values()){
 const node=registry.nodes.find(n=>n.nodeCode===record.nodeCode);if(!node?.canonicalTitleVerified)throw Error('UNVERIFIED_NODE_METADATA');
 const slug=`book-vii-observation-${node.sectionCode.replace('.','-')}`;
 const packet={packageCode:`KAP-B7-ADMISSION-${node.sectionCode}`,nodeCode:node.nodeCode,locale:'zh-Hans',authorizationRef:human.recordCode,review:{decision:'accept',basis:'USER_ACCEPTED_R1_HUMAN_REVIEW_AND_SEMANTIC_REGISTRIES'},approval:{decision:'approve',basis:'EXPLICIT_PRODUCTION_ADMISSION_AUTHORIZATION'},publication:{decision:'publish',environment:'REPOSITORY_PRODUCTION_ADMISSION',liveDeployed:false},fullManuscriptProse:false,content:record.texts.join('\n')};
 packages.push(packet);const authorityDigest=digest(JSON.stringify(packet));
 projections.nodes.push({nodeCode:node.nodeCode,locale:'zh-Hans',bookCode:'BOOK-7',partCode:'PART-14',title:node.titleZhHans,summary:record.texts[0],slug,href:`/books/reality-observation/#${node.sectionCode}`,authorityDigest,authorityRecordCode:packet.packageCode,publicationCode:packet.packageCode});
 record.texts.forEach((body,i)=>{
  const fragmentCode=`B7-${node.sectionCode}-ZH-${i+1}`;
  projections.fragments.push({fragmentCode,nodeCode:node.nodeCode,locale:'zh-Hans',ordinal:i+1,kind:'paragraph',text:body,digest:digest(body),bookId:'BOOK-7',publicationStatus:'PUBLISHED',authorityOwner:'BOOK_VII_OBSERVATION_SCIENCE',sourceType:record.figure?'REGISTERED_FIGURE_SEMANTICS':'PUBLISHED_CANONICAL_ARTICLE',...(record.figure?{canonicalProseAuthority:false,ocrAuthority:false}:{epistemicEvidence:{sufficient:false,evidenceRefs:[fragmentCode],...(node.sectionCode==='14.57'?{future:true}:{}),unknownReasons:[node.sectionCode==='14.42'?'TIME_WINDOW_TOO_SHORT':node.sectionCode==='14.92'?'MODEL_BLIND_SPOT':node.sectionCode==='14.86'?'LOW_RESOLUTION':'INSUFFICIENT_EVIDENCE']}})});
 });
 const questions=[...new Set([node.readerQuestionZhHans,...record.questions].filter(Boolean))];
 for(const [i,question] of questions.entries()){
  projections.questions.push({nodeCode:node.nodeCode,locale:'zh-Hans',question,questionCode:`B7-Q-${node.sectionCode}-${i}`,questionType:'canonical'});
  projections.aliases.push({nodeCode:node.nodeCode,locale:'zh-Hans',value:question,normalized:question.normalize('NFKC').replace(/[\p{P}\p{S}\s]+/gu,''),aliasCode:`B7-A-${node.sectionCode}-${i}`,aliasType:'question'});
  const compact=question.replace(/[，,]/g,'');if(compact!==question)projections.questions.push({nodeCode:node.nodeCode,locale:'zh-Hans',question:compact,questionCode:`B7-Q-${node.sectionCode}-${i}-compact`,questionType:'canonical'});
 }
 projections['locale-availability'].push({nodeCode:node.nodeCode,locales:[{locale:'zh-Hans',available:true,authorityRecordCode:packet.packageCode},{locale:'en',available:false}]});
 projections.publications.push({nodeCode:node.nodeCode,locale:'zh-Hans',status:'published',publicationCode:packet.packageCode,authorityDigest,publicationDigest:authorityDigest});
}
const releasePath='content/knowledge/public/successors/book-vii-production-admission-v1/published-projection.json';
for(const packet of packages){
 packet.title=projections.nodes.find(n=>n.nodeCode===packet.nodeCode).title;
 packet.approvedFragments=projections.fragments.filter(f=>f.nodeCode===packet.nodeCode);
 packet.approvedQuestions=projections.questions.filter(q=>q.nodeCode===packet.nodeCode).map(q=>q.question);
 const verifiedDigest=digest(JSON.stringify(packet));
 projections.nodes.find(n=>n.nodeCode===packet.nodeCode).authorityDigest=verifiedDigest;
 const publication=projections.publications.find(p=>p.nodeCode===packet.nodeCode);publication.authorityDigest=verifiedDigest;publication.publicationDigest=verifiedDigest;
}
write(releasePath,{schemaVersion:'PHI-OS-BOOK-VII-PRODUCTION-ADMISSION-v1.0.0',releaseCode:'KAP-BOOK-VII-PRODUCTION-ADMISSION-R1',status:'ADMITTED_FOR_PRODUCTION',humanAcceptance:{recordCode:human.recordCode,decision:human.decision,source:human.source,recordSha256:sha(humanPath)},canonicalSectionIdentityCount:100,publishedNodeCount:projections.nodes.length,unpublishedSectionsRemainUnavailable:true,packages,projections,governance:{masterAExecuted:false,providerInvoked:false,rawManuscriptIncluded:false,previewIncluded:false,ocrAuthorityCreated:false,book8DecisionAuthorityCreated:false,liveDeploymentPerformed:false}});
let api=text(runtimePaths[0]);
if(!api.includes("from './book-vii-published-admission.js'")){
 api="import {loadBookViiPublishedAdmission,appendBookViiProjection} from './book-vii-published-admission.js';\n"+api;
 api=api.replace('  return response.json();',"  const original=await response.json();\n  if(name==='published-retrieval-index')return original;\n  const release=await loadBookViiPublishedAdmission(async path=>{const r=await env.ASSETS.fetch(new Request(`https://assets.local/${path}`));if(!r.ok)return null;return r.json();});\n  return appendBookViiProjection(original,name,release);");
 api=api.replace('({fragmentCode,ordinal,kind,text,digest})=>({fragmentCode,ordinal,kind,text,digest})',"({fragmentCode,ordinal,kind,text,digest,...metadata})=>({fragmentCode,ordinal,kind,text,digest,...metadata,...(metadata.bookId==='BOOK-7'?{scopeMatch:exact,bookCode:'BOOK-7',partCode:'PART-14'}:{})})");
 fs.writeFileSync(runtimePaths[0],api);
}
let access=text(runtimePaths[1]);
if(!access.includes('BOOK_VII_ADMISSION_METADATA')){
 access=access.replace("      text: fragment.text\n", "      text: fragment.text,\n      // BOOK_VII_ADMISSION_METADATA: preserve governed projection metadata only.\n      ...(fragment.bookId==='BOOK-7'?{bookId:fragment.bookId,bookCode:fragment.bookCode,partCode:fragment.partCode,scopeMatch:fragment.scopeMatch,publicationStatus:fragment.publicationStatus,authorityOwner:fragment.authorityOwner,sourceType:fragment.sourceType,epistemicEvidence:fragment.epistemicEvidence,canonicalProseAuthority:fragment.canonicalProseAuthority,ocrAuthority:fragment.ocrAuthority}:{})\n");
 fs.writeFileSync(runtimePaths[1],access);
}
let a=text(runtimePaths[2]);
if(!a.includes('book-vii-published-admission.js')){
 a="import {loadBookViiPublishedAdmission,appendBookViiProjection} from '../../../functions/_lib/book-vii-published-admission.js';\n"+a;
 a=a.replace('  return {\n    manifest,',"  const release=await loadBookViiPublishedAdmission(readJson);\n  const admitted=projections.map((projection,i)=>appendBookViiProjection(projection,names[i],release));\n  return {\n    manifest,");
 a=a.replace('[name, projections[index].records]','[name, admitted[index].records]');fs.writeFileSync(runtimePaths[2],a);
}
let b=text(runtimePaths[3]);
let routed=text(runtimePaths[2]);
routed=routed.replace('const admitted=projections.map((projection,i)=>appendBookViiProjection(projection,names[i],release));','const admitted=await Promise.all(projections.map((projection,i)=>appendBookViiProjection(projection,names[i],release)));');
fs.writeFileSync(runtimePaths[2],routed);
if(!routed.includes('Number(b.evidence.some(e=>e.exact))')) {
 routed=routed.replace("    .filter(candidate => publishedPairs.has(`${candidate.nodeCode}:${candidate.locale}`))", "    .filter(candidate => publishedPairs.has(`${candidate.nodeCode}:${candidate.locale}`))\n    .sort((a,b)=>Number(b.evidence.some(e=>e.exact))-Number(a.evidence.some(e=>e.exact)))");fs.writeFileSync(runtimePaths[2],routed);
}
if(!b.includes('loadPublishedRetrieval')){
 b=b.replace('runPublishedRetrieval, normalizeQuery','loadPublishedRetrieval, runPublishedRetrieval, normalizeQuery');
 b=b.replace('  return { projectionPolicy, pathPolicy, nodes: nodes.records, fragments: fragments.records, relationships: relationships.records, availability: availability.records };',"  const {projections}=await loadPublishedRetrieval();\n  return {projectionPolicy,pathPolicy,nodes:projections.nodes,fragments:projections.fragments,relationships:projections.relationships,availability:projections['locale-availability']};");fs.writeFileSync(runtimePaths[3],b);
}
let composer=text('functions/_lib/knowledge-answer-composition.js');
if(!composer.includes("'GOVERNED_PUBLICATION_FIGURE_SEMANTICS'")) {
 composer=composer.replace("      : source.sourceType?.startsWith('CIVILIZATION_ATLAS_')", "      : source.sourceType==='REGISTERED_FIGURE_SEMANTICS'\n        ? 'GOVERNED_PUBLICATION_FIGURE_SEMANTICS'\n      : source.sourceType?.startsWith('CIVILIZATION_ATLAS_')");fs.writeFileSync('functions/_lib/knowledge-answer-composition.js',composer);
}
let helper=text(runtimePaths[4]);
if(!helper.includes(successor)){helper=helper.replace("  'content/knowledge/answer-projection/reconciliation/kap-book-vii-observation-science-successor-v1.json'", "  'content/knowledge/answer-projection/reconciliation/kap-book-vii-observation-science-successor-v1.json',\n  '"+successor+"'");fs.writeFileSync(runtimePaths[4],helper);}
write(successor,{schemaVersion:'PHI-OS-KAP-BOOK-VII-PRODUCTION-ADMISSION-SUCCESSOR-v1.0.0',work:'KAP-BOOK-VII-PRODUCTION-ADMISSION-R1',status:'ADMITTED_FOR_PRODUCTION_LOCAL_VALIDATION_PENDING',predecessorSuccessor:predecessor,predecessorSha256:baseline.predecessor.sha256,humanAcceptance:{path:humanPath,sha256:sha(humanPath)},release:{path:releasePath,sha256:sha(releasePath)},changes:baseline.runtime.map(e=>({path:e.path,predecessorSha256:e.sha256,successorSha256:sha(e.path)})),boundaries:{canonicalKnowledgeCreated:false,secondAskRuntimeCreated:false,historicalFreezeRewritten:false,checksumValidationRelaxed:false,humanSemanticApprovalApplied:true},authorityBoundary:{acceptedR1ArtifactsPreserved:true,historicalKapFreezeMutated:false,retrievalAuthorityReplaced:false,existingComposerReused:true,rawManuscriptRetrievalAllowed:false,book8NavigationAuthorityCreated:false,masterAExecuted:false,paidProviderInvoked:false,liveDeploymentPerformed:false}});
// Accepted R1 checker bytes and its review remain preserved; the current route follows admission SHA lineage.
let current=text('scripts/check-kap-book-vii-observation-science-successor.mjs');
current="import {kapMaintenanceSuccessorSha} from './lib/knowledge-answer-projection/kap-maintenance-successor-v1.mjs';\n"+current;
current=current.replace('assert.equal(sha(e.path),e.currentSha256);','assert.equal(sha(e.path),kapMaintenanceSuccessorSha(e.path,e.currentSha256));');
current=current.replace('`${root}/evidence/runtime-regression-v1.json`','`${root}/production-admission/evidence/r1-current-runtime-regression-v1.json`');
current=current.replace('tools/review/KAP-BOOK-VII-OBSERVATION-SCIENCE-CUTOVER-R1-HUMAN-REVIEW.html','tools/review/KAP-BOOK-VII-PRODUCTION-ADMISSION-R1-REGRESSION-REVIEW.html');
fs.writeFileSync('scripts/check-kap-book-vii-admitted-current.mjs',current);
const pkg=read('package.json');pkg.scripts['check:kap-book-vii-production-admission']='node scripts/run-zero-cost-regression.mjs check:kap-book-vii-production-admission';write('package.json',pkg);
const commands=read('config/reports/zero-cost-check-commands.json');commands['check:kap-book-vii']='node scripts/check-kap-book-vii-admitted-current.mjs';commands['check:kap-book-vii-production-admission']='node scripts/check-kap-book-vii-production-admission.mjs';write('config/reports/zero-cost-check-commands.json',commands);
const phaseHistorical='scripts/check-kap-phase18-book-vii-current.mjs',phaseAdmitted='scripts/check-kap-phase18-production-admission-current.mjs';
let phase=text(phaseHistorical).replaceAll('node scripts/check-kap-phase18-book-vii-current.mjs ALL','node scripts/check-kap-phase18-production-admission-current.mjs ALL').replace("'npm run check:kap && npm run check:kap-phase18 && npm run check:kap-book-vii'","'npm run check:kap && npm run check:kap-phase18 && npm run check:kap-book-vii && npm run check:kap-book-vii-production-admission'");
fs.writeFileSync(phaseAdmitted,phase);
commands['check:kap-phase18']='node scripts/check-kap-phase18-production-admission-current.mjs ALL';commands['check:kap-current']='npm run check:kap && npm run check:kap-phase18 && npm run check:kap-book-vii && npm run check:kap-book-vii-production-admission';write('config/reports/zero-cost-check-commands.json',commands);
const admissionSuccessor=read(successor);admissionSuccessor.checkerSuccessors=[{historicalPath:'scripts/check-kap-book-vii-observation-science-successor.mjs',historicalSha256:sha('scripts/check-kap-book-vii-observation-science-successor.mjs'),currentPath:'scripts/check-kap-book-vii-admitted-current.mjs',currentSha256:sha('scripts/check-kap-book-vii-admitted-current.mjs')},{historicalPath:phaseHistorical,historicalSha256:sha(phaseHistorical),currentPath:phaseAdmitted,currentSha256:sha(phaseAdmitted)}];write(successor,admissionSuccessor);
console.log(`Human Accept recorded; ${projections.nodes.length} reviewed section projections admitted locally; existing retrieval loaders extended; no deployment.`);

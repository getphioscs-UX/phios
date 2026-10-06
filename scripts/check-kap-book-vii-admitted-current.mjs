import {kapMaintenanceSuccessorSha} from './lib/knowledge-answer-projection/kap-maintenance-successor-v1.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {composeKapAnswerProjection,runAskPhiosPipeline} from '../functions/_lib/knowledge-answer-composition.js';
import * as epistemic from '../functions/_lib/knowledge-epistemic-reading.js';
import {evaluateGuidedStopCondition,composeGuidedReading} from '../functions/_lib/knowledge-guided-reading.js';
const root='content/knowledge/book-vii',kap='content/knowledge/answer-projection';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const baseline=read(`${root}/evidence/baseline-v1.json`);
const identity=read(`${root}/contracts/book-vii-observation-science-canonical-identity-contract-v1.json`);
assert.equal(identity.bookId,'BOOK-7');assert.equal(identity.canonicalTitleZhHans,'世界如何被观察');assert.equal(identity.canonicalTitleEn,'How the World Is Observed');assert.equal(identity.partId,'PART-14');assert.equal(identity.sectionCount,100);assert.equal(identity.figureCount,9);assert.equal(identity.previousBook,'BOOK-6');assert.equal(identity.nextBook,'BOOK-8');
for(const value of Object.values(identity.authorityBoundary))assert.equal(value,false);
const nodes=read(`${root}/registries/book-vii-observation-science-node-registry-v1.json`).nodes;
assert.equal(nodes.length,100);assert.equal(new Set(nodes.map(n=>n.nodeCode)).size,100);assert.equal(new Set(nodes.map(n=>n.sectionCode)).size,100);
nodes.forEach((n,i)=>{assert.equal(n.sectionCode,`14.${i+1}`);assert.equal(n.nodeCode,`KN-B7-14-${String(i+1).padStart(3,'0')}`);assert.equal(n.rawManuscriptRetrievalAllowed,false);});
const figures=read(`${root}/registries/book-vii-observation-science-figure-registry-v1.json`).figures;assert.equal(figures.length,9);assert.deepEqual(figures.map(f=>f.figureId),Array.from({length:9},(_,i)=>`FIG-14${String.fromCharCode(65+i)}`));figures.forEach(f=>{assert.equal(f.canonicalProseAuthority,false);assert.equal(f.ocrAuthority,false);});
const r2=read(`${root}/registries/book-vii-observation-science-r2-asset-registry-v1.json`);
const figureH=figures.find(f=>f.figureId==='FIG-14H');
assert.equal(figureH.semanticPurpose,'已知／重构／投影／争议／未知');assert.equal(figureH.primarySectionCode,'14.96');assert.equal(figureH.primaryNodeCode,'KN-B7-14-096');assert.equal(figureH.primarySectionTitleZhHans,'我们知道到哪里');assert.deepEqual(figureH.supportingSectionCodes,Array.from({length:11},(_,i)=>`14.${85+i}`));
const verification=read(`${root}/evidence/r2-targeted-object-verification-v1.json`);
for(const asset of r2.assets.filter(a=>a.assetClass!=='FULL_PRIVATE_SOURCE'&&a.bindingStatus==='BOUND')) {
 const objects=asset.assetClass==='PUBLIC_PREVIEW_50P'?asset.pages:[asset];
 if(asset.assetClass==='PUBLIC_PREVIEW_50P'){assert.equal(objects.length,50);assert.deepEqual(objects.map(o=>o.pageNumber),Array.from({length:50},(_,i)=>i+1));}
 for(const object of objects){const verified=verification.records.find(v=>v.objectKey===object.objectKey);assert.ok(verified);assert.equal(verified.status,'BOUND');assert.equal(verified.httpStatus,200);assert.equal(object.sha256,verified.sha256);assert.match(object.sha256,/^[a-f0-9]{64}$/);}
}
assert.equal(r2.assets.length,11);const full=r2.assets.find(a=>a.assetClass==='FULL_PRIVATE_SOURCE'),preview=r2.assets.find(a=>a.assetClass==='PUBLIC_PREVIEW_50P');assert.equal(full.canonicalPublicationSource,true);assert.equal(full.public,false);assert.equal(full.kapDirectRetrievalAllowed,false);assert.equal(preview.canonicalPublicationSource,false);assert.equal(preview.kapDirectRetrievalAllowed,false);assert.notEqual(full.assetId,preview.assetId);
assert.deepEqual(epistemic.KNOWLEDGE_STATES,['KNOWN','RECONSTRUCTED','PROJECTED','CONTESTED','UNKNOWN']);assert.deepEqual(epistemic.OBSERVATION_TIME_CLASSES,['CURRENT','LONGITUDINAL','STRUCTURAL']);
const states=read(`${kap}/contracts/kap-book-vii-knowledge-state-contract-v1.json`);for(const invariant of ['PROJECTED != FACT','UNKNOWN != ZERO','UNOBSERVED != NONEXISTENT','PRIMARY_READING != ONLY_READING'])assert.ok(states.invariants.includes(invariant));
const candidate=read(`${root}/publication/book-vii-governed-knowledge-projection-candidate-v1.json`);assert.equal(candidate.promotionAllowed,false);assert.equal(candidate.productionRetrievalAllowed,false);assert.equal(candidate.humanDecision,null);
assert.equal(nodes.filter(n=>n.canonicalTitleVerified).length,100);assert.equal(full.bindingStatus,'BOUND');assert.equal(full.bucket,'phios-private-manuscripts');assert.equal(full.objectKey,'books/book-7/source/PHI-OS-Book-7-v1.pdf');assert.equal(sha('scripts/check-kap-w30-w45-phase18-governance.mjs'),read(`${kap}/reconciliation/kap-book-vii-observation-science-successor-v1.json`).checkerSuccessor.historicalSha256);
const successor=read(`${kap}/reconciliation/kap-book-vii-observation-science-successor-v1.json`);assert.equal(successor.predecessorSuccessor,`${kap}/reconciliation/kap-kir-r2-content-grounding-successor-v2.json`);assert.equal(sha(successor.predecessorSuccessor),successor.predecessorSha256);for(const e of successor.runtimeSuccessors){assert.equal(sha(e.path),kapMaintenanceSuccessorSha(e.path,e.currentSha256));assert.equal(e.predecessorSha256,baseline.runtime.find(b=>b.path===e.path).sha256);}for(const e of [...baseline.historical,...baseline.unrelated])assert.equal(sha(e.path),e.sha256,`PRESERVED_BYTES:${e.path}`);
for(const e of successor.targetedHumanReviewClosure.files)assert.equal(sha(e.path),e.currentSha256);
assert.equal(sha(successor.targetedHumanReviewClosure.physicalVerification.path),successor.targetedHumanReviewClosure.physicalVerification.sha256);
assert.deepEqual(full,read(`${root}/evidence/targeted-closure-baseline-v1.json`).fullPrivateSource);
const cases=read(`${root}/fixtures/acceptance-corpus-v1.json`).cases;
let providerRequests=0;const originalFetch=globalThis.fetch;globalThis.fetch=async()=>{providerRequests++;throw Error('REGRESSION_NETWORK_FORBIDDEN');};
const evidence=[];
const eligible={status:'STRONG_COVERAGE',answerCompositionEligible:true};
function bundle(c,{published=true}={}) {return {bundleId:`KAP-B7-${c.id}`,question:{text:c.question,locale:'zh-Hans'},normalization:{searchText:c.question},nodeMatches:{primaryNodes:c.sections.map(n=>({nodeCode:`KN-B7-14-${String(n).padStart(3,'0')}`})),supportingNodes:[],relatedPublishedNodeCodes:[]},sources:c.text?[{sourceId:`TEST-${c.id}`,sourceType:'PUBLISHED_CANONICAL_ARTICLE',publicationStatus:published?'PUBLISHED':'CANDIDATE',bookId:'BOOK-7',nodeCode:`KN-B7-14-${String(c.sections[0]||86).padStart(3,'0')}`,authorityOwner:'BOOK_VII_OBSERVATION_SCIENCE',text:c.text,epistemicEvidence:c.e,fragmentCode:`TEST-FRAGMENT-${c.id}`}]:[],unknowns:[],relationships:{},retrieval:{}};}
try {
 for(const c of cases) {
  const b=bundle(c);
  if(c.figure) Object.assign(b.sources[0],{sourceType:'REGISTERED_FIGURE_SEMANTICS',canonicalProseAuthority:false,ocrAuthority:false});
  const result=c.denial?await runAskPhiosPipeline({input:{question:c.question,locale:'zh-Hans'}}):composeKapAnswerProjection({bundle:b,coverageDecision:eligible,now:new Date('2026-10-06T00:00:00Z')});
  assert.equal(result.ai.providerInvoked,false);assert.equal(result.answer.generation.generativeModelUsed,false);
  if(c.denial){assert.equal(result.sources.length,0);assert.match(result.answer.content.directAnswer,/不能/);assert.equal(result.answer.epistemicReading,undefined);}
  if(c.id==='Q1')assert.equal(result.answer.epistemicReading.knowledgeState,'UNKNOWN');
  if(['Q2','BOUNDARY_B'].includes(c.id))assert.equal(result.answer.epistemicReading.knowledgeState,'PROJECTED');
  if(c.id==='Q3'){assert.equal(result.answer.epistemicReading.knowledgeState,'CONTESTED');assert.equal(result.answer.epistemicReading.primaryReading,'');assert.equal(result.answer.epistemicReading.alternativeReadings.length,2);}
  if(c.id==='Q4')assert.equal(result.answer.epistemicReading.observationTimeClass,'CURRENT');
  if(c.figure){assert.deepEqual(c.sections,[96]);assert.equal(result.sources[0].nodeCode,'KN-B7-14-096');assert.deepEqual(result.answer.knowledgeRefs.primaryNodeCodes,['KN-B7-14-096']);assert.match(result.answer.content.directAnswer,/已知.*重构.*投影.*争议.*未知/);assert.equal(result.answer.epistemicReading,undefined);}
  assert.doesNotMatch(JSON.stringify(result),/r2\.dev|signedUrl|phios-private-manuscripts|books\/book-7\/source/);
  if(c.e) assert.equal(composeKapAnswerProjection({bundle:bundle(c,{published:false}),coverageDecision:eligible}).answer.epistemicReading,undefined,'CANDIDATE_IS_NOT_PUBLISHED_AUTHORITY');
  evidence.push({id:c.id,question:c.question,sections:c.sections.map(n=>`14.${n}`),fixtureOnly:!c.denial,result});
 }
 const one={sufficient:true,observedRealized:true,evidenceRefs:['a'],readings:[{id:'a',text:'单一有支持的读取。',material:true,highQuality:true,evidenceRefs:['a']}]};
 assert.equal(epistemic.deriveKnowledgeState(one),'KNOWN');assert.equal(epistemic.deriveAlternativeReadings(one).length,0);assert.ok(epistemic.derivePrimaryReading(one));
 assert.equal(epistemic.deriveKnowledgeState({sufficient:true,pastInferred:true,evidenceRefs:['archive']}),'RECONSTRUCTED');
 assert.equal(epistemic.deriveKnowledgeState({sufficient:true,observedRealized:true}),'UNKNOWN');
 assert.equal(epistemic.deriveKnowledgeState({...one,future:true}),'PROJECTED');
 assert.equal(epistemic.deriveKnowledgeState({...one,claimType:'STRUCTURAL_RECONFIGURATION',authorityType:'MARKET_DATA'}),'UNKNOWN');
 assert.equal(epistemic.deriveObservationTimeClass({repeatedEvidence:true,distinctTimeWindows:2}),'LONGITUDINAL');
 assert.equal(epistemic.deriveObservationTimeClass({repeatedEvidence:true,distinctTimeWindows:2,structuralChangeEvidence:true,changedDimensions:['routing']}),'STRUCTURAL');
 assert.equal(epistemic.deriveObservationTimeClass({repeatedEvidence:true,distinctTimeWindows:3,persistentPriceMovement:true}),'LONGITUDINAL');
 assert.equal(epistemic.evaluateClaimAuthorityMatch({claimType:'STRUCTURAL_RECONFIGURATION',authorityType:'MARKET_DATA'}).matched,false);
 for(const [claimType,authorities] of Object.entries(epistemic.CLAIM_AUTHORITIES))assert.equal(epistemic.evaluateClaimAuthorityMatch({claimType,authorityType:authorities[0]}).matched,true);
 const unknown=evidence.find(e=>e.id==='Q1').result.answer.epistemicReading;
 const stop=epistemic.reconcileEpistemicGuidedStop({status:'ANSWER_SUFFICIENT',automaticEscalation:false},unknown);assert.equal(stop.status,'STOP_AT_UNKNOWN');assert.equal(stop.automaticEscalation,false);
 const reality={status:'REALITY_MODEL_REQUIRED',automaticEscalation:false,requiresExplicitEscalationConsent:true};assert.equal(epistemic.reconcileEpistemicGuidedStop(reality,unknown),reality);
 const contested=evidence.find(e=>e.id==='Q3').result.answer.epistemicReading;assert.equal(epistemic.reconcileEpistemicGuidedStop({status:'MORE_CONTEXT_NEEDED'},contested).status,'CONTESTED_READING');
 assert.equal(epistemic.reconcileEpistemicGuidedStop({},evidence.find(e=>e.id==='Q4').result.answer.epistemicReading).status,'TIME_WINDOW_INSUFFICIENT');
 const unknownCase=cases.find(c=>c.id==='Q1');
 const guided=composeGuidedReading({initialProjection:evidence.find(e=>e.id==='Q1').result,bundle:bundle(unknownCase),coverageDecision:eligible,context:{locale:'zh-Hans',candidateMechanisms:[],confirmedRelevantMechanisms:[],excludedMechanisms:[],unknownMechanisms:[],clarifyingAnswers:[],temporaryObservations:[],escalationSignals:{}},questions:[]});
 assert.equal(guided.stopCondition.status,'STOP_AT_UNKNOWN');assert.equal(guided.handoff.automaticRealityJourney,false);assert.equal(guided.handoff.realityJourneyEligible,false);
 for(const sourceType of ['COMPLETED_MANUSCRIPT','PUBLIC_PREVIEW_50P','PUBLICATION_FIGURE','OCR']){
  const unsafe=bundle(unknownCase);unsafe.sources=[{...unsafe.sources[0],sourceType,text:'PROTECTED_RAW_SENTINEL',objectKey:'private/SENTINEL.pdf'}];
  const result=composeKapAnswerProjection({bundle:unsafe,coverageDecision:eligible});assert.doesNotMatch(JSON.stringify(result),/PROTECTED_RAW_SENTINEL|private\/SENTINEL/);assert.equal(result.sources.length,0);assert.equal(result.coverage.answerCompositionEligible,false);assert.ok(result.answer.content.directAnswer.length>0);
 }
 const injected=bundle(unknownCase);injected.question.text=cases.find(c=>c.id==='Q7').question;injected.sources[0].text='PROTECTED_RAW_SENTINEL';injected.sources[0].sectionCode='private/SENTINEL.pdf';
 assert.doesNotMatch(JSON.stringify(composeKapAnswerProjection({bundle:injected,coverageDecision:eligible})),/PROTECTED_RAW_SENTINEL|private\/SENTINEL/);
 assert.equal(epistemic.deriveEpistemicReading(bundle(unknownCase),{answerCompositionEligible:false}),null);
 assert.equal(epistemic.deriveAlternativeReadings({...one,readings:[...one.readings,{text:'Unsupported alternative',material:true,highQuality:true,evidenceRefs:['missing']},{text:'Immaterial alternative',material:false,highQuality:true,evidenceRefs:['a']}]}).length,0);
 const counter=bundle(unknownCase);counter.sources[0].epistemicEvidence={...one,counterEvidence:[{text:'Fabricated counterevidence',evidenceRef:'missing'}]};assert.deepEqual(epistemic.deriveEpistemicReading(counter,eligible).counterEvidence,[]);
 const runtimeText=fs.readFileSync('functions/_lib/knowledge-epistemic-reading.js','utf8');assert.doesNotMatch(runtimeText,/\bfetch\s*\(|node:|openai|anthropic|https?:\/\//i);
 assert.match(fs.readFileSync('scripts/build-cloudflare-pages.mjs','utf8'),/file\.startsWith\('content\/knowledge\/book-vii\/'\)/);
 evidence.push({id:'GUIDED_UNKNOWN_ACTUAL',result:guided});
 evidence.push({id:'PRIMARY_SINGLE',reading:{primaryReading:epistemic.derivePrimaryReading(one),alternativeReadings:epistemic.deriveAlternativeReadings(one)},stop,claimAuthorityMatches:Object.keys(epistemic.CLAIM_AUTHORITIES).map(claimType=>epistemic.evaluateClaimAuthorityMatch({claimType,authorityType:epistemic.CLAIM_AUTHORITIES[claimType][0]}))});
} finally {globalThis.fetch=originalFetch;}
assert.equal(providerRequests,0);
const report={status:'READY_FOR_HUMAN_REVIEW',identity,nodeCount:nodes.length,metadataVerifiedCount:nodes.filter(n=>n.canonicalTitleVerified).length,figures,r2BindingStatus:r2.bindingStatus,r2Assets:r2.assets.map(a=>({assetId:a.assetId,bindingStatus:a.bindingStatus})),knowledgeStates:epistemic.KNOWLEDGE_STATES,observationTimeClasses:epistemic.OBSERVATION_TIME_CLASSES,successor,providerRequests,productionPublished:false,humanAccepted:false,evidence,limitations:['Published-knowledge bridge is a review candidate; live Book VII retrieval requires Human Review and authority admission.','Acceptance evidence uses explicitly labelled synthetic published-bundle fixtures, not fabricated production publication.','88 reader questions are PDF headings; 12 are explicitly derived metadata questions.']};
const publishedProbesPath=`${root}/evidence/published-command-probes-v1.json`;
report.r2ObjectVerification=verification;
if(fs.existsSync(publishedProbesPath)) report.publishedCommandProbes=read(publishedProbesPath);
const validationPath=`${root}/evidence/validation-summary-v1.json`;
if(fs.existsSync(validationPath)) report.validation=read(validationPath);
fs.writeFileSync(`${root}/production-admission/evidence/r1-current-runtime-regression-v1.json`,JSON.stringify(report,null,2)+'\n');
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const panels=[['01 Book VII identity',identity],['02 100-node census',{count:nodes.length,first:nodes[0],last:nodes.at(-1),metadataVerifiedCount:report.metadataVerifiedCount}],['03 FIG 14A–14I census',figures],['04 R2 lineage status',{assets:report.r2Assets,publicObjectVerification:report.r2ObjectVerification}],['05 Five knowledge states',states],['06 Claim authority matching',epistemic.CLAIM_AUTHORITIES],['07 Current / longitudinal / structural',read(`${kap}/contracts/kap-book-vii-observation-time-contract-v1.json`)],['08 Primary reading',evidence.find(e=>e.id==='PRIMARY_SINGLE')],['09 Alternative reading',evidence.find(e=>e.id==='Q3')],['10 Contested case',evidence.find(e=>e.id==='Q3')],['11 Unknown-stop case',evidence.filter(e=>['Q1','GUIDED_UNKNOWN_ACTUAL'].includes(e.id))],['12 Manuscript leakage denial',evidence.filter(e=>e.id==='Q7'||e.id==='MANUSCRIPT_ZH')],['13 Figure-boundary behavior',evidence.find(e=>e.id==='FIGURE')],['14 Book VI / VII / VIII boundary',evidence.filter(e=>e.id.startsWith('BOUNDARY'))],['15 Reality handoff remains non-automatic',read(`${kap}/contracts/kap-book-vii-guided-reading-reconciliation-v1.json`)],['16 Predecessor / successor SHA chain',successor],['17 Zero-cost proof',{providerRequests,networkCalls:0,productionPublished:false,humanAccepted:false}],['Published command probes — existing production corpus',report.publishedCommandProbes||'Not yet run']];
fs.writeFileSync('tools/review/KAP-BOOK-VII-PRODUCTION-ADMISSION-R1-REGRESSION-REVIEW.html',`<!doctype html><html lang="en"><meta charset="utf-8"><title>Book VII KAP R1 Human Review</title><style>body{font:16px system-ui;max-width:1100px;margin:40px auto;padding:20px;background:#101827;color:#e7edf8}h1,h2{color:#9ddcff}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#1a263a;padding:20px;border-radius:12px}aside{padding:20px;border:1px solid #f2c86e}a{color:#9ddcff}</style><h1>KAP Book VII Observation Science R1</h1><p>Decision: <strong>READY_FOR_HUMAN_REVIEW</strong></p><aside>${report.limitations.map(esc).join('<br>')}<br>Canonical title metadata verified: ${report.metadataVerifiedCount}/100. R2: ${esc(r2.bindingStatus)}. No Human ACCEPT or automatic promotion.</aside>${panels.map(([title,data])=>`<section><h2>${esc(title)}</h2><pre>${esc(JSON.stringify(data,null,2))}</pre></section>`).join('')}<section><h2>Final local validation</h2><pre>${esc(JSON.stringify(report.validation||{status:'PENDING_FINAL_CHECKS'},null,2))}</pre></section></html>`);
console.log('PASS KAP Book VII: 100 section identities, 9 figures, additive SHA lineage, protected manuscript denial, contested/unknown stops, zero provider requests. Human Review generated.');

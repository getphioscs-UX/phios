import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {parseHTML} from 'linkedom';
import {buildProfileCustomerVisualProjection} from '../functions/profile/profile-customer-visual-projection.js';
import {buildPersonalEvidenceDossierProjection} from '../functions/profile/personal-evidence-dossier-projection.js';
import {renderPersonalEvidenceDossier} from '../functions/canonical-presentation-runtime/personal-evidence-dossier-presentation.js';
const root='tools/review/personal-evidence-r1/',audit='content/profile/successors/personal-evidence-r1/w11r2/';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const write=(p,x)=>fs.writeFileSync(audit+p,JSON.stringify(x,null,2)+'\n');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const parity=[],duplicateAudit=[],traceEvidence=[];
for(let n=1;n<=13;n++){
 const id='CASE-'+String(n).padStart(2,'0'),view=read(root+id+'-source-view.json'),allowed=new Set([view.profileViewId,...view.signalCards.map(x=>x.signalRef),...(view.crossSource?.perspectives||[]).flatMap(x=>[x.id,...x.signalRefs,...x.realityCorrelationRefs]),...(view.relationshipProfile?.evidence||[]).map(x=>x.id)]),locales={};
 for(const locale of ['en','zh-Hans']){
  const reading=read(root+id+'-'+locale+'-narrative-trace.json'),source=fs.readFileSync(root+id+'-'+locale+'-dossier.html','utf8'),{document}=parseHTML(source),bodyPages=[...document.querySelectorAll('[data-body-page]')];
  assert.equal(document.querySelectorAll('[data-pe-static]').length,15);
  assert.ok(bodyPages.length>=10);
  const paragraphs=[...document.querySelectorAll('.pe-narrative')];
  assert.equal(paragraphs.length,reading.trace.length);
  assert.equal(new Set(paragraphs.map(x=>x.getAttribute('data-paragraph-id'))).size,paragraphs.length);
  const visible=document.body.textContent;
  assert.ok(!/\b(PRD|W11R2|IR|registry|fixture|renderer|pipeline|provider|FAR|RR|RMO|PVP)\b/i.test(visible),id+' internal customer token');
  assert.ok(!/\b[A-Z]+(?:_[A-Z0-9]+)+\b/.test(visible),id+' raw enum');
  for(const p of bodyPages){assert.equal(p.querySelectorAll('[data-body-visual]').length,1);assert.ok(p.querySelector('.pe-reading-content').textContent.trim().length>40);assert.ok(p.querySelector('.pe-narrative'),'Every body page includes source-bound interpretation');assert.ok(p.querySelector('.pub-header'));assert.ok(p.querySelector('.pub-footer'));assert.ok(!p.querySelector('.prf-pfig--empty'));}
  const refs=[...document.querySelectorAll('[data-evidence-record]')].map(x=>x.getAttribute('data-evidence-record'));
  assert.equal(refs.length,view.signalCards.length);assert.equal(new Set(refs).size,refs.length,'Score records appear once');
  for(const t of reading.trace){assert.ok(t.sourceIds.length);assert.ok(t.sourceIds.every(x=>allowed.has(x)),t.paragraphId);assert.ok(['SOURCE_SCOPE','DIMENSION_MEANING','TASK_SCOPE','CONTEXT_RELATION','ABSENCE_SCOPE','CONDITIONAL_CONTEXT','DECISION_SCOPE','RELATIONSHIP_SCOPE','WORK_SCOPE','WITHIN_INSTRUMENT_SCOPE','CROSS_SOURCE_SCOPE','FINANCIAL_SCOPE','FINANCIAL_ABSENCE','REALITY_RELATION','CROSS_SOURCE_RELATION'].includes(t.claimScope));}
  assert.equal(reading.financialAdmission,'CLOSED');
  const exact=[],near=[];
  const grams=t=>new Set(t.toLowerCase().replace(/[\s\p{P}]/gu,'').match(/.{1,5}/g)||[]);
  for(let a=0;a<reading.trace.length;a++)for(let b=a+1;b<reading.trace.length;b++){const x=reading.trace[a],y=reading.trace[b];if(x.text===y.text)exact.push([x.paragraphId,y.paragraphId]);const gx=grams(x.text),gy=grams(y.text),intersection=[...gx].filter(g=>gy.has(g)).length,similarity=intersection/(gx.size+gy.size-intersection);if(similarity>.6)near.push({paragraphs:[x.paragraphId,y.paragraphId],similarity});}
  assert.equal(exact.length,0,'No duplicated primary prose');
  const secondaryNotes=[...document.querySelectorAll('.pe-evidence-note p')].map(x=>x.textContent),sentences=secondaryNotes.flatMap(x=>x.split(/(?<=[.。])\s*/).filter(Boolean)),repeatedSecondary=[...new Set(sentences)].map(text=>({text,count:sentences.filter(x=>x===text).length})).filter(x=>x.count>1);
  duplicateAudit.push({id,locale,paragraphs:reading.trace.length,exact,near,scoreRecordCount:refs.length,scoreRecordsUnique:true,boundaryNotesSecondary:true,repeatedSecondaryMetadata:repeatedSecondary,secondaryRepeatReason:'Instrument-specific notes remain with each distinct source class; no repeated primary caveat or repeated score record'});
  traceEvidence.push({id,locale,trace:reading.trace,sourceSemanticDigest:reading.sourceSemanticDigest});
  locales[locale]=reading;
 }
 const a=locales.en,b=locales['zh-Hans'];
 assert.deepEqual(a.sourceStates,b.sourceStates);assert.deepEqual(a.trace.map(({text,...x})=>x),b.trace.map(({text,...x})=>x));assert.deepEqual(a.chapters.map(c=>[c.sectionId,c.job]),b.chapters.map(c=>[c.sectionId,c.job]));
 parity.push({id,sourceDatesStatusClaimScopeUnknownAndSectionsEqual:true,paragraphs:a.trace.length});
 const visual=buildProfileCustomerVisualProjection({progressiveView:view}),dossier=buildPersonalEvidenceDossierProjection({visualProjection:visual,profileView:view,participantRef:view.participantRef});
 const broken=structuredClone(dossier);broken.sections[0].body=null;assert.throws(()=>renderPersonalEvidenceDossier({dossier:broken,profileView:view,reviewPreview:true}),/BODY_VISUAL_RESOLUTION_REQUIRED/);
 assert.equal(visual.figures.find(x=>x.pfig==='PFIG-004').state,'UNKNOWN');
}
write('bilingual-parity.json',parity);write('duplicate-content-audit.json',duplicateAudit);write('narrative-traceability.json',traceEvidence);
const baseline=read(audit+'baseline-receipt.json'),mutable=new Set([...baseline.affectedPaths,'content/profile/successors/personal-evidence-r1/acceptance/prd-w11-human-review-receipt-v1.json']);
const frozen=baseline.frozenInputs.filter(x=>!mutable.has(x.path)).map(x=>({...x,currentSha256:hash(fs.readFileSync(x.path))}));
const drift=frozen.filter(x=>x.sha256!==x.currentSha256);write('frozen-files-unchanged.json',{baselineHead:baseline.head,files:frozen,drift});assert.deepEqual(drift,[],'Frozen inputs unchanged');
write('structural-machine-evidence.json',{work:'PRD-W11R2',caseCount:13,locales:2,customerDocuments:26,bodyBindings:true,scoreRecordsUnique:true,sourceAuthority:'PRESERVED',unknown:'PRESERVED',pfig004:'UNKNOWN',financial:'CLOSED',bilingual:'PASS',frozenFiles:frozen.length,narrativeDuplicateFlags:duplicateAudit.flatMap(x=>x.near).length,humanDecision:'PENDING',w12Allowed:false,renderedChecksRequired:true});
console.log('W11R2_SOURCE_AND_COMPOSITION = PASS; rendered browser/A4 observations remain required');

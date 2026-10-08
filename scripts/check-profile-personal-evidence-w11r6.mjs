import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {writeReviewFile} from './lib/w11r6-review-io.mjs';
import {parseHTML} from 'linkedom';
import {buildProfileCustomerVisualProjection} from '../functions/profile/profile-customer-visual-projection.js';
import {buildPersonalEvidencePublicationProjection} from '../functions/profile/personal-evidence-publication-projection.js';
import {buildPersonalEvidencePublicationIr} from '../functions/profile/personal-evidence-publication-ir-adapter.js';
import {renderPersonalEvidenceFigure} from '../assets/customer-ui/js/visuals/profile-visual-mvp.js';
const dir='content/profile/successors/personal-evidence-r1/w11r6/',root='tools/review/personal-evidence-r1/',read=p=>JSON.parse(fs.readFileSync(p)),hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const baseline=read(dir+'baseline.json'),mode=process.argv.find(a=>a.startsWith('--mode='))?.split('=')[1]||'all';
const grammars=['source-domain-topology','source-native-pattern','confirmation-slots','context-observation-lanes','separated-source-comparison','work-evidence-matrix','relationship-perspective-map','conceptual-decision-sequence','bounded-reality-prerequisites'];
const results=[],authority=[];
for(const before of baseline.cases){
 const id=before.id,source=fs.readFileSync(root+id+'-source-view.json'),view=JSON.parse(source),visual=buildProfileCustomerVisualProjection({progressiveView:view}),html=fs.readFileSync(root+id+'-bilingual-dossier.html','utf8'),doc=parseHTML(html).document;
 assert.equal(hash(source),before.sourceHash,id+' source');assert.equal(hash(fs.readFileSync(root+id+'-bilingual-trace.json')),before.traceHash,id+' protected prose');
 const original=parseHTML(fs.readFileSync(baseline.backup+root+id+'-bilingual-dossier.html','utf8')).document;
 const protectedSelectors=['.pe-paragraph-pair','.pe-reading-table','.pe-source-detail','.pe-evidence-note','.pe-cover-values'];
 for(const selector of protectedSelectors)assert.deepEqual([...doc.querySelectorAll(selector)].map(e=>e.outerHTML),[...original.querySelectorAll(selector)].map(e=>e.outerHTML),id+' protected DOM '+selector);
 assert.deepEqual([...doc.querySelectorAll('.pub-static')].map(e=>e.outerHTML),[...original.querySelectorAll('.pub-static')].map(e=>e.outerHTML),id+' opening/master artwork');
 assert.equal(doc.querySelectorAll('figure[data-pfig]').length,9);
 const projection=buildPersonalEvidencePublicationProjection({profileView:view,visualProjection:visual});
 const ir=await buildPersonalEvidencePublicationIr({profileView:view,report:{canonicalState:'APPROVED_UNRELEASED',customer:view.participantRef,reportVersion:'W11R6-LOCAL-REVIEW',locale:'en'},publicationProjection:projection});
 assert.equal(ir.visualBlocks.length,9);
 const pages=[...doc.querySelectorAll('.pub-page,.pub-static')];
 for(const [index,figure]of visual.figures.entries()){
  const old=before.figures[index],els=doc.querySelectorAll('[data-pfig="'+figure.pfig+'"]');assert.equal(els.length,1);const el=els[0];
  assert.equal(hash(JSON.stringify(figure)),old.payloadHash,'Authority payload must remain byte-equivalent');
  assert.equal(el.getAttribute('data-pfig-state'),figure.state);assert.equal(el.closest('[data-pe-section]').getAttribute('data-pe-section'),old.sectionId);
  assert.deepEqual(ir.visualBlocks.find(b=>b.figure.pfig===figure.pfig).figure,figure);
  assert.equal(el.querySelector('[data-diagram-grammar]')?.getAttribute('data-diagram-grammar'),grammars[index]);
  assert(el.querySelector('.pe-diagram-description'));assert(el.querySelector('.pe-diagram-alternative'));assert(el.querySelector('span[lang=en]'));
  assert(!/W11R6|visualBlocks|authoring.pack|renderer|UNKNOWN_[A-Z]|CONFIRMATION_OR_TENSION/.test(el.textContent));
  if(figure.state!=='READY')assert(el.textContent.includes('未知 / Unknown')||el.textContent.includes('当前无资料 / Empty'));
  const ids=[...el.querySelectorAll('[data-node-id]')].map(n=>n.getAttribute('data-node-id'));
  if(figure.pfig==='PFIG-003')assert.deepEqual([...el.querySelectorAll('[data-confirmation-slot]')].map(n=>n.getAttribute('data-confirmation-slot')),['help','cost','both']);
  if(figure.pfig==='PFIG-004')assert.equal(el.querySelectorAll('[data-context-slot]').length,3);
  if(figure.pfig==='PFIG-005')assert.equal(el.querySelectorAll('[data-comparison-state]').length,4);
  if(figure.pfig==='PFIG-006')assert.equal(el.querySelectorAll('[data-work-lens]').length,6);
  if(figure.pfig==='PFIG-007'){assert.deepEqual(ids,['self','other','interaction','context']);assert.equal(el.querySelector('[data-node-id=other]').getAttribute('data-node-state'),'missing');}
  if(figure.pfig==='PFIG-008'){assert.deepEqual(ids,['notice','understand','weigh','choose','adapt']);assert.equal(el.querySelectorAll('[data-edge-state=conceptual]').length,4);assert.equal(el.querySelector('[data-node-id=choose]').getAttribute('data-node-state'),'missing');assert(el.textContent.includes('not an observed personal decision history'));}
  if(figure.pfig==='PFIG-009'){assert.deepEqual(ids,['evidence','context','difference','question','relation']);assert.equal(el.querySelector('[data-node-id=relation]').getAttribute('data-node-state'),'missing');}
  if(id==='CASE-01'&&['PFIG-003','PFIG-004','PFIG-005','PFIG-009'].includes(figure.pfig))assert.equal(el.querySelectorAll('[data-edge-state=recorded]').length,0);
  if(id==='CASE-01')authority.push({...old,status:figure.state,evidenceCoverage:{sourceCount:new Set(view.signalCards.map(c=>c.sourceClass)).size,recordedRefs:figure.evidenceRefs.length},visualGrammar:grammars[index],authoritativePayloadOwner:'functions/profile/profile-customer-visual-projection.js',rendererPath:'assets/customer-ui/js/visuals/profile-visual-mvp.js',publicationIrLocation:'functions/profile/personal-evidence-publication-ir-adapter.js:visualBlocks',cprRenderLocation:'functions/canonical-presentation-runtime/personal-evidence-dossier-presentation.js',reviewPage:pages.findIndex(p=>p.contains(el))+1,bilingualLabels:true,unknownReason:old.unknownReason,screenshotEvidence:{before:'before/'+id+'-'+figure.pfig+'.png',after:'after/'+id+'-'+figure.pfig+'.png',context:'after/'+id+'-'+figure.pfig+'-page.png'},renderCount:1,DATA_READY:figure.state==='READY',VISUAL_RENDERED:true,INTERPRETATION_READY:false,HUMAN_APPROVED:false});
 }
 if(id==='CASE-01'){assert.equal(doc.querySelectorAll('[data-native-value="75"]').length,6);assert.equal(doc.querySelector('[data-native-values]').getAttribute('data-native-values'),'75,75,75,75,75,75');assert.equal(doc.querySelectorAll('.pe-source-topology').length,1);assert.equal(doc.querySelectorAll('[data-axis-ref]').length,6);}
 if(id==='CASE-08'){const radar=doc.querySelector('[data-pfig=PFIG-002]');assert.equal(radar.querySelectorAll('svg').length,1);assert(radar.querySelector('[data-source-series=IPIP_BIG_FIVE]'));assert(radar.textContent.includes('Independent native scale'));}
 if(id==='CASE-09'){assert.equal(visual.figures[3].state,'UNKNOWN');assert.equal(visual.figures[4].state,'READY');assert.equal(visual.figures[8].state,'READY');}
 results.push({id,status:'PASS',pages:pages.length,htmlSha256:hash(html),nineDistinctGrammars:true,sourcePreserved:true,protectedBodyPreserved:true,renderCount:9,duplicates:0});
}
const hub=fs.readFileSync('tools/review/PROFILE-PERSONAL-EVIDENCE-R1-HUMAN-REVIEW.html','utf8'),assets=JSON.parse(hub.match(/embeddedAssets=(.*?);\s*const displayAssets/s)[1]);
for(const p of baseline.protectedAssets)assert.equal(hash(Buffer.from(assets[p.url].split(',')[1],'base64')),p.sha256,p.url);
const connected=read(root+'CASE-09-source-view.json'),synthetic=buildProfileCustomerVisualProjection({progressiveView:connected,confirmations:[{id:'W11R6-SYNTHETIC-ONLY',signalRef:connected.signalCards[0].signalRef,contextType:'WORK',confirmation:'HELPS_ME',label:'Synthetic review-fixture observation'}]});
for(const id of ['PFIG-004','PFIG-005','PFIG-009'])assert.equal(synthetic.figures.find(f=>f.pfig===id).state,'READY');
const syntheticHtml='<html><head><meta charset="utf-8"></head><body><h1>SYNTHETIC FIXTURE ONLY / 仅合成测试资料</h1><p>Not customer evidence; never imported into CASE-01 / 不属于客户证据；不导入 CASE-01</p>'+synthetic.figures.filter(f=>['PFIG-004','PFIG-005','PFIG-009'].includes(f.pfig)).map(f=>renderPersonalEvidenceFigure(f,{locale:'bilingual',publicationSources:connected.signalCards})).join('')+'</body></html>';
writeReviewFile(dir+'synthetic-explicit-observation.html',syntheticHtml);
writeReviewFile(dir+'PRD-W11R6-FIGURE-AUTHORITY-MAP.json',JSON.stringify({timestamp:new Date().toISOString(),caseId:'CASE-01',canonicalNamesRetained:true,reviewLabelReconciliation:{'Evidence structure / Personality pattern':'PFIG-002','Decision':'PFIG-008','Relationship':'PFIG-007','Context':'PFIG-004','Cross-source':'PFIG-005'},figures:authority},null,2));
writeReviewFile(dir+'machine-results.json',JSON.stringify({timestamp:new Date().toISOString(),mode,status:'PASS',results,synthetic:{scope:'TEST_FIXTURE_ONLY',readyIds:['PFIG-004','PFIG-005','PFIG-009'],customerSourceMutated:false}},null,2));
writeReviewFile(dir+'PRD-W11R6-PROTECTED-ASSET-DIFF.json',JSON.stringify({timestamp:new Date().toISOString(),status:'PASS',artwork:baseline.protectedAssets.map(a=>({...a,changed:false})),protectedBodyDom:'EXACT',sourceViewHashes:'EXACT',traceHashes:'EXACT',baseline40PagePdf:'UNAVAILABLE_NO_PIXEL_EQUIVALENCE_CLAIM'},null,2));
console.log('W11R6 '+mode+' PASS: 11 cases, nine semantic grammars, exact provenance and protected DOM; synthetic fixture remains separate.');

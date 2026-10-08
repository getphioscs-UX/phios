import {grammarOnlySnapshot,repairPersonalEvidenceEnglish} from '../assets/customer-ui/js/visuals/personal-evidence-grammar.js';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {parseHTML} from 'linkedom';
import {buildProfileCustomerVisualProjection} from '../functions/profile/profile-customer-visual-projection.js';
import {buildPersonalEvidencePublicationProjection} from '../functions/profile/personal-evidence-publication-projection.js';
import {buildPersonalEvidencePublicationIr} from '../functions/profile/personal-evidence-publication-ir-adapter.js';
import {PERSONAL_EVIDENCE_PFIG_PRIMARY_SECTION as primary} from '../functions/profile/personal-evidence-dossier-projection.js';
import {renderPersonalEvidenceFigure} from '../assets/customer-ui/js/visuals/profile-visual-mvp.js';
const root='tools/review/personal-evidence-r1/',audit=process.env.W11R6_REPAIR_AUDIT||'content/profile/successors/personal-evidence-r1/'+(process.env.W11R6_AUDIT_REDIRECT==='true'?'w11r6/legacy-w11r5/':process.argv.includes('--w11r6')?'w11r6/':'w11r5/');
fs.mkdirSync(audit,{recursive:true});
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const baseline=read('content/profile/successors/personal-evidence-r1/'+(process.env.W11R6_AUDIT_REDIRECT==='true'||process.argv.includes('--w11r6')?'w11r6/':'w11r5/')+'baseline.json'),only=process.argv.find(x=>x.startsWith('--case='))?.split('=')[1],results=[];
for(const before of baseline.cases.filter(c=>!only||c.id===only)){
 const id=before.id,source=fs.readFileSync(root+id+'-source-view.json'),view=JSON.parse(source),visual=buildProfileCustomerVisualProjection({progressiveView:view}),html=fs.readFileSync(root+id+'-bilingual-dossier.html','utf8'),doc=parseHTML(html).document;
 assert.equal(hash(source),before.sourceHash,id+' source drift');if(process.env.W11R6_REPAIR_AUDIT){assert.deepEqual(read(root+id+'-bilingual-trace.json'),grammarOnlySnapshot(read(baseline.backup+root+id+'-bilingual-trace.json')),id+' grammar-only trace');}else assert.equal(hash(fs.readFileSync(root+id+'-bilingual-trace.json')),before.traceHash,id+' protected prose');
 assert.equal(doc.querySelectorAll('figure[data-pfig]').length,9);
 for(const f of visual.figures){const els=doc.querySelectorAll('[data-pfig="'+f.pfig+'"]');assert.equal(els.length,1,id+' '+f.pfig);assert.equal(els[0].closest('[data-pe-section]').getAttribute('data-pe-section'),primary[f.pfig]);assert.equal(els[0].getAttribute('data-pfig-state'),f.state);assert(els[0].querySelector('figcaption'));}
 assert.equal(doc.querySelectorAll('.pub-static').length,15);assert.equal(doc.querySelectorAll('.pe-evidence-note').length,10);
 const trace=read(root+id+'-bilingual-trace.json');for(const t of trace.trace){const el=doc.querySelector('[data-paragraph-pair-id="'+t.paragraphPairId+'"]');assert.equal(el.querySelector('[lang="zh-Hans"]').textContent,t.zh.text);assert.equal(el.querySelector('[lang="en"]').textContent,t.en.text);}
 const projection=buildPersonalEvidencePublicationProjection({profileView:view,visualProjection:visual});assert.equal(projection.publicationLocaleMode,'BILINGUAL');assert.equal(projection.rrEligibility.rrHandoffBlock,'EXPLICIT_CONSENT_REQUIRED');
 const ir=await buildPersonalEvidencePublicationIr({profileView:view,report:{canonicalState:'APPROVED_UNRELEASED',customer:view.participantRef,reportVersion:'SYNTHETIC-REVIEW',locale:'en'},publicationProjection:projection});assert.equal(ir.visualBlocks.length,9);
 for(const b of ir.visualBlocks){assert.equal(b.sectionId,primary[b.figure.pfig]);assert.deepEqual(b.figure,visual.figures.find(f=>f.pfig===b.figure.pfig));}
 if(id==='CASE-01'){const p=doc.querySelector('[data-native-values]');assert(p);assert.equal(p.getAttribute('data-native-values'),'75,75,75,75,75,75');const radii=p.getAttribute('points').split(' ').map(x=>{const [a,b]=x.split(',').map(Number);return Math.hypot(a-160,b-150)});assert(radii.every(r=>Math.abs(r-75)<1e-8));}
 if(id==='CASE-08'){const f=doc.querySelector('[data-pfig="PFIG-002"]');assert(f.querySelector('[data-source-series="IPIP_BIG_FIVE"]'));assert(f.querySelector('[data-native-values]'));assert.equal(f.querySelectorAll('svg').length,1,'No cross-instrument master polygon');}
 if(id==='CASE-09'){assert(doc.querySelector('[data-pfig="PFIG-005"]').getAttribute('data-pfig-state')==='READY');assert(trace.chapters[8].tables[0].rows.some(r=>r.stateEn==='Contradicted'));}
 if(id==='CASE-04')assert(doc.querySelector('[data-pfig="PFIG-006"]').textContent.includes('Career interest is not an ability or job-fit verdict'));
 if(id==='CASE-11')assert(doc.querySelector('[data-pfig="PFIG-007"]').textContent.includes('Other-person view'));
 results.push({id,pages:doc.querySelectorAll('.pub-page,.pub-static').length,pfigs:visual.figures.map(f=>({id:f.pfig,state:f.state,fullRenderCount:1})),semanticDrift:false,duplicates:0,pass:true});
}
for(const state of ['READY','EMPTY','UNKNOWN'])assert(renderPersonalEvidenceFigure({pfig:'PFIG-003',state,data:{resources:[],costs:[]},customerLabel:{en:'Resources','zh-Hans':'资源'}},{locale:'bilingual'}).includes('data-pfig-state="'+state+'"'));
// Explicit contextual input is needed; a linked summary alone never promotes
// the existing CASE-09 UNKNOWN context state into an observed finding.
const connected=read(root+'CASE-09-source-view.json');
const withObservation=buildProfileCustomerVisualProjection({progressiveView:connected,confirmations:[{id:'SYNTHETIC-CONTEXT-ONLY',signalRef:connected.signalCards[0].signalRef,contextType:'WORK',confirmation:'HELPS_ME',label:'Explicit review-fixture observation'}]});
for(const id of ['PFIG-004','PFIG-005','PFIG-009'])assert.equal(withObservation.figures.find(f=>f.pfig===id).state,'READY');
if(!only){const m=read(root+'portable-evidence-manifest.json');assert.equal(m.customerReportCount,11);assert.equal(m.languageSelector,false);assert(!m.documents.some(x=>/-(en|zh-Hans)-dossier/.test(x)));}
fs.writeFileSync(audit+(only?'case-01-gate.json':'machine-results.json'),JSON.stringify({work:'PRD-W11R5',results,printAndMobile:'SEPARATE_BROWSER_GATE_REQUIRED',w12:'BLOCKED'},null,2));
console.log('PRD-W11R5 publication, binding, state, duplicate, radar, semantic preservation PASS: '+results.length+' cases');

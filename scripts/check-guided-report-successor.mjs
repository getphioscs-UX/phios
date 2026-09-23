import assert from 'node:assert/strict';
import fs from 'node:fs';
import {REPORT_COMMERCE_CONTRACT,eligibleReportIds,quoteReportPresentation,normalizeReportPresentation,requirePurchasedReportPresentation} from '../functions/pws/commercial/report-successor-contract.js';
import {summarizeGuidedReality,confirmGuidedReality,guidedRealityQuestions,methodRealityProbes} from '../functions/current-reality/personal-current-reality-runtime.js';
import {routeGuidedAsk} from '../functions/contextual-ask/contextual-ask-runtime.js';
import {REPORT_EDITORIAL_ASSETS} from '../functions/canonical-presentation-runtime/report-editorial-registry.js';
import {resolveReportEditorialAsset} from '../functions/canonical-presentation-runtime/report-editorial-resolver.js';
import {REPORT_REFERENCE_BLUEPRINTS} from '../functions/canonical-presentation-runtime/report-blueprint-reference.js';
import {REPORT_VISUAL_MASTERS,REPORT_CARD_FAMILIES,baziVisualMaster} from '../functions/canonical-presentation-runtime/report-visual-master-contract.js';
import {presentVisualReport} from '../functions/canonical-presentation-runtime/visual-report-page-runtime.js';
import {renderVisualReportPages} from '../assets/customer-ui/js/personal-products/visual-report-pages.js';
const baseline=JSON.parse(fs.readFileSync('docs/guided-report-successor-r1/baseline.json'));
assert.equal(Object.keys(baseline.owners).length,7);for(const owner of Object.values(baseline.owners))assert(fs.existsSync(owner.path));
let prices=0;
for(const p of REPORT_COMMERCE_CONTRACT.products)for(const reportLocale of ['en','zh-Hans','bilingual']){
 const input={reportLocale,reportLanguageMode:reportLocale==='bilingual'?'BILINGUAL':'SINGLE'};
 const selected=p.kind==='BUNDLE'?eligibleReportIds(p.productId).slice(0,p.selection.min):[];
 const quote=quoteReportPresentation(p.productId,input,selected);
 assert.equal(quote.amountMinor,p.amountMinor+(reportLocale==='bilingual'?({BUNDLE_2:1000,BUNDLE_3:1000,BUNDLE_5PLUS:2000}[p.productId]??1000):0));
 const e={entitlement_status:'active',purchase_id:'verified-fixture',reportPresentation:quote};
 assert.deepEqual(requirePurchasedReportPresentation(e,input),input);
 assert.throws(()=>requirePurchasedReportPresentation(e,{reportLanguageMode:'SINGLE',reportLocale:reportLocale==='en'?'zh-Hans':'en'}));prices++;
}
for(const x of [{},{reportLanguageMode:'SINGLE',reportLocale:'bilingual'},{reportLanguageMode:'BILINGUAL',reportLocale:'en'},{reportLanguageMode:'SINGLE',reportLocale:'fr'}])assert.throws(()=>normalizeReportPresentation(x));
for(const [mode,n] of [['QUICK',3],['GUIDED',6],['DEEP',8],['DISCOVERY',2]])assert.equal(guidedRealityQuestions(mode).length,n);
const draft={mode:'QUICK',answers:{happening:'A recent change at work.'},locale:'en'};
const summary=summarizeGuidedReality(draft);assert.equal(summary.evidencePromoted,false);
assert.throws(()=>confirmGuidedReality(draft));
const confirmed=confirmGuidedReality({...draft,confirmation:'ACCURATE',confirmedSummary:JSON.stringify(summary.items)});assert.equal(confirmed.observations[0].text,draft.answers.happening);
assert.throws(()=>confirmGuidedReality({...draft,answers:{happening:'Changed after confirmation'},confirmation:'ACCURATE',confirmedSummary:JSON.stringify(summary.items)}));
for(const method of ['BZR','AST','ZWR','NUM','PROFILE','ECR','HD','CROSS'])assert(methodRealityProbes(method).length>=2&&methodRealityProbes(method).length<=4);
const registry=JSON.parse(fs.readFileSync('content/customer-experience-rebuild/registries/cx-r12r4-method-availability-registry-v1.json'));
assert.equal(routeGuidedAsk({question:'What is a four-pillar chart?'}).mode,'DIRECT_ANSWER');
assert.equal(routeGuidedAsk({question:'I feel stuck'}).mode,'CLARIFY');
assert.equal(routeGuidedAsk({confirmedReality:confirmed}).mode,'REALITY_BASED_RESPONSE');
assert.equal(routeGuidedAsk({selectedMethod:registry.methods[0].methodId,registry}).mode,'USER_SELECTED_METHOD');
assert(routeGuidedAsk({methodGuidanceRequested:true,registry}).alternatives.length<=2);
assert.equal(REPORT_EDITORIAL_ASSETS.length,120);assert.equal(new Set(REPORT_EDITORIAL_ASSETS.map(a=>a.object_key)).size,120);
for(const a of REPORT_EDITORIAL_ASSETS){
 const args={registry:{bucket:'phios-public-assets',assets:REPORT_EDITORIAL_ASSETS},methodId:a.methodId,page:a.page,locale:a.locale,publicBaseUrl:'https://assets.example.test'};
 if(a.active){const result=resolveReportEditorialAsset(args);assert(result.renderable);assert(result.src.endsWith(a.object_key));assert(a.width>0&&a.height>0);}
 else assert.throws(()=>resolveReportEditorialAsset(args),{code:'STATIC_EDITORIAL_ASSET_MISSING'});
 // Explicitly deactivated and wrong-language objects must still fail closed.
 assert.throws(()=>resolveReportEditorialAsset({...args,registry:{...args.registry,assets:[{...a,active:false}]}}),{code:'STATIC_EDITORIAL_ASSET_MISSING'});
 assert.throws(()=>resolveReportEditorialAsset({...args,locale:'fr'}),{code:'STATIC_EDITORIAL_ASSET_MISSING'});
}
assert.equal(REPORT_CARD_FAMILIES.length,6);
const visualSource=fs.readFileSync('docs/guided-report-successor-r1/reference-visual-attachment.md','utf8').split(/\r?\n/);
const visualIndex=JSON.parse(fs.readFileSync('docs/guided-report-successor-r1/visual-requirement-index.json'));
let fenced=false;const expectedSections=[];
for(let i=0;i<visualSource.length;i++){
 if(/^```/.test(visualSource[i]))fenced=!fenced;
 if(!fenced&&/^#{1,3} /.test(visualSource[i]))expectedSections.push([i+1,visualSource[i].replace(/^#+ /,'')]);
}
assert.deepEqual(visualIndex.sections.map(s=>[s.line,s.heading]),expectedSections,'Visual attachment sections must not disappear from the checklist');
const exactBazi=['M01','M02','M02','M02','M02','M03','M04','M04','M05','M05','M05','M04','M04','M04','M04','M06','M06','M06','M06','M07','M07','M07','M08','M08','M08','M08'];
assert.deepEqual(REPORT_REFERENCE_BLUEPRINTS.find(p=>p.methodId==='BZR').pages.map(p=>p.master),exactBazi);
assert.deepEqual(exactBazi.map((_,i)=>baziVisualMaster(i+1)),exactBazi);
for(const plan of REPORT_REFERENCE_BLUEPRINTS){
 assert.equal(plan.pages.length,({BZR:26,AST:26,ZWR:26,NUM:24,PROFILE:26,ECR:26,HD:32,CROSS:34})[plan.methodId]);
 assert.equal(new Set(plan.pages.map(p=>p.pageNumber)).size,plan.pages.length);
 for(const page of plan.pages)assert(REPORT_VISUAL_MASTERS[page.master]);
}
const source=JSON.parse(fs.readFileSync('docs/visual-report-r1/cases/BZR-01-en.json')).paid;
const project=report=>presentVisualReport({report,presentation:{reportLanguageMode:'SINGLE',reportLocale:'en'},access:'FREE',editorialRegistry:{bucket:'phios-public-assets',assets:REPORT_EDITORIAL_ASSETS},publicBaseUrl:'https://assets.example.test',reviewMode:true});
const free=project(source),locked=free.pages.find(p=>p.accessState==='PAID_LOCKED');assert(locked);
assert(!('sourcePage' in locked));assert(!('translations' in locked));
assert.deepEqual(Object.keys(locked.preview).sort(),['insightCount','visualType']);
const markup=renderVisualReportPages(free);assert(!markup.includes('src="undefined"'));assert.equal(free.pages.slice(0,5).filter(p=>p.accessState==='OPEN').length,5);assert(markup.includes('<img src="https://assets.example.test/images/reports/bazi/'));assert.match(markup,/data-preview-family=/);assert.match(markup,/Visual layout preview/);
const missing=structuredClone(source);for(const p of missing.pages)p.accessState='DATA_REQUIRED';
assert(!renderVisualReportPages(project(missing)).includes('vrpt-unlock'));
assert(!project(missing).pages.some(p=>p.accessState==='PAID_LOCKED'));
console.log(`Guided report successor contracts PASS: ${prices} prices; confirmation, language locks, routing, probes and 120 fail-closed assets. Human parity and actual asset availability are separate.`);

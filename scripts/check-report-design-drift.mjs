import assert from 'node:assert/strict';
import fs from 'node:fs';
import {reportDesignErrors,reportCssErrors} from './lib/report-design-drift.mjs';
import {baziVisualMaster,REPORT_CARD_FAMILIES} from '../functions/canonical-presentation-runtime/report-visual-master-contract.js';
const registry=JSON.parse(fs.readFileSync('content/registry/report-visual-reference-freeze-r1.json'));
assert.equal(registry.tokenOwner,'assets/css/tokens.css');
assert.equal(registry.productionAccepted,false);
assert.equal(registry.nextBatch,'STOP_BEFORE_BATCH_1');
assert.equal(registry.masters.length,6);
assert.deepEqual(registry.panel.cardFamilies,REPORT_CARD_FAMILIES);
assert.deepEqual(registry.pageMap.map(p=>p.master),Array.from({length:26},(_,i)=>baziVisualMaster(i+1)));
const css=fs.readFileSync(registry.tokenOwner,'utf8');
for(const [name,value] of Object.entries(registry.tokenValues)){
 assert(css.includes(`${name}: ${value};`),`Token drift: ${name}`);
 assert.equal(css.split(`${name}:`).length-1,1,`Multiple token owners: ${name}`);
}
for(const ref of registry.sources.dynamic){assert(fs.existsSync(ref.path));assert.equal(ref.shipAsCustomerPage,false);assert.equal(ref.sampleDataAuthority,false);}
for(const path of Object.values(registry.existingOwners))assert(fs.existsSync(path));
for(const master of registry.masters)assert.equal(master.implementedInBatch0,false);
// Synthetic guard inputs test rejection only; never report-production defaults.
const page={visualTemplateId:'M05',pageNumber:9,reportIdentity:'GUARD_TEST_ONLY',accessState:'OPEN',title:'Distribution',question:'What is distributed?',visual:{type:'DONUT',nodes:[{value:1}],dataRefs:['governed:test:distribution']},insights:[{sourceRef:'governed:test:claim'}],visualDesign:{referenceDataCopied:false,cardTypes:['PRIMARY_INSIGHT'],iconFamily:registry.iconFamily.id,iconIds:['elements'],tokenRefs:['--phi-report-navy'],classNames:['vrpt-page'],headerContract:'REPORT_SHARED_HEADER_R1',footerContract:'REPORT_SHARED_FOOTER_R1',measuredLayout:{source:'BROWSER_GEOMETRY',primaryVisualShare:.65,proseShare:.2}}};
assert.deepEqual(reportDesignErrors(page,registry),[]);
const failures=[
 ['UNKNOWN_TEMPLATE',p=>p.visualTemplateId='M99'],['UNKNOWN_CARD_FAMILY',p=>p.visualDesign.cardTypes=['UNAPPROVED']],
 ['UNKNOWN_ICON_FAMILY',p=>p.visualDesign.iconFamily='emoji'],['UNKNOWN_TOKEN',p=>p.visualDesign.tokenRefs=['--random-red']],
 ['UNKNOWN_STYLE_CLASS',p=>p.visualDesign.classNames=['font-99']],['INLINE_STYLE_DRIFT',p=>p.visualDesign.inlineStyle='color:red'],
 ['PRIMARY_VISUAL_REQUIRED',p=>p.visual=null],['TOO_MANY_INSIGHTS',p=>p.insights=Array(4).fill({sourceRef:'test'})],
 ['PAGE_STATUS_REQUIRED',p=>delete p.accessState],['PAGE_NUMBER_REQUIRED',p=>delete p.pageNumber],['REPORT_IDENTITY_REQUIRED',p=>delete p.reportIdentity],
 ['REFERENCE_DATA_NOT_EXCLUDED',p=>p.visualDesign.referenceDataCopied=true],['GOVERNED_VISUAL_SOURCE_REQUIRED',p=>p.visual.dataRefs=['assets/images/report/M03 Snapshot.webp']],
 ['PRIMARY_VISUAL_TOO_SMALL',p=>p.visualDesign.measuredLayout.primaryVisualShare=.2],['PROSE_DOMINANCE',p=>p.visualDesign.measuredLayout.proseShare=.8],
 ['PAGE_CHROME_DRIFT',p=>p.visualDesign.footerContract='new-footer'],['PAGE_MASTER_MISMATCH',p=>p.pageNumber=7]
];
for(const [error,mutate] of failures){const p=structuredClone(page);mutate(p);assert(reportDesignErrors(p,registry).includes(error),error);}
assert.deepEqual(reportCssErrors('.vrpt-page{color:var(--phi-report-navy);border:var(--phi-report-border)}',registry),[]);
for(const style of ['color:red','border-radius:99px','font-size:99px','box-shadow:0 0 10px #ff0000','background:#000'])assert(reportCssErrors(`.vrpt-page{${style}}`,registry).length>0);
const input=process.argv.indexOf('--page-ir');
if(input>=0){
 const report=JSON.parse(fs.readFileSync(process.argv[input+1]));
 assert.equal(report.schemaVersion,'PHI-OS-PERSONAL-READING-VISUAL-PAGES-v1.0.0');
 for(const p of report.pages.filter(p=>p.kind!=='STATIC_EDITORIAL'))assert.deepEqual(reportDesignErrors(p,registry),[],`Design drift: ${p.pageId}`);
}
const cssInput=process.argv.indexOf('--css');
if(cssInput>=0)assert.deepEqual(reportCssErrors(fs.readFileSync(process.argv[cssInput+1],'utf8'),registry),[],'Unregistered candidate CSS');
console.log(`Report design drift guard PASS: 6 references, ${Object.keys(registry.tokenValues).length} canonical tokens, 26 mappings, ${failures.length} negative IR cases + 5 CSS rejection cases. No dynamic pages accepted by this registration check.`);

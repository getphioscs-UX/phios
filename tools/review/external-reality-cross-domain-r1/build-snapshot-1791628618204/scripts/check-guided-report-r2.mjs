import assert from 'node:assert/strict';
import fs from 'node:fs';
import {resolveReportObservationTime} from '../functions/method-production-activation/report-observation-time.js';
import {REPORT_PAGE_REGISTRY,METHOD_VISUAL_SKINS,globalReportPagination} from '../functions/canonical-presentation-runtime/report-publication-contract.js';
import {composePublicationNarrative,humanizePublicationStatement} from '../functions/personal-reading/narrative/narrative-writer.js';
import {generatePublicationSnapshot} from '../functions/personal-reading/narrative/narrative-generation-service.js';
import {createNarrativeGenerationCache} from '../functions/personal-reading/narrative/narrative-generation-cache.js';
import {renderVisualReportPages} from '../assets/customer-ui/js/personal-products/visual-report-pages.js';
import {buildBaziPublicationReading} from '../functions/personal-professional-reading/bazi-method-native-reading-adapter.js';
const root='docs/guided-report-successor-r2';
const read=p=>JSON.parse(fs.readFileSync(`${root}/${p}.json`));
const base={generatedAt:'2026-09-21T00:30:00Z',customerTimezone:'America/Los_Angeles'};
assert.equal(resolveReportObservationTime(base).localDate,'2026-09-20');
assert.equal(resolveReportObservationTime({...base,customerTimezone:'Asia/Kuala_Lumpur'}).localTime,'08:30:00');
assert.throws(()=>resolveReportObservationTime({...base,customerTimezone:null}));
assert.throws(()=>resolveReportObservationTime({...base,mode:'NONE'}));
const custom=(date,time,extra={})=>({...base,mode:'CUSTOM',requestedTarget:{localDate:date,localTime:time,timezone:'America/New_York',...extra}});
assert.throws(()=>resolveReportObservationTime(custom('2026-03-08','02:30')),/NONEXISTENT/);
assert.throws(()=>resolveReportObservationTime(custom('2026-11-01','01:30')),/AMBIGUOUS/);
assert.equal(resolveReportObservationTime(custom('2026-11-01','01:30',{utcOffset:'-05:00'})).instant,'2026-11-01T06:30:00.000Z');
assert.throws(()=>resolveReportObservationTime(custom('2026-02-31','10:00')));
const engine=read('bazi-execution');
const timed=await buildBaziPublicationReading({canonicalProjection:engine.result.canonicalProjection,canonicalInput:engine.input,baseExecution:engine.result.execution,locale:'en',observationTime:{mode:'CUSTOM',generatedAt:'2026-09-21T00:30:00Z',customerTimezone:'Asia/Kuala_Lumpur',requestedTarget:{localDate:'2024-04-01',localTime:'12:00',timezone:'Asia/Kuala_Lumpur'}}});
assert.equal(timed.reading.professionalModules.professionalTimeline.currentWindow.annual.year,2024);
assert.equal(timed.temporalSnapshot.mode,'CUSTOM');assert.equal(timed.temporalSnapshot.localDate,'2024-04-01');
assert.equal(timed.reading.evidence.sourceNatalProjectionId,engine.result.canonicalProjection.projectionId);
await assert.rejects(()=>buildBaziPublicationReading({temporalProjectionOverride:{}}),/OVERRIDE_FORBIDDEN/);
assert.equal(REPORT_PAGE_REGISTRY.length,8);assert.equal(Object.keys(METHOD_VISUAL_SKINS).length,8);
assert.equal(globalReportPagination(1,26),'');assert.equal(globalReportPagination(7,26),'07 / 26');assert.throws(()=>globalReportPagination(27,26));
assert(new Set(REPORT_PAGE_REGISTRY.map(p=>p.totalPages)).size>1);
const reports=['zh-Hans','en'].map(l=>read('bazi-'+l));
for(const report of reports){
 assert.equal(report.customerPublishable,false);assert.equal(report.successorBaselineActivated,false);assert.equal(report.pages.length,20);
 assert.equal(report.intro[0].src,reports[0].intro[0].src);assert(report.intro[0].src.includes('/bilingual/'));
 assert.equal(report.intro[5].html.match(/data-pagination-owner=/g).length,1);
 assert(!/<span data-part="page-index">/.test(report.intro[5].html));
 const html=renderVisualReportPages(report);
 assert(!/CMP-|BAZI_FULL_REPORT:|PPR-C1-|[a-f0-9]{32,}/.test(html.replace(/src="[^"]*"/g,'')));
 assert.equal((html.match(/data-pagination-owner=/g)||[]).length,21);
 const seen=new Set();for(const p of report.pages){for(const text of [...p.paragraphs,p.boundary].filter(Boolean)){assert(!seen.has(text),`DUPLICATE:${report.locale}:${p.pageNumber}:${text}`);seen.add(text);}}
 assert(report.pages.find(p=>p.pageNumber===21).temporal.annual);
}
const internals=['zh-Hans','en'].map(l=>read('bazi-'+l+'-internal'));
for(let i=0;i<20;i++){
 const a=internals[0].internalPages[i].interpretation,b=internals[1].internalPages[i].interpretation;
 assert.equal(a.topic,b.topic);assert.deepEqual(a.evidence,b.evidence);assert.deepEqual(a.canonicalFacts.map(f=>[f.id,f.value]),b.canonicalFacts.map(f=>[f.id,f.value]));assert.deepEqual(a.allowedInterpretations.map(s=>s.sourceRef),b.allowedInterpretations.map(s=>s.sourceRef));
 assert.deepEqual(a.temporalContext,b.temporalContext);
}
const interpretation=internals[1].internalPages.find(p=>p.pageNumber===18).interpretation;
const registry={models:[{providerId:'test',modelId:'governed-test',capabilityClass:'DEEP',planningCostRank:1,status:'AVAILABLE'}]};
let calls=0;
const fallback=await composePublicationNarrative({interpretation,locale:'en',executionClass:'T3_DEEP_COMPOSITION',registry,providerAdapters:{test:async()=>{calls++;throw Error('provider down');}},verifyComposition:async()=>({accepted:false})});
assert.equal(calls,1);assert.equal(fallback.internalOnly.fallbackState,'DEEP_COMPOSITION_FALLBACK');assert.deepEqual(fallback.paragraphs,interpretation.allowedInterpretations.map(s=>humanizePublicationStatement(s.text)));
const rejected=await composePublicationNarrative({interpretation,locale:'en',executionClass:'T3_DEEP_COMPOSITION',registry,providerAdapters:{test:async()=>({paragraphs:['You will definitely become rich.']})},verifyComposition:async()=>({accepted:false})});assert.deepEqual(rejected.paragraphs,fallback.paragraphs);
const cache=createNarrativeGenerationCache();let builds=0;const args={reportId:'TEST',revision:'R2',locale:'en',cache,reviewMode:true,build:async()=>{builds++;return {customer:reports[1],internalOnly:internals[1]};}};
const first=await generatePublicationSnapshot(args),second=await generatePublicationSnapshot({...args,reason:'REOPEN'});assert.equal(builds,1);assert.equal(second.cacheHit,true);assert.deepEqual(first.snapshot,second.snapshot);
assert.throws(()=>{first.snapshot.customer.pages[0].title='mutated';});
await assert.rejects(()=>generatePublicationSnapshot({...args,revision:'unknown',reason:'REOPEN'}));
console.log('PASS: R2 page/skin contracts, single pagination, immutable bilingual cover, NOW/CUSTOM/DST, source parity, narrative deduplication, ID isolation, model failure/rejection fallback, immutable reopen cache. Human acceptance is separate.');

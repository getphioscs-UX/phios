import assert from 'node:assert/strict';
import fs from 'node:fs';
import {BAZI_SECTION_REGISTRY as plan,REPORT_PAGE_FAMILIES as families,BAZI_SECTION_VISUAL_ASSETS as assets,validateSectionRegistry,validateExpandedSections,bindSectionVisual,splitSemanticBlocks,textUnits} from '../functions/canonical-presentation-runtime/report-section-contract.js';
import {projectBaziSectionPublication} from '../functions/personal-reading/bazi-section-publication.js';
import {renderVisualReportPages} from '../assets/customer-ui/js/personal-products/visual-report-pages.js';
const root='docs/guided-report-successor-r2/visual-commerce',read=p=>JSON.parse(fs.readFileSync(p));
const reports=['zh-Hans','en'].map(l=>read(`${root}/bazi-${l}.json`));
validateSectionRegistry();
for(const [name,data] of [['bazi-section-registry',plan],['report-page-families',{version:'2.1.0',families}],['bazi-visual-assets',assets]])assert.deepEqual(data,read(`config/reports/${name}.json`),'generated config must match canonical JSON');
const invalid=structuredClone(plan);invalid.sections[0].pages[0].family='NARRATIVE_ANALYSIS_PAGE';assert.throws(()=>validateSectionRegistry(invalid));
assert.equal(Object.keys(families).length,7);assert.equal(assets.assets.length,13);
for(const asset of assets.assets){assert.equal(asset.containsText,false);assert.equal(asset.localeIndependent,true);assert(asset.objectKey.endsWith(`${asset.assetId}.${asset.preferredFormat}`));assert(!asset.objectKey.includes('LIFE_STRUCTURE'));}
for(const [id,url] of Object.entries(assets.bindings)){if(url.startsWith('https://')){assert.equal(new URL(url).origin,'https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev');assert.equal(url.split('/').at(-1),id+'.webp');continue;}assert(fs.existsSync('.'+url),id);assert(url.endsWith('.svg')||url.endsWith('.webp'));if(url.endsWith('.svg')){const svg=fs.readFileSync('.'+url,'utf8');assert(!/<(?:text|foreignObject|script)\b|\bon\w+\s*=/.test(svg));for(const match of svg.matchAll(/(?:xlink:)?href="([^"]+)"/g))assert(/^data:image\/(png|webp);base64,|^#/.test(match[1]));}}
const layers=structuredClone(assets),key=plan.sections[0].key;
layers.bindings={};assert.equal(bindSectionVisual(key,{assets:layers}).selected,'CSS_PREMIUM');
layers.bindings[layers.global.bodyBackground]='/assets/body.webp';assert.equal(bindSectionVisual(key,{assets:layers}).selected,'BODY');
layers.bindings[layers.global.motifLayer]='/assets/motif.svg';assert.equal(bindSectionVisual(key,{assets:layers}).selected,'BODY_WITH_MOTIF');
layers.bindings[layers.global.sectionStyle]='/assets/style.webp';assert.equal(bindSectionVisual(key,{assets:layers}).selected,'SECTION_STYLE');
layers.bindings[layers.sections[key]]='/assets/hero.webp';assert.equal(bindSectionVisual(key,{assets:layers}).selected,'SECTION_HERO');
layers.bindings[layers.sections[key]]='javascript:alert(1)';assert.throws(()=>bindSectionVisual(key,{assets:layers}));
const budgets=[];
for(const report of reports){
 assert.equal(report.totalPages,report.pages.length+6);assert.notEqual(report.totalPages,26);validateExpandedSections(report.pages);
 const previous=read(`docs/guided-report-successor-r2/bazi-${report.locale}.json`);
 assert.deepEqual(report.intro.slice(0,5),previous.intro.slice(0,5));
 assert.equal(report.intro[5].html.replaceAll(` / ${report.totalPages}`,' / TOTAL'),previous.intro[5].html.replaceAll(' / 26',' / TOTAL'));
 const html=renderVisualReportPages(report);assert.equal((html.match(/data-pagination-owner=/g)||[]).length,report.totalPages-5);
 assert(!/CMP-|PPR-C1-|BAZI_FULL_REPORT:|未选择目标时间|T3_DEEP_COMPOSITION/.test(html));
 assert.equal(report.pages.filter(p=>p.pageFamily==='SECTION_OPENER_PAGE').length,10);
 assert.equal(new Set(report.pages.map(p=>p.pageFamily)).size,7);
 for(const p of report.pages){
  const budget=families[p.pageFamily].budget,range=budget[report.locale==='en'?'en':'zh'];
  if(range){const units=textUnits(p.paragraphs.join(' '),report.locale);budgets.push({locale:report.locale,key:p.pageKey,units,range});assert((p.primaryVisualRef||units>=range[0])&&units<=range[1],`CONTENT_BUDGET:${p.pageKey}:${units}`);}
  if(p.pageFamily==='NARRATIVE_ANALYSIS_PAGE'){const units=textUnits(p.paragraphs.join(' '),report.locale);assert(units>=range[0],`THIN_NARRATIVE:${p.pageKey}`);}
  if(p.pageFamily==='INSIGHT_LIST_PAGE'){assert(p.items.length>=3&&p.items.length<=6);const range=budget[report.locale==='en'?'enItem':'zhItem'];for(const item of p.items){const units=textUnits(item,report.locale);assert(units>=range[0]&&units<=range[1],`${p.pageKey}:${units}`);}}
  if(p.pageFamily==='TIMING_PAGE'){assert(p.temporal.date&&p.temporal.annual&&p.temporal.selectedLuck);assert(p.observations.length>=2&&p.observations.length<=4);}
 }
 const liveSource=read('docs/guided-report-successor-r2/bazi-source.json');const built=await projectBaziSectionPublication({reading:liveSource.reading,locale:report.locale,temporalContext:liveSource.temporalSnapshot});const internal={internalPages:built.internalSections};assert.equal(internal.internalPages.length,10);
 for(const s of internal.internalPages){assert(s.sectionComposition.pageBlocks.length>=1);assert.equal(s.sectionComposition.sectionKey,s.sectionKey);assert.equal(s.interpretation.topic,s.sectionKey);assert.equal(s.composition.executionClass,'T2_LIGHT_COMPOSITION');}
}
assert.deepEqual(reports[0].pages.map(p=>[p.pageKey,p.pageFamily,p.pageNumber]),reports[1].pages.map(p=>[p.pageKey,p.pageFamily,p.pageNumber]));
const source=read('docs/guided-report-successor-r2/bazi-source.json');
const shorter=await projectBaziSectionPublication({reading:source.reading,temporalContext:source.temporalSnapshot,locale:'en',unavailableModules:['careerFields']});
assert.equal(shorter.pages.length,reports[1].pages.length-1);validateExpandedSections(shorter.pages);assert.equal(shorter.pages.filter(p=>p.pageFamily==='SECTION_OPENER_PAGE').length,10);
const chunks=splitSemanticBlocks([{text:'one two three'},{text:'four five six'},{text:'seven eight'}],{locale:'en',maxUnits:5});assert.equal(chunks.length,2);assert.deepEqual(chunks.flat().map(x=>x.text),['one two three','four five six','seven eight']);assert.throws(()=>splitSemanticBlocks([{text:'one two three four'}],{locale:'en',maxUnits:3}));
let requests=[];
await projectBaziSectionPublication({reading:source.reading,temporalContext:source.temporalSnapshot,locale:'en',composition:{registry:{models:[{providerId:'test',modelId:'test',capabilityClass:'DEEP',planningCostRank:1,status:'AVAILABLE'}]},providerAdapters:{test:async r=>{requests.push(r);return {paragraphs:['Unsupported invented conclusion.']};}},verifyComposition:async()=>({accepted:false})}});
assert(requests.length>0&&requests.length<=10);for(const r of requests){assert.equal(r.taskType,'PUBLICATION_SECTION');assert(r.sectionComposition.pageBlocks.length>=1);assert.equal(r.compositionPolicy.scope,'SECTION');}
fs.writeFileSync(`${root}/contract-evidence.json`,JSON.stringify({machinePass:true,totalPages:reports.map(r=>({locale:r.locale,total:r.totalPages})),shorterFixturePages:shorter.pages.length+6,sectionLevelProviderRequests:requests.length,budgets,humanAccepted:false},null,2)+'\n');
console.log('PASS: section order, seven families, variable totals, section-level composition, frozen intro, shared pagination, bilingual parity, text budgets, temporal data, 13-asset registry and fallback chain.');

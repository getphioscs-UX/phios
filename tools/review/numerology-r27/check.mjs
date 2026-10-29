import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {requireDiskSpace} from '../../../scripts/lib/disk-space-guard.mjs';
import {calculateNumPublicationSnapshot,composeNumR20Pages,numR20PhysicalPlan} from '../../../functions/personal-reading/narrative/numerology-publication-adapter.js';
import {buildNumR27SourceView,renderNumR27SourceDiagram,renderNumR27PublicationHtml} from '../../../functions/personal-reading/narrative/numerology-school-transparent.js';
import {renderNumR22Diagram} from '../../../functions/personal-reading/narrative/numerology-diagram-html.js';
import {buildNumSecondaryChart} from '../../../functions/num-depth/num-secondary-chart-runtime.js';
import {reportEconomics} from '../../../functions/pws/commercial/commerce-economics-policy.js';

requireDiskSpace({estimatedBytes:60000000,label:'Numerology R27 source review'});
const dir='tools/review/numerology-r27',temp='.tmp/numerology-r27';
fs.mkdirSync(dir,{recursive:true});fs.mkdirSync(temp,{recursive:true});
const write=(file,value)=>fs.writeFileSync(file,JSON.stringify(value,null,2));
const identity={fullBirthName:'John Michael Smith',customerConfirmed:true,sourceNameKind:'ORIGINAL_BIRTH_NAME',alphabetSystemId:'PYTHAGOREAN_LATIN_1_9_V1',nameNormalizationPolicy:'ASCII_LATIN_LETTERS_ONLY_V1'};
async function run(input){return calculateNumPublicationSnapshot({canonicalInput:{birthDate:input.birthDate,timezone:{iana:'Asia/Singapore',utcOffsetAtBirth:'+08:00',source:'PINNED_IANA_TZDB',confidence:'HIGH'},consent:{recordId:'NUM-R27-SYNTHETIC-ONLY',granted:true}},expansionInput:input,localReview:true});}
const input={birthDate:'1989-11-15',targetDate:'2026-10-27',identityInput:identity},snapshot=await run(input),monthlySnapshots=[];
for(let month=1;month<=12;month++)monthlySnapshots.push(await run({...input,targetDate:'2026-'+String(month).padStart(2,'0')+'-01'}));
write(temp+'/NATIVE-DIAGNOSTIC.json',{calendar:snapshot.readings.en.sections.timing,monthly:monthlySnapshots.map(x=>({target:x.expansionInput.targetDate,calendar:x.readings.en.sections.timing.calendar,unknown:x.projection.unknown}))});
const view=await buildNumR27SourceView({snapshot,monthlySnapshots}),rows=[];
async function test(name,fn){try{await fn();rows.push({name,status:'PASS'});}catch(e){rows.push({name,status:'FAIL',error:e.stack});}}
await test('Exact source-aligned and global paths remain distinct',()=>{
 assert.equal(view.name.roles.length,3);
 assert.deepEqual(view.name.roles.map(r=>r.reductionSteps),[[41,5],[21,3],[20,2]]);
 assert.deepEqual(view.name.roles.map(r=>r.comparison.reductionSteps),[[77,14,5],[30,3],[47,11,2]]);
 assert.deepEqual(view.name.roles[0].intermediates.map(x=>x.reductionSteps),[[20,2],[33],[24,6]]);
 assert.equal(view.name.parts[1].letters.map(x=>x.letter).join(''),'MICHAEL');
 assert(Object.isFrozen(view.name.roles[0].intermediates));
});
await test('Native DOB paths and 11 are preserved',()=>{
 assert.deepEqual(view.birthRoles.find(x=>x.role==='LIFE_PATH').reductionSteps,[35,8]);
 assert.equal(view.birthRoles.find(x=>x.role==='BIRTH_MONTH_NUMBER').value,11);
 assert.equal(view.frequency['1'],4);assert.equal(view.frequency['9'],2);assert(!('0'in view.frequency));
});
await test('All twelve native months, February 11, date binding',()=>{assert.equal(view.months.length,12);assert.equal(view.months[1].value,11);assert.equal(view.targetDate,'2026-10-27');});
await test('Western age bands and archival exclusion',()=>{assert.deepEqual(view.timing.pinnacles.map(x=>[x.startAge,x.endAge]),[[0,28],[29,37],[38,46],[47,null]]);assert.deepEqual(view.archivalTriangle.customerValues,[]);});
await test('Seven native diagrams in each language, accessible summaries',()=>{for(const l of ['zh-Hans','en','bilingual'])for(const p of ['P06','P07','P09','P10','P19','P20','P24']){const svg=renderNumR27SourceDiagram(view,p,l);assert(svg.includes('<title'));assert(svg.includes('<desc'));assert(!svg.includes('NaN'));assert(svg.includes(view.snapshotDigest));}});
for(const [name,identityInput] of [['NO_NAME',undefined],['UNCONFIRMED',{...identity,customerConfirmed:false}],['Y_AMBIGUOUS',{...identity,fullBirthName:'Mary Jane Smith'}],['UNSUPPORTED_SCRIPT',{...identity,fullBirthName:'陈测试'}],['CONFLICTING_ALIAS',{...identity,fullBirthName:'John / James Smith'}]])await test(name+' suppresses name-derived diagram',async()=>{
 try{const s=await run({...input,identityInput}),v=await buildNumR27SourceView({snapshot:s});assert.equal(v.name.roles.length,0);assert.equal(v.name.parts.length,0);assert(v.birthRoles.some(x=>x.role==='LIFE_PATH'));}catch(e){if(name!=='UNCONFIRMED')throw e;assert.match(e.message,/CONFIRM|INPUT|NAME/);}
});
await test('Archival and unsupported names cannot acquire provenance',()=>{for(const name of ['陈测试','John / James','Mary Smith']){const x=buildNumSecondaryChart({fullBirthName:name,birthDayNumber:15,lifePathValue:8});assert(!x.sourceAlignedCore?.calculationProvenance);}});
for(const [value,birthDate] of [[11,'2020-11-05'],[22,'1980-01-03'],[33,'1990-09-14'],[6,'2000-02-29']])await test('Native fixture '+birthDate,async()=>{const s=await run({birthDate,targetDate:'2026-10-27'});assert.equal(s.readings.en.sections.snapshot.find(x=>x.role==='LIFE_PATH').value,value);});
await test('Month injection and duplicate rejection',async()=>{await assert.rejects(buildNumR27SourceView({snapshot,monthlySnapshots:[monthlySnapshots[0],monthlySnapshots[0]]}),/DUPLICATE/);const other=await run({...input,targetDate:'2027-01-01'});await assert.rejects(buildNumR27SourceView({snapshot,monthlySnapshots:[other]}),/MISMATCH/);});
await test('Changed reference date uses new native values',async()=>{const s=await run({...input,targetDate:'2027-03-12'}),v=await buildNumR27SourceView({snapshot:s});assert.notDeepEqual(v.timing.calendar,view.timing.calendar);});
const pages=composeNumR20Pages(snapshot),selected=['P06','P07','P09','P10','P19','P20','P24'];
await test('33-page plan remains five locale assets, nine shared inserts, nineteen body pages',()=>{for(const locale of ['zh-Hans','en','bilingual']){const p=numR20PhysicalPlan(pages,locale);assert.equal(p.length,33);assert.equal(p.filter(x=>x.pageRole==='FIXED_EDITORIAL').length,5);assert.equal(p.filter(x=>x.pageRole==='FIXED_MASTER_SECTION').length,9);assert.equal(p.filter(x=>x.pageRole==='BODY_CONTENT').length,19);}});
await test('Existing publication integration changes exactly seven diagram slots and preserves fourteen fixed asset identities',()=>{
 const manifest=JSON.parse(fs.readFileSync('content/reports/shared/report-visual-assets-r2.json'));
 // Explicit simulated image transport for markup assertions only, never saved
 // or reported as printable PDF/image fidelity evidence.
 const assets=Object.fromEntries(manifest.assets.filter(a=>a.methodId==='NUM').map(a=>[a.objectKey,{sha256:a.sha256,dataUrl:'data:image/webp;base64,AA=='}]));
 for(const locale of ['zh-Hans','en','bilingual']){const rendered=renderNumR27PublicationHtml({sourceView:view,snapshot,locale,manifest,assets,fontUrl:'data:font/ttf;base64,',localReview:true});assert.equal(rendered.plan.length,33);assert.equal((rendered.html.match(/<figure class="num-r27-diagram"/g)||[]).length,7);assert.equal((rendered.html.match(/<figure class="num-r22-diagram"/g)||[]).length,12);assert.equal((rendered.html.match(/data-source-sha=/g)||[]).length,14);assert.equal(rendered.customerPublishable,false);}
 assert.throws(()=>renderNumR27PublicationHtml({sourceView:{...view,snapshotDigest:'tampered'},snapshot}),/SNAPSHOT_MISMATCH/);
});
const editorial=JSON.parse(fs.readFileSync('.tmp/numerology-r21/EDITORIAL-PAGES.json'));
const escape=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
for(const locale of ['zh-Hans','en','bilingual']){
 const langs=locale==='bilingual'?['zh-Hans','en']:[locale];
 fs.mkdirSync(dir+'/'+locale,{recursive:true});
 let body='';for(const p of pages){const diagram=selected.includes(p.logicalPageId)?renderNumR27SourceDiagram(view,p.logicalPageId,locale):renderNumR22Diagram(p,locale);fs.writeFileSync(dir+'/'+locale+'/'+p.logicalPageId+'.svg',diagram.match(/<svg[\s\S]*?<\/svg>/)[0]);const e=editorial.find(x=>x.logicalPageId===p.logicalPageId);body+=`<article><h2>${p.logicalPageId} · ${escape(e.title[langs[0]])}</h2>${diagram}<div class="prose">${langs.map(l=>`<section lang="${l}">${e.languages[l].map(t=>'<p>'+escape(t)+'</p>').join('')}</section>`).join('')}</div></article>`;}
 fs.writeFileSync(dir+'/'+locale+'/REVIEW.html',`<!doctype html><meta charset="utf-8"><title>R27 native source review</title><style>body{font:16px/1.55 Arial,sans-serif;color:#193442;background:#eee9de;max-width:980px;margin:auto}article{background:#fffdf4;padding:28px;margin:24px 0}svg{width:100%}.prose{display:grid;grid-template-columns:repeat(${langs.length},minmax(0,1fr));gap:24px}figure{margin:0}figcaption{font-weight:bold}.r27-caption{font-size:12px}h1{font-size:24px}</style><h1>R2.7 · Native calculation review · 本地合成资料候选</h1><p>19 body pages only. Fixed artwork is preserved by the existing 33-page assembler. Prose below replays the prior R2.1 candidate and awaits R2.7 claim-by-claim editorial reconciliation. Print QA and source admission are pending.</p>${body}`);
}
write(temp+'/PUBLICATION-SNAPSHOT.json',snapshot);write(temp+'/SOURCE-VIEW.json',view);
write(dir+'/CHECKS.json',{rows,providerCalls:0,productionWrites:0,syntheticOnly:true});
const economics=reportEconomics('COM-REPORT-NUMEROLOGY-FULL');write(dir+'/ECONOMICS-READONLY.json',{owner:'functions/pws/commercial/commerce-economics-policy.js',economics,remoteStripeVerified:false,mutations:0});
write(dir+'/SOURCE-IDENTITY.json',{zipSHA256:createHash('sha256').update(fs.readFileSync('C:/Users/Guest Account/Desktop/PHIOS_NUMEROLOGY_R27_SCHOOL_TRANSPARENT_HANDOFF.zip')).digest('hex'),snapshotDigest:snapshot.snapshotDigest,sources:['functions/core-method-runtime/num-birth-number-runtime.js','functions/core-method-runtime/num-cycle-runtime.js','functions/num-depth/num-secondary-chart-runtime.js','functions/num-expansion/num-name-runtime.js','functions/personal-reading/narrative/numerology-school-transparent.js'].map(path=>({path,sha256:createHash('sha256').update(fs.readFileSync(path)).digest('hex')})),selectedPageIds:selected});
console.log(JSON.stringify({pass:rows.filter(x=>x.status==='PASS').length,fail:rows.filter(x=>x.status==='FAIL')}));
if(rows.some(x=>x.status==='FAIL'))process.exitCode=1;

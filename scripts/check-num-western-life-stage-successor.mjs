import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createNumCycleRuntime,selectNumWesternLifeStage} from '../functions/core-method-runtime/num-cycle-runtime.js';
import {resolveAlternativeTimingPhase} from '../functions/num-expansion/num-alternative-timing-runtime.js';
import {recoverLifePeriod} from '../functions/num-expansion/num-life-period-recovery.js';
import {buildNumerologyChartModel} from '../functions/customer-projection/numerology-customer-reading-envelope-v1.js';
import {renderNumR28Diagram} from '../functions/personal-reading/narrative/numerology-publication-diagrams.js';
import {assertNumWesternLifeStageSuccessor,NUM_WESTERN_CYCLE_RUNTIME_PATH} from './lib/num-western-life-stage-successor.mjs';

const predecessor='9b1155a7b79b75c0d1ce89f78ca89a44208e283439fdea79b63cac6856a4de2c';
const registration=assertNumWesternLifeStageSuccessor(predecessor);
const source=fs.readFileSync(NUM_WESTERN_CYCLE_RUNTIME_PATH,'utf8');
const start=source.indexOf(registration.runtime.additiveStartMarker),end=source.indexOf(registration.runtime.additiveEndMarker,start);
// Execute the exact, hash-verified historical implementation in memory. Only
// its relative import is resolved to the existing dependency URL for loading.
const historical=(source.slice(0,start)+source.slice(end)).replace('../method-runtime/shared-calculation-runtime.js',pathToFileURL(path.resolve('functions/method-runtime/shared-calculation-runtime.js')).href);
const old=await import('data:text/javascript;base64,'+Buffer.from(historical).toString('base64'));
const native=createNumCycleRuntime(),baseline=old.createNumCycleRuntime();
const cases=[];let nativeComparisons=0,diagramCases=0,schoolComparisons=0;
const dayBefore=d=>{const t=new Date(d+'T00:00:00Z');t.setUTCDate(t.getUTCDate()-1);return t.toISOString().slice(0,10);};
const anniversary=(birth,age)=>{const [y,m,d]=birth.split('-').map(Number);return new Date(Date.UTC(y+age,m-1,d)).toISOString().slice(0,10);};
for(const birthDate of ['1989-11-15','1992-02-29'])for(const lifePath of [1,2,3,4,5,6,7,8,9,11,22,33]){
 const request={calculationId:'NUM-RESTRICTED-SYNTHETIC',runtimeCode:'NUM_CYCLE_RUNTIME',executionMode:'validation',targetDate:'2026-10-29',timezonePolicyCode:'USER_LOCAL_CALENDAR_DATE_V1',inputRecords:[{authority:'SHARED_DATA_AUTHORITY',status:'verified',methodOwner:null,pluginOwner:null,recordId:'SYNTHETIC-NUM-BIRTH',recordType:'NUM_BIRTH_NUMBER_RESULT',recordVersion:'1.0.0',payload:{runtimeCode:'NUM_BIRTH_NUMBER_RUNTIME',runtimeVersion:'1.0.0',outputDigest:'a'.repeat(64),birthDate,numberFactsCreated:true,numbers:{lifePath:{reducedValue:lifePath}}}}]};
 const current=await native.calculate(request),prior=await baseline.calculate(request);
 assert.deepEqual(current.output,prior.output);assert.equal(current.outputDigest,prior.outputDigest);nativeComparisons++;
 const {pinnacleCycles:pinnacles,challengeCycles:challenges}=current.output.lifeStageCycles;
 const inputsBefore=JSON.stringify({pinnacles,challenges});
 // Exercise independent Energy timing on a date already supported by that
 // owner, including a leap target year for its Feb-29 fixture. Its separate
 // calendar policy is not modified or adopted by the Western selector.
 const schoolTargetDate=birthDate.endsWith('02-29')?'2024-10-29':request.targetDate;
 const schoolBefore={energy:resolveAlternativeTimingPhase({birthDate,targetDate:schoolTargetDate}),lifePeriod:recoverLifePeriod({birthDate})};
 for(const band of pinnacles){
  const dates=[anniversary(birthDate,band.startAge)];
  if(band.endAge!==null)dates.push(anniversary(birthDate,band.endAge),dayBefore(anniversary(birthDate,band.endAge+1)));
  else dates.push(anniversary(birthDate,90));
  for(const targetDate of dates){
   const result=selectNumWesternLifeStage({birthDate,targetDate,pinnacles,challenges});
   assert.equal(result.available,true);assert.equal(result.cycleNumber,band.cycleNumber);
   assert.equal(result.pinnacle,band.number);assert.equal(result.challenge,challenges.find(c=>c.cycleNumber===band.cycleNumber).number);
   assert.equal(result.startAge,band.startAge);assert.equal(result.endAge,band.endAge);assert(Object.isFrozen(result));
   cases.push({birthDate,lifePath,targetDate,cycleNumber:result.cycleNumber});
  }
  if(band.startAge>0){const targetDate=dayBefore(anniversary(birthDate,band.startAge));assert.equal(selectNumWesternLifeStage({birthDate,targetDate,pinnacles,challenges}).cycleNumber,band.cycleNumber-1);}
  if(lifePath===8){
   const targetDate=anniversary(birthDate,band.startAge),p=pinnacles.map(x=>({...x,value:x.number})),c=challenges.map(x=>({...x,value:x.number}));
   const sourceView={birthDate,targetDate,timing:{pinnacles:p,challenges:c,calendar:[]},name:{roles:[],parts:[]},months:[]};
   const ir={customerPublishable:true,sections:{snapshot:[],relationships:[],timing:{calendar:[],pinnacles:p,challenges:c,lifePeriod:schoolBefore.lifePeriod},expansion:{sections:{alternativeTiming:schoolBefore.energy}},depth:{sections:{}}}};
   const chartModels=Object.fromEntries(['en','zh-Hans'].map(locale=>[locale,buildNumerologyChartModel({integratedReading:ir,locale,publicationSourceView:sourceView})]));
   for(const model of Object.values(chartModels)){
    assert.equal(model.publicationDetail.westernTimeline.selection.cycleNumber,band.cycleNumber);
    assert.deepEqual(model.publicationDetail.westernTimeline.pinnacles,p);assert.deepEqual(model.publicationDetail.westernTimeline.challenges,c);
    const withoutSelector=buildNumerologyChartModel({integratedReading:ir,locale:model.locale});
    assert.deepEqual(model.timingBand,withoutSelector.timingBand);assert.deepEqual(model.cycleTimeline,withoutSelector.cycleTimeline);assert.deepEqual(model.energyPatternMap,withoutSelector.energyPatternMap);
   }
   for(const locale of ['en','zh-Hans','bilingual']){
    const diagram={logicalPageId:'P19',diagramId:'SYNTHETIC-P19',diagramFamily:'WESTERN_PHASES',snapshotDigest:current.outputDigest,languages:Object.fromEntries(['en','zh-Hans'].map(l=>[l,{title:'P19',visual:{rows:[]}}]))};
    const svg=renderNumR28Diagram({diagram,publication:{refinement:'R30_PILOT',sourceView,chartModels},locale});
    assert.equal((svg.match(/stroke-width="2\.5"/g)||[]).length,1);
    assert(svg.includes(`<rect x="${103+(band.cycleNumber-1)*151}" y="40" width="143" height="211" rx="7" fill="#e9e0c8"`));
    diagramCases++;
   }
  }
 }
 assert.equal(JSON.stringify({pinnacles,challenges}),inputsBefore);
 assert.deepEqual({energy:resolveAlternativeTimingPhase({birthDate,targetDate:schoolTargetDate}),lifePeriod:recoverLifePeriod({birthDate})},schoolBefore);schoolComparisons++;
}
// Invalid, absent, ambiguous or incomplete native facts must never be guessed.
const p=[{cycleNumber:1,startAge:0,endAge:28,number:0}],c=[{cycleNumber:1,startAge:0,endAge:28,number:0}];
const valid={birthDate:'2000-06-15',targetDate:'2026-06-15',pinnacles:p,challenges:c};
assert.equal(selectNumWesternLifeStage({...valid,targetDate:'2026-06-14'}).completedAge,25);
assert.equal(selectNumWesternLifeStage(valid).completedAge,26);
assert.equal(selectNumWesternLifeStage(valid).pinnacle,0);assert.equal(selectNumWesternLifeStage(valid).challenge,0);
const unknownInputs=[null,{}, {...valid,birthDate:null},{...valid,targetDate:'2026-02-30'},{...valid,targetDate:'1999-01-01'},{...valid,pinnacles:null},{...valid,pinnacles:[]},{...valid,challenges:[]},{...valid,pinnacles:[p[0],p[0]]},{...valid,challenges:[c[0],c[0]]},{...valid,pinnacles:[{...p[0],startAge:'0'}]},{...valid,challenges:[{...c[0],number:null}]},{...valid,pinnacles:[{...p[0],endAge:25}]}];
for(const input of unknownInputs){const r=selectNumWesternLifeStage(input);assert.equal(r.available,false);assert.equal(typeof r.reason,'string');assert.equal(Object.hasOwn(r,'cycleNumber'),false);}
const evidence={status:'PASS',scope:'NUM_WESTERN_LIFE_STAGE_SELECTION_ONLY',successor:registration.successorCode,nativeHistoricalOutputComparisons:nativeComparisons,boundarySelections:cases.length,p19NativeProjectionAndSvgCases:diagramCases,independentEnergyAndLifePeriodComparisons:schoolComparisons,unknownCases:unknownInputs.length,historicalFormulasBytePreserved:true,masterNumberInputs:[11,22,33],leapPolicy:'FEB29_ROLLOVER_MARCH1',productionAdmission:'NOT_AUTOMATIC',liveVerification:'NOT_RUN'};
if(process.argv.includes('--write-evidence')){
 const out='docs/acceptance/numerology/western-life-stage-selection-r1';fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/CHECK-EVIDENCE.json',JSON.stringify(evidence,null,2)+'\n');
}
console.log(JSON.stringify(evidence));

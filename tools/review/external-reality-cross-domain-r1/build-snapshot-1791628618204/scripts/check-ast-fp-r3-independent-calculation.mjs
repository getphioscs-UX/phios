import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as astronomy from 'astronomy-engine';
import {executeAndProjectAstV2} from '../functions/method-client-delivery/canonical-projection-runtime-ast-v2.js';
import {createAstStructuralProductionRuntime,canonicalUtcIso} from '../functions/ast-production/ast-structural-calculation-runtime.js';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const contract=read('content/professional/ast-full-production/contracts/ast-fp-r3-independent-calculation-certification-contract-v1.json');
const authority=read(contract.referenceAuthorityRef);
const fixture=read(contract.referenceFixtureRef);
const r2=read('content/professional/ast-full-production/acceptance/ast-fp-r2-human-admission-acceptance-v1.json');
const r2Admission=read('content/professional/ast-full-production/admission/ast-fp-r2-candidate-human-admission-v1.json');
const tol=contract.tolerances;
const CORE=['SUN','MOON','MERCURY','VENUS','MARS','JUPITER','SATURN','URANUS','NEPTUNE','PLUTO'];
const ASPECTS=[['CONJUNCTION',0,8],['SEXTILE',60,4],['SQUARE',90,6],['TRINE',120,6],['OPPOSITION',180,8]];
const norm=v=>((Number(v)%360)+360)%360;
const delta=(a,b)=>{let d=Math.abs(norm(a)-norm(b));if(d>180)d=360-d;return d};
const pairKey=(a,b)=>[a,b].sort().join('|');
const group=(projection,code)=>projection?.calculation?.structures?.find(x=>x.code===code)?.items||[];
const itemMap=items=>new Map(items.map(x=>[x.code,x]));
const inputFor=row=>({birthDate:row.input.birthDate,birthTime:row.input.birthTime,birthPlace:{displayName:`R3 ${row.caseId}`,countryCode:'ZZ',latitude:row.input.latitude,longitude:row.input.longitude},timezone:{iana:row.input.iana,utcOffsetAtBirth:row.input.utcOffsetAtBirth,source:'HUMAN_DECLARATION',confidence:'HIGH'},timeAccuracy:'EXACT',locale:'en',consent:{recordId:'AST-FP-R3-INDEPENDENT-CERTIFICATION',granted:true},inputVersion:'MCD-3-CANONICAL-BIRTH-INPUT-v1.0.0'});
const requestFor=(row,houseSystemCode)=>{const canonicalInput=inputFor(row);return {schemaVersion:'PHI-OS-MCD-METHOD-EXECUTION-REQUEST-v1.0.0',methodCode:'ASTROLOGY',methodVersion:'0.1.0',capability:'CALCULATION',purposeCode:'AST_FP_R3_INDEPENDENT_CERTIFICATION',canonicalInput,executionParameters:{houseSystemCode},consentRecordId:canonicalInput.consent.recordId,requestId:`${row.caseId}-${houseSystemCode}-R3`}};
async function project(row,houseSystemCode){return (await executeAndProjectAstV2(requestFor(row,houseSystemCode),{astronomyModuleLoader:async()=>astronomy})).canonicalProjection}
function referenceAspectDecision(a,b){const separation=delta(a,b);const candidates=ASPECTS.map(([aspectCode,angle,orbLimit],priority)=>({aspectCode,angle,orbLimit,priority,orb:Math.abs(separation-angle)})).sort((x,y)=>x.orb-y.orb||x.priority-y.priority);const active=candidates.filter(x=>x.orb<=x.orbLimit)[0]||null;if(active)return {active:true,aspectCode:active.aspectCode,margin:active.orbLimit-active.orb,separation};const nearest=candidates.sort((x,y)=>Math.abs(x.orb-x.orbLimit)-Math.abs(y.orb-y.orbLimit))[0];return {active:false,aspectCode:null,margin:Math.abs(nearest.orb-nearest.orbLimit),separation}}
function nearestCuspDistance(longitude,cusps){return Math.min(...cusps.map(x=>delta(longitude,x.longitude)))}
function assertClose(actual,expected,max,label,stats){const error=delta(actual,expected);assert.ok(error<=max,`${label}: ${actual} vs ${expected}; circular error ${error} > ${max}`);stats.max=Math.max(stats.max,error);stats.count++;return error}

assert.equal(contract.workCode,'AST-FP-R3');
assert.equal(authority.workCode,'AST-FP-R3');
assert.equal(fixture.workCode,'AST-FP-R3');
assert.equal(authority.independence.referenceNumbersGeneratedOutsidePhiOsAstRuntime,true);
assert.equal(authority.independence.runtimeDependencyCreated,false);
assert.equal(fixture.coverage.cases,10);
assert.equal(fixture.coverage.existingR2Cases,8);
assert.equal(fixture.coverage.newR3EdgeCases,2);
assert.equal(fixture.coverage.allFiveMajorAspectTypesPresent,true);
assert.equal(r2.result.humanAccepted,16);assert.equal(r2.result.humanPending,0);
assert.equal(r2.boundaries.productionAllowed,false);assert.equal(r2.boundaries.customerCutover,false);
assert.equal(r2Admission.governance.productionAllowed,false);assert.equal(r2Admission.governance.customerCutoverAllowed,false);

const longitudeStats={max:0,count:0},nodeStats={max:0,count:0},angleStats={max:0,count:0},placidusStats={max:0,count:0};
let decisiveRetrogrades=0,stationaryGuarded=0,stableHousePlacements=0,robustAspectPairs=0,robustNoAspectPairs=0,polarCases=0;
const naturalTypes=new Set();
for(const row of fixture.cases){
 const canonicalInput=inputFor(row);
 assert.equal(canonicalUtcIso(canonicalInput),row.expectedUtcIso,`${row.caseId}: explicit offset UTC normalization drift`);
 const whole=await project(row,'WHOLE_SIGN_V1');
 assert.ok(whole,`${row.caseId}: Whole Sign projection missing`);
 const pmap=itemMap(whole.calculation.positions);
 const vmap=itemMap(whole.calculation.values);
 for(const ref of row.core10){
  const actual=pmap.get(ref.bodyCode);assert.ok(actual,`${row.caseId}: ${ref.bodyCode} missing`);
  assertClose(actual.value,ref.longitude,tol.core10LongitudeDegrees,`${row.caseId}:${ref.bodyCode}`,longitudeStats);
  if(Math.abs(ref.speedLongitudeDegreesPerDay)>=tol.retrogradeReferenceSpeedGuardDegreesPerDay){
   assert.equal(vmap.get(`${ref.bodyCode}_RETROGRADE`)?.value,ref.retrograde,`${row.caseId}:${ref.bodyCode} retrograde mismatch`);decisiveRetrogrades++;
  }else stationaryGuarded++;
 }
 for(const [code,expected] of [['NORTH_NODE',row.trueNode.northLongitude],['SOUTH_NODE',row.trueNode.southLongitude]]){
  const actual=pmap.get(code);assert.ok(actual,`${row.caseId}: ${code} missing`);assertClose(actual.value,expected,tol.trueNodeLongitudeDegrees,`${row.caseId}:${code}`,nodeStats);
 }
 const wholeRef=row.houseSystems.WHOLE_SIGN_V1;assert.equal(wholeRef.available,true);
 const wa=itemMap(group(whole,'ANGLES')),wc=group(whole,'HOUSE_CUSPS'),wp=itemMap(group(whole,'HOUSE_PLACEMENTS'));
 for(const code of ['ASC','MC','DSC','IC'])assertClose(wa.get(code)?.value,wholeRef.angles[code],tol.angleLongitudeDegrees,`${row.caseId}:WHOLE_SIGN:${code}`,angleStats);
 assert.equal(wc.length,12,`${row.caseId}: Whole Sign 12 cusps required`);
 for(const ref of wholeRef.cusps){const actual=wc.find(x=>x.meta?.houseNumber===ref.houseNumber);assert.ok(actual);assertClose(actual.value,ref.longitude,tol.wholeSignCuspLongitudeDegrees,`${row.caseId}:WHOLE_SIGN:H${ref.houseNumber}`,{max:0,count:0})}
 const allRefPos=[...row.core10.map(x=>({bodyCode:x.bodyCode,longitude:x.longitude})),{bodyCode:'NORTH_NODE',longitude:row.trueNode.northLongitude},{bodyCode:'SOUTH_NODE',longitude:row.trueNode.southLongitude}];
 for(const ref of wholeRef.placements){const pos=allRefPos.find(x=>x.bodyCode===ref.bodyCode);if(nearestCuspDistance(pos.longitude,wholeRef.cusps)>=tol.stableHousePlacementCuspDistanceDegrees){assert.equal(wp.get(ref.bodyCode)?.value,ref.houseNumber,`${row.caseId}:WHOLE_SIGN:${ref.bodyCode} house mismatch`);stableHousePlacements++}}
 const aspectItems=group(whole,'ASPECTS');const actualAspects=new Map(aspectItems.map(x=>[pairKey(x.meta.fromCode,x.meta.toCode),x.meta.type]));
 const refs=new Map(row.core10.map(x=>[x.bodyCode,x.longitude]));
 for(let i=0;i<CORE.length;i++)for(let j=i+1;j<CORE.length;j++){
  const a=CORE[i],b=CORE[j],decision=referenceAspectDecision(refs.get(a),refs.get(b));if(decision.active)naturalTypes.add(decision.aspectCode);
  if(decision.margin<tol.robustAspectBoundaryMarginDegrees)continue;
  const actual=actualAspects.get(pairKey(a,b))||null;
  if(decision.active){assert.equal(actual,decision.aspectCode,`${row.caseId}:${a}-${b} robust aspect mismatch`);robustAspectPairs++}else{assert.equal(actual,null,`${row.caseId}:${a}-${b} robust non-aspect mismatch`);robustNoAspectPairs++}
 }
 const placRef=row.houseSystems.PLACIDUS_V1;
 const plac=await project(row,'PLACIDUS_V1');
 if(!placRef.available){polarCases++;assert.ok(plac.unknown.some(x=>x.reasonCodes?.includes(placRef.expectedReasonCode)),`${row.caseId}: Placidus polar guard missing`);assert.equal(group(plac,'HOUSE_CUSPS').length,0,`${row.caseId}: polar Placidus must not publish cusps`);continue}
 const pa=itemMap(group(plac,'ANGLES')),pc=group(plac,'HOUSE_CUSPS'),pp=itemMap(group(plac,'HOUSE_PLACEMENTS'));
 for(const code of ['ASC','MC','DSC','IC'])assertClose(pa.get(code)?.value,placRef.angles[code],tol.angleLongitudeDegrees,`${row.caseId}:PLACIDUS:${code}`,angleStats);
 assert.equal(pc.length,12,`${row.caseId}: Placidus 12 cusps required`);
 for(const ref of placRef.cusps){const actual=pc.find(x=>x.meta?.houseNumber===ref.houseNumber);assert.ok(actual);assertClose(actual.value,ref.longitude,tol.placidusCuspLongitudeDegrees,`${row.caseId}:PLACIDUS:H${ref.houseNumber}`,placidusStats)}
 for(const ref of placRef.placements){const pos=allRefPos.find(x=>x.bodyCode===ref.bodyCode);if(nearestCuspDistance(pos.longitude,placRef.cusps)>=tol.stableHousePlacementCuspDistanceDegrees){assert.equal(pp.get(ref.bodyCode)?.value,ref.houseNumber,`${row.caseId}:PLACIDUS:${ref.bodyCode} house mismatch`);stableHousePlacements++}}
}
assert.deepEqual([...naturalTypes].sort(),ASPECTS.map(x=>x[0]).sort(),'Natural independent corpus must contain all five major aspect types');
assert.ok(polarCases>=1,'Polar fail-closed case required');

const structural=createAstStructuralProductionRuntime({astronomyModuleLoader:async()=>astronomy});
const syntheticInput={birthDate:'2000-01-01',birthTime:'12:00:00',birthPlace:{displayName:'R3 synthetic orb boundary',countryCode:'ZZ',latitude:0,longitude:0},timezone:{iana:'Etc/UTC',utcOffsetAtBirth:'+00:00',source:'ENGINEERING_FIXTURE',confidence:'HIGH'},timeAccuracy:'EXACT',locale:'en',consent:{recordId:'AST-FP-R3-ORB',granted:true},inputVersion:'MCD-3-CANONICAL-BIRTH-INPUT-v1.0.0'};
let orbBoundaryChecks=0;
for(const [aspectCode,angle,orb] of ASPECTS){
 const exactSep=aspectCode==='OPPOSITION'?angle-orb:angle+orb;
 const outsideSep=aspectCode==='OPPOSITION'?exactSep-tol.orbBoundaryEpsilonDegrees:exactSep+tol.orbBoundaryEpsilonDegrees;
 const exact=await structural.calculate({requestId:`R3-ORB-${aspectCode}-IN`,canonicalInput:syntheticInput,planetBodies:[{bodyCode:'SUN',longitude:0},{bodyCode:'MOON',longitude:exactSep}],houseSystemCode:'WHOLE_SIGN_V1'});
 const exactMatch=exact.aspects.output.aspects.find(x=>pairKey(x.fromCode,x.toCode)===pairKey('SUN','MOON'));assert.equal(exactMatch?.aspectCode,aspectCode,`${aspectCode}: exact authorized orb must be included`);
 const outside=await structural.calculate({requestId:`R3-ORB-${aspectCode}-OUT`,canonicalInput:syntheticInput,planetBodies:[{bodyCode:'SUN',longitude:0},{bodyCode:'MOON',longitude:outsideSep}],houseSystemCode:'WHOLE_SIGN_V1'});
 const outsideMatch=outside.aspects.output.aspects.find(x=>pairKey(x.fromCode,x.toCode)===pairKey('SUN','MOON'));assert.equal(outsideMatch,undefined,`${aspectCode}: orb + epsilon must be excluded`);orbBoundaryChecks+=2;
}

console.log(JSON.stringify({status:'PASS',workCode:'AST-FP-R3',reference:`${authority.independentReference.library} ${authority.independentReference.libraryVersion} / ${authority.independentReference.planetaryBackend}`,cases:fixture.cases.length,core10LongitudeComparisons:longitudeStats.count,maxCore10LongitudeErrorDegrees:longitudeStats.max,trueNodeComparisons:nodeStats.count,maxTrueNodeErrorDegrees:nodeStats.max,angleComparisons:angleStats.count,maxAngleErrorDegrees:angleStats.max,placidusCuspComparisons:placidusStats.count,maxPlacidusCuspErrorDegrees:placidusStats.max,decisiveRetrogradeComparisons:decisiveRetrogrades,nearStationaryGuarded:stationaryGuarded,stableHousePlacementComparisons:stableHousePlacements,robustAspectPairs,robustNoAspectPairs,naturalAspectTypes:[...naturalTypes].sort(),orbBoundaryChecks,polarFailClosedCases:polarCases,r2HumanAdmissionPreserved:`${r2.result.humanAccepted}/16`,customerCutover:false},null,2));

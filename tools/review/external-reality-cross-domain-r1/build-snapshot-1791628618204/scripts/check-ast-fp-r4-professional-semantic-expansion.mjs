import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {buildAstProfessionalSemanticProjection,AST_R4_SEMANTIC_SCHEMA_VERSION} from '../functions/ast-full-production/ast-professional-semantic-runtime.js';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const hash=v=>crypto.createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v)).digest('hex');
const lfHash=p=>hash(fs.readFileSync(p,'utf8').replace(/\r\n/g,'\n'));
const authority=read('content/professional/ast-full-production/authority/ast-fp-r4-professional-semantic-authority-v1.json');
const contract=read('content/professional/ast-full-production/contracts/ast-fp-r4-professional-semantic-projection-contract-v1.json');
const fixture=read('content/professional/ast-full-production/fixtures/ast-fp-r4-professional-semantic-fixture-v1.json');
const registries=Object.fromEntries(Object.entries(authority.registryRefs).map(([k,p])=>[k,read(p)]));
const r2=read('content/professional/ast-full-production/acceptance/ast-fp-r2-human-admission-acceptance-v1.json');
for(const [key,path] of Object.entries(authority.registryRefs))assert.equal(lfHash(path),authority.registryDigests?.[key],`R4 registry digest drift: ${key}`);
const before=hash(fixture.inputProjection);
const result=buildAstProfessionalSemanticProjection({canonicalProjection:fixture.inputProjection,authority,registries});
assert.equal(hash(fixture.inputProjection),before,'R4 sidecar must not mutate Canonical AST v2 projection');
assert.equal(result.schemaVersion,AST_R4_SEMANTIC_SCHEMA_VERSION);
assert.equal(result.sourceProjectionId,fixture.inputProjection.projectionId);
assert.equal(result.boundary.sourceProjectionMutated,false);
assert.equal(result.boundary.customerMeaningAdmitted,false);
assert.equal(result.boundary.customerCutoverAllowed,false);
assert.equal(authority.status,'ENGINEERING_CANDIDATE_COMPLETE_NOT_HUMAN_ADMITTED');
assert.equal(authority.production.customerRuntimeUseAllowed,false);
assert.equal(authority.production.customerPublicationAllowed,false);
assert.equal(authority.production.productionAllowed,false);
assert.equal(authority.production.customerCutoverAllowed,false);
assert.equal(contract.rules.r4IsSidecarSuccessor,true);
assert.equal(contract.rules.r2DigestBoundAcceptanceNotReusedForR4,true);
assert.equal(r2.result.humanAccepted,16);assert.equal(r2.result.humanPending,0);
assert.equal(r2.boundaries.productionAllowed,false);

const expected=fixture.expected,R=result.sections.rulership,E=result.sections.elementModality;
assert.deepEqual(result.sections.angles.map(x=>x.code).sort(),[...expected.angleCodes].sort());
assert.ok(result.sections.angles.every(x=>x.candidateMeaning?.en&&x.candidateMeaning?.['zh-Hans']));
assert.equal(R.chartRuler.bodyCode,expected.chartRuler);
assert.equal(R.houseRulers.length,expected.houseRulerCount);
assert.deepEqual(R.finalDispositors,expected.finalDispositors);
const cycles=new Set(R.cycles.flatMap(x=>x.members));for(const code of expected.requiredCycleMembers)assert.ok(cycles.has(code),`Missing required dispositor cycle member ${code}`);
const pluto=R.planetaryDispositors.find(x=>x.bodyCode==='PLUTO');assert.equal(pluto.signCode,'SCORPIO');assert.equal(pluto.primaryRuler,'MARS');assert.equal(pluto.modernCoRulerAnnotation,'PLUTO');
const saturn=R.planetaryDispositors.find(x=>x.bodyCode==='SATURN');assert.equal(saturn.signCode,'AQUARIUS');assert.equal(saturn.primaryRuler,'SATURN');assert.equal(saturn.modernCoRulerAnnotation,'URANUS');
const neptune=R.planetaryDispositors.find(x=>x.bodyCode==='NEPTUNE');assert.equal(neptune.signCode,'PISCES');assert.equal(neptune.primaryRuler,'JUPITER');assert.equal(neptune.modernCoRulerAnnotation,'NEPTUNE');
assert.deepEqual(E.elementCounts,expected.elementCounts);assert.deepEqual(E.modalityCounts,expected.modalityCounts);
assert.equal(E.elementLeader.state,'TIED_NO_SINGLE_LEADER');assert.deepEqual(E.elementLeader.codes,['FIRE','WATER']);
assert.equal(E.modalityLeader.state,'TIED_NO_SINGLE_LEADER');assert.deepEqual(E.modalityLeader.codes,['CARDINAL','FIXED']);
const patternCodes=new Set(result.sections.aspectPatterns.map(x=>x.patternCode));for(const code of expected.patternsRequired)assert.ok(patternCodes.has(code),`Required R4 pattern missing: ${code}`);
assert.ok(result.sections.aspectPatterns.some(x=>x.patternCode==='T_SQUARE'&&x.apexBodyCode),'T-Square apex must be geometric and explicit');
const dynamics=new Set(result.sections.aspectDynamics.map(x=>x.state));for(const state of expected.aspectDynamicStatesRequired)assert.ok(dynamics.has(state),`R4 dynamics missing ${state}`);assert.ok(dynamics.has('EXACT'));
assert.ok(result.sections.aspectDynamics.every(x=>!('perfectionDate' in x)&&!('eventDate' in x)),'R4 dynamics may not calculate perfection/event dates');

// Missing speed must fail closed to UNDETERMINED, not fabricate motion direction.
const missingSpeed=structuredClone(fixture.inputProjection);const sun=missingSpeed.calculation.positions.find(x=>x.code==='SUN');sun.meta.speedLongitudeDegreesPerDay=null;
const missingResult=buildAstProfessionalSemanticProjection({canonicalProjection:missingSpeed,authority,registries});
assert.ok(missingResult.sections.aspectDynamics.filter(x=>x.fromCode==='SUN'||x.toCode==='SUN').every(x=>x.state==='UNDETERMINED'||x.state==='EXACT'));

// House/angle semantics are conditional; the rest of R4 stays structurally usable.
const noAngles=structuredClone(fixture.inputProjection);noAngles.calculation.structures=noAngles.calculation.structures.filter(x=>!['ANGLES','HOUSE_CUSPS'].includes(x.code));
const partial=buildAstProfessionalSemanticProjection({canonicalProjection:noAngles,authority,registries});
assert.equal(partial.availability.angles,'UNAVAILABLE_UPSTREAM');assert.equal(partial.availability.houseRulers,'UNAVAILABLE_UPSTREAM');assert.equal(partial.sections.rulership.chartRuler,null);assert.equal(partial.sections.rulership.houseRulers.length,0);assert.equal(partial.sections.elementModality.totalBodies,10);assert.ok(partial.sections.aspectPatterns.length>0);


// Dedicated Mystic Rectangle probe: 0/60/180/240 creates two oppositions,
// two trines and two sextiles without introducing a new aspect family.
const mystic=structuredClone(fixture.inputProjection);
for(const [code,longitude] of [['SUN',0],['MOON',60],['MERCURY',180],['VENUS',240]])mystic.calculation.positions.find(x=>x.code===code).value=longitude;
const kept=new Set(['SUN','MOON','MERCURY','VENUS']);mystic.calculation.structures.find(x=>x.code==='ASPECTS').items=[];
const ma=mystic.calculation.structures.find(x=>x.code==='ASPECTS').items;
const addEdge=(a,b,type,angle,limit)=>ma.push({code:`MYSTIC_${ma.length+1}`,value:angle,rawValue:null,meta:{fromCode:a,toCode:b,type,orb:0,authorizedOrbDegrees:limit,applyingState:'UNDETERMINED',aspectSetCode:'MAJOR_ASPECTS_V1'}});
addEdge('SUN','MERCURY','OPPOSITION',180,8);addEdge('MOON','VENUS','OPPOSITION',180,8);addEdge('SUN','MOON','SEXTILE',60,4);addEdge('MERCURY','VENUS','SEXTILE',60,4);addEdge('SUN','VENUS','TRINE',120,6);addEdge('MOON','MERCURY','TRINE',120,6);
const mysticResult=buildAstProfessionalSemanticProjection({canonicalProjection:mystic,authority,registries});
assert.ok(mysticResult.sections.aspectPatterns.some(x=>x.patternCode==='MYSTIC_RECTANGLE'),'Mystic Rectangle registry rule must execute');
assert.ok(!registries.aspectPatterns.patterns.some(x=>x.patternCode==='YOD'),'Yod must stay excluded until quincunx enters governed aspect scope');

// School guards: modern outer-planet annotations must not silently become chain authority.
const bad=structuredClone(registries);bad.rulership.schoolPolicy.chainAuthority='MODERN_RULERS_PRIMARY';assert.throws(()=>buildAstProfessionalSemanticProjection({canonicalProjection:fixture.inputProjection,authority,registries:bad}),/AST_R4_RULERSHIP_SCHOOL_INVALID/);

const acceptance=read('content/professional/ast-full-production/acceptance/ast-fp-r4-professional-semantic-expansion-acceptance-v1.json');
assert.equal(acceptance.status,'ENGINEERING_COMPLETE_R3_CERTIFICATION_AND_R4_HUMAN_ADMISSION_STILL_REQUIRED');
for(const [key,path] of Object.entries(acceptance.evidence.refs))assert.equal(lfHash(path),acceptance.evidence.lfNormalizedSha256[key],`R4 acceptance evidence digest drift: ${key}`);
assert.equal(acceptance.governance.customerCutoverAllowed,false);assert.equal(acceptance.governance.productionAllowed,false);

console.log(JSON.stringify({status:'PASS',workCode:'AST-FP-R4',schemaVersion:result.schemaVersion,angles:result.sections.angles.length,chartRuler:R.chartRuler.bodyCode,houseRulers:R.houseRulers.length,dispositorChains:R.dispositorChains.length,finalDispositors:R.finalDispositors,dispositorCycles:R.cycles.length,elementCounts:E.elementCounts,modalityCounts:E.modalityCounts,aspectPatterns:result.sections.aspectPatterns.length,patternTypes:[...patternCodes].sort(),aspectDynamics:result.sections.aspectDynamics.length,dynamicStates:[...dynamics].sort(),r2HumanAdmissionPreserved:`${r2.result.humanAccepted}/16`,mysticRectangleProbe:'PASS',yodExcludedUntilQuincunxGoverned:true,r4CustomerAdmission:false},null,2));

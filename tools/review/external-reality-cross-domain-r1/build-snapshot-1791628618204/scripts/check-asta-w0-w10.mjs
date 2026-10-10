import assert from 'node:assert/strict';
import fs from 'node:fs';
import {executeAndProjectMcd5CurrentRequest} from '../functions/method-client-delivery/canonical-projection-runtime-current.js';
import {executeAndProjectAstV2} from '../functions/method-client-delivery/canonical-projection-runtime-ast-v2.js';
const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));const t=p=>fs.readFileSync(p,'utf8');const exists=p=>fs.existsSync(p);
const paths={
 w0:'content/professional/ast-production/authority/ast-production-authority-reconciliation-v1.json',
 w1:'content/professional/ast-production/contracts/ast-production-scope-v1.json',
 w2:'content/professional/ast-production/authority/ast-astronomical-input-authority-v1.json',
 w3:'content/professional/ast-production/acceptance/ast-core-10-regression-acceptance-v1.json',
 w4:'content/professional/ast-production/policies/ast-node-production-policy-v1.json',
 w5:'content/professional/ast-production/policies/ast-angle-policy-v1.json',
 w6:'content/professional/ast-production/policies/ast-house-system-policy-v1.json',
 w7:'content/professional/ast-production/successors/ast-house-runtime-production-successor-v1.json',
 w8:'content/professional/ast-production/policies/ast-aspect-policy-v1.json',
 w9:'content/professional/ast-production/successors/ast-aspect-runtime-production-successor-v1.json',
 w10:'content/professional/ast-production/contracts/ast-canonical-projection-v2-contract.json',
 acceptance:'content/professional/ast-production/acceptance/ast-calculation-projection-scope-acceptance-v1.json',
 schema:'content/professional/ast-production/projection/canonical-method-projection-ast-v2.schema.json',
 fixture:'content/professional/ast-production/fixtures/ast-structural-scope-fixture-v1.json',
 policyV3:'content/professional/method-governance/successors/ast-production-policy-successor-v3.json',
 mpaScope:'content/professional/method-production-activation/successors/mpa-ast-structural-scope-successor-v1.json',
 mcdScope:'content/professional/method-client-delivery/successors/mcd-ast-structural-projection-successor-v2.json'
};
for(const p of Object.values(paths))assert(exists(p),`missing ${p}`);
const oldHouse=j('content/professional/core-method-runtime/ast-house-runtime-v1.json');assert.equal(oldHouse.execution.productionExecutionAllowed,false);assert.equal(oldHouse.governance.houseSystemFrozen,false);
const oldAspect=j('content/professional/core-method-runtime/ast-aspect-governance-v1.json');assert.equal(oldAspect.aspectSets[0].productionApproved,false);assert.equal(oldAspect.orbPolicies[0].productionApproved,false);
const oldPolicy=j('content/professional/method-governance/successors/ast-production-policy-successor-v1.json');assert.equal(oldPolicy.policy.housePolicy.included,false);assert.equal(oldPolicy.policy.aspectPolicy.included,false);assert.equal(oldPolicy.policy.nodePolicy.included,false);
const w0=j(paths.w0);assert.equal(w0.predecessors.every(x=>x.mutated===false),true);assert.equal(w0.rules.meaningActivationInBatch4Forbidden,true);
const scope=j(paths.w1);for(const f of ['CORE_10_PLANETS','TRUE_LUNAR_NORTH_NODE','ASCENDANT','WHOLE_SIGN_12_HOUSES','MAJOR_PLANETARY_ASPECTS'])assert(scope.includedFeatures.includes(f));assert.equal(scope.aspectBodyScope,'CORE_10_PLANETS_ONLY');
const inputAuthority=j(paths.w2);assert.equal(inputAuthority.ephemeris.version,'2.1.19');assert.equal(inputAuthority.observer.coordinatesRequiredForAnglesAndHouses,true);
const nodePolicy=j(paths.w4);assert.equal(nodePolicy.nodeConvention,'TRUE_NODE.V1');assert.equal(nodePolicy.meanNodeFallbackAllowed,false);
const anglePolicy=j(paths.w5);assert.deepEqual(anglePolicy.angles,['ASC','MC','DSC','IC']);
const housePolicy=j(paths.w6);assert.equal(housePolicy.houseSystem,'WHOLE_SIGN');assert.equal(housePolicy.implicitDefaultAllowed,false);
const aspectPolicy=j(paths.w8);assert.equal(aspectPolicy.aspects.length,5);assert.equal(aspectPolicy.luminaryOverridesAllowed,false);assert.equal(aspectPolicy.applyingSeparatingPolicy.deferred,true);
const contract=j(paths.w10);assert.equal(contract.publicBinding.currentApiRemainsV1,true);assert.equal(contract.boundaries.meaningAuthorityCreated,false);
const acceptance=j(paths.acceptance);for(const v of Object.values(acceptance.gates))assert.equal(v,true);assert.equal(acceptance.meaningReady,false);assert.equal(acceptance.capabilityAvailability,'LIMITED');
const policyV3=j(paths.policyV3);assert.equal(policyV3.predecessorsMutated,false);assert.deepEqual(policyV3.clientProjectionScope,['PLANET','NODE','ANGLE','HOUSE','ASPECT']);assert.equal(policyV3.boundaries.currentPublicApiPromoted,false);
const mpa=j(paths.mpaScope);assert.equal(mpa.mpaRemainsOnlyDispatchAuthority,true);assert.equal(mpa.meaningEligible,false);
const mcd=j(paths.mcdScope);assert.equal(mcd.currentPublicMethodExecuteBindingChanged,false);assert.equal(mcd.schemaVersionProduced,'PHI-OS-CANONICAL-METHOD-PROJECTION-v2.0.0');
const fixture=j(paths.fixture);const input=fixture.input;
const speeds={Sun:1,Moon:13,Mercury:-.2,Venus:1.1,Mars:.5,Jupiter:.08,Saturn:.03,Uranus:.01,Neptune:.006,Pluto:.004};const bodyNames=Object.keys(speeds);
const astronomyFixture=Object.freeze({Body:Object.freeze(Object.fromEntries(bodyNames.map(x=>[x,x]))),MakeTime(d){const ut=(d.getTime()-Date.UTC(2000,0,1,12))/86400000;return {ut,tt:ut+64/86400,date:d}},GeoVector(body,date){const day=(date.getTime()-Date.UTC(1989,10,15,14,50))/86400000;return {x:1,y:0,z:0,_lon:((bodyNames.indexOf(body)*30+232.5)+(speeds[body]||.1)*day+360)%360,_lat:bodyNames.indexOf(body)*.1}},Ecliptic(v){return {elon:v._lon,elat:v._lat}},SearchSunLongitude(_lon,start){return {date:start}},GeoMoonState(){return {x:1,y:0,z:0,vx:0,vy:1,vz:.1}},Rotation_EQJ_ECT(){return {}},RotateState(_r,s){return s}});
const loader=async()=>astronomyFixture;
// Historical W0-W10 scope is Whole Sign. Pin it explicitly; the current
// Placidus default is independently checked by the house reconciliation suite.
const request=(canonicalInput=input,id='ASTA-W10')=>({schemaVersion:'PHI-OS-MCD-METHOD-EXECUTION-REQUEST-v1.0.0',methodCode:'ASTROLOGY',methodVersion:'0.1.0',capability:'CALCULATION',purposeCode:'ASTA_W0_W10_CHECK',canonicalInput,executionParameters:{houseSystemCode:'WHOLE_SIGN_V1'},consentRecordId:'ASTA-FIXTURE-CONSENT',requestId:id});
const legacy=await executeAndProjectMcd5CurrentRequest(request(input,'ASTA-LEGACY'),{astronomyModuleLoader:loader});assert.equal(legacy.canonicalProjection.schemaVersion,'PHI-OS-CANONICAL-METHOD-PROJECTION-v1.0.0');assert.equal(legacy.canonicalProjection.calculation.positions.length,10);assert.equal(legacy.canonicalProjection.calculation.structures.length,0);
const a=await executeAndProjectAstV2(request(input,'ASTA-V2-A'),{astronomyModuleLoader:loader});const b=await executeAndProjectAstV2(request(input,'ASTA-V2-A'),{astronomyModuleLoader:loader});
assert.equal(a.canonicalProjection.schemaVersion,fixture.expected.projectionSchemaVersion);assert.equal(a.execution.executionStatus,'EXECUTED_BOUND_SCOPE');assert.equal(a.canonicalProjection.projection.status,'COMPLETE');assert.equal(a.canonicalProjection.calculation.positions.length,12);assert.deepEqual(a.canonicalProjection.calculation.positions.slice(0,10).map(x=>[x.code,x.value]),legacy.canonicalProjection.calculation.positions.map(x=>[x.code,x.value]));assert.deepEqual(a.canonicalProjection.calculation.positions.slice(-2).map(x=>x.code),fixture.expected.nodeCodes);assert.equal(a.canonicalProjection.projectionId,b.canonicalProjection.projectionId,'ASTA v2 projection must be deterministic for same request and policies');
const groups=new Map(a.canonicalProjection.calculation.structures.map(x=>[x.code,x]));for(const code of ['ANGLES','HOUSE_CUSPS','HOUSE_PLACEMENTS','ASPECTS'])assert(groups.has(code),`missing ${code}`);assert.deepEqual(groups.get('ANGLES').items.map(x=>x.code),fixture.expected.angleCodes);assert.equal(groups.get('HOUSE_CUSPS').items.length,12);assert.equal(groups.get('HOUSE_PLACEMENTS').items.length,12);assert.equal(groups.get('HOUSE_CUSPS').items[0].value%30,0);for(let i=1;i<12;i++)assert.equal((groups.get('HOUSE_CUSPS').items[i].value-groups.get('HOUSE_CUSPS').items[i-1].value+360)%360,30);const ang=Object.fromEntries(groups.get('ANGLES').items.map(x=>[x.code,x.value]));assert.ok(Math.abs((((ang.ASC+180)%360)-ang.DSC+360)%360)<1e-9);assert.ok(Math.abs((((ang.MC+180)%360)-ang.IC+360)%360)<1e-9);assert.ok(groups.get('ASPECTS').items.length>0);assert.equal(groups.get('ASPECTS').items.some(x=>String(x.meta.fromCode).includes('NODE')||String(x.meta.toCode).includes('NODE')),false);assert.equal(a.canonicalProjection.interpretation.included,false);assert.equal(a.canonicalProjection.interpretation.meaningAuthorityCreated,false);
const noCoords=structuredClone(input);noCoords.birthPlace.latitude=null;noCoords.birthPlace.longitude=null;const partial=await executeAndProjectAstV2(request(noCoords,'ASTA-V2-PARTIAL'),{astronomyModuleLoader:loader});assert.equal(partial.execution.executionStatus,'PARTIAL_EXECUTION');assert.equal(partial.canonicalProjection.projection.status,'PARTIAL');assert(partial.canonicalProjection.unknown.some(x=>x.code==='AST_HOUSES_ANGLES_NOT_CALCULATED'));assert.equal(partial.canonicalProjection.calculation.positions.length,12);assert.equal(partial.canonicalProjection.calculation.structures.some(x=>x.code==='ASPECTS'),true);assert.equal(partial.canonicalProjection.calculation.structures.some(x=>x.code==='HOUSE_CUSPS'),false);
const api=t('functions/api/method-execute.js');assert.equal(api.includes('canonical-projection-runtime-ast-v2.js'),false,'Batch 4 must not promote AST v2 to current public API before ASTA-W19');
const pcm=j('content/governance/production-capability-matrix/registries/production-capability-registry-v3.json');const ast=pcm.capabilities.find(x=>x.methodRuntime.pluginCode==='AST');assert.equal(ast.classification,'LIMITED_SCOPED');assert.equal(ast.meaningReady,false);assert.equal(ast.readingReady,false);
console.log('✓ ASTA-W0–W10 AST calculation/projection scope successor passed.');
console.log('  Core 10 remains byte-behavior compatible at the Canonical projection layer; True Nodes, Angles, Whole Sign Houses and Major Aspects are deterministic in CanonicalMethodProjection v2.');
console.log('  Historical W0-W10 was Limited; current availability is checked by ASTA-W11-W24 and the explicit Placidus successor suite.');

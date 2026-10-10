import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { trueNodeLongitudeFromEclipticState, createAstronomyEngineLunarNodeAdapter, AST_TRUE_NODE_CONVENTION } from '../functions/core-method-runtime/ast-lunar-node-adapter.js';
import { createPersonalStructureLunarNodeSuccessor } from '../functions/method-runtime/personal-structure/lunar-node-successor-runtime.js';
import { resolveGateLine } from '../functions/method-runtime/personal-structure/gate-line.js';

const root=process.cwd(); const read=async p=>JSON.parse(await fs.readFile(path.join(root,p),'utf8'));
const policy=await read('content/professional/method-governance/successors/ast-production-policy-successor-v2.json');
const binding=await read('content/method/personal-structure/canonical-astronomy-binding-v2.json');
const contract=await read('content/method/personal-structure/lunar-node-calculation-contract-v1.json');
const fixture=await read('content/method/personal-structure/fixtures/teresa-lunar-node-true-reference-v1.json');
const pkg=await read('package.json'); const lock=await read('package-lock.json');
const reconciliation=await read('content/reconciliation/mir/mir-3-lunar-node-successor-v1.json');
assert.equal(reconciliation.exitGate.trueNodeModelFrozen,true); assert.equal(reconciliation.exitGate.oldNodeNonePolicyPreserved,true);
assert.equal(policy.policy.nodePolicy.nodeConvention,'TRUE_NODE.V1'); assert.equal(policy.policy.nodePolicy.meanNodeFallbackAllowed,false);
assert.equal(binding.nodeAuthority.nodeConvention,'TRUE_NODE.V1'); assert.equal(binding.gateMapping.eclipticOffsetDeg,302);
assert.equal(contract.authority,'SHARED_CALCULATION_RUNTIME'); assert.equal(contract.gateMappingVersion,'PHI-OS-GATE-WHEEL-v1.0.0');
assert.equal(pkg.dependencies['astronomy-engine'],'2.1.19');
assert.equal(lock.packages['node_modules/astronomy-engine'].version,'2.1.19');
assert.equal(lock.packages['node_modules/astronomy-engine'].integrity,'sha512-8yWKNf7UeNbH458h3sAJ6ZgAjE5jTXp/mNNRFoC20j2SHwZIjAQeEsBB2Q3uCFRaTCCJRv33K2XhkhZQMXoX6w==');

// Geometry regression: construct an orbit whose ascending node is exactly omega.
function stateForNode(omegaDeg, inclinationDeg=5){const O=omegaDeg*Math.PI/180,i=inclinationDeg*Math.PI/180;const x=Math.cos(O),y=Math.sin(O),z=0;const vx=-Math.sin(O)*Math.cos(i),vy=Math.cos(O)*Math.cos(i),vz=Math.sin(i);return{x,y,z,vx,vy,vz};}
for(const omega of [0,41.25,123.456789,320.761158209905]) assert.ok(Math.abs(trueNodeLongitudeFromEclipticState(stateForNode(omega))-omega)<1e-9);

// Validation-only true-node reference -> frozen existing 302-degree Gate mapper.
for(const [layer,data] of [['PERSONALITY',fixture.personality],['DESIGN',fixture.design]]){
  const n=resolveGateLine(data.northNodeLongitudeDeg),s=resolveGateLine(data.southNodeLongitudeDeg);
  assert.deepEqual({gate:n.gate,line:n.line},data.expectedNorth,`${layer} north`);
  assert.deepEqual({gate:s.gate,line:s.line},data.expectedSouth,`${layer} south`);
}

// End-to-end successor: injected Astronomy Engine facade exercises GeoMoonState -> ECT -> node geometry.
const refByIso=new Map([[fixture.personality.instantUTC,fixture.personality],[fixture.design.instantUTC,fixture.design]]);
const fakeEngine={
 MakeTime:d=>d,
 GeoMoonState:t=>{const d=refByIso.get(new Date(t).toISOString().replace('.000Z','Z'));if(!d)throw Error('fixture instant');return stateForNode(d.northNodeLongitudeDeg);},
 Rotation_EQJ_ECT:()=>({identity:true}), RotateState:(_r,s)=>s
};
const adapter=createAstronomyEngineLunarNodeAdapter({astronomyEngine:fakeEngine});
const successor=createPersonalStructureLunarNodeSuccessor({lunarNodeAdapter:adapter});
const canonicalInput={birthDate:'1989-11-15',birthTime:'22:50:00',birthPlace:{displayName:'Taiping',countryCode:'MY',latitude:4.85,longitude:100.74},timezone:{iana:'Asia/Kuala_Lumpur',utcOffsetAtBirth:'+08:00',source:'PINNED_IANA_TZDB',confidence:'HIGH'},timeAccuracy:'EXACT',locale:'zh-Hans',consent:{},inputVersion:'MCD-3-CANONICAL-BIRTH-INPUT-v1.0.0'};
const baseOthers={MOON:20,MERCURY:30,VENUS:40,MARS:50,JUPITER:60,SATURN:70,URANUS:80,NEPTUNE:90,PLUTO:100};
const record=(recordId,recordType,payload)=>({authority:'SHARED_DATA_AUTHORITY',status:'verified',methodOwner:null,pluginOwner:null,recordId,recordType,recordVersion:'MIR-3-NODE-TEST-v1',payload});
const pSun=232.75,dSun=144.75;
const records=[record('IN','CANONICAL_BIRTH_INPUT',canonicalInput),record('PA','PERSONALITY_ASTRONOMY',{instantUTC:fixture.personality.instantUTC,longitudes:{SUN:pSun,EARTH:(pSun+180)%360,...baseOthers},astronomyRef:'TEST_AST'}),record('DA','DESIGN_ASTRONOMY',{instantUTC:fixture.design.instantUTC,longitudes:{SUN:dSun,EARTH:(dSun+180)%360,...baseOthers},astronomyRef:'TEST_AST'}),record('DM','DESIGN_MOMENT',{designMomentRef:'DM',designInstantUTC:fixture.design.instantUTC,personalitySunLongitude:pSun,designSunLongitude:dSun,solarArcDeg:88,solverTolerance:1e-7,iterationCount:17,fixedDaySubtractionUsed:false,lineage:{solver:'HDR_DESIGN_MOMENT_RUNTIME'}}),record('CONSENT','CONSENT',{valid:true})];
const result=await successor.calculate({calculationId:'MIR3-NODE-SUCCESSOR',inputRecords:records});
const acts=result.structure.output.activations;
assert.equal(acts.length,26);assert.equal(acts.filter(x=>x.status==='CALCULATED').length,26);assert.equal(acts.filter(x=>x.status==='UNKNOWN').length,0);
assert.equal(result.structure.output.nodeConvention,AST_TRUE_NODE_CONVENTION);
const find=(layer,body)=>acts.find(x=>x.layer===layer&&x.bodyCode===body);
assert.deepEqual([find('PERSONALITY','NORTH_NODE').gate,find('PERSONALITY','NORTH_NODE').line],[49,3]);
assert.deepEqual([find('PERSONALITY','SOUTH_NODE').gate,find('PERSONALITY','SOUTH_NODE').line],[4,3]);
assert.deepEqual([find('DESIGN','NORTH_NODE').gate,find('DESIGN','NORTH_NODE').line],[30,2]);
assert.deepEqual([find('DESIGN','SOUTH_NODE').gate,find('DESIGN','SOUTH_NODE').line],[29,2]);
assert.equal(result.nodeCalculation.runtimeCode,'SHARED_CALCULATION_RUNTIME');assert.equal(result.nodeCalculation.output.providerUsed,false);assert.equal(result.nodeCalculation.output.aiUsed,false);
console.log('✓ MIR-3 Lunar Node successor passed: TRUE_NODE.V1 frozen under AST authority; 302° mapper reused; 26/26 CALCULATED, 0 UNKNOWN in governed successor path.');
console.log('✓ Mean-node fallback forbidden; frozen MIR-3 predecessor remains independently regression-testable.');

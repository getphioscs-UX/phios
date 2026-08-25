import assert from 'node:assert/strict';
import fs from 'node:fs';
import {executeAndProjectAstV2} from '../functions/method-client-delivery/canonical-projection-runtime-ast-v2.js';
import {buildAstrologyCustomerReading} from '../functions/customer-projection/astrology-customer-reading.js';
import {projectAstrologyForCustomer} from '../functions/customer-projection/astrology-customer-projection.js';

const fixture=JSON.parse(fs.readFileSync('content/professional/ast-production/fixtures/ast-structural-scope-fixture-v1.json','utf8'));
const input=fixture.input;
const speeds={Sun:1,Moon:13,Mercury:-.2,Venus:1.1,Mars:.5,Jupiter:.08,Saturn:.03,Uranus:.01,Neptune:.006,Pluto:.004};
const names=Object.keys(speeds);
const engine=Object.freeze({
 Body:Object.freeze(Object.fromEntries(names.map(x=>[x,x]))),
 MakeTime(d){const ut=(d.getTime()-Date.UTC(2000,0,1,12))/86400000;return {ut,tt:ut+64/86400,date:d}},
 GeoVector(body,date){const day=(date.getTime()-Date.UTC(1989,10,15,14,50))/86400000;return {x:1,y:0,z:0,_lon:((names.indexOf(body)*30+232.5)+(speeds[body]||.1)*day+360)%360,_lat:names.indexOf(body)*.1}},
 Ecliptic(v){return {elon:v._lon,elat:v._lat}},
 SearchSunLongitude(_lon,start){return {date:start}},
 GeoMoonState(){return {x:1,y:0,z:0,vx:0,vy:1,vz:.1}},
 Rotation_EQJ_ECT(){return {}},
 RotateState(_r,s){return s}
});
const request={schemaVersion:'PHI-OS-MCD-METHOD-EXECUTION-REQUEST-v1.0.0',methodCode:'ASTROLOGY',methodVersion:'0.1.0',capability:'CALCULATION',purposeCode:'CX_R12R3A_ACCEPTANCE',canonicalInput:input,executionParameters:{},consentRecordId:'CX-R12R3A-CONSENT',requestId:'CX-R12R3A-AST'};
const {canonicalProjection}=await executeAndProjectAstV2(request,{astronomyModuleLoader:async()=>engine});
assert.equal(canonicalProjection.schemaVersion,'PHI-OS-CANONICAL-METHOD-PROJECTION-v2.0.0');
assert.equal(canonicalProjection.projection.status,'COMPLETE');
assert.equal(canonicalProjection.calculation.positions.length,12,'10 planets + north/south node required');
for(const code of ['NORTH_NODE','SOUTH_NODE'])assert(canonicalProjection.calculation.positions.some(x=>x.code===code),`${code} required`);
for(const code of ['ANGLES','HOUSE_CUSPS','HOUSE_PLACEMENTS','ASPECTS'])assert(canonicalProjection.calculation.structures.some(x=>x.code===code),`${code} required`);
assert.equal(canonicalProjection.calculation.structures.find(x=>x.code==='HOUSE_CUSPS').items.length,12);
assert.ok(canonicalProjection.calculation.structures.find(x=>x.code==='ASPECTS').items.length>0);
const zhReading=await buildAstrologyCustomerReading({canonicalProjection,locale:'zh-Hans'});
assert.equal(zhReading.executionCompleteness,'COMPLETE');
assert.ok(zhReading.meaningBundle.items.length>=30,'governed meaning bundle should be populated');
const customer=projectAstrologyForCustomer({canonicalProjection,meaningPayload:zhReading,locale:'zh-Hans'});
assert.equal(customer.bodies.length,12);
assert.equal(customer.houses.length,12);
assert.equal(customer.angles.length,4);
assert.ok(customer.aspects.length>0);
assert.ok(customer.interpretation.canonicalMeaningCount>=30);
assert.ok(customer.interpretation.statements.length>0,'human-readable canonical meaning statements required');
assert.equal(customer.bodies.find(x=>x.code==='SUN')?.label,'太阳');
assert.ok(customer.bodies.every(x=>x.label!=='结构项'));
assert.equal(customer.boundary.meaningCreatedHere,false);
assert.equal(customer.boundary.recommendationCreatedHere,false);

const api=fs.readFileSync('functions/api/customer-personal-reality.js','utf8');
assert(api.includes("endpoint:'/api/ast-structural-execute'"),'Personal Reality must call AST v2 successor endpoint');
assert(api.includes('buildAstrologyCustomerReading'),'Personal Reality must consume governed AST meaning/reading');
assert(api.includes('projectAstrologyForCustomer'),'Personal Reality must use AST-specific customer adapter');
const client=fs.readFileSync('assets/customer-ui/js/surfaces/personal-reality.js','utf8');
for(const token of ['renderAstrologyWheel','cx-ast-placement','Major structural relationships'])assert(client.includes(token),`client missing ${token}`);
const css=fs.readFileSync('assets/customer-ui/surfaces/personal-reality.css','utf8');
assert(css.includes('.cx-ast-wheel'));
const generic=fs.readFileSync('functions/customer-projection/method-customer-projection.js','utf8');
assert(generic.includes('publicMethodCode:m.publicMethodCode'),'generic method structure must preserve method identity for AST-specific rendering');

console.log('✓ CX-R12R3A Astrology Runtime Completion passed.');
console.log(`  AST v2: ${customer.bodies.length} positions · ${customer.houses.length} houses · ${customer.angles.length} angles · ${customer.aspects.length} major aspects · ${customer.interpretation.canonicalMeaningCount} governed meanings.`);
console.log('  Personal Reality now consumes AST structural successor → canonical meaning → AST customer adapter → natal structure visual.');

import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ACTIVATION_BODIES} from '../functions/method-runtime/personal-structure/activation-builder.js';
import {buildHdrTargetActivationReference} from '../functions/external-profile/hdr-target-activation-reference.js';
import {buildEcrTargetContextSnapshot} from '../functions/embodied-configuration/ecr-target-context-runtime.js';
import {resolveHdrTargetContextInput} from '../functions/api/customer-personal-reality.js';

const targetContext=Object.freeze({
  targetDate:'2026-09-01',
  targetTime:'09:15:00',
  targetTimezone:Object.freeze({iana:'Asia/Kuala_Lumpur',utcOffsetAtTarget:'+08:00'}),
  source:'CUSTOMER_EDITED'
});

const validated=resolveHdrTargetContextInput({hdrTargetContext:targetContext});
assert.equal(validated.targetDate,'2026-09-01');
assert.equal(validated.targetTime,'09:15:00');
assert.equal(validated.targetTimezone.iana,'Asia/Kuala_Lumpur');

const longitudes=Object.fromEntries(ACTIVATION_BODIES.map((body,index)=>[body,(index*23.75)%360]));
const hdr=await buildHdrTargetActivationReference({
  targetContext,
  confirmedProfile:{records:[{field:'activations',value:[{layer:'PERSONALITY',bodyCode:'SUN',gateLine:'41.1'}]}]},
  astronomyAdapter:{async calculateLongitudesAt(utcIso){return {utcIso,longitudes}}}
});
assert.equal(hdr.state,'AVAILABLE');
assert.equal(hdr.utcIso,'2026-09-01T01:15:00.000Z');
assert.equal(hdr.activations.length,ACTIVATION_BODIES.length);
assert.equal(hdr.boundary.targetMomentReferenceOnly,true);
assert.equal(hdr.boundary.confirmedChartChanged,false);
assert.equal(hdr.boundary.bodyGraphRebuilt,false);
assert.equal(hdr.boundary.variableOrPhsDerived,false);
assert.equal(hdr.boundary.persisted,false);

const projection={calculation:{structures:[
  {code:'ECR_CONTEXT',items:[{code:'CC01'}]},
  {code:'ECR_GRAMMAR',items:[{code:'G01'}]},
  {code:'ECR_QUESTION',items:[{code:'Q01'}]},
  {code:'ECR_CAPABILITIES',items:[{code:'R01'}]},
  {code:'ECR_MOTION',items:[{code:'M01'}]},
  {code:'ECR_CONFIGURATION',items:[{code:'H01'}]},
  {code:'ECR_ACTIVATION',items:[{code:'A01'}]}
]}};
const astronomyModuleLoader=async()=>({Body:{Sun:'Sun'},GeoVector(){return {x:1,y:0,z:0}},Ecliptic(){return {elon:123.456}}});
const ecr=await buildEcrTargetContextSnapshot({canonicalProjection:projection,targetContext,locale:'zh-Hans',astronomyModuleLoader});
assert.equal(ecr.state,'AVAILABLE');
assert.equal(ecr.utcIso,'2026-09-01T01:15:00.000Z');
assert.equal(ecr.boundary.targetReferenceOnly,true);
assert.equal(ecr.boundary.natalProjectionChanged,false);
assert.equal(ecr.boundary.persisted,false);
assert.ok(ecr.target.contextId);
assert.ok(ecr.target.grammarCode);

const page=fs.readFileSync('perspectives/personal/index.html','utf8');
const client=fs.readFileSync('assets/customer-ui/js/surfaces/personal-reality.js','utf8');
const api=fs.readFileSync('functions/api/customer-personal-reality.js','utf8');
const shadow=fs.readFileSync('functions/api/customer-external-profile-shadow-check.js','utf8');
assert.match(page,/data-cx-hd-target-reference/);
assert.match(client,/mountHdrTargetActivationReference/);
assert.match(client,/birthCrossCheckRequested/);
assert.match(api,/buildHdrTargetActivationReference/);
assert.match(api,/hdrTargetActivationReference/);
assert.match(shadow,/TARGET_REFERENCE_ONLY/);

console.log('✓ PPR shared timing runtime R2 passed.');
console.log('  One shared target can drive Astrology/BaZi/Zi Wei/Numerology/ECR and a Human Design target-activation reference without replacing the confirmed HD chart.');

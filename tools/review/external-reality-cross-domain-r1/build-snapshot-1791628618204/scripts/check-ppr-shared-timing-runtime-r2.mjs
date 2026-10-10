import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ACTIVATION_BODIES} from '../functions/method-runtime/personal-structure/activation-builder.js';
import {resolveGateLine} from '../functions/method-runtime/personal-structure/gate-line.js';
import {SCU_ENDPOINTS} from '../functions/method-runtime/personal-structure/scu-resolver.js';
import {buildHdrTransitOverlay} from '../functions/external-profile/hdr-target-activation-reference.js';
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
const transitGates=new Set(Object.values(longitudes).map(longitude=>resolveGateLine(longitude).gate));
const bridgeEndpoint=SCU_ENDPOINTS.find(item=>transitGates.has(item.gateA)!==transitGates.has(item.gateB));
assert(bridgeEndpoint,'test fixture must expose one natal/transit bridge endpoint');
const natalGate=transitGates.has(bridgeEndpoint.gateA)?bridgeEndpoint.gateB:bridgeEndpoint.gateA;
const transitGate=transitGates.has(bridgeEndpoint.gateA)?bridgeEndpoint.gateA:bridgeEndpoint.gateB;
const confirmedProfile={
  profileDigest:'a'.repeat(64),
  intakeId:'XPF-TRANSIT-TEST',
  records:[
    {field:'activations',value:[{layer:'DESIGN',bodyCode:'SUN',gateLine:`${natalGate}.1`},{layer:'PERSONALITY',bodyCode:'EARTH',gateLine:`${natalGate}.2`}]},
    {field:'definedCenters',value:[]}
  ]
};
const hdr=await buildHdrTransitOverlay({
  targetContext,
  confirmedProfile,
  astronomyAdapter:{async calculateLongitudesAt(utcIso){return {utcIso,longitudes}}}
});
assert.equal(hdr.state,'AVAILABLE');
assert.equal(hdr.mode,'CONFIRMED_NATAL_PLUS_TRANSIT');
assert.equal(hdr.utcIso,'2026-09-01T01:15:00.000Z');
assert.equal(hdr.transit.activations.length,ACTIVATION_BODIES.length);
assert(hdr.transit.activations.every(item=>item.layer==='TRANSIT_PERSONALITY'));
assert(hdr.natal.activations.some(item=>item.layer==='DESIGN'));
assert(hdr.natal.activations.some(item=>item.layer==='PERSONALITY'));
assert(hdr.natal.gateNumbers.includes(natalGate));
assert(hdr.transit.gateNumbers.includes(transitGate));
assert(hdr.overlay.combinedGateNumbers.includes(natalGate));
assert(hdr.overlay.combinedGateNumbers.includes(transitGate));
assert(hdr.overlay.temporaryChannels.some(item=>new Set([item.gateA,item.gateB]).has(natalGate)&&new Set([item.gateA,item.gateB]).has(transitGate)&&item.composition==='TRANSIT_COMPLETES_NATAL'));
assert.equal(hdr.overlay.transitObject.objectType,'TransitOverlay');
assert.equal(hdr.overlay.transitObject.natalMutationAllowed,false);
assert.equal(hdr.boundary.usesConfirmedNatalChart,true);
assert.equal(hdr.boundary.natalBaselineImmutable,true);
assert.equal(hdr.boundary.transitLayer,'TRANSIT_PERSONALITY');
assert.equal(hdr.boundary.transitDesignLayerCalculated,false);
assert.equal(hdr.boundary.temporaryStructureDerived,true);
assert.equal(hdr.boundary.natalTypeStrategyAuthorityProfileDefinitionRecomputed,false);
assert.equal(hdr.boundary.confirmedChartChanged,false);
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
assert.match(page,/Human Design transit overlay/);
assert.match(client,/mountHdrTransitOverlay/);
assert.match(client,/birthCrossCheckRequested/);
assert.match(client,/Design \+ Personality/);
assert.match(api,/buildHdrTransitOverlay/);
assert.match(api,/hdrTransitOverlay/);
assert.match(api,/hdrTargetActivationReference:hdrTransitOverlay/);
assert.match(shadow,/TRANSIT_OVERLAY_ONLY/);
assert.match(shadow,/transitOverlay/);

console.log('✓ PPR shared timing runtime R2 passed.');
console.log('  One shared target can drive Astrology/BaZi/Zi Wei/Numerology/ECR and a Human Design transit overlay that composes the current Personality layer with the customer-confirmed natal Design + Personality baseline.');

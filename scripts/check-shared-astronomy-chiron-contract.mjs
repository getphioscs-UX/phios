import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createSharedMinorBodyCapability,CHIRON_BODY_IDENTITY} from '../functions/method-client-delivery/production-adapters/shared-minor-body-capability.js';
assert.equal(CHIRON_BODY_IDENTITY.majorPlanet,false);
const request={bodyCode:'CHIRON',instantUtc:'2000-01-01T00:00:00.000Z'};
const absent=createSharedMinorBodyCapability();
assert.equal((await absent.positionAt(request)).calculationStatus,'EPHEMERIS_DATA_MISSING');
for(const instantUtc of ['bad','2000-02-30T00:00:00Z','2000-01-01T00:00:00','2000-01-01T00:00:00+08:00'])assert.equal((await absent.positionAt({...request,instantUtc})).calculationStatus,'INVALID_INPUT');
// Explicitly synthetic adapter tests: no astronomical accuracy/acceptance claimed.
const admission={status:'FROZEN',providerCode:'SYNTHETIC_TEST_ONLY',providerVersion:'1',startUtc:'1900-01-01T00:00:00Z',endUtc:'2100-01-01T00:00:00Z',coordinateFrame:'TEST_FRAME',licenseAccepted:true,runtimeAccepted:true,precisionAccepted:true,independentValidationAccepted:true,dataAccepted:true};
const raw={...request,calculationStatus:'SUPPORTED',julianDayUt:2451544.5,observerMode:'GEOCENTRIC',coordinateFrame:'TEST_FRAME',coordinateSystem:'ECLIPTIC',longitudeDeg:361,latitudeDeg:2,longitudeSpeedDegPerDay:-.1,distanceAu:12,providerCode:admission.providerCode,providerVersion:'1',ephemerisMode:'SYNTHETIC_TEST_ONLY'};
const adapter=fn=>createSharedMinorBodyCapability({admission,provider:{providerCode:admission.providerCode,providerVersion:'1',positionAt:fn}});
const supported=adapter(async()=>raw),a=await supported.positionAt(request),b=await supported.positionAt(request);
assert.deepEqual(a,b);assert.equal(a.position.longitudeDeg,1);assert.equal(a.position.retrograde,true);
assert.equal((await supported.positionAt({...request,instantUtc:'1800-01-01T00:00:00Z'})).calculationStatus,'UNSUPPORTED_DATE');
for(const value of [{...raw,latitudeDeg:91},{...raw,longitudeDeg:NaN},{...raw,distanceAu:0},{...raw,julianDayUt:0},{...raw,providerVersion:'other'}]){
 const result=await adapter(async()=>value).positionAt(request);assert.equal(result.calculationStatus,'PROVIDER_ERROR');assert.equal(result.position,null);
}
assert.equal((await adapter(async()=>{throw Error('provider private detail');}).positionAt(request)).position,null);
const missing=await adapter(async()=>({calculationStatus:'EPHEMERIS_DATA_MISSING'})).positionAt(request);assert.equal(missing.position,null);
const decision=JSON.parse(fs.readFileSync('content/astronomy/chiron-r1/provider/chiron-provider-decision-v1.json'));
assert.equal(decision.positionFreeze,'NOT_FROZEN');
console.log('PASS Chiron contract/status/digest tests with SYNTHETIC adapter only. Real provider selection, independent precision and position freeze NOT_RUN.');

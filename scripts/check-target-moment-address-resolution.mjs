import assert from 'node:assert/strict';
import fs from 'node:fs';
import {resolveTargetPlace} from '../functions/location/target-place-resolver.js';
import {onRequestPost as resolveTargetLocation} from '../functions/api/target-location-resolve.js';
import {currentCivilMoment} from '../assets/customer-ui/js/personal-inputs/target-moment-place-control.js';

const read=path=>fs.readFileSync(path,'utf8');
const page=read('perspectives/personal/index.html');
const client=read('assets/customer-ui/js/surfaces/personal-reality.js');
const host=read('assets/customer-ui/js/personal-inputs/method-input-extension-host.js');
const control=read('assets/customer-ui/js/personal-inputs/target-moment-place-control.js');
const astSurface=read('assets/customer-ui/js/specialists/ast/ast-specialist-surface-v3.js');

assert.match(page,/data-cx-target-use-now/);
assert.match(page,/name="ziweiTargetPlaceQuery"/);
assert.match(page,/name="ziweiTargetPlaceRef"/);
assert.match(page,/type="hidden" name="ziweiTargetTimezoneIana"/);
assert.match(page,/type="hidden" name="ziweiTargetUtcOffset"/);
assert.doesNotMatch(page,/<span[^>]*>目标时刻 UTC 偏移<\/span>/);
assert.match(client,/upgradeAndInstallTargetMomentControls/);
assert.match(client,/ziweiTargetPlaceRef/);
assert.doesNotMatch(client,/function seedZiweiTargetContext|DEVICE_DEFAULT|resolvedOptions\(\)\.timeZone|new Date\s*\(/);
assert.match(host,/upgradeAndInstallTargetMomentControls/);
assert.match(control,/\/api\/location-search/);
assert.match(control,/\/api\/target-location-resolve/);
assert.match(control,/useNow\?\.addEventListener\('change'/);
assert.equal((control.match(/\bfillNow\(/g)||[]).length,1,'fillNow must be called only by the explicit checkbox handler.');
assert.match(astSurface,/canonical route will call the existing transit calculation/);
assert.doesNotMatch(astSurface,/never calculates transits in the renderer\. A governed target context must arrive/);

const kuala=currentCivilMoment('Asia/Kuala_Lumpur',Date.parse('2026-08-30T14:00:00.000Z'));
assert.deepEqual(kuala,{date:'2026-08-30',time:'22:00'});

const originalFetch=globalThis.fetch;
globalThis.fetch=async input=>{
  const url=String(input?.url||input);
  if(url.includes('nominatim.openstreetmap.org/lookup'))return new Response(JSON.stringify([{name:'New York',lat:'40.7128',lon:'-74.0060',display_name:'New York, United States',address:{city:'New York',state:'New York',country:'United States',country_code:'us'},namedetails:{'name:en':'New York','name:zh':'纽约'}}]),{status:200,headers:{'content-type':'application/json'}});
  if(url.includes('timeapi.io/api/TimeZone/coordinate'))return new Response(JSON.stringify({timeZone:'America/New_York'}),{status:200,headers:{'content-type':'application/json'}});
  throw new Error(`UNEXPECTED_TARGET_LOCATION_FETCH:${url}`);
};
try{
  const location=await resolveTargetPlace('R175905',{targetDate:'2026-01-15',targetTime:'10:30',locale:'zh-Hans',env:{}});
  assert.equal(location.state,'CONFIRMED');
  assert.equal(location.targetTimezone.iana,'America/New_York');
  assert.equal(location.targetTimezone.utcOffsetAtTarget,'-05:00');
  assert.equal('utcOffsetAtBirth' in location.targetTimezone,false);
  const request=new Request('https://getphios.com/api/target-location-resolve',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({providerRef:'R175905',targetDate:'2026-07-15',targetTime:'10:30',locale:'en'})});
  const response=await resolveTargetLocation({request,env:{}});
  assert.equal(response.status,200);
  const payload=await response.json();
  assert.equal(payload.ok,true);
  assert.equal(payload.location.targetTimezone.utcOffsetAtTarget,'-04:00');
}finally{globalThis.fetch=originalFetch}

console.log('✓ Target moment address resolution passed.');
console.log('  Today/now is explicit opt-in; target address is confirmed; IANA timezone and date-specific UTC offset are automatic hidden transport; AST/Zi Wei calculations remain upstream of their renderers.');

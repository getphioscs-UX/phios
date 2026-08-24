import assert from 'node:assert/strict';
const base=String(process.env.PHIOS_STAGE16_BASE_URL||'').replace(/\/$/,'');
if(!/^https:\/\//.test(base))throw new Error('PHIOS_STAGE16_BASE_URL_HTTPS_REQUIRED');
const get=async p=>{const r=await fetch(base+p,{headers:{accept:'text/html,application/json'},redirect:'follow'});return {r,text:await r.text()}};
let x=await get('/');assert.equal(x.r.status,200);for(const marker of ['data-cir-root','My current situation','A relationship','Personal Runtime','Financial Reality'])assert.ok(x.text.includes(marker),`HOME_MARKER_MISSING_${marker}`);
x=await get('/ask?intent=CURRENT');assert.equal(x.r.status,200);assert.ok(x.text.includes('data-uxl-root'));
const route=await fetch(base+'/api/client-intent-route',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({question:'Why am I thinking about changing jobs?',taxonomyHint:'CURRENT'})});assert.equal(route.status,200);assert.match(route.headers.get('cache-control')||'',/no-store/i);const payload=await route.json();assert.equal(payload.ok,true);assert.equal(payload.route.surface,'ASK');assert.match(payload.route.href,/intent=CURRENT/);
x=await get('/personal-runtime');assert.equal(x.r.status,200);x=await get('/financial-reality');assert.equal(x.r.status,200);x=await get('/my-reality');assert.equal(x.r.status,200);x=await get('/reality-journey');assert.equal(x.r.status,200);
console.log('✓ STAGE 16 live public browser smoke passed.');

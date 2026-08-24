import assert from 'node:assert/strict';
const base=String(process.env.PHIOS_HEALTH_BASE_URL||'').replace(/\/$/,'');
assert.ok(base,'PHIOS_HEALTH_BASE_URL is required for live HRX acceptance');
assert.match(base,/^https:\/\//,'PHIOS_HEALTH_BASE_URL must use HTTPS');
const page=await fetch(`${base}/health-reality.html`,{redirect:'manual'});assert.equal(page.status,200);const html=await page.text();assert.match(html,/Health Reality/);assert.match(html,/does not diagnose/i);
const api=await fetch(`${base}/api/ask-phios-health`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({question:'I have had fatigue for several months',caseRef:'LIVE-SMOKE'})});assert.ok([200,400].includes(api.status));assert.match(api.headers.get('cache-control')||'',/no-store/);const payload=await api.json();assert.equal(payload?.governance?.diagnosis??payload?.plan?.governance?.diagnosisAllowed??false,false);
console.log('✓ HRX-W33 live browser/API smoke passed against',base);

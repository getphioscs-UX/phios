import assert from 'node:assert/strict';import fs from 'node:fs';
const html=fs.readFileSync('perspectives/personal/index.html','utf8'),client=fs.readFileSync('assets/customer-ui/js/surfaces/personal-reality.js','utf8'),api=fs.readFileSync('functions/api/customer-personal-reality.js','utf8');
assert.match(html,/data-cx-surface="PERSONAL_REALITY"/);assert.match(html,/Personal Reality/);for(const label of ['Birth date','Birth time','Birth place','Birth-based perspectives'])assert.ok(html.toLowerCase().includes(label.toLowerCase()),`Personal Reality missing ${label}`);
// CX-R12 historically owned a static Overview/Structure/Patterns result shell.
// The frozen PPR-R3 successor now delegates those labels and their IA to each
// approved specialist renderer, so the shared HTML must expose only the stable
// product mount and must not be forced back to the retired static vocabulary.
const pprR3=html.includes('data-cx-specialist-products')&&fs.existsSync('content/professional/personal-reality/r3/authority/ppr-r3-w10-successor-freeze-v1.json');
if(pprR3){
  const freeze=JSON.parse(fs.readFileSync('content/professional/personal-reality/r3/authority/ppr-r3-w10-successor-freeze-v1.json','utf8'));
  assert.equal(freeze.status,'FROZEN_PPR_R3_SPECIALIST_HOST');assert.match(html,/Start with the specialist product/);assert.match(client,/renderProductRoute\(view\.productRoute/);assert.match(api,/productRoute/);
}else{
  for(const label of ['Overview','Structure','Patterns'])assert.ok(html.toLowerCase().includes(label.toLowerCase()),`Personal Reality missing ${label}`);for(const [predecessor,successor] of [['Current Context','Context'],['Reality Connection','Reality Comparison'],['What remains open','Technical Details']])assert.ok([predecessor,successor].some(label=>html.toLowerCase().includes(label.toLowerCase())),`Personal Reality missing predecessor/successor label: ${predecessor} / ${successor}`);
}
assert.match(html,/Continue in My Reality/);assert.match(html,/data-cx-personal-handoff-consent/);assert.match(api,/validateCanonicalBirthInput/);assert.match(api,/projectMethodsForCustomer/);assert.match(api,/resolveBirthPlace/);assert.match(api,/runMethodExecute/);assert.match(api,/runZiWeiExecute/);
for(const bad of ['public-shell-v2','wpr-personal-runtime.css','runtime-spine.css','ast-production-meaning.css','bzr-production-meaning.css','num-production-meaning.css','zi-wei-dynamic-runtime.css'])assert.equal(html.includes(bad),false,`Personal Reality legacy presentation dependency: ${bad}`);
assert.match(client,/customer-personal-reality/);assert.match(client,/handoffToMyReality/);assert.match(client,/location-search/);assert.match(client,/location-resolve/);assert.equal(client.includes('canonicalProjection'),false,'Personal CX client must not bind raw method output');assert.match(api,/PERSONAL_REALITY_PROCESSING_CONSENT_REQUIRED/);
const acceptance=JSON.parse(fs.readFileSync('content/customer-experience-rebuild/acceptance/cx-r12-acceptance-v1.json','utf8'));assert.equal(acceptance.work,'CX-R12');assert.match(acceptance.status,/BROWSER.*PENDING|PENDING.*BROWSER/);
console.log('✓ CX-R12 code cutover remains intact: Personal Reality uses the CX shell, customer projection boundary, explicit consent and the new confirmed-place flow.');

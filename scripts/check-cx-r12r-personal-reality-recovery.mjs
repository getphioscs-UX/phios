import assert from 'node:assert/strict';import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');const html=read('perspectives/personal/index.html'),client=read('assets/customer-ui/js/surfaces/personal-reality.js'),css=read('assets/customer-ui/surfaces/personal-reality.css'),api=read('functions/api/customer-personal-reality.js'),assets=read('assets/customer-ui/js/assets.js');
assert.match(html,/data-cx-asset="ILL-004"/);assert.equal(html.includes('data-cx-asset="ILL-005"'),false,'Personal Reality must not use Financial Reality illustration');assert.match(html,/data-cx-asset-fallback/);assert.match(assets,/naturalWidth/);assert.match(assets,/addEventListener\('error'/);
for(const name of ['birthDate','birthTime','birthPlaceQuery'])assert.match(html,new RegExp(`name="${name}"`));for(const removed of ['name="birthTimezone"','name="utcOffsetAtBirth"','name="countryCode"','name="latitude"','name="longitude"'])assert.equal(html.includes(removed),false,`advanced location field leaked into primary intake: ${removed}`);
assert.match(html,/data-cx-place-results/);assert.match(html,/data-cx-place-confirmed/);assert.match(client,/providerRef/);assert.match(client,/Choose a confirmed birth place/);assert.match(api,/resolveBirthPlace\(body\.placeRef/);assert.match(api,/latitude:location\.latitude/);assert.match(api,/longitude:location\.longitude/);assert.match(api,/iana:location\.timezone\.iana/);assert.match(api,/utcOffsetAtBirth:location\.timezone\.utcOffsetAtBirth/);
assert.match(html,/data-cx-traditional-sex/);assert.match(client,/methods\.includes\('ziwei'\)/);assert.match(api,/traditionalCalculationSex/);
assert.match(client,/perspective.*ready/i);assert.match(client,/needs more information|需要补充资料/);
const pprR3=html.includes('data-cx-specialist-products')&&fs.existsSync('content/professional/personal-reality/r3/authority/ppr-r3-w10-successor-freeze-v1.json');
if(pprR3){assert.match(html,/data-cx-reality-choice/);assert.match(html,/BRING IT BACK TO REALITY/);assert.match(client,/renderProductRoute\(view\.productRoute/);}else assert.match(html,/Reality (?:Connection|Comparison)/);
assert(/一个人，从来不只有一种读法|同一个现实，需要不止一种读取方式/.test(html));assert(/不同传统，从一开始就在问不同的问题|data-ppr-r5-zone="method-taxonomy"/.test(html));
for(const token of ['min-width:0','overflow-wrap:anywhere','@media(max-width:620px)'])assert.ok(css.includes(token),`mobile repair missing ${token}`);
const acceptance=JSON.parse(read('content/customer-experience-rebuild/acceptance/cx-r12r-acceptance-v1.json'));assert.equal(acceptance.work,'CX-R12R');assert.equal(acceptance.productionHumanAcceptance,'PENDING');assert.equal(acceptance.legacyPhysicalDeleteAllowed,false);
console.log('✓ CX-R12R recovery passed: correct hero binding, simple intake, confirmed place resolution, conditional Zi Wei input, partial results, human copy and mobile repair are present.');

// CX-R12R2 is checked separately by the delivery validation; package wiring remains unchanged on this baseline.

import assert from 'node:assert/strict';import fs from 'node:fs';
const works=['w71','w72','w73'];const results=works.map(k=>JSON.parse(fs.readFileSync(`content/personal-reading/human-acceptance/review/${k}-human-review-results-v1.json`,'utf8')));const accepted=results.every(r=>r.status==='HUMAN_ACCEPTED_24_OF_24'&&r.accepted===24&&r.revised===0&&r.rejected===0&&r.pending===0);const blocker=JSON.parse(fs.readFileSync('content/personal-reading/production-cutover/successors/w76-w88-human-gate-blocker-v1.json','utf8'));
const forbiddenWhenPending=[
 'content/personal-reading/production-cutover/acceptance/ppr-r2-production-acceptance-v1.json',
 'content/personal-reading/production-cutover/freeze/personal-reading-report-production-freeze-v2.json',
 'content/personal-reading/production-cutover/freeze/paid-narrative-production-freeze-v1.json',
 'content/personal-reading/continuity/registries/continuity-subscription-product-registry-v1.json',
 'content/personal-reading/continuity/freeze/continuity-subscription-product-freeze-v1.json'
];
if(!accepted){assert.equal(blocker.status,'BLOCKED_BY_W71_W73_HUMAN_ACCEPTANCE');assert.equal(blocker.customerCutoverAllowed,false);assert.equal(blocker.productionFreezeAllowed,false);assert.equal(blocker.continuityProductAuthorityAllowed,false);for(const p of forbiddenWhenPending)assert.equal(fs.existsSync(p),false,`Human gate pending but downstream authority exists: ${p}`);console.log('✓ W76-W88 gate is correctly BLOCKED: W71-W73 Human acceptance is pending; no cutover/freeze/Continuity authority has been smuggled in.');}
else{console.log('✓ W71-W73 Human gate is accepted; W76 becomes eligible, but this checker does not itself execute cutover.');}

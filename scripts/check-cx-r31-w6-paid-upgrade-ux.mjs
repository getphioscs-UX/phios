import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(read(p));
const c=json('content/customer-experience-rebuild/cx-r31/contracts/cx-r31-w6-paid-upgrade-ux-v1.json');
const html=read('knowledge/ask/index.html');
const client=read('assets/customer-ui/js/surfaces/contextual-ask.js');
assert.equal(c.status,'COMPLETE');
assert.equal(c.hardDeadEndAllowed,false);
assert.equal(c.clientMayInventPrice,false);
assert.equal(c.paidDoesNotChangeTruth,true);
for(const value of ['NEW_STRUCTURE','NEW_COMBINATION','NEW_TIMING','NEW_CONTEXT','NEW_CONTINUITY'])assert.ok(c.requiredValueExplanation.includes(value),`missing paid value ${value}`);
for(const marker of ['data-cx-paid-upgrade','data-cx-paid-upgrade-value','data-cx-paid-upgrade-cost','data-cx-paid-continue-knowledge','Continue with Knowledge','data-cx-paid-account-options','Account options','new structure, combination, timing, context, or continuity'])assert.ok(html.includes(marker),`paid upgrade UI missing ${marker}`);
for(const marker of ['function showPaidUpgrade','function hidePaidUpgrade','function isPaidBoundary','paidUpgradeContinueKnowledge',"form.elements.contextKnowledge.checked=true"])assert.ok(client.includes(marker),`paid upgrade client missing ${marker}`);
for(const forbidden of c.forbiddenCopy){assert.equal(html.includes(forbidden),false,`forbidden paid copy in HTML: ${forbidden}`);assert.equal(client.includes(forbidden),false,`forbidden paid copy in client: ${forbidden}`);}
assert.ok(html.indexOf('Continue with Knowledge')<html.indexOf('Account options'),'fail-soft knowledge continuation should remain a first-class option');
console.log('✓ CX-R31-W6 Paid Upgrade UX passed: no hard dead-end, concrete depth value, Knowledge continuation and account options preserved.');

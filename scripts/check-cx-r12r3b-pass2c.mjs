import assert from 'node:assert/strict';import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));const B='content/customer-experience-rebuild';
const a=read(`${B}/acceptance/cx-r12r3b-pass2c-machine-reacceptance-v1.json`);const p=read(`${B}/production/cx-r12r3b-production-gates-v2.json`);
assert.equal(a.status,'POST_HUMAN_MACHINE_REACCEPTED_DEPLOYMENT_READY');assert.equal(a.checks.aggregateExitCode,0);assert.equal(a.claims.humanAccepted,true);assert.equal(a.claims.machineReacceptedAfterHumanReview,true);assert.equal(a.claims.liveBrowserAccepted,false);assert.equal(a.claims.fullProduction,false);
assert.equal(p.prerequisites.machineReacceptanceAfterHumanReview,true);assert.equal(p.prerequisites.liveBrowserAccepted,false);for(const m of Object.values(p.controlledProduction)){assert.equal(m.status,'READY_FOR_EXACT_DEPLOYMENT_AND_LIVE_BROWSER');assert.equal(m.publicRunAllowed,false)}
console.log('✓ CX-R12R3B PASS2C post-human machine reacceptance passed.');console.log('  Exact deployment + live browser + 5-minute ordinary-reader evidence remain required before production promotion/freeze.');

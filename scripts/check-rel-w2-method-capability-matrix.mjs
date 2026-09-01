import assert from 'node:assert/strict';
import fs from 'node:fs';
const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const m=j('content/personal-reading/relationship/registries/relationship-method-capability-matrix-v1.json');
assert.equal(m.work,'REL-W2');assert.equal(m.baselineCommit,'4b2688665e0875f6a628c2b81d1991a14ea62a49');assert.deepEqual(m.methods.map(x=>x.methodId),['AST','BZR','ZWR','NUM','ECR','HD']);
const states=new Set(m.capabilityStates),allowed=['SUPPORTED','PARTIAL','NOT_APPLICABLE','SOURCE_PENDING','AUTHORITY_PENDING','NOT_SUPPORTED'];assert.deepEqual([...states],allowed);
for(const row of m.methods){for(const key of ['personBInputSupported','personBIndependentCalculationSupported','personBIndependentReadingSupported','relationshipCompositionSupported','relationshipTimingSupported'])assert.ok(states.has(row[key]),`${row.methodId}.${key}`);assert.equal(typeof row.exactBirthTimeRequired,'boolean');assert.equal(typeof row.unknownBirthTimePartialSupported,'boolean');assert.equal(typeof row.birthPlaceRequired,'boolean');assert.equal(typeof row.customerPublishable,'boolean');for(const ref of [row.relationshipCompositionAuthorityRef,row.relationshipTimingAuthorityRef].filter(Boolean))assert.ok(fs.existsSync(ref),`${row.methodId} missing ${ref}`);}
const by=id=>m.methods.find(x=>x.methodId===id);
const rlr=j('content/governance/multi-lens/successors/multi-lens-capability-state-registry-v6.json');assert.equal(rlr.records.find(x=>x.pluginCode==='AST').subCapabilities.RELATIONAL.availability,'AVAILABLE');assert.equal(by('AST').relationshipCompositionSupported,'SUPPORTED');
assert.equal(rlr.records.find(x=>x.pluginCode==='BZR').subCapabilities.RELATIONAL_CONTEXT.availability,'AVAILABLE_CONTEXTUAL_ONLY');assert.equal(by('BZR').relationshipCompositionSupported,'PARTIAL');
assert.equal(rlr.records.find(x=>x.pluginCode==='ZWR').subCapabilities.RELATIONAL.availability,'AVAILABLE_CONTEXTUAL_ONLY');assert.equal(by('ZWR').relationshipCompositionSupported,'PARTIAL');
const num=j('content/professional/num-production/expansion-r9-r18/authority/num-r16-relationship-authority-v1.json');assert.equal(num.customerPublishable,true);assert.equal(num.compatibilityJudgmentAuthorityGranted,false);assert.equal(by('NUM').relationshipCompositionSupported,'PARTIAL');
assert.equal(by('ECR').relationshipCompositionSupported,'AUTHORITY_PENDING');
const hd=j('content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/relationship/HD-PRO-R3-W18-single-chart-relationship-contract-v1.json');assert.equal(hd.secondChartAccepted,false);assert.equal(by('HD').personBIndependentCalculationSupported,'NOT_SUPPORTED');assert.equal(by('HD').personBIndependentReadingSupported,'SUPPORTED');assert.equal(by('HD').relationshipCompositionSupported,'NOT_SUPPORTED');
assert.ok(m.methods.some(x=>x.personBInputSupported==='SUPPORTED'&&x.relationshipCompositionSupported!=='SUPPORTED'),'Person-B input must not imply relationship composition admission');
console.log('✓ REL-W2 Method Capability Matrix passed: AST current structural relation supported; BZR/ZWR/NUM remain partial; ECR authority-pending; HD dual-chart not supported; Person-B input never auto-grants relationship composition.');

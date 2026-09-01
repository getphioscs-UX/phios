import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const o=read('content/personal-reading/relationship/successors/rel-method-capability-promotion-overlay-v2.json');
const c=read('content/personal-reading/relationship/successors/rel-method-authority-current-successor-v3.json');
const a=read('content/personal-reading/relationship/audit/relationship-product-completeness-audit-v3.json');
const h=read('content/personal-reading/relationship/hd-r1/acceptance/HD-REL-R1-W8-production-admission-v1.json');
assert.equal(o.status,'SIX_METHOD_REL_W4_HUMAN_ADMITTED_OVERLAY_ACTIVE');for(const m of ['AST','NUM','BZR','ZWR','ECR','HD']){assert.equal(o.effectiveMethods[m].relationshipCompositionSupported,'SUPPORTED');assert.equal(o.effectiveMethods[m].humanAdmissionStatus,'ACCEPTED_24_OF_24')}
assert.equal(o.relW5Eligibility.allSixMethodSpecificLanesReconciled,true);assert.equal(o.relW5Eligibility.relW5MayStart,true);assert.equal(o.productBoundary.wholeRelationshipProductCustomerPublished,false);
assert.equal(c.status,'SIX_METHOD_REL_W4_AUTHORITY_HUMAN_ADMITTED');assert.equal(Object.keys(c.admittedMethods).length,6);assert.deepEqual(c.totalHumanAcceptance,{required:144,accepted:144,pending:0,rejected:0});assert.equal(c.relW5Eligible,true);assert.equal(c.nextGate,'REL_W5_RELATIONSHIP_CURRENT_REALITY');assert.equal(c.wholeRelationshipProductCustomerPublicationAllowed,false);assert.ok(fs.existsSync(c.admittedCompositionRuntime));
assert.equal(a.status,'SIX_METHOD_REL_W4_HUMAN_ADMITTED__REL_W5_READY_NOT_STARTED');assert.equal(a.summary.relW4HumanAcceptedAcrossAdmittedMethods,144);assert.equal(a.summary.methodCompositionHumanAdmitted.length,6);assert.equal(a.summary.relationshipCurrentReality,'READY_FOR_REL_W5');assert.equal(a.productBoundary.relW5MayStart,true);assert.equal(a.productBoundary.relW5StartedByThisWork,false);assert.equal(a.summary.fullRelationshipProductReady,false);
assert.equal(h.status,'PRODUCTION_ADMITTED_CUSTOMER_PUBLISHABLE');assert.equal(h.authorityEffect.relW5Eligible,true);assert.equal(h.authorityEffect.wholeRelationshipProductCustomerPublished,false);
console.log('✓ REL-W4 all-method current reconciliation passed: AST/NUM/BZR/ZWR/ECR/HD are 144/144 Human-admitted; REL-W5 is unblocked but the full relationship product is not yet customer-published.');

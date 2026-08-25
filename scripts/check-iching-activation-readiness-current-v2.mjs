import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const read=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const sha=path=>crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
assert.equal(sha('scripts/check-iching-activation-readiness.mjs'),'1434721e45b30c69e57e4377b7ba1a0d833426cf80c91e79bdd2215aafb59010');
assert.equal(sha('scripts/check-iching-current-v2.mjs'),'9431c9c373942fe728b87c691044e43cd9e88cc9199562c3c56cc026ca48253e');
assert.equal(sha('scripts/check-iching-product-runtime-current-v2.mjs'),'1839587f547a443bdcc46df57d578b2eebeb954f0eaadf9222fa39c8c88dc640');

const predecessor=read('content/production/symbolic-method/reconciliation/iching-production-activation-readiness-v1.json');
const current=read('content/production/symbolic-method/reconciliation/iching-production-activation-readiness-v2.json');
assert.equal(sha('content/production/symbolic-method/reconciliation/iching-production-activation-readiness-v1.json'),'1140488770c286bef966cb44236b202e5d3830db64c15b03be61e869d03a28a7');
assert.equal(current.successorOf,'content/production/symbolic-method/reconciliation/iching-production-activation-readiness-v1.json');
assert.equal(current.historicalPredecessorMutated,false);
assert.equal(predecessor.contentReadiness.sourceBoundCommentaryCoverage,'2/64');
assert.equal(current.contentReadiness.sourceBoundCanonicalTextCoverage,'64/64');
assert.equal(current.contentReadiness.sourceBoundCanonicalLineWitnessCoverage,'384/384');
assert.equal(current.contentReadiness.canonicalTextIsNotEditorialInterpretation,true);
assert.equal(current.contentReadiness.humanInterpretiveReviewComplete,false);
assert.equal(current.externalGates.acceptedHumanSessions,0);
assert.equal(current.currentAuthority.fullyActivated,false);
assert.equal(current.currentAuthority.publicRunAllowed,false);
assert.equal(current.currentAuthority.productionCapabilityPromoted,false);

console.log('✓ ICH-PROD-W18 current activation readiness passed: canonical text 64/64 and canonical lines 384/384.');
console.log('  Frozen v2 evidence remains unchanged; its obsolete shared-context digest is superseded, not rewritten.');
console.log('  This does not grant production activation; human, identity/D1, browser, SHA and deployment-jurisdiction gates remain pending.');

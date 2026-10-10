import assert from 'node:assert/strict';
import fs from 'node:fs';
const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const i=j('content/product-visual-platform-r1/phase13/contracts/pvp-r1-vis-w37-real-evidence-intake-contract-v1.json');
const t=j('content/product-visual-platform-r1/phase13/pilot/pvp-r1-vis-w37-real-evidence-template-v1.json');
const required=['click','unlock','purchase','upgrade','reality_return'];
assert.equal(i.status,'REAL_EVIDENCE_COLLECTION_READY');
assert.equal(i.publicRepoPrivacyBoundary.privateProofMustRemainOutsidePublicRepo,true);
assert.equal(i.publicRepoPrivacyBoundary.publicArtifactStoresOnlyProofDigestAndNonSensitiveMetadata,true);
assert.deepEqual(Object.keys(i.signalRules),required);
assert.equal(t.events.length,5);
assert.deepEqual(t.events.map(x=>x.signal),required);
for(const e of t.events){assert.equal(e.real,true);assert.equal(e.productionEnvironment,true);assert.equal(e.synthetic,false);assert.equal(e.controlledReplay,false);assert.equal(e.testTransaction,false);assert.equal(e.ownerVerified,true);assert.equal(e.privateEvidenceRetainedOutsideRepo,true);assert.equal(e.proofDigestSha256,'')}
console.log('✓ PVP W37 real-evidence collection readiness passed: all five signals have privacy-safe digest-only intake paths.');

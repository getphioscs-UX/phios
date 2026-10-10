import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const f=JSON.parse(fs.readFileSync('content/personal-reading/relationship/freeze/rel-w4-all-method-current-freeze-v1.json','utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
assert.equal(f.status,'SIX_METHOD_REL_W4_HUMAN_ADMITTED_CURRENT_FROZEN');assert.deepEqual(f.humanAcceptance,{required:144,accepted:144,hdAccepted:24,hdAdmissionRef:'content/personal-reading/relationship/hd-r1/review/HD-REL-R1-W7-human-admission-v1.json'});assert.equal(f.nextGate,'REL_W5_RELATIONSHIP_CURRENT_REALITY');
for(const x of f.frozenArtifacts){assert.equal(fs.existsSync(x.path),true,`missing frozen artifact ${x.path}`);assert.equal(sha(x.path),x.sha256,`current REL-W4 freeze drift ${x.path}`)}
assert.equal(f.policy.historicalFrozenOwnersNotRewritten,true);assert.equal(f.policy.futureChangesRequireVersionedSuccessor,true);assert.equal(f.policy.relationshipMeaningChangesRequireFreshHumanReview,true);assert.equal(f.policy.noCompatibilityScore,true);assert.equal(f.policy.hdBirthCalculationAuthorityCreated,false);assert.equal(f.policy.pentaStillSeparate,true);assert.equal(f.policy.bg5StillSeparate,true);
console.log(`✓ REL-W4 all-method current freeze passed: ${f.frozenArtifacts.length} current artifacts match digests; 144/144 Human acceptance frozen before REL-W5.`);

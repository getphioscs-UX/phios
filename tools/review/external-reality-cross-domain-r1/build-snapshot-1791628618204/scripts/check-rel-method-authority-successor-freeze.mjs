import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const f=JSON.parse(fs.readFileSync('content/personal-reading/relationship/freeze/rel-method-authority-successor-freeze-v1.json','utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
assert.equal(f.status,'BZR_ZWR_ECR_HUMAN_ADMITTED_SUCCESSOR_FROZEN');
assert.equal(f.humanAcceptance.status,'72_OF_72_ACCEPT');
assert.equal(f.parallelHDPolicy.hdArtifactsFrozenHere,false);assert.equal(f.parallelHDPolicy.hdAuthorityChangedHere,false);
for(const x of f.frozenArtifacts){assert.equal(fs.existsSync(x.path),true,`missing frozen artifact ${x.path}`);assert.equal(sha(x.path),x.sha256,`freeze drift ${x.path}`)}
assert.equal(f.successorPolicy.noCompatibilityScore,true);assert.equal(f.successorPolicy.noHiddenPartnerState,true);assert.equal(f.successorPolicy.noGuaranteedOutcome,true);
console.log(`✓ REL BZR/ZWR/ECR successor freeze passed: ${f.frozenArtifacts.length} artifacts match frozen digests; HD parallel lane untouched.`);

import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const sha256 = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const read = path => JSON.parse(fs.readFileSync(path, 'utf8'));

const expected = Object.freeze({
  'content/web/homepage/hpc2/contracts/hpc2-w5-phios-runtime-composition-contract-v1.json': '20cfd8990349e49cb28bd533646759e16042f1b0b4e859ff301ad36afdcf5c5c',
  'content/web/homepage/hpc2/evidence/hpc2-w5-phios-runtime-composition-audit-v1.json': '4d685f5197976c70768ab3d6f461433b2f3ab1a90d7119efc38dc493bdffda08',
  'content/web/homepage/hpc2/acceptance/hpc2-w5-phios-runtime-composition-acceptance-v1.json': '81eaf97711a2cea7b7ce2c5aa5361d76d5b3f6cfdcfdddd1b4737d2784a1c294',
  'content/web/homepage/hpc2/freeze/hpc2-w5-phios-runtime-composition-freeze-v1.json': '046feb91025475aa76be7eccbe01c17a6797017075d3cf1e2dcb3606d3fc9439',
  'scripts/check-hpc2-w5.mjs': '204747fc5b9c9200965e9f39f06b2e89e0c334edda9a7b8f3f2675646d1fb703'
});

for (const [path, digest] of Object.entries(expected)) {
  assert.ok(fs.existsSync(path), `Missing frozen HPC2-W5 artifact: ${path}`);
  assert.equal(sha256(path), digest, `Frozen HPC2-W5 artifact drift: ${path}`);
}

const contract = read('content/web/homepage/hpc2/contracts/hpc2-w5-phios-runtime-composition-contract-v1.json');
const freeze = read('content/web/homepage/hpc2/freeze/hpc2-w5-phios-runtime-composition-freeze-v1.json');
assert.equal(contract.work, 'HPC2-W5');
assert.equal(contract.askBoundary.homepageConsumerState, 'MISSING_PENDING_CKA');
assert.equal(freeze.status, 'HPC2_W5_H04_REPOSITORY_COMPOSITION_FROZEN_ADDITIVE_SUCCESSOR_REQUIRED');
assert.equal(freeze.successorRules.w6MayNotActivateAskHomepageConsumerWithoutCkaEvidence, true);

console.log('HPC2-W5 frozen artifacts: ACCEPTED');
console.log('  historical contract, evidence, acceptance, freeze and checker remain byte-exact');
console.log('  current Homepage state is evaluated only by check:hpc2-w5 successor');


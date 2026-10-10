import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const manifest=JSON.parse(fs.readFileSync('content/production/symbolic-method/freeze/iching-limited-production-implementation-freeze-v2.json','utf8'));
const sha=path=>crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
assert.equal(manifest.schemaVersion,'PHI-OS-ICHING-LIMITED-PRODUCTION-IMPLEMENTATION-FREEZE-v2.0.0');
assert.equal(manifest.successorOf,'content/production/symbolic-method/freeze/iching-limited-production-implementation-freeze-v1.json');
assert.equal(manifest.historicalPredecessorMutated,false);
for(const item of manifest.artifacts){assert.equal(sha(item.path),item.sha256,`Limited Production v2 artifact drift: ${item.path}`);}
for(const item of manifest.historicalPredecessorWitnesses){assert.equal(sha(item.path),item.sha256,`Historical Limited Production v1 predecessor drift: ${item.path}`);}
assert.equal(manifest.acceptance.edgeRedirectMode,'manual');
assert.equal(manifest.acceptance.fullProductionAllowed,false);
assert.equal(manifest.deploymentBoundary.liveLimitedProductionClaimed,false);
console.log('✓ ICH-PROD-W29 Limited Production implementation freeze v2 passed.');
console.log('  v1 remains byte-preserved; v2 edge-fetch successor is frozen and still requires a new deployed SHA + live acceptance before LIMITED_PRODUCTION may be claimed.');

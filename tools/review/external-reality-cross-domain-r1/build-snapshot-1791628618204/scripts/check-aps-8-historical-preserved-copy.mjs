import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const freeze=read('content/production/article-simplification/freeze/aps-8-production-freeze-v1.json');
const rec=read('content/production/bilingual-final-approval/contracts/bfa-aps8-operator-successor-reconciliation-v1.json');
assert.equal(freeze.status,'FROZEN');
assert.equal(sha(rec.historicalFrozenImplementations.articleBatch.preservedCopyPath),freeze.digests['scripts/article-batch.mjs']);
assert.equal(sha(rec.historicalFrozenImplementations.articlePublish.preservedCopyPath),freeze.digests['scripts/article-publish.mjs']);
for(const [p,d] of Object.entries(freeze.digests)){
  if(['scripts/article-batch.mjs','scripts/article-publish.mjs'].includes(p)) continue;
  assert.equal(sha(p),d,`APS-8 historical frozen authority drift: ${p}`);
}
assert.equal(rec.historicalFrozenImplementations.historicalBytesPreserved,true);
assert.equal(rec.historicalFrozenImplementations.historicalAuthorityInvalidated,false);
console.log('✓ APS-8 historical authority remains reproducible from byte-identical preserved operator implementations.');
console.log('✓ BATCH-001 history is preserved; BFA is an additive BATCH-002+ successor, not a rewrite.');

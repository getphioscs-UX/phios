import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
const readJson = async path => JSON.parse(await fs.readFile(path, 'utf8'));
const sha = async path => crypto.createHash('sha256').update(await fs.readFile(path)).digest('hex');
const paths = {
  audit: 'content/professional/canonical-asset-runtime/audits/car-baseline-audit-v1.json',
  boundary: 'content/professional/canonical-asset-runtime/audits/car-authority-boundary-v1.json',
  reconciliation: 'content/professional/canonical-asset-runtime/audits/car-existing-article-runtime-reconciliation-v1.json',
  freeze: 'content/professional/canonical-asset-runtime/freeze/car-w0-freeze-v1.json'
};
const [audit,boundary,reconciliation,freeze] = await Promise.all(Object.values(paths).map(readJson));
assert.equal(audit.work,'CAR-W0');
assert.equal(audit.baselineCommit,'f85bf43bf2d3069700008ac2c9f4b0ffab20f47a');
assert.ok(audit.sourceSystems.length >= 14);
for (const record of audit.sourceSystems) {
  assert.equal(record.exists,true,`${record.path} missing`);
  assert.equal(await sha(record.path),record.sha256,`${record.path} changed after audit`);
}
assert.equal(boundary.invariants.pjaRebuilt,false);
assert.equal(boundary.invariants.publishedArticleRuntimeRebuilt,false);
assert.equal(boundary.invariants.providerRoutingRebuilt,false);
assert.equal(boundary.invariants.assetRegistryIsKnowledgeAuthority,false);
assert.equal(boundary.invariants.canonicalAssetMayRewriteKnowledge,false);
assert.equal(boundary.invariants.canonicalAssetMayPublishArticle,false);
assert.equal(boundary.invariants.providerMayCreatePublishedContent,false);
assert.equal(boundary.invariants.duplicateSourceOfTruthCreated,false);
assert.equal(reconciliation.futureIntegration.assetType,'ARTICLE');
assert.equal(reconciliation.futureIntegration.authorityMode,'reference_only');
assert.equal(reconciliation.futureIntegration.publicationAuthority,'PJA');
assert.ok(reconciliation.decisions.every(x=>x.result===true));
assert.equal(freeze.status,'frozen');
for (const output of freeze.outputs) assert.equal(await sha(output),freeze.digests[output]);
assert.equal(freeze.invariants.pjaUnchanged,true);
assert.equal(freeze.invariants.publishedArticleRuntimeUnchanged,true);
assert.equal(freeze.invariants.providerRoutingUnchanged,true);
assert.equal(freeze.invariants.assetRegistryNotKnowledgeAuthority,true);
assert.equal(freeze.invariants.duplicateSourceOfTruth,false);
console.log('✓ CAR-W0 Foundation Audit passed.');
console.log('✓ Existing PJA, Published Article Runtime, Article Renderer and Provider Routing are reused, not rebuilt.');
console.log('✓ Public Asset Registry remains storage/resolution metadata and is not Knowledge Authority.');
console.log('✓ CAR-W0 created no duplicate Source of Truth.');

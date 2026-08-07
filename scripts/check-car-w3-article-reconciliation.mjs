import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const readJson = async p => JSON.parse(await fs.readFile(p,'utf8'));
const exists = async p => !!(await fs.stat(p).catch(()=>null));
const paths = {
 contract:'content/professional/canonical-asset-runtime/contracts/car-article-reconciliation-contract-v1.json',
 schema:'content/professional/canonical-asset-runtime/schemas/canonical-article-reference-v1.schema.json',
 registry:'content/professional/canonical-asset-runtime/registries/canonical-article-reference-registry-v1.json',
 valid:'content/professional/canonical-asset-runtime/fixtures/canonical-article-reference.valid.json',
 invalid:'content/professional/canonical-asset-runtime/fixtures/canonical-article-reference.invalid.json',
 freeze:'content/professional/canonical-asset-runtime/freeze/car-w3-freeze-v1.json',
 types:'content/professional/canonical-asset-runtime/registries/canonical-asset-type-registry-v1.json',
 candidates:'content/knowledge/production/registry/candidate-registry.json',
 reviews:'content/knowledge/production/registry/review-registry.json',
 approvals:'content/knowledge/production/registry/approval-registry.json',
 publications:'content/knowledge/production/registry/publication-registry.json'
};
const [contract,schema,registry,valid,invalid,freeze,types,candidates,reviews,approvals,publications] = await Promise.all(Object.values(paths).map(readJson));
assert.equal(contract.assetType,'ARTICLE');
assert.equal(contract.authorityMode,'reference_only');
assert.equal(contract.invariants.articleContinuesToBelongToPJA,true);
assert.equal(contract.invariants.carOnlyCreatesReferenceRelationship,true);
assert.equal(contract.invariants.articleBodyStoredInCAR,false);
assert.equal(contract.invariants.articleLifecycleStateStoredInCAR,false);
const articleType=types.assetTypes.find(x=>x.assetType==='ARTICLE');
assert.deepEqual({authorityMode:articleType.authorityMode,productionAuthority:articleType.productionAuthority,publicationAuthority:articleType.publicationAuthority},{authorityMode:'reference_only',productionAuthority:'PJA',publicationAuthority:'PJA'});
assert.equal(registry.recordCount,registry.records.length);
assert.ok(registry.records.length>=2);
const seen=new Set();
for (const ref of registry.records) {
 assert.equal(ref.assetType,'ARTICLE'); assert.equal(ref.authorityMode,'reference_only'); assert.equal(ref.referenceState,'active');
 assert.ok(!seen.has(ref.assetReferenceCode)); seen.add(ref.assetReferenceCode);
 for (const forbidden of ['bodyMarkdown','title','summary','reviewState','approvalState','publicationState']) assert.equal(Object.hasOwn(ref,forbidden),false);
 assert.ok(await exists(ref.publishedAuthorityReference.authorityPath));
 const authority=await readJson(ref.publishedAuthorityReference.authorityPath);
 assert.equal(authority.nodeCode,ref.nodeCode); assert.equal(authority.locale,ref.locale);
 assert.equal(authority.article.articleCode,ref.articleCode); assert.equal(authority.article.version,ref.articleVersion);
 assert.equal(authority.authorityRecordCode,ref.publishedAuthorityReference.authorityRecordCode);
 assert.equal(authority.authorityDigest,ref.publishedAuthorityReference.authorityDigest);
 assert.equal(authority.eligibility.approved,true); assert.equal(authority.eligibility.published,true);
 assert.deepEqual(authority.lineage,ref.lineage);
 const candidateInRegistry=candidates.records.some(x=>x.candidateCode===ref.lineage.candidateCode && x.candidateDigest===ref.lineage.candidateDigest);
 const candidatePackagePath=`content/knowledge/production/candidates/${ref.locale}/${ref.nodeCode}/candidate.v1.json`;
 const candidatePackage=await readJson(candidatePackagePath).catch(()=>null);
 const candidateInPackage=candidatePackage && candidatePackage.candidateCode===ref.lineage.candidateCode && candidatePackage.candidateDigest===ref.lineage.candidateDigest;
 assert.ok(candidateInRegistry || candidateInPackage);
 assert.ok(reviews.records.some(x=>x.reviewCode===ref.lineage.reviewCode && x.reviewDigest===ref.lineage.reviewDigest));
 assert.ok(approvals.records.some(x=>x.approvalCode===ref.lineage.approvalCode && x.approvalDigest===ref.lineage.approvalDigest));
 assert.ok(publications.records.some(x=>x.publicationCode===ref.lineage.publicationCode && x.publicationDigest===ref.lineage.publicationDigest));
 assert.equal(ref.articleRendererReference.rendererPath,'assets/js/knowledge/article-renderer.js');
}
assert.deepEqual(valid,registry.records[0]);
assert.equal(Object.hasOwn(invalid,'bodyMarkdown'),true);
assert.ok(schema.allOf.some(x=>x.not?.required?.includes('bodyMarkdown')));
assert.equal(freeze.baselineCommit,'a32504722c95a3bbd36bce4ea01b84a1c69c208d');
assert.equal(freeze.acceptance.noDuplicateSourceOfTruth,true);
assert.ok(await exists('assets/js/knowledge/article-renderer.js'));
console.log('✓ CAR-W3 Article Reconciliation passed.');
console.log('✓ ARTICLE remains reference_only and PJA retains candidate, review, approval and publication authority.');
console.log('✓ CAR stores immutable article references and complete PJA lineage, never article body or lifecycle authority.');
console.log('✓ Published Knowledge Authority and the existing Article Renderer are reused without duplication.');

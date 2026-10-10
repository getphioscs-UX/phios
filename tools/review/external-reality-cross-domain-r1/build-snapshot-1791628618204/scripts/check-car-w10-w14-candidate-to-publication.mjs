import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { buildAssetCandidate, buildAssetReview, buildAssetApproval, buildMediaRecord, publishAsset } from './lib/canonical-asset-runtime/canonical-asset-lifecycle-v1.mjs';
const readJson = async p => JSON.parse(await fs.readFile(p, 'utf8'));
const base='content/professional/canonical-asset-runtime/';
const [candidateSchema,reviewSchema,approvalSchema,mediaSchema,pubSchema,req,types,providerPolicy,pubPolicy] = await Promise.all([
 readJson(base+'schemas/asset-candidate-v1.schema.json'), readJson(base+'schemas/asset-review-package-v1.schema.json'), readJson(base+'schemas/asset-approval-package-v1.schema.json'), readJson(base+'schemas/asset-media-record-v1.schema.json'), readJson(base+'schemas/published-asset-v1.schema.json'), readJson(base+'fixtures/asset-candidate.request.valid.json'), readJson(base+'registries/canonical-asset-type-registry-v1.json'), readJson('content/provider/routing/provider-routing-policy-v1.json'), readJson(base+'policies/car-asset-publication-gate-policy-v1.json')
]);
const validate=(schema,obj)=>{
  for(const key of schema.required||[]) assert.ok(Object.prototype.hasOwnProperty.call(obj,key), `missing ${key}`);
  assert.equal(typeof obj,'object');
};
assert.ok(types.assetTypes.some(x=>x.assetType===req.brief.assetType));
const candidate=buildAssetCandidate(req); validate(candidateSchema,candidate);
assert.equal(candidate.assetBriefDigest, req.brief.briefDigest);
assert.deepEqual(candidate.meaningReferences, [...req.brief.meaningReferences].sort());
assert.deepEqual(candidate.knowledgeReferences, [...req.brief.knowledgeReferences].sort());
assert.deepEqual(candidate.sourceFragmentDigests, [...req.brief.sourceFragmentDigests].sort());
const dimensions={semanticAccuracy:'pass',knowledgeTraceability:'pass',brandCompliance:'pass',accessibility:'pass',rightsLicense:'pass'};
const review=buildAssetReview({candidate,reviewerCode:'REVIEWER-VALIDATION-01',reviewerIndependent:true,dimensions,decision:'accept',reviewNotes:['Validation fixture only.'],reviewedAt:'2026-08-07T05:10:00Z',reviewCode:'CAR-REV-KN-PREFACE-001-HERO-EN-001'}); validate(reviewSchema,review);
const approval=buildAssetApproval({candidate,review,approverCode:'APPROVER-VALIDATION-01',approverIndependent:true,decision:'approved',conditions:[],approvedAt:'2026-08-07T05:20:00Z',approvalCode:'CAR-APP-KN-PREFACE-001-HERO-EN-001'}); validate(approvalSchema,approval);
// Prompt assets can be governed/published as prompt assets but can never impersonate media.
assert.throws(()=>buildMediaRecord({candidate,assetType:candidate.assetType,mediaCode:'CAR-MEDIA-X',mediaType:'IMAGE',storageAuthority:'validation_fixture',contentType:'image/webp',locale:candidate.locale,accessibilityText:'x',accessibilityStatus:'passed',rightsStatus:'owned',sourceDigest:candidate.candidateDigest}),/CAR_PROMPT_CANNOT_REGISTER_AS_MEDIA/);
const publication=publishAsset({candidate,review,approval,media:[],surface:'API',rightsStatus:'owned',accessibilityStatus:'passed',publishedAt:'2026-08-07T05:30:00Z',publicationCode:'CAR-PUB-KN-PREFACE-001-HERO-EN-001-API'}); validate(pubSchema,publication);
assert.equal(pubPolicy.surfacePublicationIndependent,true); assert.equal(pubPolicy.providerMayCreatePublishedContent,false);
// Negative gates
assert.throws(()=>buildAssetReview({candidate,reviewerCode:'X',reviewerIndependent:false,dimensions,decision:'accept',reviewedAt:'2026-08-07T05:10:00Z',reviewCode:'CAR-REV-X'}),/CAR_REVIEW_INDEPENDENCE_REQUIRED/);
const rejected=buildAssetReview({candidate,reviewerCode:'R2',reviewerIndependent:true,dimensions,decision:'changes_required',reviewedAt:'2026-08-07T05:10:00Z',reviewCode:'CAR-REV-REJECT'});
assert.throws(()=>buildAssetApproval({candidate,review:rejected,approverCode:'A2',approverIndependent:true,decision:'approved',approvedAt:'2026-08-07T05:20:00Z',approvalCode:'CAR-APP-X'}),/CAR_APPROVAL_ACCEPTED_REVIEW_REQUIRED/);
assert.throws(()=>publishAsset({candidate,review,approval,media:[],surface:'WEBSITE',rightsStatus:'pending',accessibilityStatus:'passed',publishedAt:'2026-08-07T05:30:00Z',publicationCode:'CAR-PUB-X'}),/CAR_PUBLICATION_RIGHTS_GATE_FAILED/);
assert.throws(()=>publishAsset({candidate,review,approval,media:[],surface:'WEBSITE',rightsStatus:'owned',accessibilityStatus:'failed',publishedAt:'2026-08-07T05:30:00Z',publicationCode:'CAR-PUB-X'}),/CAR_PUBLICATION_ACCESSIBILITY_GATE_FAILED/);
// Production registries must remain empty: fixtures are not production state.
for (const [file,key] of [['asset-candidate-registry-v1.json','candidates'],['asset-review-registry-v1.json','reviews'],['asset-approval-registry-v1.json','approvals'],['asset-media-registry-v1.json','media'],['published-asset-registry-v1.json','publications']]) {
 const r=await readJson(base+'registries/'+file); assert.equal(r.productionStatus,'validation_only'); assert.deepEqual(r[key],[]); assert.equal(r.invariants.fixtureRecordsAreProductionRecords,false);
}
assert.equal(providerPolicy.workersAi.mayCreatePublishedContent,false); assert.equal(providerPolicy.openAiPublicKnr.paidFallbackAllowed,false);
console.log('✓ CAR-W10～W14 Candidate to Publication passed.');
console.log('✓ Candidate, Review, Approval, Media and Publication authorities are independently separated and lineage-bound.');
console.log('✓ Rights and Accessibility gates fail closed; prompt assets cannot impersonate final media.');
console.log('✓ Validation fixtures prove the lifecycle while production registries remain empty and provider publication remains disabled.');

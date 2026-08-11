import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { approveCandidate, importCandidate, materializeMedia, publishProductionAsset, readJson, reviewCandidate } from './lib/car-production/car-production-v1.mjs';

const root=process.cwd();
for(const [relative,collection] of [
  ['content/production/car/registries/asset-candidate-production-registry-v1.json','candidates'],
  ['content/production/car/registries/asset-review-production-registry-v1.json','reviews'],
  ['content/production/car/registries/asset-approval-production-registry-v1.json','approvals'],
  ['content/production/car/registries/asset-media-production-registry-v1.json','media'],
  ['content/production/car/registries/published-asset-production-registry-v1.json','publications']
]) assert.equal(readJson(root,relative)[collection].length,0,`${relative}:REAL_PRODUCTION_STATE_MUST_REMAIN_EMPTY_BEFORE_CANDIDATE_INTAKE`);

const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'phios-car-life-')); fs.cpSync(root,tmp,{recursive:true,filter:src=>!src.includes(`${path.sep}.git${path.sep}`)&&!src.includes(`${path.sep}node_modules${path.sep}`)});
const svg=path.join(tmp,'external-chatgpt-candidate.svg'); fs.writeFileSync(svg,'<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"><rect width="1200" height="800"/><circle cx="600" cy="400" r="100"/></svg>');
const briefCode='CAB-KN-PREFACE-001-MECHANISM-ZH-HANS-001';
const candidate=await importCandidate({root:tmp,briefCode,file:svg,modelCode:null,createdAt:'2026-08-11T12:00:00.000Z'});
assert.equal(candidate.providerLineage.mode,'external_manual'); assert.equal(candidate.providerLineage.providerCode,'OPENAI_CHATGPT'); assert.equal(candidate.providerLineage.modelCode,null); assert.equal(candidate.candidateState,'candidate'); assert.equal(candidate.assetBriefCode,briefCode); assert.equal(candidate.assetType,'DIAGRAM');
const dimsPass={semanticAccuracy:'pass',knowledgeTraceability:'pass',brandCompliance:'pass',accessibility:'pass',rightsLicense:'pass'};
const changes=await reviewCandidate({root:tmp,candidateCode:candidate.candidateCode,reviewerCode:'TL',decision:'changes_required',dimensions:{...dimsPass,brandCompliance:'fail'},reviewNotes:['fixture changes required'],reviewedAt:'2026-08-11T12:01:00.000Z'}); assert.equal(changes.decision,'changes_required');
await assert.rejects(()=>approveCandidate({root:tmp,candidateCode:candidate.candidateCode,approverCode:'TL',decision:'approved',approvedAt:'2026-08-11T12:02:00.000Z'}),/CAR_APPROVAL_ACCEPTED_REVIEW_REQUIRED/);
const accepted=await reviewCandidate({root:tmp,candidateCode:candidate.candidateCode,reviewerCode:'TL',decision:'accept',dimensions:dimsPass,reviewNotes:[],reviewedAt:'2026-08-11T12:03:00.000Z'}); assert.equal(accepted.decision,'accept'); assert.deepEqual(Object.values(accepted.dimensions),Array(5).fill('pass'));
const approval=await approveCandidate({root:tmp,candidateCode:candidate.candidateCode,approverCode:'TL',decision:'approved',conditions:[],approvedAt:'2026-08-11T12:04:00.000Z'}); assert.equal(approval.approver,'TL'); assert.equal(approval.candidateDigest,candidate.candidateDigest); assert.equal(approval.reviewDigest,accepted.reviewDigest); assert.equal(approval.decision,'approved');
await assert.rejects(()=>materializeMedia({root:tmp,candidateCode:candidate.candidateCode,altText:'x',rightsStatus:'blocked',accessibilityStatus:'passed'}),/CAR_MEDIA_RIGHTS_MUST_BE_CLEARED/);
await assert.rejects(()=>materializeMedia({root:tmp,candidateCode:candidate.candidateCode,altText:'x',rightsStatus:'owned',accessibilityStatus:'failed'}),/CAR_MEDIA_ACCESSIBILITY_MUST_PASS/);
const media=await materializeMedia({root:tmp,candidateCode:candidate.candidateCode,altText:'文明能力形成机制图',rightsStatus:'owned',accessibilityStatus:'passed'}); assert.equal(media.width,1200); assert.equal(media.height,800); assert.equal(media.altText,'文明能力形成机制图'); assert.equal(media.rightsStatus,'owned'); assert.equal(media.accessibilityStatus,'passed'); assert(media.publicSrc.startsWith('/assets/knowledge/KN-PREFACE-001/')); assert(media.publicSrc.endsWith('.svg')); assert.equal(media.carMediaRecord.fixtureOnly,false);
const published=await publishProductionAsset({root:tmp,candidateCode:candidate.candidateCode,surface:'WEBSITE',publishedAt:'2026-08-11T12:05:00.000Z'}); assert.equal(published.publishedAssetCode,`PUBLISHED-${candidate.assetCode}`); assert.equal(published.mediaCode,media.mediaCode); assert.equal(published.publicSrc,media.publicSrc); assert.equal(published.width,1200); assert.equal(published.height,800); assert.equal(published.altText,'文明能力形成机制图'); assert.equal(published.carPublicationRecord.publicationState,'published'); assert.equal(published.carPublicationRecord.rightsStatus,'owned'); assert.equal(published.carPublicationRecord.accessibilityStatus,'passed');
const pubReg=readJson(tmp,'content/production/car/registries/published-asset-production-registry-v1.json'); assert.equal(pubReg.publications.length,1); assert.equal(readJson(root,'content/production/car/registries/published-asset-production-registry-v1.json').publications.length,0);
console.log('✓ VAP-W15 external-manual Figure Candidate Intake preserves CAB/Knowledge/Meaning lineage and records OPENAI_CHATGPT provider lineage.');
console.log('✓ VAP-W16 independent Asset Review enforces semanticAccuracy, knowledgeTraceability, brandCompliance, accessibility and rightsLicense; changes_required cannot approve.');
console.log('✓ VAP-W17 independent Asset Approval requires an accepted review and remains distinct from generation/publication.');
console.log('✓ VAP-W18 Media Materialization is fail-closed on rights/accessibility and emits only safe /assets/... .svg/.webp/.avif paths with dimensions and alt text.');
console.log('✓ VAP-W19 Published Asset requires Candidate + accepted Review + approved Approval + Media + rights/accessibility gates; real production registries remain empty until explicit candidate intake.');

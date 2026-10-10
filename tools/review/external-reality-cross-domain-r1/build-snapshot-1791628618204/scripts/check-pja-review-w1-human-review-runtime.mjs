import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { digest, serialize } from './lib/knowledge-production/canonical-brief-v2.mjs';
import { buildHumanReview, validateHumanReview, buildReviewRegistryRecord, registerReviewProjection, writeReviewPackage } from './lib/knowledge-production/human-review-v1.mjs';
const root=process.cwd(),readJson=async p=>JSON.parse(await fs.readFile(path.join(root,p),'utf8'));
const contractPath='content/knowledge/production/contracts/human-review-contract.json',schemaPath='content/knowledge/production/schemas/human-review-package-v1.schema.json',registryPath='content/knowledge/production/registry/review-registry.json',freezePath='content/knowledge/production/freeze/pja-review-w1-freeze-v1.json',candidatePath='content/knowledge/production/candidates/zh-Hans/KN-PREFACE-001/candidate.v1.json';
const [contract,schema,registry,freeze,candidate]=await Promise.all([contractPath,schemaPath,registryPath,freezePath,candidatePath].map(readJson));
assert.equal(contract.outputAuthority,'review_only');assert.equal(contract.boundaries.reviewDoesNotImplyApproval,true);assert.equal(contract.boundaries.reviewDoesNotImplyPublication,true);for(const x of ['rewrite_candidate','modify_knowledge_registry','approve','publish','promote_locale_state','call_provider'])assert(contract.prohibitedOperations.includes(x));
assert.equal(schema.properties.decision.enum.join(','),'accept,changes_required,reject,defer');assert.equal(registry.authority,'Human Review Runtime');assert(Array.isArray(registry.records));
const reviewCodes=new Set();
for(const record of registry.records){
 assert.equal(typeof record.reviewCode,'string');assert(!reviewCodes.has(record.reviewCode),`REVIEW_REGISTRY_DUPLICATE:${record.reviewCode}`);reviewCodes.add(record.reviewCode);
 const packagePath=`content/knowledge/production/reviews/${record.locale}/${record.nodeCode}/review.v1.json`;
 const reviewPackage=await readJson(packagePath);
 const registeredCandidate=await readJson(`content/knowledge/production/candidates/${record.locale}/${record.nodeCode}/candidate.v1.json`);
 const packageValidation=validateHumanReview(reviewPackage,registeredCandidate);assert.equal(packageValidation.valid,true,JSON.stringify(packageValidation.errors));
 assert.deepEqual(record,buildReviewRegistryRecord(reviewPackage),`REVIEW_REGISTRY_PROJECTION_MISMATCH:${record.reviewCode}`);
}
const input={reviewerCode:'TL',decision:'accept',summary:'Candidate preserves the Canonical Meaning, required distinctions, public boundary and continuity to the next node.',findings:[{category:'continuity',severity:'note',comment:'The ending opens KN-PREFACE-002 without resolving it.'}],reviewedAt:'2026-08-06T08:30:00.000Z'};
const a=await buildHumanReview(root,{candidate,...input}),b=await buildHumanReview(root,{candidate,...input});assert.equal(serialize(a),serialize(b));const valid=validateHumanReview(a,candidate);assert.equal(valid.valid,true,JSON.stringify(valid.errors));assert.equal(a.authority.approval,'not_approved');assert.equal(a.authority.publication,'not_published');assert.equal(a.governance.candidateMutationAllowed,false);
await assert.rejects(()=>buildHumanReview(root,{candidate,...input,decision:'changes_required',findings:[]}),/REVIEW_FINDING_REQUIRED/);
const temp=await fs.mkdtemp(path.join(os.tmpdir(),'pja-review-w1-'));await fs.mkdir(path.join(temp,'content/knowledge/production/registry'),{recursive:true});await fs.writeFile(path.join(temp,registryPath),serialize({...registry,records:[]}));const dryWrite=await writeReviewPackage(temp,a,{apply:false});assert.equal(dryWrite.applied,false);const appliedWrite=await writeReviewPackage(temp,a,{apply:true});assert.equal(appliedWrite.applied,true);await assert.rejects(()=>writeReviewPackage(temp,a,{apply:true}),/REVIEW_TARGET_EXISTS/);const record=buildReviewRegistryRecord(a);const dryRegistry=await registerReviewProjection(temp,record,{apply:false});assert.equal(dryRegistry.applied,false);const appliedRegistry=await registerReviewProjection(temp,record,{apply:true});assert.equal(appliedRegistry.applied,true);await assert.rejects(()=>registerReviewProjection(temp,record,{apply:true}),/REVIEW_REGISTRY_RECORD_EXISTS/);
assert.equal(freeze.status,'PJA-REVIEW-W1-v1.0.0-Frozen');assert.equal(freeze.baselineCommit,'e2cb2de');const checkerRel='scripts/check-pja-review-w1-human-review-runtime.mjs',mutableRegistryRel='content/knowledge/production/registry/review-registry.json';
for(const [rel,expected] of Object.entries(freeze.digests)){if(rel===checkerRel||rel===mutableRegistryRel)continue;assert.equal(digest(await fs.readFile(path.join(root,rel))),expected,`FREEZE_DIGEST_MISMATCH:${rel}`);}
const checkerAmendment=await readJson('content/knowledge/production/freeze/pja-review-w1-checker-compatibility-v1.json');assert.equal(checkerAmendment.originalFreezeCode,freeze.freezeCode);assert.equal(digest(await fs.readFile(path.join(root,checkerRel))),checkerAmendment.checkerDigest,'CHECKER_COMPATIBILITY_DIGEST_MISMATCH:review');
console.log('✓ STEP58A Human Review Contract passed.');console.log('✓ STEP58B Review Package Schema passed.');console.log('✓ STEP58C deterministic Human Review Runtime passed.');console.log('✓ STEP58D Review Checker and Candidate binding passed.');console.log('✓ STEP58E independent Review Registry passed.');console.log('✓ STEP58F PJA-REVIEW-W1 Freeze digests passed.');console.log('  Review remains separate from Approval and Publication.');

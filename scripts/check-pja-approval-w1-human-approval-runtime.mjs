import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { digest, serialize } from './lib/knowledge-production/canonical-brief-v2.mjs';
import { buildHumanApproval, validateHumanApproval, buildApprovalRegistryRecord, registerApprovalProjection, writeApprovalPackage } from './lib/knowledge-production/human-approval-v1.mjs';
const root=process.cwd(),readJson=async p=>JSON.parse(await fs.readFile(path.join(root,p),'utf8'));
const contractPath='content/knowledge/production/contracts/human-approval-contract.json',schemaPath='content/knowledge/production/schemas/approval-package-v1.schema.json',registryPath='content/knowledge/production/registry/approval-registry.json',freezePath='content/knowledge/production/freeze/pja-approval-w1-freeze-v1.json',candidatePath='content/knowledge/production/candidates/zh-Hans/KN-PREFACE-001/candidate.v1.json',reviewPath='content/knowledge/production/reviews/zh-Hans/KN-PREFACE-001/review.v1.json';
const [contract,schema,registry,freeze,candidate,review]=await Promise.all([contractPath,schemaPath,registryPath,freezePath,candidatePath,reviewPath].map(readJson));
assert.equal(contract.outputAuthority,'approval_only');assert.deepEqual(contract.eligibleReviewDecisions,['accept']);assert.equal(contract.boundaries.approvalDoesNotImplyPublication,true);for(const x of ['rewrite_candidate','modify_review','modify_knowledge_registry','publish','promote_locale_state','call_provider'])assert(contract.prohibitedOperations.includes(x));
assert.equal(schema.properties.decision.enum.join(','),'approve,decline,defer');assert.equal(registry.authority,'Approval Runtime');assert(Array.isArray(registry.records));assert.equal(review.decision,'accept');
const approvalCodes=new Set();
for(const record of registry.records){
 assert.equal(typeof record.approvalCode,'string');assert(!approvalCodes.has(record.approvalCode),`APPROVAL_REGISTRY_DUPLICATE:${record.approvalCode}`);approvalCodes.add(record.approvalCode);
 if(record.locale!=='zh-Hans')continue;
 const packagePath=`content/knowledge/production/approvals/${record.locale}/${record.nodeCode}/approval.v1.json`;
 const approvalPackage=await readJson(packagePath);
 const registeredCandidate=await readJson(`content/knowledge/production/candidates/${record.locale}/${record.nodeCode}/candidate.v1.json`);
 const registeredReview=await readJson(`content/knowledge/production/reviews/${record.locale}/${record.nodeCode}/review.v1.json`);
 const packageValidation=validateHumanApproval(approvalPackage,registeredCandidate,registeredReview);assert.equal(packageValidation.valid,true,JSON.stringify(packageValidation.errors));
 assert.deepEqual(record,buildApprovalRegistryRecord(approvalPackage),`APPROVAL_REGISTRY_PROJECTION_MISMATCH:${record.approvalCode}`);
}
const input={approverCode:'TL',decision:'approve',summary:'The accepted zh-Hans Candidate is independently approved for the next publication-governance stage.',conditions:[{status:'satisfied',description:'Human Review decision is accept.'},{status:'not_applicable',description:'No additional approval condition applies.'}],approvedAt:'2026-08-06T09:00:00.000Z'};
const a=await buildHumanApproval(root,{candidate,review,...input}),b=await buildHumanApproval(root,{candidate,review,...input});assert.equal(serialize(a),serialize(b));const valid=validateHumanApproval(a,candidate,review);assert.equal(valid.valid,true,JSON.stringify(valid.errors));assert.equal(a.authority.publication,'not_published');assert.equal(a.governance.publicationRecorded,false);
await assert.rejects(()=>buildHumanApproval(root,{candidate,review:{...review,decision:'defer'},...input}),/APPROVAL_REQUIRES_VALID_REVIEW|APPROVAL_REQUIRES_ACCEPTED_REVIEW/);
await assert.rejects(()=>buildHumanApproval(root,{candidate,review,...input,conditions:[{status:'pending',description:'Pending condition.'}]}),/APPROVAL_PENDING_CONDITION/);
const temp=await fs.mkdtemp(path.join(os.tmpdir(),'pja-approval-w1-'));await fs.mkdir(path.join(temp,'content/knowledge/production/registry'),{recursive:true});await fs.writeFile(path.join(temp,registryPath),serialize({...registry,records:[]}));const dryWrite=await writeApprovalPackage(temp,a,{apply:false});assert.equal(dryWrite.applied,false);const appliedWrite=await writeApprovalPackage(temp,a,{apply:true});assert.equal(appliedWrite.applied,true);await assert.rejects(()=>writeApprovalPackage(temp,a,{apply:true}),/APPROVAL_TARGET_EXISTS/);const record=buildApprovalRegistryRecord(a);const dryRegistry=await registerApprovalProjection(temp,record,{apply:false});assert.equal(dryRegistry.applied,false);const appliedRegistry=await registerApprovalProjection(temp,record,{apply:true});assert.equal(appliedRegistry.applied,true);await assert.rejects(()=>registerApprovalProjection(temp,record,{apply:true}),/APPROVAL_REGISTRY_RECORD_EXISTS/);
assert.equal(freeze.status,'PJA-APPROVAL-W1-v1.0.0-Frozen');assert.equal(freeze.baselineCommit,'aa3a09a');const checkerRel='scripts/check-pja-approval-w1-human-approval-runtime.mjs',mutableRegistryRel='content/knowledge/production/registry/approval-registry.json';
for(const [rel,expected] of Object.entries(freeze.digests)){if(rel===checkerRel||rel===mutableRegistryRel)continue;assert.equal(digest(await fs.readFile(path.join(root,rel))),expected,`FREEZE_DIGEST_MISMATCH:${rel}`);}
const checkerAmendment=await readJson('content/knowledge/production/freeze/pja-approval-w1-checker-compatibility-v1.json');assert.equal(checkerAmendment.originalFreezeCode,freeze.freezeCode);assert.equal(digest(await fs.readFile(path.join(root,checkerRel))),checkerAmendment.checkerDigest,'CHECKER_COMPATIBILITY_DIGEST_MISMATCH:approval');
console.log('✓ STEP59A Human Approval Contract passed.');console.log('✓ STEP59B Approval Package Schema passed.');console.log('✓ STEP59C deterministic Approval Runtime passed.');console.log('✓ STEP59D Approval Checker and accepted Review binding passed.');console.log('✓ STEP59E independent Approval Registry passed.');console.log('✓ STEP59F PJA-APPROVAL-W1 Freeze digests passed.');console.log('  Approval remains separate from Publication.');

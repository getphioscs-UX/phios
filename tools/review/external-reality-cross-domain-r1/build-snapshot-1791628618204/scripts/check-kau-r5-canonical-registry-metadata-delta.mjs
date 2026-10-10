import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { verifyKnowledgeBlueprintFreeze } from './lib/knowledge-blueprint/freeze-contract.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const digestText=p=>crypto.createHash('sha256').update(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n'),'utf8').digest('hex');
const digestString=s=>crypto.createHash('sha256').update(s,'utf8').digest('hex');
const predecessorSha='61c1d8bd00a13af5fa3d41e802fa3a787c97750c60b04e037377b585a3d01431';
const predecessorCodeSetSha='98cea9eb7a84970dc1ea8fb98c992ee66612f5c560b987c90ba85a11d43f50c3';
const newCodes=['KN-B2-P7-058','KN-B2-P7-059'];
const deprecatedCodes=['KN-B2-P6-051','KN-B2-P6-052','KN-B2-P6-053','KN-B2-P6-054','KN-B2-P6-055'];
const rehomeCodes=['KN-B2-P7-052','KN-B2-P7-057'];
const scopeKeys={
 'KN-B2-P6-037':'book-2-p6-37-group-formation',
 'KN-B2-P6-040':'book-2-p6-40-collective-synchronization',
 'KN-B2-P6-045':'book-2-p6-45-narrative-coupling',
 'KN-B2-P6-048':'book-2-p6-48-relationship-deadlock',
 'KN-B2-P7-006':'book-2-p7-06-collective-pressure',
 'KN-B2-P7-012':'book-2-p7-12-collective-incentive-structures',
 'KN-B2-P7-056':'book-2-p7-56-collective-reconfiguration'
};
const nodes=read('content/knowledge/registry/nodes.json');
const byCode=new Map(nodes.nodes.map(n=>[n.nodeCode,n]));
const lineage=read('content/knowledge/reconciliation/kau-r5/canonical-registry-lineage-v1.json');
const acceptance=read('content/knowledge/reconciliation/kau-r5/kau-r5-acceptance-v1.json');
const freeze=read('content/knowledge/reconciliation/kau-r5/kau-r5-freeze-v1.json');
const gate=read('content/knowledge/reconciliation/kau-r5/kau-r5-downstream-successor-gate-v1.json');
const additions=read('content/knowledge/reconciliation/kau-r5/canonical-node-additions-v1.json');
const deprecations=read('content/knowledge/reconciliation/kau-r5/canonical-node-deprecations-v1.json');
const rehomes=read('content/knowledge/reconciliation/kau-r5/canonical-node-rehome-pending-v1.json');
const metadata=read('content/knowledge/reconciliation/kau-r5/canonical-metadata-revisions-v1.json');
const newBindings=read('content/knowledge/reconciliation/kau-r5/book-2-new-node-approved-bindings-v1.json');
const bindings=read('content/knowledge/source-access/registries/manuscript-section-canonical-binding-v1.json');
const b1bp=read('content/knowledge/blueprints/book-1-knowledge-blueprint.json');
const b2bp=read('content/knowledge/blueprints/book-2-knowledge-blueprint.json');
const bpRegistry=read('content/knowledge/blueprints/blueprint-registry.json');
const codes=nodes.nodes.map(n=>n.nodeCode).sort();
assert.equal(nodes.version,'2.1.0');
assert.equal(nodes.nodes.length,718);
assert.equal(new Set(codes).size,718);
assert.equal(new Set(nodes.nodes.map(n=>n.canonicalQuestionKey)).size,718,'Canonical question keys must remain unique after KAU-R5.');
const predecessorCodes=codes.filter(c=>!newCodes.includes(c));
assert.equal(predecessorCodes.length,716);
assert.equal(digestString(predecessorCodes.join('\n')+'\n'),predecessorCodeSetSha,'All 716 predecessor nodeCodes must remain exact and reusable only as their original identities.');
assert.equal(digestText('content/knowledge/registry/nodes.json'),freeze.canonicalAuthority.successorSha256);
assert.equal(freeze.canonicalAuthority.predecessorSha256,predecessorSha);
assert.equal(lineage.predecessor.normalizedSha256,predecessorSha);
assert.equal(lineage.predecessor.nodeCodeSetSha256,predecessorCodeSetSha);
assert.deepEqual(lineage.identityDelta.addedNodeCodes,newCodes);
assert.deepEqual(lineage.identityDelta.deletedNodeCodes,[]);
assert.deepEqual(lineage.identityDelta.renamedNodeCodes,[]);
for(const code of newCodes) assert.ok(byCode.has(code));
assert.equal(byCode.get('KN-B2-P7-058').canonicalQuestionKey,'book-2-p7-52-ai-collective-threshold');
assert.equal(byCode.get('KN-B2-P7-058').canonicalAdmission.sourceSectionCode,'CM-B2V1-P7-S052');
assert.equal(byCode.get('KN-B2-P7-059').canonicalQuestionKey,'book-2-p7-57-maintenance-threshold');
assert.equal(byCode.get('KN-B2-P7-059').canonicalAdmission.sourceSectionCode,'CM-B2V1-P7-S057');
assert.equal(byCode.get('KN-B2-P7-059').transitionTarget.partCode,'P8');
assert.equal(byCode.get('KN-B2-P7-059').transitionTarget.legacyCurrentP8EntryNotAssumedEquivalent,true);
for(const code of deprecatedCodes){const n=byCode.get(code);assert.equal(n.registryStatus,'deprecated');assert.equal(n.productionQueue,'retired');assert.equal(n.canonicalDisposition.nodeCodeReusable,false);assert.equal(n.canonicalDisposition.historicalIdentityPreserved,true);assert.equal(n.crossSessionNode.enabled,false);}
for(const code of rehomeCodes){const n=byCode.get(code);assert.equal(n.registryStatus,'rehome_pending');assert.equal(n.publicationBookCode,'BOOK-2');assert.equal(n.partCode,'P7');assert.equal(n.canonicalDisposition.physicalMoveStatus,'DEFERRED_TO_BOOK_W1D_OR_TARGET_SOURCE_AUTHORITY');assert.equal(n.crossSessionNode.enabled,false);}
assert.equal(byCode.get('KN-B2-P7-052').canonicalDisposition.targetPartCode,'P11');
assert.equal(byCode.get('KN-B2-P7-057').canonicalDisposition.targetPartCode,'P10');
assert.equal(byCode.get('KN-B2-P7-057').canonicalDisposition.targetChapterCode,'10.81');
for(const [code,key] of Object.entries(scopeKeys)){const n=byCode.get(code);assert.equal(n.canonicalQuestionKey,key);assert.equal(n.canonicalRevision.appliedBy,'KAU-R5');}
assert.equal(byCode.get('KN-B2-P6-050').crossSessionNode.nextNodeCode,'KN-B2-P6-056');
assert.equal(byCode.get('KN-B2-P6-056').crossSessionNode.previousNodeCode,'KN-B2-P6-050');
assert.equal(byCode.get('KN-B2-P7-051').crossSessionNode.nextNodeCode,'KN-B2-P7-058');
assert.equal(byCode.get('KN-B2-P7-058').crossSessionNode.nextNodeCode,'KN-B2-P7-053');
assert.equal(byCode.get('KN-B2-P7-053').crossSessionNode.previousNodeCode,'KN-B2-P7-058');
assert.equal(byCode.get('KN-B2-P7-056').crossSessionNode.nextNodeCode,'KN-B2-P7-059');
assert.equal(byCode.get('KN-B2-P7-059').crossSessionNode.nextNodeCode,null);
assert.equal(metadata.book1DisplayTitleRevisions.length,2);
assert.equal(b1bp.nodes.find(n=>n.nodeCode==='KN-B1-P1-002').titleZhHans,'约束如何裁剪可能性并维持差异');
assert.equal(b1bp.nodes.find(n=>n.nodeCode==='KN-B1-P1-005').titleZhHans,'结构差异如何形成区域与网络');
assert.deepEqual(b2bp.parts.map(p=>[p.partCode,p.canonicalNodeCount]),[['P5',65],['P6',58],['P7',59]]);
assert.equal(b2bp.nodes.length,182);
assert.equal(b2bp.registryCompletion.canonicalSemanticReconciliationComplete,true);
assert.equal(b2bp.registryCompletion.humanAcceptedVolumeIIReconciliation,true);
assert.deepEqual(bpRegistry.totals,{books:5,parts:16,canonicalNodes:931});
assert.deepEqual(Object.fromEntries(bpRegistry.books.map(b=>[b.bookCode,b.canonicalNodeCount])),{'BOOK-1':65,'BOOK-2':180,'BOOK-3':105,'BOOK-4':279,'BOOK-5':302});
assert.equal(bpRegistry.status,'book-w1d-human-approved-frozen-successor');
assert.equal(bpRegistry.supersedes.sha256,freeze.blueprintAuthority.registryManifestSha256);
const verifiedFreeze=await verifyKnowledgeBlueprintFreeze(process.cwd());
assert.equal(verifiedFreeze.freeze.registryManifestSHA,digestText('content/knowledge/blueprints/blueprint-registry.json'));
assert.equal(read('content/knowledge/blueprints/knowledge-blueprint-freeze-v2.json').registryManifestSHA,freeze.blueprintAuthority.registryManifestSha256);
assert.equal(additions.recordCount,2);assert.equal(deprecations.recordCount,5);assert.equal(rehomes.recordCount,2);
assert.equal(newBindings.recordCount,2);
assert.equal(bindings.status,'ACTIVE_VOLUME_I_II_APPROVED');
assert.equal(bindings.records.length,235);
assert.equal(bindings.records.filter(r=>r.bookCode==='BOOK-1').length,62);
assert.equal(bindings.records.filter(r=>r.bookCode==='BOOK-2').length,173);
assert.equal(new Set(bindings.records.filter(r=>r.bookCode==='BOOK-2').map(r=>r.sectionCode)).size,171);
for(const r of newBindings.records){assert.equal(r.status,'APPROVED');assert.ok(newCodes.includes(r.nodeCode));assert.ok(bindings.records.some(x=>x.mappingCode===r.mappingCode&&x.nodeCode===r.nodeCode));}
assert.equal(acceptance.status,'ACCEPTED_CANONICAL_AUTHORITY_SUCCESSOR');
assert.equal(acceptance.acceptance.canonicalNodeCount,718);
assert.equal(acceptance.acceptance.all716PredecessorNodeCodesPreserved,true);
assert.equal(freeze.status,'FROZEN_SUCCESSOR_CANONICAL_AUTHORITY');
assert.equal(gate.status,'CANONICAL_SUCCESSOR_ACTIVE_DOWNSTREAM_RECONCILIATION_REQUIRED');
assert.equal(gate.downstreamPolicy.newNodesAutoProductionActivated,false);
assert.equal(gate.downstreamPolicy.historicalEvidenceRewriteAllowed,false);
console.log('✓ KAU-R5 Canonical Registry / Metadata Delta passed.');
console.log('  Canonical Authority successor: 716 → 718 nodes; all 716 predecessor nodeCodes remain preserved, with 2 human-authorized P7 additions.');
console.log('  Applied: 7 Book-II scope/key revisions, 2 Book-I display-title revisions, 5 deprecations, and 2 accepted rehome-pending dispositions.');
console.log('  KSAR: 62 Volume-I + 173 Volume-II approved mapping records are active; Book-II covers 171 unique manuscript sections canonically.');
console.log('  KAU-R5 preserves its deferred rehome evidence; W1D separately applies P10/P11 publication ownership without granting Article/PJA/CAR/VAP production authority.');

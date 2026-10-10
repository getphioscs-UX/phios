import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd();
const readJson=async f=>JSON.parse(await fs.readFile(path.join(root,f),'utf8'));
const digest=async f=>crypto.createHash('sha256').update(await fs.readFile(path.join(root,f))).digest('hex');
const base='content/knowledge/authoring/extensions/legacy-supporting-source';
const r5FreezePath='content/knowledge/reconciliation/kau-r5/kau-r5-freeze-v1.json';
const e0=await readJson(`${base}/registries/legacy-supporting-source-registry-v2.json`);
assert.equal(e0.entries.length,2,'KAU_E1_REQUIRES_TWO_E0_REGISTERED_SOURCES');
for (const e of e0.entries){ assert.equal(e.supportingOnly,true); assert.equal(e.canonicalAuthority,false); assert.equal(e.meaningAuthority,false); assert.equal(e.nodeAuthority,false); assert.equal(e.publicationAuthority,false); }
const sections=await readJson(`${base}/inventories/legacy-unified-language-section-inventory-v1.json`);
const terms=await readJson(`${base}/inventories/legacy-unified-language-concept-terminology-inventory-v1.json`);
const matches=await readJson(`${base}/matching/legacy-unified-language-node-candidate-match-v1.json`);
const recon=await readJson(`${base}/reconciliation/legacy-unified-language-cross-book-reconciliation-v1.json`);
const review=await readJson(`${base}/review/legacy-unified-language-human-review-queue-v1.json`);
const acceptance=await readJson(`${base}/acceptance/kau-e1-legacy-reconciliation-acceptance-v1.json`);
const nodes=await readJson('content/knowledge/registry/nodes.json');
const r5Active=await fs.access(path.join(root,r5FreezePath)).then(()=>true).catch(()=>false);
if(r5Active){
  const r5=await readJson(r5FreezePath);
  assert.equal(r5.status,'FROZEN_SUCCESSOR_CANONICAL_AUTHORITY');
  assert.equal(r5.canonicalAuthority.predecessorCount,716);
  assert.equal(r5.canonicalAuthority.successorCount,718);
  assert.equal(nodes.nodes.length,718,'KAU_E1_REQUIRES_EXACT_KAU_R5_SUCCESSOR');
  assert.equal(await digest('content/knowledge/registry/nodes.json'),r5.canonicalAuthority.successorSha256);
  assert.equal(acceptance.canonicalNodeRegistryDigestBefore,`sha256:${r5.canonicalAuthority.predecessorSha256}`);
}else assert.equal(nodes.nodes.length,716,'KAU_E1_CANONICAL_NODE_COUNT_DRIFT');
const nodeCodes=new Set(nodes.nodes.map(n=>n.nodeCode));
assert.ok(sections.entries.length>100,'KAU_E1_SECTION_INVENTORY_TOO_SMALL');
assert.ok(terms.terms.length>=20,'KAU_E1_TERMINOLOGY_INVENTORY_TOO_SMALL');
assert.equal(matches.entries.length,review.entries.length,'KAU_E1_REVIEW_QUEUE_COUNT_MISMATCH');
for (const m of matches.entries){
  assert.equal(m.candidateOnly,true,'KAU_E1_MATCH_MUST_BE_CANDIDATE_ONLY');
  assert.equal(m.acceptedNodeReferences.length,0,'KAU_E1_MUST_NOT_ACCEPT_NODE_RELATIONSHIP');
  assert.ok(m.candidates.length>0 && m.candidates.length<=3,'KAU_E1_CANDIDATE_LIMIT_INVALID');
  for (const c of m.candidates) assert.ok(nodeCodes.has(c.nodeCode),`KAU_E1_UNKNOWN_NODE:${c.nodeCode}`);
}
for (const r of review.entries){ assert.equal(r.reviewStatus,'PENDING','KAU_E1_HUMAN_REVIEW_MUST_REMAIN_PENDING'); assert.equal(r.humanDecision,null); assert.equal(r.acceptedRelationship,null); }
for (const r of recon.entries){ assert.equal(r.canonicalDecision,'NOT_MADE'); assert.equal(r.ownershipDecision,'NOT_MADE'); assert.equal(r.terminologyDecision,'NOT_MADE'); }
const actual=await digest('content/knowledge/registry/nodes.json');
if(!r5Active) assert.equal(`sha256:${actual}`,acceptance.canonicalNodeRegistryDigestBefore,'KAU_E1_CANONICAL_DIGEST_BASELINE_MISMATCH');
assert.equal(acceptance.canonicalNodeRegistryDigestBefore,acceptance.canonicalNodeRegistryDigestAfter,'KAU_E1_CANONICAL_REGISTRY_MUTATION_DETECTED');
assert.equal(acceptance.checks.newCanonicalNodesCreated,false);
assert.equal(acceptance.checks.meaningAuthorityMutated,false);
assert.equal(acceptance.checks.productionReadinessPromoted,false);
assert.equal(acceptance.checks.acceptedCanonicalRelationshipsCreated,false);
assert.equal(acceptance.status,'READY_FOR_HUMAN_REVIEW');
console.log(`✓ KAU-E1 legacy reconciliation passed: ${sections.entries.length} inventory entries and ${matches.entries.length} preserved candidate matches; the historical 716-node boundary remains immutable.`);
if(r5Active) console.log('  KAU-E1 predecessor evidence is preserved inside the exact 718-node KAU-R5 Canonical successor.');

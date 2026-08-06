import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {buildRelationshipMechanismExpansion,buildCrossDomainExpansion,stable,sha} from './lib/knowledge-intelligence/package-k-b-v1.mjs';

const read=async f=>JSON.parse(await fs.readFile(f,'utf8'));
const contract=await read('content/knowledge/contracts/knowledge-intelligence-package-k-b-v1.json');
const relPolicy=await read('content/knowledge/runtime/knowledge-intelligence/package-k-b/relationship-mechanism-expansion-policy-v1.json');
const domainPolicy=await read('content/knowledge/runtime/knowledge-intelligence/package-k-b/cross-domain-expansion-policy-v1.json');
const relDoc=await read('content/knowledge/intelligence/expansion/relationship-mechanism-expansion.json');
const domainDoc=await read('content/knowledge/intelligence/expansion/cross-domain-expansion.json');
const graph=await read('content/knowledge/intelligence/graph/published-knowledge-graph.json');
const profiles=await read('content/knowledge/intelligence/semantic-profiles/published-semantic-profiles.json');
const freeze=await read('content/knowledge/production/freeze/knowledge-intelligence-package-k-b-v1.json');

assert.equal(contract.contractCode,'PHI-OS-KNOWLEDGE-INTELLIGENCE-PACKAGE-K-B-v1.0.0');
assert.deepEqual(contract.steps,['STEP76','STEP77']);
for(const x of ['provider_call','unsupported_inference','unpublished_promotion','assembly','compression','adaptive_projection'])assert.ok(contract.prohibited.includes(x));
assert.equal(relPolicy.relationshipAuthority,'published_graph_only');
assert.equal(relPolicy.unsupportedInferenceAllowed,false);
assert.equal(domainPolicy.causalClaimsAllowed,false);

const rebuiltRel=await buildRelationshipMechanismExpansion();
const rebuiltDomain=await buildCrossDomainExpansion();
assert.deepEqual(relDoc,rebuiltRel);
assert.deepEqual(domainDoc,rebuiltDomain);

assert.equal(relDoc.recordCount,profiles.profileCount);
assert.equal(relDoc.records.length,profiles.profileCount);
for(const record of relDoc.records){
 assert.equal(record.providerUsed,false);
 assert.equal(record.unsupportedInferenceAllowed,false);
 assert.ok(record.mechanismFacets.length>=1);
 for(const facet of record.mechanismFacets){
  assert.equal(facet.evidenceMode,'controlled_term_match');
  assert.ok(facet.evidenceFragmentCodes.length>=1);
 }
 for(const rel of record.explicitRelationships){
  if(!rel.targetPublished)assert.equal(rel.authority,'external_unpublished_boundary');
 }
}
assert.ok(!graph.nodes.some(n=>n.nodeCode==='KN-PREFACE-002'));
assert.ok(graph.externalBoundaries.some(b=>b.targetNodeCode==='KN-PREFACE-002'));
assert.ok(relDoc.records.every(r=>r.explicitRelationships.some(x=>x.targetNodeCode==='KN-PREFACE-002'&&!x.targetPublished)));

assert.equal(domainDoc.recordCount,10);
assert.equal(domainDoc.linkCount,20);
assert.equal(domainDoc.canonicalDomainCount,5);
for(const record of domainDoc.records){
 assert.equal(record.evidenceMode,'controlled_term_match');
 assert.ok(record.evidenceFragmentCodes.length>=1);
}
for(const link of domainDoc.links){
 assert.equal(link.linkType,'co_present_in_same_published_node');
 assert.equal(link.causalClaim,false);
 assert.ok(link.sharedEvidenceFragmentCodes.length>=1);
}
assert.deepEqual(domainDoc.canonicalDomainSummary.map(x=>x.domainCode),[
 'feedback_scaling','knowledge_expression','material_infrastructure','organizational_coordination','responsibility_boundary'
]);

assert.equal(freeze.status,'frozen');
assert.equal(freeze.baselineCommit,'5fd6ff4');
assert.equal(freeze.outputs.relationshipMechanismDigest,relDoc.digest);
assert.equal(freeze.outputs.crossDomainDigest,domainDoc.digest);
assert.equal(freeze.authorityBoundaries.providerUsed,false);
assert.equal(freeze.authorityBoundaries.unpublishedPromotion,false);
assert.equal(freeze.authorityBoundaries.causalClaimGeneration,false);

console.log('✓ STEP76 published-only Relationship and Mechanism Expansion passed.');
console.log('✓ STEP77 evidence-backed Cross-domain Expansion passed.');
console.log(`✓ ${relDoc.recordCount} locale expansions / ${domainDoc.recordCount} domain records / ${domainDoc.linkCount} non-causal cross-domain links.`);
console.log('✓ KN-PREFACE-002 remains an external unpublished boundary; no Provider or unsupported inference was used.');

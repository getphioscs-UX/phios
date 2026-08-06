import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadSemanticGraphRuntime } from './lib/knowledge-runtime/semantic-graph.mjs';

const runtime = loadSemanticGraphRuntime(process.cwd());
assert.equal(runtime.nodes.size, 716);
assert.equal(runtime.profiles.size, 716);
assert.deepEqual([...runtime.nodes.keys()].sort(), [...runtime.profiles.keys()].sort());
const required = ['nodeCode','canonicalQuestion','mechanism','mechanismScope','boundary','carrierScope','runtimeLayer','inputs','outputs','conditions','dependencies','contradictions','distinctions','searchConcepts','searchAliases','evidenceTypes','notThisNodeWhen','lifecycle','profileVersion','status','humanReviewed'];
for (const profile of runtime.profiles.values()) {
  for (const field of required) assert.ok(Object.hasOwn(profile, field), `${profile.nodeCode} missing ${field}`);
  assert.notEqual(profile.status, 'approved');
  assert.equal(profile.humanReviewed, false);
}
assert.ok(runtime.relationshipRegistry.allowedRelationshipTypes.includes('prerequisite_of'));
assert.ok(runtime.relationshipRegistry.allowedRelationshipTypes.includes('related_to'));
assert.ok(runtime.relationshipRegistry.relationships.length > 0);
const sample = runtime.resolve('KN-B1-P5-001');
assert.equal(sample.semanticProfile.nodeCode, 'KN-B1-P5-001');
assert.ok(Array.isArray(sample.relationships));
const serialized = JSON.stringify({profiles:[...runtime.profiles.values()], relationships:runtime.relationshipRegistry});
for (const forbidden of ['OpenAI','Workers AI','Interpretation Candidate','Professional Signature','Projection JSON']) assert.equal(serialized.includes(forbidden), false);
assert.equal(fs.existsSync('content/knowledge/semantic/semantic-profile-registry.json'), true);
console.log('KH-W4G.5 STEP 10-14 Canonical Semantic Graph Foundation checks passed.');
console.log(`Validated: ${runtime.nodes.size} Nodes, one profile per Node, controlled registries, relationship graph, no automatic approval.`);

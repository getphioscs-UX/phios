import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';

const readText = file => fs.readFile(file, 'utf8');
const readJson = async file => JSON.parse(await readText(file));
const canonical = value => `${JSON.stringify(value, Object.keys(value).sort())}\n`;
const digestObject = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');

const paths = {
  manifest: 'content/knowledge/runtime/knowledge-intelligence/phase-k/checker-manifest-v1.json',
  profiles: 'content/knowledge/intelligence/semantic-profiles/published-semantic-profiles.json',
  graph: 'content/knowledge/intelligence/graph/published-knowledge-graph.json',
  relationships: 'content/knowledge/intelligence/expansion/relationship-mechanism-expansion.json',
  domains: 'content/knowledge/intelligence/expansion/cross-domain-expansion.json',
  assembly: 'content/knowledge/intelligence/assembly/canonical-assembly.json',
  compression: 'content/knowledge/intelligence/compression/knowledge-compression.json',
  reading: 'content/knowledge/intelligence/reading/dynamic-reading-paths.json',
  projection: 'content/knowledge/intelligence/projection/adaptive-knowledge-projections.json',
  fragments: 'content/knowledge/public/retrieval/fragments.json',
  freeze: 'content/knowledge/production/freeze/knowledge-intelligence-phase-k-v1.json'
};
const [manifest,profiles,graph,relationships,domains,assembly,compression,reading,projection,fragments,freeze] = await Promise.all(Object.values(paths).map(readJson));

assert.equal(manifest.phase, 'PHASE-K');
assert.deepEqual(manifest.steps, ['STEP74','STEP75','STEP76','STEP77','STEP78','STEP79','STEP80','STEP81']);
assert.equal(manifest.packages.length, 4);
assert.equal(manifest.authorityBoundaries.publishedOnly, true);
for (const key of ['providerUsed','generatedAnswer','generatedSummary','newCanonicalMeaning','unpublishedPromotion','registryMutation','publicationMutation']) assert.equal(manifest.authorityBoundaries[key], false);

assert.equal(profiles.profileCount, 2);
assert.equal(profiles.canonicalNodeCount, 1);
assert.equal(graph.canonicalNodeCount, 1);
assert.equal(graph.nodes.some(node => node.nodeCode === 'KN-PREFACE-002'), false);
assert.ok(graph.externalBoundaries.some(boundary => boundary.targetNodeCode === 'KN-PREFACE-002'));
assert.equal(relationships.recordCount, profiles.profileCount);
assert.equal(domains.recordCount, 10);
assert.equal(domains.linkCount, 20);
assert.equal(assembly.assemblyCount, 16);
assert.equal(compression.blockCount, assembly.assemblyCount);
assert.equal(reading.pathCount, 10);
assert.equal(projection.profileCount, 10);

const fragmentMap = new Map(fragments.records.map(fragment => [fragment.fragmentCode, fragment]));
const assemblyMap = new Map(assembly.assemblies.map(item => [item.assemblyCode, item]));
const blockMap = new Map(compression.blocks.map(block => [block.blockCode, block]));

for (const item of assembly.assemblies) {
  assert.equal(item.publishedFragmentsOnly, true);
  assert.equal(item.providerUsed, false);
  assert.equal(item.generatedText, false);
  assert.equal(item.nodeCodes.includes('KN-PREFACE-002'), false);
  for (const fragment of item.fragmentDigests) assert.equal(fragmentMap.get(fragment.fragmentCode)?.digest, fragment.digest);
}
for (const block of compression.blocks) {
  assert.equal(block.sourceTextPreserved, true);
  assert.equal(block.newCanonicalMeaning, false);
  assert.equal(block.generatedSummary, false);
  assert.equal(block.providerUsed, false);
  const sourceAssembly = assemblyMap.get(block.assemblyCode);
  assert.ok(sourceAssembly);
  assert.equal(sourceAssembly.assemblyDigest, block.assemblyDigest);
  for (const fragment of block.fragments) {
    const source = fragmentMap.get(fragment.fragmentCode);
    assert.ok(source);
    assert.equal(fragment.text, source.text);
    assert.equal(fragment.digest, source.digest);
  }
}
for (const path of reading.paths) {
  assert.equal(path.publishedOnly, true);
  assert.ok(path.blockCodes.every(code => blockMap.has(code)));
  assert.equal(path.blockCodes.some(code => code.includes('KN-PREFACE-002')), false);
}
for (const profile of projection.profiles) {
  assert.equal(profile.generatedAnswer, false);
  assert.equal(profile.sourceTextPreserved, true);
  assert.ok(profile.blockCodes.every(code => blockMap.has(code)));
}

assert.equal(freeze.status, 'frozen');
assert.equal(freeze.baselineCommit, '0348586');
assert.deepEqual(freeze.steps, manifest.steps);
assert.equal(freeze.outputs.semanticProfileCount, profiles.profileCount);
assert.equal(freeze.outputs.graphNodeCount, graph.nodes.length);
assert.equal(freeze.outputs.relationshipExpansionCount, relationships.recordCount);
assert.equal(freeze.outputs.crossDomainRecordCount, domains.recordCount);
assert.equal(freeze.outputs.assemblyCount, assembly.assemblyCount);
assert.equal(freeze.outputs.knowledgeBlockCount, compression.blockCount);
assert.equal(freeze.outputs.dynamicPathProfileCount, reading.pathCount);
assert.equal(freeze.outputs.adaptiveProjectionProfileCount, projection.profileCount);
for (const [name,file] of Object.entries(paths)) {
  if (name === 'freeze') continue;
  assert.equal(freeze.digests[file], digestObject(await readJson(file)));
}
for (const key of ['providerUsed','generatedAnswer','generatedSummary','newCanonicalMeaning','unpublishedPromotion','registryMutation','publicationMutation']) assert.equal(freeze.authorityBoundaries[key], false);

console.log('✓ STEP74–81 Knowledge Intelligence chain consistency passed.');
console.log('✓ Profiles → Graph → Expansion → Assembly → Compression → Dynamic Paths → Adaptive Projection passed.');
console.log(`✓ ${profiles.profileCount} profiles / ${graph.nodes.length} graph nodes / ${assembly.assemblyCount} assemblies / ${compression.blockCount} blocks / ${reading.pathCount} paths.`);
console.log('✓ Published-only, source-preserving, no Provider, no generated answer, no unpublished promotion passed.');

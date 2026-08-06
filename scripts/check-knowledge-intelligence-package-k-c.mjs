import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {buildCanonicalAssembly,buildKnowledgeCompression,sha} from './lib/knowledge-intelligence/package-k-c-v1.mjs';
const read=async f=>JSON.parse(await fs.readFile(f,'utf8'));
const [contract,assemblyPolicy,compressionPolicy,assembly,compression,fragments,graph,freeze]=await Promise.all([
 read('content/knowledge/contracts/knowledge-intelligence-package-k-c-v1.json'),
 read('content/knowledge/runtime/knowledge-intelligence/package-k-c/canonical-assembly-policy-v1.json'),
 read('content/knowledge/runtime/knowledge-intelligence/package-k-c/knowledge-compression-policy-v1.json'),
 read('content/knowledge/intelligence/assembly/canonical-assembly.json'),
 read('content/knowledge/intelligence/compression/knowledge-compression.json'),
 read('content/knowledge/public/retrieval/fragments.json'),
 read('content/knowledge/intelligence/graph/published-knowledge-graph.json'),
 read('content/knowledge/production/freeze/knowledge-intelligence-package-k-c-v1.json')
]);
assert.equal(contract.contractCode,'PHI-OS-KNOWLEDGE-INTELLIGENCE-PACKAGE-K-C-v1.0.0');
assert.deepEqual(contract.steps,['STEP78','STEP79']);
for(const x of ['provider_call','generated_summary','fragment_rewrite','new_canonical_meaning','unpublished_promotion','dynamic_reading_paths','adaptive_projection'])assert.ok(contract.prohibited.includes(x));
assert.equal(assemblyPolicy.fragmentTextMutationAllowed,false);
assert.equal(compressionPolicy.compressionMode,'extractive_reference_grouping');
assert.equal(compressionPolicy.generatedSummaryAllowed,false);
const rebuiltAssembly=await buildCanonicalAssembly();
const rebuiltCompression=await buildKnowledgeCompression(rebuiltAssembly);
assert.deepEqual(assembly,rebuiltAssembly);
assert.deepEqual(compression,rebuiltCompression);
const fragmentMap=new Map(fragments.records.map(f=>[f.fragmentCode,f]));
assert.equal(assembly.canonicalNodeCount,1);
assert.equal(assembly.localeCount,2);
assert.ok(assembly.assemblyCount>=8);
for(const a of assembly.assemblies){
 assert.equal(a.publishedFragmentsOnly,true); assert.equal(a.providerUsed,false); assert.equal(a.generatedText,false);
 assert.ok(a.fragmentCodes.length>0); assert.ok(!a.nodeCodes.includes('KN-PREFACE-002'));
 for(const fd of a.fragmentDigests){assert.equal(fragmentMap.get(fd.fragmentCode)?.digest,fd.digest);}
}
assert.equal(compression.blockCount,assembly.assemblyCount);
for(const b of compression.blocks){
 assert.equal(b.compressionMode,'extractive_reference_grouping'); assert.equal(b.sourceTextPreserved,true);
 assert.equal(b.newCanonicalMeaning,false); assert.equal(b.generatedSummary,false); assert.equal(b.providerUsed,false);
 const a=assembly.assemblies.find(x=>x.assemblyCode===b.assemblyCode); assert.ok(a); assert.equal(a.assemblyDigest,b.assemblyDigest);
 for(const f of b.fragments){const src=fragmentMap.get(f.fragmentCode);assert.ok(src);assert.equal(f.text,src.text);assert.equal(f.digest,src.digest);}
}
assert.ok(!graph.nodes.some(n=>n.nodeCode==='KN-PREFACE-002'));
assert.ok(graph.externalBoundaries.some(b=>b.targetNodeCode==='KN-PREFACE-002'));
assert.equal(freeze.status,'frozen'); assert.equal(freeze.baselineCommit,'7446f97');
assert.equal(freeze.outputs.assemblyDigest,assembly.digest); assert.equal(freeze.outputs.compressionDigest,compression.digest);
assert.equal(freeze.authorityBoundaries.providerUsed,false); assert.equal(freeze.authorityBoundaries.generatedSummary,false); assert.equal(freeze.authorityBoundaries.unpublishedPromotion,false);
console.log('✓ STEP78 deterministic Canonical Assembly passed.');
console.log('✓ STEP79 extractive Knowledge Compression passed.');
console.log(`✓ ${assembly.assemblyCount} assemblies / ${compression.blockCount} controlled knowledge blocks across ${assembly.localeCount} locales.`);
console.log('✓ Published fragment text and digests are preserved; no Provider, generated summary or unpublished promotion was used.');

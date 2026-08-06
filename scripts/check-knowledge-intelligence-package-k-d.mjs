import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {buildPackageKDCatalog,buildDynamicReadingPath,buildAdaptiveKnowledgeProjection} from './lib/knowledge-intelligence/package-k-d-v1.mjs';
const read=async f=>JSON.parse(await fs.readFile(f,'utf8'));
const [contract,pathPolicy,projectionPolicy,paths,profiles,compression,fragments,graph,quality,freeze]=await Promise.all([
 read('content/knowledge/contracts/knowledge-intelligence-package-k-d-v1.json'),
 read('content/knowledge/runtime/knowledge-intelligence/package-k-d/dynamic-reading-path-policy-v1.json'),
 read('content/knowledge/runtime/knowledge-intelligence/package-k-d/adaptive-knowledge-projection-policy-v1.json'),
 read('content/knowledge/intelligence/reading/dynamic-reading-paths.json'),
 read('content/knowledge/intelligence/projection/adaptive-knowledge-projections.json'),
 read('content/knowledge/intelligence/compression/knowledge-compression.json'),
 read('content/knowledge/public/retrieval/fragments.json'),
 read('content/knowledge/intelligence/graph/published-knowledge-graph.json'),
 read('content/knowledge/public/quality/published-quality-evaluation.json').catch(()=>({status:'not_evaluated'})),
 read('content/knowledge/production/freeze/knowledge-intelligence-package-k-d-v1.json')
]);
assert.equal(contract.contractCode,'PHI-OS-KNOWLEDGE-INTELLIGENCE-PACKAGE-K-D-v1.0.0');
assert.deepEqual(contract.steps,['STEP80','STEP81']);
for(const x of ['provider_call','generated_answer','generated_summary','fragment_rewrite','new_canonical_meaning','translation','unpublished_promotion'])assert.ok(contract.prohibited.includes(x));
assert.equal(pathPolicy.publishedBlocksOnly,true);
assert.equal(pathPolicy.unpublishedTargetsBlocked,true);
assert.equal(projectionPolicy.sourceTextPreserved,true);
assert.equal(projectionPolicy.generatedAnswerAllowed,false);
assert.equal(projectionPolicy.generatedSummaryAllowed,false);
const rebuilt=await buildPackageKDCatalog();
assert.deepEqual(paths,rebuilt.readingPaths);
assert.deepEqual(profiles,rebuilt.projectionProfiles);
assert.equal(paths.pathCount,10);
assert.equal(profiles.profileCount,10);
const blockMap=new Map(compression.blocks.map(b=>[b.blockCode,b]));
for(const p of paths.paths){
 assert.ok(['en','zh-Hans'].includes(p.locale));
 assert.equal(p.publishedOnly,true);
 assert.ok(!p.blockCodes.length||p.blockCodes.every(c=>blockMap.has(c)));
}
const zhQuery='人工智能如何从文明能力中形成？';
const dynamic=await buildDynamicReadingPath({query:zhQuery,locale:'zh-Hans',purpose:'deep_reading'});
assert.equal(dynamic.pathCode,'KID-DYNAMIC-PUBLISHED-KNOWLEDGE-PATH');
assert.equal(dynamic.entryNodeCode,'KN-PREFACE-001');
assert.ok(dynamic.steps.length>0);
assert.equal(dynamic.generatedAnswer,false);
assert.equal(dynamic.providerUsed,false);
assert.ok(dynamic.blockedContinuations.some(x=>x.targetNodeCode==='KN-PREFACE-002'&&x.navigable===false));
const projection=await buildAdaptiveKnowledgeProjection({query:zhQuery,locale:'zh-Hans',purpose:'deep_reading'});
assert.equal(projection.projectionCode,'KID-ADAPTIVE-CONTROLLED-KNOWLEDGE-PROJECTION');
assert.equal(projection.generatedAnswer,false);
assert.equal(projection.generatedSummary,false);
assert.equal(projection.providerUsed,false);
assert.equal(projection.newCanonicalMeaning,false);
assert.equal(projection.sourceTextPreserved,true);
assert.ok(projection.blocks.length>0);
const fragmentMap=new Map(fragments.records.map(f=>[f.fragmentCode,f]));
for(const f of projection.fragments){const src=fragmentMap.get(f.fragmentCode);assert.ok(src);assert.equal(f.text,src.text);assert.equal(f.digest,src.digest);assert.equal(f.fragmentCode.includes('-ZH-HANS-'),true);}
assert.ok(!graph.nodes.some(n=>n.nodeCode==='KN-PREFACE-002'));
assert.equal(freeze.status,'frozen');
assert.equal(freeze.baselineCommit,'b358ef3');
assert.equal(freeze.outputs.dynamicReadingPathDigest,paths.digest);
assert.equal(freeze.outputs.adaptiveProjectionProfileDigest,profiles.digest);
assert.equal(freeze.authorityBoundaries.generatedAnswer,false);
assert.equal(freeze.authorityBoundaries.unpublishedPromotion,false);
console.log('✓ STEP80 deterministic Dynamic Reading Paths passed.');
console.log('✓ STEP81 source-preserving Adaptive Knowledge Projection passed.');
console.log(`✓ ${paths.pathCount} path profiles / ${profiles.profileCount} projection profiles across 2 locales.`);
console.log(`✓ Package D quality status remains disclosed as ${quality.status??'unknown'}; no Provider or unpublished promotion used.`);

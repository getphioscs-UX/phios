import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const root=process.cwd(); const j=async p=>JSON.parse(await fs.readFile(path.join(root,p),'utf8'));
const base='content/professional/canonical-meaning-runtime';
const runtime=await import(pathToFileURL(path.join(root,'functions/canonical-meaning-runtime/canonical-meaning-runtime.js')));
const bridge=await import(pathToFileURL(path.join(root,'functions/canonical-meaning-runtime/meaning-knowledge-bridge.js')));
const registries={
  meaningCodeRegistry:await j(`${base}/registries/canonical-meaning-code-registry-v1.2.json`),
  meaningFamilyRegistry:await j(`${base}/registries/canonical-meaning-family-registry-v1.1.json`),
  meaningDimensionRegistry:await j(`${base}/registries/canonical-meaning-dimension-registry-v1.json`),
  knowledgeMap:await j(`${base}/registries/canonical-meaning-knowledge-map-v1.2.json`),
  mappingRegistries:[
    await j(`${base}/registries/hdr-structure-mapping-registry-v1.json`),
    await j(`${base}/registries/hdr-runtime-mapping-registry-v1.json`),
    await j(`${base}/registries/hdr-variable-mapping-registry-v1.json`),
    await j(`${base}/registries/ast-meaning-mapping-registry-v1.json`),
    await j(`${base}/registries/bzr-meaning-mapping-registry-v1.json`)
  ]
};
const projection=await j(`${base}/fixtures/cmr-w11-hdr-gate-02-projection.valid.json`);
const bundle=await runtime.buildCanonicalMeaningBundle({projection,registries,locale:'zh-Hans'});
const knowledge={
  nodesRegistry:await j('content/knowledge/registry/nodes.json'),
  semanticProfiles:await j('content/knowledge/intelligence/semantic-profiles/published-semantic-profiles.json'),
  knowledgeGraph:await j('content/knowledge/intelligence/graph/published-knowledge-graph.json'),
  canonicalAssembly:await j('content/knowledge/intelligence/assembly/canonical-assembly.json'),
  adaptiveProjection:await j('content/knowledge/intelligence/projection/adaptive-knowledge-projections.json')
};
const a=await bridge.queryMeaningKnowledge({meaningBundle:bundle,knowledge,locale:'zh-Hans'});
const b=await bridge.queryMeaningKnowledge({meaningBundle:bundle,knowledge,locale:'zh-Hans'});
assert.deepEqual(a,b);
assert.equal(a.status,'validation_only');
assert.equal(a.authority.connectionMode,'reference_query_contract');
assert.equal(a.authority.meaningRegistryMergedWithKnowledgeRegistry,false);
assert.equal(a.authority.knowledgeAuthorityRewritten,false);
assert.equal(a.authority.unpublishedKnowledgeExposed,false);
assert.equal(a.knowledgeCoverage.sufficientForInterpretation,false);
assert.ok(['partial_coverage','no_coverage'].includes(a.knowledgeCoverage.status));
assert.ok(a.references.length>0);
const contract=await j(`${base}/contracts/meaning-knowledge-query-contract-v1.json`);
const policy=await j(`${base}/contracts/meaning-knowledge-coverage-policy-v1.json`);
const reconciliation=await j(`${base}/contracts/cmr-w13-w14-reconciliation-contract-v1.json`);
const acceptance=await j(`${base}/acceptance/cmr-w13-meaning-knowledge-bridge-acceptance-v1.json`);
const w14Contract=await j(`${base}/contracts/meaning-projection-for-journey-contract-v1.json`);
assert.equal(contract.contractVersion,'1.1.0');
assert.equal(contract.authority.connectionMode,'reference_query_contract');
assert.equal(contract.registryAuthority.meaningCodeRegistry,'canonical-meaning-code-registry-v1.2.json');
assert.equal(contract.registryAuthority.meaningFamilyRegistry,'canonical-meaning-family-registry-v1.1.json');
assert.equal(contract.registryAuthority.meaningKnowledgeMap,'canonical-meaning-knowledge-map-v1.2.json');
assert.equal(policy.interpretationEligibility.partial_coverage,false);
assert.equal(policy.providerFallbackAllowed,false);
assert.equal(policy.paidFallbackAllowed,false);
assert.equal(reconciliation.rules.cmW13Available,true);
assert.equal(reconciliation.rules.cmW14V1Frozen,true);
assert.equal(reconciliation.rules.cmW14V1MayQueryCMW13,false);
assert.equal(reconciliation.rules.futureLiveCMW13JourneyIntegrationRequiresVersionedSuccessor,true);
assert.equal(w14Contract.knowledgeBoundary.cmW13MeaningToKnowledgeBridgePresent,false);
assert.equal(w14Contract.knowledgeBoundary.knowledgeQueryAllowed,false);
assert.equal(w14Contract.knowledgeBoundary.futureCMW13IntegrationRequiresVersionedSuccessor,true);
assert.equal(acceptance.status,'passed_validation_only');
const source=await fs.readFile(path.join(root,'functions/canonical-meaning-runtime/meaning-knowledge-bridge.js'),'utf8');
assert.doesNotMatch(source,/\bfetch\s*\(|OpenAI|Workers AI|prompt\s*generation|article\s*generation/i);
console.log('✓ CM-W13 Meaning-to-Knowledge Bridge v1.1 passed.');
console.log('✓ Current Meaning registry successors are consumed read-only; Meaning and Knowledge authorities remain separate.');
console.log('✓ CM-W14 v1 remains frozen and independent of live CM-W13 queries; future integration requires a versioned successor.');

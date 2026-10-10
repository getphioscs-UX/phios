import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { buildCanonicalAssetBrief, digest } from './lib/canonical-asset-runtime/canonical-asset-brief-v1.mjs';
const readJson = async p => JSON.parse(await fs.readFile(p, 'utf8'));
const paths = {
 type:'content/professional/canonical-asset-runtime/registries/canonical-asset-type-registry-v1.json',
 meaning:'content/professional/canonical-meaning-runtime/fixtures/canonical-meaning.valid.json',
 nodes:'content/knowledge/registry/nodes.json', fragments:'content/knowledge/public/retrieval/fragments.json', assemblies:'content/knowledge/intelligence/assembly/canonical-assembly.json', locale:'content/knowledge/production/manifests/production-locale-manifest.json', pds:'content/registry/pds-w2-design-token-contract.json', valid:'content/professional/canonical-asset-runtime/fixtures/canonical-asset-brief.request.valid.json', invalid:'content/professional/canonical-asset-runtime/fixtures/canonical-asset-brief.request.invalid.json', contract:'content/professional/canonical-asset-runtime/contracts/canonical-asset-brief-runtime-v1.json', schema:'content/professional/canonical-asset-runtime/schemas/canonical-asset-brief-v1.schema.json', policy:'content/professional/canonical-asset-runtime/policies/canonical-asset-brief-coverage-policy-v1.json', freeze:'content/professional/canonical-asset-runtime/freeze/car-w2-freeze-v1.json'
};
const [types, meaning, nodes, fragments, assemblies, locale, pds, valid, invalid, contract, schema, policy, freeze] = await Promise.all(Object.values(paths).map(readJson));
const authorities = { assetTypes:types.assetTypes, meanings:[meaning], nodes:nodes.nodes, fragments:fragments.records, assemblies:assemblies.assemblies, supportedLocales:locale.supportedLocales, minimumPublishedFragmentCount:policy.minimumPublishedFragmentCount, pdsReferences:[pds.source.canonicalFile,'content/registry/pds-w2-design-token-contract.json'] };
const a = buildCanonicalAssetBrief(valid, authorities); const b = buildCanonicalAssetBrief(valid, authorities);
assert.deepEqual(a,b); assert.equal(a.briefDigest,digest(Object.fromEntries(Object.entries(a).filter(([k])=>k!=='briefDigest'))));
assert.equal(a.outputContract.assetIsBrief,false); assert.equal(a.outputContract.publicationAllowed,false); assert.equal(a.factualBoundary.newClaimsAllowed,false);
assert.ok(a.sourceFragmentDigests.length >= 1); assert.ok(a.knowledgeReferences.includes(a.nodeCode));
assert.deepEqual(Object.values(a.authorityValidation),[true,true,true,true,true]);
assert.throws(()=>buildCanonicalAssetBrief(invalid,authorities),/CAR_ASSET_BRIEF_GATE_FAILED/);
assert.equal(contract.invariants.assetBriefIsAsset,false); assert.equal(contract.invariants.providerRequired,false); assert.equal(freeze.productionStatus,'validation_only');
assert.ok(schema.required.includes('visualOrNarrativeContract')); assert.equal(types.assetTypes.length,18);
console.log('✓ CAR-W2 Canonical Asset Brief Runtime passed.');
console.log('✓ Meaning, Knowledge, Published Coverage, Locale and Asset Type gates are enforced.');
console.log('✓ Brief generation is deterministic, registry-led and provider-free.');
console.log('✓ Asset Brief remains distinct from Asset, Meaning, Knowledge and Published Fragment.');

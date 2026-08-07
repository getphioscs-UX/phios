import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const root=process.cwd(); const j=async p=>JSON.parse(await fs.readFile(path.join(root,p),'utf8'));
const runtime=await import(pathToFileURL(path.join(root,'functions/canonical-meaning-runtime/canonical-meaning-runtime.js')));
const convergence=await import(pathToFileURL(path.join(root,'functions/canonical-meaning-runtime/cross-method-meaning-convergence.js')));
const base='content/professional/canonical-meaning-runtime';
const registries={
 meaningCodeRegistry:await j(`${base}/registries/canonical-meaning-code-registry-v1.json`),
 meaningFamilyRegistry:await j(`${base}/registries/canonical-meaning-family-registry-v1.json`),
 meaningDimensionRegistry:await j(`${base}/registries/canonical-meaning-dimension-registry-v1.json`),
 knowledgeMap:await j(`${base}/registries/canonical-meaning-knowledge-map-v1.json`),
 mappingRegistries:[await j(`${base}/registries/hdr-structure-mapping-registry-v1.json`),await j(`${base}/registries/hdr-runtime-mapping-registry-v1.json`),await j(`${base}/registries/hdr-variable-mapping-registry-v1.json`),await j(`${base}/registries/ast-meaning-mapping-registry-v1.json`),await j(`${base}/registries/bzr-meaning-mapping-registry-v1.json`)]
};
const projection=await j(`${base}/fixtures/cmr-w11-hdr-gate-02-projection.valid.json`);
const a=await runtime.buildCanonicalMeaningBundle({projection,registries,locale:'zh-Hans'}); const b=await runtime.buildCanonicalMeaningBundle({projection,registries,locale:'zh-Hans'});
assert.deepEqual(a,b); assert.equal(a.meanings.length,1); assert.equal(a.meanings[0].meaningCode,'CM-FORMATION-SDU-02'); assert.equal(a.meanings[0].sourceProjection.methodCode,'HUMAN_DESIGN'); assert.equal(a.status,'validation_only'); assert.equal(a.meanings[0].status,'validation_only');
assert.equal(a.meanings[0].meaningDimensions.formationBoundary,'not_populated');
const bad=structuredClone(projection); bad.aiUsed=true; await assert.rejects(()=>runtime.buildCanonicalMeaningBundle({projection:bad,registries}),/CMR_PROJECTION_BOUNDARY_INVALID/);
const noMap=structuredClone(projection); noMap.projectionValue.activations=[{gate:999}]; await assert.rejects(()=>runtime.buildCanonicalMeaningBundle({projection:noMap,registries}),/CMR_MAPPING_NOT_FOUND/);
const fixture=await j(`${base}/fixtures/cmr-w12-cross-method-convergence.fixture-only.json`); const cv=await convergence.buildCrossMethodMeaningConvergence(fixture.bundles);
assert.equal(cv.sourceIndependence.independent,true); assert.equal(cv.sourceIndependence.independentMethodCount,2); assert.equal(cv.supportingSignals.length,2); assert.equal(cv.contradictingSignals.length,0); assert.equal(cv.status,'validation_only');
for (const file of ['functions/canonical-meaning-runtime/canonical-meaning-runtime.js','functions/canonical-meaning-runtime/cross-method-meaning-convergence.js']) { const s=await fs.readFile(path.join(root,file),'utf8'); assert.doesNotMatch(s,/\bfetch\s*\(/); assert.doesNotMatch(s,/OpenAI|Workers AI|prompt\s*generation|article\s*generation/i); }
console.log('✓ CM-W11 Canonical Meaning Runtime passed.');
console.log('✓ Canonical Projection → Mapping Registry → Boundary Validation → Canonical Meaning Bundle is deterministic and registry-led.');
console.log('✓ CM-W12 Cross-Method Meaning Convergence passed.');
console.log('✓ Cross-method co-location never promotes agreement into a reality fact, Professional conclusion or Reality decision.');

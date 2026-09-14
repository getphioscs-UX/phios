import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const baseline = path.join(root, 'content', 'production-truth', 'baseline');

async function json(name) {
  return JSON.parse(await readFile(path.join(baseline, name), 'utf8'));
}

const [census, graph, deployment, environment] = await Promise.all([
  json('ptrc-w0-repository-census-v1.json'),
  json('ptrc-w0-route-consumer-graph-v1.json'),
  json('ptrc-w0-deployment-evidence-v1.json'),
  json('ptrc-w0-environment-binding-audit-v1.json')
]);

const expectedCommit = 'f9ba2940fd80553686833e068e03a74e72a825d3';
for (const record of [census, graph, deployment, environment]) {
  assert.equal(record.baselineCommit, expectedCommit, `${record.schemaVersion} must bind to the approved baseline commit.`);
}

assert.equal(census.canonicalCodeAuthority, 'github:main');
assert.equal(census.brand.preferredVisibleLogo, 'LOGO-003');
assert.deepEqual(census.brand.conditionalMonochromeLogos, ['LOGO-009', 'LOGO-011']);
assert.ok(census.brand.forbiddenFallbacks.includes('MATHEMATICAL_PHI_GLYPH'));
assert.equal(census.contentTruth.articleBodyAuthority, 'ARTICLE_JSON_ONLY');
assert.equal(census.contentTruth.book5ManuscriptSourceUploaded, false);
assert.equal(census.contentTruth.book5ManuscriptExtractionComplete, false);
assert.equal(census.contentTruth.book5ArticleProductionComplete, false);
assert.deepEqual(census.contentTruth.atlasLayersPresent, [2, 3, 4, 5, 6, 7, 8]);
assert.equal(census.contentTruth.book5FabricationPermitted, false);

const routeKeys = graph.routes.map(route => route.path || route.pathPattern);
assert.equal(new Set(routeKeys).size, graph.routes.length, 'Routes must be unique.');
assert.ok(graph.routes.every(route => route.owner && route.consumers.length > 0), 'Every route must have an owner and consumers.');
assert.deepEqual(graph.retrievalChain, ['ATLAS_ENTITY', 'ATLAS_EVIDENCE', 'PART_12', 'BROADER_GOVERNED_KNOWLEDGE']);
assert.ok(graph.unavailableRetrievalScope.includes('BOOK_5_MANUSCRIPT'));

assert.deepEqual(deployment.origins.map(origin => origin.id).sort(), ['CLOUDFLARE_PAGES_PREVIEW', 'CUSTOM_DOMAIN']);
assert.ok(deployment.requiredEvidence.includes('COMMIT_SHA'));
assert.ok(deployment.requiredEvidence.includes('DEPLOYMENT_ID'));

assert.ok(environment.bindings.some(binding => binding.name === 'AI'));
assert.ok(environment.bindings.some(binding => binding.name === 'RUNTIME_DB'));
assert.ok(environment.bindings.some(binding => binding.name === 'MANUSCRIPTS'));
assert.equal(environment.secretsPolicy.valuesRecorded, false);
assert.equal(environment.modelFeatureFlags.productionValues, 'UNVERIFIED');

console.log('✓ PTRC-W0 Production Truth Baseline passed.');
console.log('  Baseline commit, route ownership, deployment evidence, environment bindings, logo policy, Book V boundary and Atlas layers 2–8 are frozen for W0.');

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const readJson = async file =>
  JSON.parse(await fs.readFile(path.join(root, file), 'utf8'));
const exists = async file => {
  try { await fs.access(path.join(root, file)); return true; }
  catch { return false; }
};

const registry = await readJson(
  'content/professional/cross-runtime-authority/runtime-authority-registry-v1.json'
);
const relationships = await readJson(
  'content/professional/cross-runtime-authority/runtime-authority-relationship-v1.json'
);
const matrix = await readJson(
  'content/professional/cross-runtime-authority/runtime-source-of-truth-matrix-v1.json'
);
const identity = await readJson(
  'content/professional/cross-runtime-authority/cross-runtime-object-identity-v1.json'
);
const lineage = await readJson(
  'content/professional/cross-runtime-authority/cross-runtime-lineage-contract-v1.json'
);
const freeze = await readJson(
  'content/professional/cross-runtime-authority/cross-runtime-authority-freeze-v1.json'
);

assert.equal(registry.phaseCode, 'PHASE-0');
assert.equal(registry.stepCode, 'STEP-0.1');
assert.equal(registry.status, 'frozen');
assert.match(registry.baseline.commit, /^[a-f0-9]{40}$/);

const expectedAuthorities = [
  'INPUT_AUTHORITY',
  'METHOD_AUTHORITY',
  'PROJECTION_AUTHORITY',
  'MEANING_AUTHORITY',
  'KNOWLEDGE_AUTHORITY',
  'ASSET_AUTHORITY',
  'JOURNEY_AUTHORITY',
  'PROFESSIONAL_AUTHORITY',
  'REPORT_AUTHORITY',
  'PRESENTATION_AUTHORITY',
  'PUBLICATION_AUTHORITY'
];

assert.deepEqual(
  registry.authorities.map(item => item.authorityCode),
  expectedAuthorities
);
assert.equal(
  new Set(registry.authorities.map(item => item.objectDomain)).size,
  registry.authorities.length
);
assert.equal(
  new Set(registry.authorities.map(item => item.authorityCode)).size,
  registry.authorities.length
);

for (const authority of registry.authorities) {
  assert.equal(
    await exists(authority.sourceOfTruth),
    true,
    `Authority source missing: ${authority.sourceOfTruth}`
  );
  assert.equal(authority.mayCreateDownstreamObjects, false);
}

const authoritySet = new Set(expectedAuthorities);
for (const edge of relationships.edges) {
  assert.ok(authoritySet.has(edge.from));
  assert.ok(authoritySet.has(edge.to));
  assert.notEqual(edge.from, edge.to);
  assert.equal(edge.writeThroughAllowed, false);
}

assert.equal(matrix.rows.length, 11);
assert.equal(
  new Set(matrix.rows.map(item => item.objectType)).size,
  matrix.rows.length
);
for (const row of matrix.rows) {
  assert.ok(authoritySet.has(row.authorityCode));
  assert.equal(row.mutableByConsumers, false);
}

assert.equal(identity.stepCode, 'STEP-0.2');
assert.equal(identity.identities.length, 10);
assert.equal(
  new Set(identity.identities.map(item => item.field)).size,
  identity.identities.length
);
assert.equal(
  new Set(identity.identities.map(item => item.objectType)).size,
  identity.identities.length
);
assert.equal(
  new Set(identity.identities.map(item => item.prefix)).size,
  identity.identities.length
);
for (const item of identity.identities) {
  assert.ok(authoritySet.has(item.authorityCode));
  assert.match(item.prefix, /^[A-Z]+-$/);
}
assert.equal(identity.rules.sameCodeMayRepresentDifferentObjectTypes, false);
assert.equal(identity.rules.codeMayChangeWithLocale, false);
assert.equal(identity.rules.codeMayChangeWithPublicationState, false);

assert.equal(lineage.stepCode, 'STEP-0.3');
assert.equal(lineage.digestAlgorithm, 'sha256');
assert.equal(lineage.chain.length, 10);
assert.deepEqual(
  lineage.chain.map(item => item.order),
  [1,2,3,4,5,6,7,8,9,10]
);
assert.deepEqual(
  lineage.chain.map(item => item.digestField),
  [
    'inputDigest',
    'calculationDigest',
    'projectionDigest',
    'meaningDigest',
    'knowledgeReferenceDigest',
    'assetBriefDigest',
    'assetDigest',
    'journeyDigest',
    'professionalDecisionDigest',
    'reportDigest'
  ]
);
for (const link of lineage.chain) {
  assert.ok(authoritySet.has(link.authorityCode));
}
assert.equal(lineage.rules.upstreamObjectMutationAllowed, false);
assert.equal(lineage.rules.missingIntermediateLineageAllowed, false);
assert.equal(lineage.rules.lineageMustFailClosed, true);

const sharedData = await readJson(
  'content/professional/method-runtime/shared-data-authority-v1.json'
);
const sharedProjection = await readJson(
  'content/professional/method-runtime/shared-projection-runtime-v1.json'
);
const meaningBoundary = await readJson(
  'content/professional/canonical-meaning-runtime/audits/cmr-authority-boundary-v1.json'
);
const knowledgeAuthority = await readJson(
  'content/knowledge/contracts/knowledge-registry-authority-v2.json'
);
const assetBoundary = await readJson(
  'content/professional/canonical-asset-runtime/audits/car-authority-boundary-v1.json'
);
const professional = await readJson(
  'content/professional/method-runtime/shared-professional-runtime-v1.json'
);
const published = await readJson(
  'content/knowledge/contracts/published-knowledge-authority-v1.json'
);

assert.equal(sharedData.authorityCode, 'SHARED_DATA_AUTHORITY');
assert.equal(sharedProjection.runtimeCode, 'SHARED_PROJECTION_RUNTIME');
assert.equal(
  meaningBoundary.authorities.canonicalMeaningAuthority
    .doesNotOwn.includes('method projections'),
  true
);
assert.equal(
  knowledgeAuthority.projectionRules.blueprintMayCreateCanonicalNode,
  false
);
assert.equal(
  assetBoundary.invariants.canonicalAssetMayRewriteKnowledge,
  false
);
assert.equal(professional.runtimeCode, 'SHARED_PROFESSIONAL_RUNTIME');
assert.equal(published.sourceOfTruth, 'Publication Packages');

assert.equal(freeze.status, 'PHASE 0 Frozen v1');
assert.equal(freeze.freezeRules.existingRuntimeFilesModified, false);
assert.equal(freeze.freezeRules.duplicateAuthorityAllowed, false);
assert.equal(freeze.freezeRules.identityCollisionAllowed, false);
assert.equal(freeze.freezeRules.lineageGapAllowed, false);
assert.equal(freeze.freezeRules.productionPromotionAllowed, false);

console.log('✓ PHASE 0 STEP 0.1 Runtime Authority Registry passed.');
console.log('  11 object domains resolve to one declared authority each.');
console.log('✓ PHASE 0 STEP 0.2 Cross-Runtime Object Identity passed.');
console.log('  10 canonical identity fields use unique object types and prefixes.');
console.log('✓ PHASE 0 STEP 0.3 Cross-Runtime Lineage Contract passed.');
console.log('  Input → Calculation → Projection → Meaning → Knowledge → Asset → Journey → Professional Decision → Report is fail-closed.');
console.log('✓ PHASE 0 Cross-Runtime Authority Freeze passed without rebuilding existing runtimes.');

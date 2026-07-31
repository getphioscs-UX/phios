import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';

const root = process.cwd();
const readJson = async (relative) => JSON.parse(await fs.readFile(path.join(root, relative), 'utf8'));
const readText = async (relative) => fs.readFile(path.join(root, relative), 'utf8');

const paths = {
  meaningSchema: 'content/knowledge/meaning/schemas/meaning.schema.json',
  ruleSchema: 'content/knowledge/meaning/schemas/formation-rule.schema.json',
  projectionSchema: 'content/knowledge/meaning/schemas/projection.schema.json',
  relationshipSchema: 'content/knowledge/meaning/schemas/meaning-relationship.schema.json',
  meanings: 'content/knowledge/meaning/registry/meanings.json',
  rules: 'content/knowledge/meaning/registry/formation-rules.json',
  projections: 'content/knowledge/meaning/registry/projections.json',
  relationships: 'content/knowledge/meaning/registry/meaning-relationships.json',
  boundary: 'content/knowledge/meaning/governance/kmr-w0-boundary.json'
};

const ajv = new Ajv2020({ allErrors: true, strict: true });
const validators = {
  meaning: ajv.compile(await readJson(paths.meaningSchema)),
  rule: ajv.compile(await readJson(paths.ruleSchema)),
  projection: ajv.compile(await readJson(paths.projectionSchema)),
  relationship: ajv.compile(await readJson(paths.relationshipSchema))
};

const validMeaning = {
  meaningId: 'KM-P1-001', nodeCode: 'KN-P1-001', canonicalLanguage: 'zh-Hans',
  canonicalMeaning: 'A governed meaning candidate.',
  meaningBoundary: { includes: ['formation mechanism'], excludes: ['personal diagnosis'] },
  authorityStatus: 'candidate', sourceVersion: 'book-i-draft', version: '1.0.0'
};
assert(validators.meaning(validMeaning), ajv.errorsText(validators.meaning.errors));
assert.equal(validators.meaning({ ...validMeaning, authorityStatus: 'approved' }), false);
assert.equal(validators.meaning({ ...validMeaning, articleBody: 'not allowed' }), false);

const validRule = {
  ruleId: 'KFR-P1-001', meaningId: 'KM-P1-001', ruleType: 'formation',
  conditions: ['condition a'], outcome: 'formation outcome', boundary: 'theory only',
  authorityStatus: 'candidate', version: '1.0.0'
};
assert(validators.rule(validRule), ajv.errorsText(validators.rule.errors));
assert.equal(validators.rule({ ...validRule, customerEvidence: ['private case'] }), false);

const validProjection = {
  projectionId: 'KP-WEB-P1-001', nodeCode: 'KN-P1-001', meaningId: 'KM-P1-001',
  projectionType: 'website_article', language: 'zh-Hans', sourceMeaningVersion: '1.0.0',
  lifecycleState: 'planned', reviewState: 'not_reviewed', publicationState: 'not_publication_ready', version: '1.0.0'
};
assert(validators.projection(validProjection), ajv.errorsText(validators.projection.errors));
assert.equal(validators.projection({ ...validProjection, publicationState: 'auto_published' }), false);

const validRelationship = {
  relationshipId: 'KMR-P1-001', sourceMeaningId: 'KM-P1-001', targetMeaningId: 'KM-P1-002',
  relationshipType: 'depends_on', direction: 'directed', authorityStatus: 'candidate', version: '1.0.0'
};
assert(validators.relationship(validRelationship), ajv.errorsText(validators.relationship.errors));
assert.equal(validators.relationship({ ...validRelationship, relationshipType: 'diagnoses' }), false);

for (const relative of [paths.meanings, paths.rules, paths.projections, paths.relationships]) {
  const registry = await readJson(relative);
  assert.equal(registry.version, '1.0.0');
  assert.deepEqual(registry.records, [], `${relative} must remain empty at KMR-W0`);
}

const boundary = await readJson(paths.boundary);
assert.equal(boundary.contract, 'PHI-OS-KMR-W0-BASELINE-BOUNDARY-v1.0.0');
assert.equal(boundary.publicReadPolicy, 'deny_by_default');
assert.equal(boundary.writePolicy, 'human_governed_future_stage_only');
assert(boundary.principles.some((item) => item.includes('PJA')));
assert(boundary.principles.some((item) => item.includes('Runtime')));

const nodes = await readJson('content/knowledge/registry/nodes.json');
assert.equal(nodes.version, '1.1.0');
assert(nodes.nodes.length >= 13);
assert.equal(new Set(nodes.nodes.map((item) => item.nodeCode)).size, nodes.nodes.length);

const forbiddenPublicReferences = [
  'content/knowledge/meaning/registry/meanings.json',
  'content/knowledge/meaning/registry/formation-rules.json',
  'content/knowledge/meaning/registry/projections.json',
  'content/knowledge/meaning/registry/meaning-relationships.json'
];
const publicFiles = ['index.html', 'articles.html', 'book-one.html', 'reality-journey.html', 'professional-workspace.html'];
for (const file of publicFiles) {
  const text = await readText(file);
  for (const forbidden of forbiddenPublicReferences) {
    assert.equal(text.includes(forbidden), false, `${file} must not read ${forbidden}`);
  }
}

const packageJson = await readJson('package.json');
assert.equal(packageJson.scripts['check:kmr-w0'], 'npm run check:pja-w2f-c3 && node scripts/check-kmr-w0-meaning-runtime-baseline.mjs');

console.log('✓ KMR-W0 Meaning Runtime Baseline and PJA Compatibility passed.');
console.log('  Canonical Meaning, Formation Rule, Projection and Meaning Relationship contracts are strict and additive.');
console.log('  Four KMR registries remain intentionally empty; no Book I content is fabricated or auto-promoted.');
console.log('  Existing Canonical Node identity and the complete PJA W1–C3 chain remain authoritative and compatible.');
console.log('  Public pages do not read KMR registries; public access remains deny-by-default.');
console.log('  No review, approval, publication, Runtime, Provider, Payment, Entitlement or Professional authority is created.');
console.log('  State: KMR-W0-v1.0.0-Baseline-and-PJA-Compatible.');

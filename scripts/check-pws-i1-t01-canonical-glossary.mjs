import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFile(path.join(root, file), 'utf8');

const glossary = JSON.parse(await read(
  'docs/pws/contracts/pws-canonical-glossary-v1.json'
));
assert.equal(glossary.contractId, 'phi-os.pws.canonical-glossary.v1');
assert.equal(glossary.schemaVersion, '1.0.0');
assert.equal(glossary.status, 'frozen');
assert.equal(
  glossary.baseline.commit,
  '358abb1473ecab105fc93f8d34c623886bf842b4'
);
for (const [rule, expected] of Object.entries({
  canonicalTermsAreCaseSensitive: true,
  canonicalIdsAreStable: true,
  legacyAliasWritesAllowed: false,
  ambiguousAliasGuessingAllowed: false,
  aiMayNameFormalObjects: false,
  presentationLabelsCreateObjects: false,
  legacyCompatibilityRequired: true
})) assert.equal(glossary.rules[rule], expected, rule);

const expectedTerms = [
  'Professional','Capability','Credential','Certification','Method','Service',
  'Product','Offer','Price','Order','Payment','Entitlement','Consent',
  'Assignment','Workspace','Evidence','Record','Candidate','Journey Report',
  'Professional Response','Specialist Report','Deliverable','Signature',
  'Follow-up','Complaint','Incident','Policy','Organization','Restriction',
  'Governance','Knowledge Resource','Question Route','Observation',
  'Professional Readiness','Provider Usage'
];
assert.deepEqual(glossary.terms.map(item => item.term), expectedTerms);
assert.equal(new Set(glossary.terms.map(item => item.id)).size, expectedTerms.length);
for (const item of glossary.terms) {
  assert.match(item.id, /^[a-z][a-z0-9_]*$/);
  assert.ok(item.zhHans);
  assert.ok(item.definition);
  assert.ok(item.owner);
}

const expectedAliases = [
  'Case','Task','Job','Project','Ticket','ServiceProduct',
  'ServiceEntitlement','ProfessionalCandidateReport','JPR','Public Journey',
  'Reality Demo'
];
assert.deepEqual(glossary.legacyAliases.map(item => item.alias), expectedAliases);
for (const alias of glossary.legacyAliases) {
  assert.ok([
    'mapped','context_required','presentation_alias','presentation_only'
  ].includes(alias.resolution));
  assert.ok(Array.isArray(alias.canonicalTargets));
  assert.ok(alias.reason);
  for (const target of alias.canonicalTargets) {
    assert.ok(expectedTerms.includes(target), `${alias.alias} -> ${target}`);
  }
}
for (const name of ['Case','Task','Job','Ticket']) {
  assert.equal(
    glossary.legacyAliases.find(item => item.alias === name).resolution,
    'context_required'
  );
}
assert.deepEqual(
  glossary.legacyAliases.find(item => item.alias === 'Reality Demo')
    .canonicalTargets,
  []
);
assert.equal(
  glossary.legacyAliases.find(item => item.alias === 'Public Journey')
    .externalCanonicalReference,
  'runtime/journey'
);

const registry = JSON.parse(await read('content/registry/index.json'));
const contracts = JSON.parse(await read('content/registry/runtime-contracts.json'));
const migrations = JSON.parse(await read('content/registry/runtime-migrations.json'));
assert.equal(Object.keys(registry.registries).length, 48);
assert.equal(contracts.contracts.length, 20);
assert.equal(migrations.migrations.length, 4);
assert.deepEqual(migrations.migrations.map(item => item.version), [1, 2, 3, 4]);

console.log('✓ PWS-I1-T01 Canonical Glossary v1 frozen.');
console.log('  35 canonical terms; 11 Legacy Alias decisions; ambiguous aliases require context.');
console.log('  Registry 48, Runtime Contracts 20, Migrations 4; presentation unchanged.');

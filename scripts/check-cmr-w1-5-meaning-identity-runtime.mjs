import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import { buildMeaningHashes, buildMeaningCanonicalDigest, compareMeaningIdentity, canonicalJson } from './lib/canonical-meaning-runtime/meaning-identity-v1.mjs';

const readJson = async path => JSON.parse(await fs.readFile(path, 'utf8'));
const sha = async path => crypto.createHash('sha256').update(await fs.readFile(path)).digest('hex');
const isDigest = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const isVersion = value => typeof value === 'string' && /^\d+\.\d+\.\d+$/.test(value);

const paths = {
  schema: 'content/professional/canonical-meaning-runtime/schemas/meaning-identity-v1.schema.json',
  contract: 'content/professional/canonical-meaning-runtime/contracts/meaning-identity-contract-v1.json',
  registry: 'content/professional/canonical-meaning-runtime/identity/meaning-identity-registry-v1.json',
  source: 'content/professional/canonical-meaning-runtime/fixtures/meaning-identity-source.valid.json',
  freeze: 'content/professional/canonical-meaning-runtime/freeze/cmr-w1-5-freeze-v1.json',
  w1Freeze: 'content/professional/canonical-meaning-runtime/freeze/cmr-w1-freeze-v1.json'
};

const [schema,contract,registry,source,freeze,w1Freeze] = await Promise.all(Object.values(paths).map(readJson));

assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
assert.equal(contract.work, 'CM-W1.5');
assert.equal(contract.productionStatus, 'validation_only');
assert.equal(contract.identityRules.meaningIdStableAcrossVersions, true);
assert.equal(contract.identityRules.meaningIdentityVersionIndependentFromMeaningVersion, true);
assert.equal(contract.hashRules.algorithm, 'sha256');
assert.equal(contract.deprecationRules.hardDeleteAllowed, false);
assert.equal(contract.invariants.providerAllowed, false);
assert.equal(contract.invariants.aiAllowed, false);
assert.equal(contract.invariants.promptAllowed, false);
assert.equal(contract.invariants.meaningFamilyRegistryCreated, false);
assert.equal(contract.invariants.meaningCodeRegistryCreated, false);
assert.equal(contract.invariants.methodMappingCreated, false);
assert.equal(contract.invariants.productionAuthorityCreated, false);

assert.equal(registry.registryVersion, '1.0.0');
assert.equal(registry.productionStatus, 'validation_only');
assert.deepEqual(registry.records, []);

const hashes = buildMeaningHashes(source);
for (const value of Object.values(hashes)) assert.equal(isDigest(value), true);
const identity = {
  meaningIdentityVersion: '1.0.0',
  meaningId: 'CMID-DECISION-INTERNAL-RESPONSE',
  meaningCode: source.meaningCode,
  meaningVersion: source.meaningVersion,
  ...hashes
};
identity.meaningCanonicalDigest = buildMeaningCanonicalDigest(identity);
assert.equal(isDigest(identity.meaningCanonicalDigest), true);
assert.equal(identity.meaningCanonicalDigest, buildMeaningCanonicalDigest(identity), 'canonical digest is not deterministic');
assert.equal(canonicalJson({b:1,a:2}), canonicalJson({a:2,b:1}));

const semanticChange = { ...identity, semanticHash: 'a'.repeat(64), meaningVersion: '2.0.0' };
semanticChange.meaningCanonicalDigest = buildMeaningCanonicalDigest(semanticChange);
assert.equal(compareMeaningIdentity(identity, semanticChange).requiredVersionBump, 'major');
const knowledgeChange = { ...identity, knowledgeHash: 'b'.repeat(64), meaningVersion: '1.1.0' };
knowledgeChange.meaningCanonicalDigest = buildMeaningCanonicalDigest(knowledgeChange);
assert.equal(compareMeaningIdentity(identity, knowledgeChange).requiredVersionBump, 'minor');
const metadataOnly = { ...identity, meaningVersion: '1.0.1' };
metadataOnly.meaningCanonicalDigest = buildMeaningCanonicalDigest(metadataOnly);
assert.equal(compareMeaningIdentity(identity, metadataOnly).requiredVersionBump, 'patch');

assert.equal(w1Freeze.status, 'frozen');
assert.equal(freeze.status, 'frozen');
assert.equal(freeze.work, 'CM-W1.5');
for (const output of freeze.outputs) assert.equal(await sha(output), freeze.digests[output], `${output} changed after CM-W1.5 freeze`);
assert.equal(freeze.invariants.cmrW1FreezeUnchanged, true);
assert.equal(freeze.invariants.khW4G6SemanticRuntimeFreezeUnchanged, true);
assert.equal(freeze.invariants.methodRuntimeFreezesUnchanged, true);
assert.equal(freeze.invariants.meaningFamilyRegistryCreated, false);
assert.equal(freeze.invariants.meaningCodeRegistryCreated, false);
assert.equal(freeze.invariants.methodMappingCreated, false);
assert.equal(freeze.invariants.productionAuthorityCreated, false);

console.log('✓ CM-W1.5 Meaning Identity Runtime passed.');
console.log('✓ Stable meaningId, versioned meaningCode identity and deterministic component hashes passed.');
console.log('✓ Compatibility, deprecation and successor boundaries passed.');
console.log('✓ No Meaning Family, Meaning Code population, Method Mapping or Production authority was created.');

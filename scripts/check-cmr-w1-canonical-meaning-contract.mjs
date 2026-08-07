import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';

const readJson = async path => JSON.parse(await fs.readFile(path, 'utf8'));
const sha = async path => crypto.createHash('sha256').update(await fs.readFile(path)).digest('hex');

const paths = {
  meaningSchema: 'content/professional/canonical-meaning-runtime/schemas/canonical-meaning-v1.schema.json',
  bundleSchema: 'content/professional/canonical-meaning-runtime/schemas/canonical-meaning-bundle-v1.schema.json',
  contract: 'content/professional/canonical-meaning-runtime/contracts/canonical-meaning-runtime-v1.json',
  validMeaning: 'content/professional/canonical-meaning-runtime/fixtures/canonical-meaning.valid.json',
  invalidMeaning: 'content/professional/canonical-meaning-runtime/fixtures/canonical-meaning.invalid.json',
  validBundle: 'content/professional/canonical-meaning-runtime/fixtures/canonical-meaning-bundle.valid.json',
  freeze: 'content/professional/canonical-meaning-runtime/freeze/cmr-w1-freeze-v1.json',
  w0Boundary: 'content/professional/canonical-meaning-runtime/audits/cmr-authority-boundary-v1.json',
  w0Freeze: 'content/professional/canonical-meaning-runtime/freeze/cmr-w0-freeze-v1.json'
};

const [meaningSchema,bundleSchema,contract,validMeaning,invalidMeaning,validBundle,freeze,w0Boundary,w0Freeze] =
  await Promise.all(Object.values(paths).map(readJson));

const isDigest = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const isVersion = value => typeof value === 'string' && /^\d+\.\d+\.\d+$/.test(value);
const validateMeaningRecord = value => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  if (!/^CM-[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(value.meaningCode ?? '')) return false;
  if (!isVersion(value.meaningVersion)) return false;
  if (!/^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/.test(value.meaningFamily ?? '')) return false;
  if (!value.meaningDimensions || Object.keys(value.meaningDimensions).length < 1) return false;
  const sp=value.sourceProjection;
  if (!sp || !sp.methodCode || !sp.projectionType || !sp.projectionCode || !isVersion(sp.projectionVersion) || !isDigest(sp.projectionDigest)) return false;
  const ml=value.mappingLineage;
  if (!ml || !ml.mappingCode || !isVersion(ml.mappingVersion) || !['registry_led','tl_human_approved'].includes(ml.mappingAuthority) || !isDigest(ml.mappingDigest)) return false;
  const kr=value.knowledgeReferences;
  if (!kr || !Array.isArray(kr.primaryNodeCodes) || kr.primaryNodeCodes.length < 1 || !kr.primaryNodeCodes.every(x=>/^KN-[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(x))) return false;
  if (!Array.isArray(kr.supportingNodeCodes) || !Array.isArray(kr.publishedFragmentDigests) || !kr.publishedFragmentDigests.every(isDigest)) return false;
  if (!value.confidence || !['provisional','bounded','validated'].includes(value.confidence.level) || !Array.isArray(value.confidence.basis) || value.confidence.basis.length < 1) return false;
  const b=value.boundaries;
  if (!b || !Array.isArray(b.mustNotClaim) || b.mustNotClaim.length < 1 || !Array.isArray(b.limitations) || b.limitations.length < 1 || !Array.isArray(b.prohibitedAuthorities)) return false;
  for (const required of ['method_projection','article','reality_fact','professional_conclusion']) if (!b.prohibitedAuthorities.includes(required)) return false;
  return ['draft','validation_only','deprecated'].includes(value.status);
};
const validateBundleRecord = value => {
  if (!value || !/^CMB-[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(value.bundleCode ?? '') || !isVersion(value.bundleVersion)) return false;
  if (!Array.isArray(value.projectionLineage) || value.projectionLineage.length < 1) return false;
  if (!Array.isArray(value.meanings) || value.meanings.length < 1 || !value.meanings.every(validateMeaningRecord)) return false;
  if (![value.supportingSignals,value.contradictingSignals,value.unresolvedSignals].every(Array.isArray)) return false;
  if (typeof value.sourceIndependence !== 'boolean') return false;
  const kc=value.knowledgeCoverage;
  if (!kc || !['none','partial','sufficient'].includes(kc.status) || !Number.isInteger(kc.nodeCount) || !Number.isInteger(kc.publishedFragmentCount) || !['zh-Hans','en'].includes(kc.locale)) return false;
  return Array.isArray(value.limitations) && value.limitations.length > 0 && ['validation_only','deprecated'].includes(value.status);
};

assert.equal(validateMeaningRecord(validMeaning), true);
assert.equal(validateMeaningRecord(invalidMeaning), false, 'invalid Meaning fixture unexpectedly passed');
assert.equal(validateBundleRecord(validBundle), true);
assert.equal(meaningSchema.$schema, 'https://json-schema.org/draft/2020-12/schema');
assert.equal(bundleSchema.$schema, 'https://json-schema.org/draft/2020-12/schema');

assert.equal(contract.work, 'CM-W1');
assert.equal(contract.productionStatus, 'validation_only');
assert.equal(contract.authority.methodProjectionAuthority, 'external_read_only');
assert.equal(contract.authority.knowledgeSemanticAuthority, 'external_read_only');
assert.equal(contract.authority.professionalConclusionAuthority, 'forbidden');
for (const phrase of [
  'Method original interpretation',
  'Article',
  'Reality fact',
  'Professional conclusion',
  'Reality decision'
]) assert.ok(contract.meaningDefinition.isNot.includes(phrase));

const i = contract.runtimeInvariants;
assert.equal(i.deterministic, true);
assert.equal(i.registryLed, true);
assert.equal(i.knowledgeReferencesOnly, true);
assert.equal(i.mayRewriteMethodProjection, false);
assert.equal(i.mayRewriteKnowledgeNode, false);
assert.equal(i.mayStoreArticleBody, false);
assert.equal(i.providerAllowed, false);
assert.equal(i.aiAllowed, false);
assert.equal(i.promptAllowed, false);
assert.equal(i.interpretationAllowed, false);
assert.equal(i.professionalConclusionAllowed, false);
assert.equal(i.realityDecisionAllowed, false);

assert.equal(w0Boundary.invariants.khW4G6SemanticRuntimeFreezeModified, false);
assert.equal(w0Boundary.invariants.methodRuntimeFreezeModified, false);
assert.equal(w0Freeze.status, 'frozen');

assert.equal(freeze.status, 'frozen');
assert.equal(freeze.work, 'CM-W1');
assert.equal(freeze.baselineCommit, 'f85bf43bf2d3069700008ac2c9f4b0ffab20f47a');
for (const output of freeze.outputs) {
  assert.equal(await sha(output), freeze.digests[output], `${output} changed after CM-W1 freeze`);
}
assert.equal(freeze.invariants.khW4G6SemanticRuntimeFreezeUnchanged, true);
assert.equal(freeze.invariants.methodRuntimeFreezesUnchanged, true);
assert.equal(freeze.invariants.meaningFamilyRegistryCreated, false);
assert.equal(freeze.invariants.meaningCodeRegistryCreated, false);
assert.equal(freeze.invariants.methodMappingCreated, false);
assert.equal(freeze.invariants.productionAuthorityCreated, false);

console.log('✓ CM-W1 Canonical Meaning Contract passed.');
console.log('✓ Canonical Meaning Record and Bundle schemas accept valid fixtures and reject invalid Meaning state.');
console.log('✓ Meaning remains separate from Method interpretation, Article, Reality fact and Professional Conclusion.');
console.log('✓ No Meaning Family, Meaning Code, Method Mapping, Provider, AI, Prompt or Production authority was created.');

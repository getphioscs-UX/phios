import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const base = 'content/professional/canonical-meaning-runtime';
const readJson = async file =>
  JSON.parse(await fs.readFile(path.join(root, file), 'utf8'));
const sha = async file =>
  crypto.createHash('sha256')
    .update(await fs.readFile(path.join(root, file)))
    .digest('hex');

const runtime = await import(pathToFileURL(
  path.join(root, 'functions/canonical-meaning-runtime/journey-meaning-projection.js')
));

const [contract, schema, acceptance, fixture, freeze, w11, w12] =
  await Promise.all([
    readJson(`${base}/contracts/meaning-projection-for-journey-contract-v1.json`),
    readJson(`${base}/schemas/journey-meaning-context-v1.schema.json`),
    readJson(`${base}/acceptance/cmr-w14-journey-meaning-projection-acceptance-v1.json`),
    readJson(`${base}/fixtures/cmr-w14-journey-meaning-projection.valid.json`),
    readJson(`${base}/freeze/cmr-w14-journey-meaning-projection-freeze-v1.json`),
    readJson(`${base}/freeze/cmr-w11-canonical-meaning-runtime-freeze-v1.json`),
    readJson(`${base}/freeze/cmr-w12-cross-method-convergence-freeze-v1.json`)
  ]);

assert.equal(contract.work, 'CM-W14');
assert.equal(contract.productionStatus, 'validation_only');
assert.deepEqual(contract.output.journeyContextFields, [
  'meaningCode',
  'meaningFamily',
  'selectedDimensions',
  'knowledgeCoverage',
  'limitations',
  'sourceLineage'
]);
assert.equal(contract.knowledgeBoundary.cmW13MeaningToKnowledgeBridgePresent, false);
assert.equal(contract.knowledgeBoundary.knowledgeQueryAllowed, false);
assert.equal(contract.knowledgeBoundary.unpublishedKnowledgeExposureAllowed, false);
assert.equal(contract.knowledgeBoundary.futureCMW13IntegrationRequiresVersionedSuccessor, true);
assert.deepEqual(contract.lineageBoundary.exposed, [
  'methodCode',
  'projectionType',
  'projectionCode',
  'projectionVersion',
  'projectionDigest'
]);

assert.equal(w11.work, 'CM-W11');
assert.equal(w11.status, 'frozen');
assert.equal(w12.work, 'CM-W12');
assert.equal(w12.status, 'frozen');

const before = JSON.stringify(fixture.meaningBundle);
const first = runtime.projectMeaningBundleForJourney(fixture);
const second = runtime.projectMeaningBundleForJourney(fixture);

assert.deepEqual(first, second);
assert.equal(JSON.stringify(fixture.meaningBundle), before);
assert.equal(first.runtimeCode, 'JOURNEY_MEANING_PROJECTION_RUNTIME');
assert.equal(first.readOnly, true);
assert.equal(first.providerUsed, false);
assert.equal(first.aiUsed, false);
assert.equal(first.promptUsed, false);
assert.equal(first.knowledgeQueried, false);
assert.equal(first.interpretationCreated, false);
assert.equal(first.professionalConclusionCreated, false);
assert.equal(first.realityDecisionCreated, false);
assert.equal(first.status, 'validation_only');
assert.equal(first.journeyContext.length, 1);

const context = first.journeyContext[0];
assert.deepEqual(Object.keys(context).sort(), [
  'knowledgeCoverage',
  'limitations',
  'meaningCode',
  'meaningFamily',
  'selectedDimensions',
  'sourceLineage'
].sort());
assert.deepEqual(context.selectedDimensions, {
  numericSlot: 1,
  semanticAxis: 'number_orientation'
});
assert.deepEqual(Object.keys(context.sourceLineage).sort(), [
  'methodCode',
  'projectionCode',
  'projectionDigest',
  'projectionType',
  'projectionVersion'
].sort());

const serialized = JSON.stringify(first);
for (const forbidden of [
  'algorithmCode',
  'algorithmVersion',
  'calculationId',
  'calculationRuntimeCode',
  'inputDigest',
  'outputDigest',
  'mappingCode',
  'mappingDigest',
  'primaryNodeCodes',
  'supportingNodeCodes',
  'publishedFragmentDigests',
  'professionalNotes',
  'licenseRestrictedSourceData',
  'articleBody',
  'providerOutput'
]) {
  assert.equal(serialized.includes(forbidden), false, `Forbidden exposure: ${forbidden}`);
}

const bad = structuredClone(fixture);
bad.meaningBundle.status = 'production';
assert.throws(
  () => runtime.projectMeaningBundleForJourney(bad),
  /CMR_W14_MEANING_BUNDLE_INVALID/
);

const badLineage = structuredClone(fixture);
delete badLineage.meaningBundle.meanings[0].sourceProjection.projectionDigest;
assert.throws(
  () => runtime.projectMeaningBundleForJourney(badLineage),
  /CMR_W14_SOURCE_LINEAGE_PROJECTIONDIGEST_REQUIRED/
);

assert.equal(schema.properties.readOnly.const, true);
assert.equal(schema.properties.knowledgeQueried.const, false);
assert.equal(
  schema.properties.journeyContext.items.additionalProperties,
  false
);
assert.equal(acceptance.results.exposedJourneyContextFieldCount, 6);
assert.equal(acceptance.results.unpublishedKnowledgeExposed, false);
assert.equal(acceptance.upstreamStatus.cmW13Available, false);
assert.equal(
  acceptance.upstreamStatus.cmW14KnowledgeCoverageMode,
  'inherited_bundle_summary'
);

for (const file of freeze.outputs) {
  assert.equal(await sha(file), freeze.digests[file]);
}
assert.equal(freeze.invariants.protectedAuthoritiesModified, false);
assert.equal(freeze.invariants.journeyContextFieldCount, 6);
assert.equal(freeze.invariants.knowledgeQueryPerformed, false);
assert.equal(freeze.invariants.meaningAuthorityTransferredToJourney, false);

const source = await fs.readFile(
  path.join(root, 'functions/canonical-meaning-runtime/journey-meaning-projection.js'),
  'utf8'
);
assert.doesNotMatch(source, /\bfetch\s*\(/);
assert.doesNotMatch(source, /from ['\"](?:openai|@cloudflare\/workers-types)/i);
assert.doesNotMatch(source, /\.professionalNotes\b|\.internalProfessionalNotes\b|\.licenseRestrictedSourceData\b/);
assert.doesNotMatch(source, /knowledge-completion-runtime|queryPublished|queryCoverage/i);

console.log('✓ CM-W14 Meaning Projection for Journey passed.');
console.log('✓ Canonical Meaning Bundle → read-only Journey Context Projection exposes exactly six safe context fields.');
console.log('✓ Restricted algorithm details, unpublished knowledge, Professional Notes and license-restricted source data are not exposed.');
console.log('✓ CM-W13 is not present; W14 inherits only the Meaning Bundle knowledgeCoverage summary and performs no Knowledge query.');

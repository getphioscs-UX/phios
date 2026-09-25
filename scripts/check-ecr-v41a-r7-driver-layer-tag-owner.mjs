import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const readText = path => fs.readFileSync(path, 'utf8').replace(/\r\n?/g, '\n');
const read = path => JSON.parse(readText(path));
const gitBlobSha = path => {
  const content = fs.readFileSync(path);
  const header = Buffer.from(`blob ${content.length}\0`, 'utf8');
  return crypto.createHash('sha1').update(header).update(content).digest('hex');
};

const r7 = 'content/embodied-configuration/v4-1/semantic-admission-r7/';
const baseline = read(r7 + 'r7-baseline-v1.json');
assert.equal(baseline.stage, 'ECR-V4.1A-R7-DRIVER-LAYER-TAG-OWNER-CANONICALIZATION');
assert.equal(baseline.startHead, 'b1ee052e5b64c3970ae06b425f491888c6dc93ff');
assert.equal(baseline.customerProductionMutation, false);
assert.equal(baseline.authorityBoundary.secondMethodRuntimeProhibited, true);
for (const row of [...baseline.r6Authorities, ...baseline.readinessRefs]) {
  assert.equal(gitBlobSha(row.path), row.gitBlobSha, `R6 authority drift: ${row.path}`);
}

const drivers = read(r7 + 'driver-role-candidates-v1.json');
assert.equal(drivers.records.length, 12);
assert.deepEqual(drivers.records.map(x => x.driverId), ['D1','D2','D3','D4','D5','D6','D7','D8','D9','D10','D11','D12']);
assert(drivers.records.every(x => x.semanticStatus === 'SOURCE_GAP'));
assert(drivers.records.every(x => x.canonicalRoleMeaning === null && x.allowedSemanticTags.length === 0));
assert.equal(drivers.records.find(x => x.driverId === 'D11').mechanicalStatus, 'UNKNOWN_ALLOWED_NON_BLOCKING');

const layers = read(r7 + 'layer-role-candidates-v1.json');
assert.deepEqual(layers.records.map(x => x.layer), ['PERSONALITY','DESIGN']);
assert(layers.records.every(x => x.semanticStatus === 'SOURCE_GAP' && x.canonicalRoleMeaning === null && x.semanticTags.length === 0));
assert(layers.records.find(x => x.layer === 'DESIGN').mechanicalIdentity.includes('88_DEGREE'));

const owners = read('content/embodied-configuration/meaning/ecr-semantic-runtime-owner-registry-v2.json');
const ownerSet = new Set(owners.ownerAddresses);
const tags = read(r7 + 'semantic-tag-canon-candidates-v1.json');
const expectedTags = ['ATTENTION','SELECTION','BOUNDARY','EXPRESSION','COMMITMENT','ADAPTATION','REORGANIZATION','CONTINUITY','RECOVERY','VALUE','RELATION','INPUT','CAPACITY','CONSTRAINT'];
assert.deepEqual(tags.tags.map(x => x.tagId), expectedTags);
assert(tags.tags.every(x => x.reviewState === 'PENDING'));
for (const tag of tags.tags) {
  assert(tag.sourceOwnerAddresses.length > 0);
  assert(tag.sourceOwnerAddresses.every(ref => ownerSet.has(ref)), `Unknown owner address in tag ${tag.tagId}`);
}

const composition = read(r7 + 'composition-tag-rules-candidates-v1.json');
assert.equal(composition.rules.length, 10);
assert(composition.rules.every(x => x.ruleId.startsWith('R7-COMP-')));
assert.equal(composition.optionalEnglishEnrichment.gateSpecificLineKeywords384, 'OPTIONAL_SEMANTIC_ENRICHMENT');
assert.equal(composition.optionalEnglishEnrichment.mayStopBlockingV41OnlyAfterOwnerAcceptsCompositionalModel, true);

const runtimeOwners = read(r7 + 'runtime-owner-rules-candidates-v1.json');
assert.equal(runtimeOwners.rules.length, expectedTags.length);
assert.deepEqual(runtimeOwners.rules.map(x => x.requiredTags[0]), expectedTags);
assert(runtimeOwners.rules.every(x => x.reviewState === 'PENDING'));
assert.equal(runtimeOwners.conflictPolicy.equalPriority, 'UNKNOWN');
assert.equal(runtimeOwners.conflictPolicy.missingTag, 'UNKNOWN');
assert.equal(runtimeOwners.conflictPolicy.noAdmittedSemanticDepth, 'UNKNOWN');

const review = read(r7 + 'human-review-package-v1.json');
assert.deepEqual(review.reviewGroups.map(x => x.items.length), [12,2,14,10,14,9,5,1]);
assert.equal(review.releaseBoundary.compositionPolicyMutated, false);
assert.equal(review.releaseBoundary.cardEligibilityMutated, false);
assert.equal(review.releaseBoundary.customerAdmissionMutated, false);
for (const row of review.generatedFrom.candidateFileBindings) {
  assert.equal(gitBlobSha(row.path), row.gitBlobSha, `R7 candidate changed after W6 binding: ${row.path}`);
}
assert.deepEqual(review.frozenAcceptedNotReopened.topicRules.map(x => x.ruleId), [
  'M_ZERO_DEGREE_SECTOR_TO_P64_UPPER_TRIGRAM',
  'A_OLD_H64_SECTOR_TO_P64_INDEPENDENT_A8'
]);

const oldPolicy = read('content/embodied-configuration/v4-1/semantic-admission-r2/composition-policy.json');
assert.equal(oldPolicy.runtimeOwnerRules.length, 0);
assert(oldPolicy.planetaryDriverRoles.every(x => x.status === 'PENDING' && x.humanReview === null));
assert(oldPolicy.layerRoles.every(x => x.status === 'PENDING' && x.humanReview === null));
const cards = read('content/embodied-configuration/v4-1/semantic-admission-r2/card-eligibility.json');
assert(cards.runtimeSlotEligibility.every(x => x.status === 'PENDING' && x.humanReview === null));
const admission = read('content/embodied-configuration/v4-1/admission/customer-admission-v1.json');
assert.equal(admission.customerProductionAdmitted, false);
assert.equal(admission.structuralCustomerSurfaceAdmitted, false);

const pja = read('content/knowledge/reconciliation/pja-w2d/pja-w2d-book6-publication-successor-v1.json');
assert.equal(pja.status, 'ACTIVE_SUCCESSOR_AWARE_HISTORICAL_CHECKER_RECONCILIATION');
assert.equal(pja.humanDecisionAuthority.requiredHumanDecision, 'APPROVED_28_OF_28');

const reviewHtml = readText('docs/ecr-human-runtime-v4-1/r7-driver-layer-tag-owner/review.html');
for (const token of ['ACCEPT','REVISE','REJECT','SOURCE_GAP','ECR-V4.1A-R7-human-review-decisions.json']) assert(reviewHtml.includes(token));

console.log('PASS ECR V4.1A R7 W0-W6: R6 frozen, Driver/Layer gaps fail-closed, Tag/Owner candidates bound, human review pack ready; no operational/customer admission applied.');

import assert from 'node:assert/strict';
import fs from 'node:fs';

const ROOT='content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3';
const readJson=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const census=readJson(`${ROOT}/coverage/human-design-semantic-coverage-census-v1.json`);
const source=readJson('knowledge/external-readers/human-design/registry/entries.json');
const structure=readJson('content/professional/canonical-meaning-runtime/registries/hdr-structure-mapping-registry-v1.json');
const html=fs.readFileSync(`${ROOT}/coverage/HD-PRO-R3-W1-COVERAGE.html`,'utf8');

assert.equal(census.schemaVersion,'PHI-OS-HD-PRO-R3-W1-SEMANTIC-COVERAGE-CENSUS-v1.0.0');
assert.equal(census.baselineCommit,'dae24c1dd8de49a6c238ddffb8d52b388e8da10d');
assert.equal(census.status,'CENSUS_COMPLETE_R3_SEMANTIC_ADMISSION_NOT_STARTED');
assert.equal(census.measurementPolicy.countsCustomerExplainableCombinationsNotRawAtomicLabels,true);
assert.equal(census.measurementPolicy.categoryLevelLensDoesNotCountAsValueSpecificMeaning,true);
assert.equal(census.measurementPolicy.internalHdrStructuralMappingDoesNotCreateExternalSemanticAuthority,true);
assert.equal(census.measurementPolicy.r2PublishedGenericCategoryReadingDoesNotAutoAdmitR3SpecificMeaning,true);
assert.equal(census.measurementPolicy.sourcePendingIsValid,true);
assert.equal(census.measurementPolicy.genericFillerForbidden,true);

assert.equal(census.inventory.types.length,5);
assert.equal(census.inventory.authorities.length,8);
assert.equal(census.inventory.profiles.length,12);
assert.equal(census.inventory.centers.length,9);
assert.equal(census.inventory.channels.length,36);
assert.equal(new Set(census.inventory.channels.map(x=>x.code)).size,36);
assert.equal(census.inventory.gates.length,64);
assert.deepEqual(census.inventory.gates,[...Array(64)].map((_,i)=>i+1));
assert.equal(census.inventory.definitions.length,5);
assert.equal(census.inventory.advancedFields.length,6);

assert.equal(source.entries.length,14);
for(const category of ['type','authority','profile','definition','center','channel','gate','variable','phs','environment','cognition','motivation','perspective']){
  assert(source.entries.some(x=>x.category===category),`missing category source witness: ${category}`);
}
assert.equal(structure.expectedCoverage.sdu,64);
assert.equal(structure.expectedCoverage.scu,36);
assert.equal(structure.productionStatus,'validation_only');

assert.equal(census.headline.structuralInventoryCoveragePct,100);
assert.equal(census.headline.categorySourceWitnessCoveragePct,100);
assert.equal(census.headline.valueSpecificSemanticCoveragePct,0);
assert.equal(census.headline.compositionSupportedCoveragePct,0);
assert.equal(census.headline.customerPublishableR3CoveragePct,0);
assert.equal(census.headline.r2CustomerPublishedStillActive,true);
for(const row of census.coverage){
  assert.equal(row.structuralCoveragePct,100,`${row.category} structural census incomplete`);
  assert.equal(row.categorySourceWitnessPresent,true,`${row.category} lacks category source witness`);
  assert.equal(row.valueSpecificSemanticUnitsSourceAdmitted,0,`${row.category} W1 baseline was rewritten after the census`);
  assert.equal(row.valueSpecificSemanticCoveragePct,0,`${row.category} W1 baseline was rewritten after the census`);
  assert.equal(row.compositionSupportedUnits,0,`${row.category} falsely reports R3 composition support`);
  assert.equal(row.customerPublishableR3Units,0,`${row.category} falsely reports R3 customer publication`);
  assert.equal(row.admissionState,'SOURCE_PENDING');
}
assert.equal(census.blockingGap.code,'HD_R3_VALUE_SPECIFIC_SOURCE_CORPUS_NOT_ADMITTED');
assert.equal(census.blockingGap.severity,'BLOCKS_R3_SEMANTIC_PRODUCTION');
assert.equal(census.publication.r2State,'CUSTOMER_PUBLISHED');
assert.equal(census.publication.r3State,'SHADOW_CANDIDATE');
assert.equal(census.publication.r3HumanReviewInheritedFromR2,false);
assert.equal(census.publication.r3CustomerCutoverAllowed,false);

for(const token of ['Structural inventory','Value-specific semantics','R3 customer-publishable','SOURCE_PENDING','R2 remains CUSTOMER_PUBLISHED'])assert(html.includes(token),`W1 HTML missing ${token}`);

console.log('✓ HD-PRO-R3-W1 Semantic Coverage Census baseline passed.');
console.log('  W1 remains the pre-admission census; W2 may add source-admitted units without rewriting this historical census.');

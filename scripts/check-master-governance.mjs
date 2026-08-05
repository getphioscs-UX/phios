import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const read = async file => fs.readFile(path.join(root, file), 'utf8');
const readJson = async file => JSON.parse(await read(file));

const contract = await readJson('content/registry/master-governance.json');
const pds = await readJson('content/registry/pds-w1-experience-contract.json');
const shell = await readJson('content/registry/pds-w4-reality-journey-shell-contract.json');

assert.equal(contract.contractId, 'phi-os.master-governance.v1');
assert.equal(contract.contractVersion, '1.1.0');
assert.equal(contract.status, 'frozen');
assert.equal(
  contract.baseline.commit,
  '5136c471cbd897511ac38ccc83a4e06f31f0c745'
);

assert.deepEqual(contract.sourceOfTruthPriority, [
  'reality-integrity-evidence-boundary-safety-law',
  'frozen-core-runtime-contract',
  'pds-v1.1-experience-and-design-requirements',
  'pws-pja-canonical-contract',
  'registry-and-migration-contract',
  'page-implementation',
  'copy-and-visual-preference'
]);
assert.equal(contract.conflictResolution.higherPriorityAlwaysWins, true);
assert.equal(contract.conflictResolution.laterPageMayOverwriteFrozenBoundary, false);
assert.equal(contract.conflictResolution.silentConflictMergeAllowed, false);
assert.equal(contract.conflictResolution.unresolvedConflictMustRemainVisible, true);

const expectedPrinciples = [
  'reality-first',
  'understanding-before-explanation',
  'journey-before-page',
  'one-primary-task',
  'progressive-disclosure',
  'unknowns-remain-visible',
  'evidence-boundary',
  'correctability',
  'verifiable-action',
  'system-restraint',
  'consistent-behaviour',
  'reality-integrity'
];
assert.deepEqual(contract.pdsMandatoryPrinciples, expectedPrinciples);
assert.equal(new Set(expectedPrinciples).size, 12);

assert.deepEqual(contract.implementationGates, [
  'pds-intent-review',
  'automated-checks-where-possible',
  'visual-acceptance-360px-768px-1440px',
  'chinese-english-acceptance',
  'keyboard-and-focus-acceptance',
  'touch-target-acceptance',
  'runtime-regression',
  'production-verification'
]);
assert.deepEqual(contract.gateRules.appliesToViews, [
  'public', 'customer', 'professional', 'technical'
]);
assert.equal(contract.gateRules.pageChangeRequiresVisualAcceptance, true);
assert.equal(contract.gateRules.notApplicableRequiresReason, true);
assert.equal(contract.gateRules.automatedPassCannotSubstituteForVisualAcceptance, true);

const expectedStageIds = [
  'enter', 'describe', 'discover', 'understand', 'choose', 'continue'
];
assert.deepEqual(
  contract.canonicalJourneyMapping.map(stage => stage.stageId),
  expectedStageIds
);
assert.deepEqual(expectedStageIds, pds.journey.publicStageOrder);
assert.deepEqual(expectedStageIds, shell.publicStageOrder);

for (const mapping of contract.canonicalJourneyMapping) {
  const pdsStage = pds.journey.stages.find(stage => stage.id === mapping.stageId);
  assert(pdsStage, `Missing PDS stage: ${mapping.stageId}`);
  assert.deepEqual(mapping.customerName, pdsStage.publicName);
  assert.deepEqual(mapping.technicalSurfaces, pdsStage.systemSurfaces);
  for (const shellSurface of shell.surfaceMap[mapping.stageId]) {
    assert(
      mapping.technicalSurfaces.includes(shellSurface),
      `Journey shell surface missing from canonical mapping: ${shellSurface}`
    );
  }
  for (const surface of mapping.technicalSurfaces) {
    await fs.access(path.join(root, surface));
  }
}

for (const boundary of [
  'reality-integrity',
  'evidence-boundary',
  'runtime-route',
  'runtime-state',
  'runtime-schema',
  'provider-contract',
  'persistence-behaviour',
  'lineage-behaviour',
  'frozen-responsibility-boundary'
]) {
  assert(contract.protectedBoundaries.includes(boundary), `Missing protected boundary: ${boundary}`);
}

assert.equal(contract.journeyRules.technicalRouteNamesMayRemainUnchanged, true);
assert.equal(contract.journeyRules.customerFacingLanguageUsesExperienceStage, true);
assert.equal(contract.journeyRules.journeyStateIsNotJourneyStage, true);
assert.equal(contract.journeyRules.mappingMayCreateSecondJourney, false);

assert.equal(contract.writeSourceRule.pageMayCreateSecondSourceOfTruth, false);
assert.equal(contract.writeSourceRule.pageWritesCanonicalData, false);
assert.equal(contract.writeSourceRule.pageProjectionMayBecomeCanonical, false);
assert.equal(contract.writeSourceRule.staticJsonMayOverrideCanonicalOwner, false);
assert.equal(contract.writeSourceRule.legacyConfigurationMayAcceptNewWrites, false);
assert.equal(contract.writeSourceRule.readModelsAreReadOnly, true);

const expectedWriteSources = [
  { objects: ['Journey'], owner: 'Core Runtime' },
  { objects: ['Knowledge Node', 'Supporting Question'], owner: 'PKR' },
  {
    objects: ['Book', 'Part', 'Knowledge Blueprint'],
    owner: 'KH-W4B Canonical Registry Authority'
  },
  {
    objects: ['Product', 'Offer', 'Price', 'Entitlement'],
    owner: 'PWS-I2 / PWS-I4'
  },
  { objects: ['Consent', 'Privacy'], owner: 'PWS-I8' },
  { objects: ['Provider', 'Prompt', 'Budget'], owner: 'PWS-I9' },
  {
    objects: ['Professional Identity', 'Capability'],
    owner: 'PWS-I3'
  },
  {
    objects: ['Assignment', 'Workspace', 'Deliverable'],
    owner: 'PWS-I5'
  },
  { objects: ['Queue', 'Continuity'], owner: 'PWS-I6' },
  { objects: ['Governance', 'Quality'], owner: 'PWS-I7' }
];
assert.deepEqual(
  contract.writeSourceRule.writeSourceMap.map(({ objects, owner }) => ({
    objects,
    owner
  })),
  expectedWriteSources
);
const canonicalObjects = contract.writeSourceRule.writeSourceMap.flatMap(
  entry => entry.objects
);
assert.equal(
  new Set(canonicalObjects).size,
  canonicalObjects.length,
  'Every governed object must have exactly one write-source owner'
);
for (const writeSource of contract.writeSourceRule.writeSourceMap) {
  assert(writeSource.canonicalPaths.length > 0);
  for (const canonicalPath of writeSource.canonicalPaths) {
    await fs.access(path.join(root, canonicalPath));
  }
}

assert.equal(contract.changeControl.appliesAfterPhaseFreeze, true);
assert.deepEqual(contract.changeControl.allowedChangeClasses, [
  'bug-fix',
  'security-fix',
  'accessibility-fix',
  'migration-fix',
  'acceptance-fix',
  'explicit-contract-version-upgrade'
]);
assert.equal(contract.changeControl.silentBehaviouralChangeAllowed, false);
assert.equal(contract.changeControl.unclassifiedChangeAllowed, false);
for (const requiredDeclaration of [
  'changeClassDeclarationRequired',
  'affectedContractDeclarationRequired',
  'versionImpactDeclarationRequired',
  'acceptanceEvidenceRequired',
  'preservedBoundaryDeclarationRequired'
]) {
  assert.equal(
    contract.changeControl[requiredDeclaration],
    true,
    `Missing change-control declaration: ${requiredDeclaration}`
  );
}

const governanceDoc = await read('docs/pws/contracts/PWS-MASTER-GOVERNANCE-V1.md');
for (const phrase of [
  'Reality Integrity / Evidence Boundary / Safety / Law',
  'PDS v1.1 Experience and Design Requirements',
  '360 px / 768 px / 1440 px visual acceptance',
  'Automated checks cannot substitute for visual acceptance',
  'Journey lifecycle state remains separate from Journey stage',
  'No page, customer view, professional view or technical view may create a second source of truth',
  'Silent behavioural change and unclassified change are prohibited'
]) {
  assert(governanceDoc.includes(phrase), `Governance document missing: ${phrase}`);
}

const packageJson = await readJson('package.json');
assert.equal(
  packageJson.scripts['check:master-governance'],
  'node scripts/check-master-governance.mjs'
);
const pdsW0Check = await read('scripts/check-pds-w0-baseline-boundary.mjs');
assert(
  pdsW0Check.includes("import './check-master-governance.mjs';"),
  'The first PDS precheck must enforce Master Governance'
);

console.log('✓ PHI OS Master Governance v1.1.0 frozen.');
console.log('  Source-of-truth priority and conflict rules are closed.');
console.log('  PDS mandatory principles and implementation gates are closed.');
console.log('  Six customer stages match PDS-W1 and the shared Journey shell.');
console.log('  Ten canonical domains have one traceable write-source owner.');
console.log('  Six post-freeze change classes are closed; silent behaviour is prohibited.');

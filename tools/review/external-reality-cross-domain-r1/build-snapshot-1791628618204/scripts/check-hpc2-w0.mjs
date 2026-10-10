import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const baselineCommit = '9e7c6121edcf76a8e257f47217c77de4f6d60a85';
const sourcePath = 'content/web/homepage/hpc2/sources/PHIOS-market-positioning-founder-v8-no-pricing.html';
const manifestPath = 'content/web/homepage/hpc2/v8-content-preservation-manifest-v1.json';
const destinationMapPath = 'content/web/homepage/hpc2/v8-content-destination-map-v1.json';
const contractPath = 'content/web/homepage/hpc2/contracts/hpc2-w0-v8-content-preservation-contract-v1.json';
const evidencePath = 'content/web/homepage/hpc2/evidence/hpc2-w0-v8-source-audit-v1.json';
const acceptancePath = 'content/web/homepage/hpc2/acceptance/v8-content-preservation-acceptance-v1.json';
const freezePath = 'content/web/homepage/hpc2/freeze/hpc2-w0-v8-content-preservation-freeze-v1.json';
const p0AuditPath = 'content/web/homepage/hpc2/evidence/hpc2-p0-baseline-audit-v1.json';

const expectedCodes = [
  'V8-HERO-001', 'V8-HERO-002', 'V8-POS-001',
  'V8-REALITY-001', 'V8-REALITY-002', 'V8-REALITY-003', 'V8-REALITY-004',
  'V8-MARKET-001', 'V8-MARKET-002', 'V8-MARKET-003', 'V8-MARKET-004', 'V8-MARKET-005',
  'V8-RESEARCH-001', 'V8-RESEARCH-002', 'V8-RESEARCH-003', 'V8-RESEARCH-004', 'V8-RESEARCH-005', 'V8-RESEARCH-006',
  'V8-CATEGORY-001', 'V8-VALUE-001', 'V8-VALUE-002', 'V8-VALUE-003',
  'V8-PRO-001', 'V8-PRO-002', 'V8-PRO-003', 'V8-PRO-004', 'V8-PRO-005', 'V8-PRO-006',
  'V8-EXT-001', 'V8-EXT-002', 'V8-EXT-003',
  'V8-JOURNEY-001', 'V8-JOURNEY-002', 'V8-SYSTEM-001',
  'V8-FOUNDER-001', 'V8-FOUNDER-002', 'V8-FOUNDER-003', 'V8-ECO-001', 'V8-BOUNDARY-001'
];

const expectedRoutes = [
  '/about',
  '/about/why-phios',
  '/about/reality-navigation',
  '/about/system',
  '/about/founder',
  '/research',
  '/research/why-reality-navigation',
  '/research/human-reading-systems',
  '/professional',
  '/professional/authority',
  '/professional/boundaries',
  '/reality'
];

const requiredBlockFields = [
  'blockCode',
  'source',
  'semanticTitle',
  'sourceState',
  'homepageSuccessor',
  'destinationRoute',
  'destinationComposition',
  'copyPolicy',
  'visualPolicy',
  'deletionAllowedFromHomepage',
  'successorVerified'
];

function fail(message) {
  throw new Error(`[HPC2-W0] ${message}`);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

async function text(path) {
  return readFile(resolve(root, path), 'utf8');
}

async function json(path) {
  return JSON.parse(await text(path));
}

async function sha256(path) {
  const bytes = await readFile(resolve(root, path));
  return createHash('sha256').update(bytes).digest('hex');
}

function sameMembers(actual, expected, label) {
  assert(actual.length === expected.length, `${label} count ${actual.length} !== ${expected.length}`);
  const actualSet = new Set(actual);
  assert(actualSet.size === actual.length, `${label} contains duplicates`);
  for (const value of expected) assert(actualSet.has(value), `${label} missing ${value}`);
}

const [
  manifest,
  destinationMap,
  contract,
  evidence,
  acceptance,
  freeze,
  p0Audit,
  packageJson,
  sourceText
] = await Promise.all([
  json(manifestPath),
  json(destinationMapPath),
  json(contractPath),
  json(evidencePath),
  json(acceptancePath),
  json(freezePath),
  json(p0AuditPath),
  json('package.json'),
  text(sourcePath)
]);

for (const [label, record] of [
  ['manifest', manifest],
  ['destination map', destinationMap],
  ['contract', contract],
  ['evidence', evidence],
  ['acceptance', acceptance],
  ['freeze', freeze]
]) {
  assert(record.work === 'HPC2-W0', `${label} work must be HPC2-W0`);
  const recordedBaseline = record.baselineCommit ?? record.auditedCommit;
  assert(recordedBaseline === baselineCommit, `${label} baseline must be ${baselineCommit}`);
}

const sourceStats = await stat(resolve(root, sourcePath));
const sourceDigest = await sha256(sourcePath);
const sourceLineCount = sourceText.endsWith('\n') ? sourceText.split('\n').length - 1 : sourceText.split('\n').length;
assert(sourceDigest === '75f1b41729cc53038711bd31595897b137943c34f4f17a48289b525608f036b5', 'canonical source digest drift');
assert(sourceStats.size === 98898, 'canonical source byte length drift');
assert(sourceLineCount === 377, 'canonical source line count drift');
assert(manifest.sourceArtifact.path === sourcePath, 'manifest source path drift');
assert(manifest.sourceArtifact.sha256 === sourceDigest, 'manifest source digest mismatch');
assert(manifest.sourceArtifact.byteLength === sourceStats.size, 'manifest source size mismatch');
assert(manifest.sourceArtifact.lineCount === sourceLineCount, 'manifest source line count mismatch');
assert(manifest.sourceArtifact.runtimeState === 'ARCHIVAL_SOURCE_NOT_PRODUCTION_CONSUMER', 'source must remain archival, not a production consumer');
assert(manifest.sourceArtifact.visualAuthorityState === 'REFERENCE_ONLY_EXISTING_VISUAL_SYSTEM_REMAINS_AUTHORITY', 'source must not become a second visual authority');
assert(manifest.sourceArtifact.deletionAllowed === false, 'canonical source deletion must remain forbidden');

assert(Array.isArray(manifest.semanticBlocks), 'manifest semanticBlocks must be an array');
sameMembers(manifest.semanticBlocks.map((block) => block.blockCode), expectedCodes, 'semantic block codes');
assert(manifest.semanticBlocks.length === 39, 'semantic inventory must contain 39 records');

const blocksByCode = new Map();
for (const block of manifest.semanticBlocks) {
  for (const field of requiredBlockFields) {
    assert(Object.hasOwn(block, field), `${block.blockCode ?? 'unknown block'} missing ${field}`);
  }
  assert(typeof block.semanticTitle === 'string' && block.semanticTitle.length > 0, `${block.blockCode} missing semanticTitle`);
  assert(typeof block.source === 'string' && block.source.startsWith(sourcePath), `${block.blockCode} source must trace to canonical source`);
  assert(Array.isArray(block.sourceAnchors) && block.sourceAnchors.length > 0, `${block.blockCode} needs source anchors`);
  for (const anchor of block.sourceAnchors) {
    assert(sourceText.includes(anchor), `${block.blockCode} source anchor not found: ${anchor}`);
  }
  assert(block.sourceState === 'PRESERVED_CANONICAL_SOURCE_NOT_PRODUCTION_CONSUMER', `${block.blockCode} sourceState drift`);
  assert(block.homepageSuccessor === 'UNASSIGNED_PENDING_HPC2_W1_NARRATIVE_AUTHORITY', `${block.blockCode} prematurely assigns homepage successor`);
  assert(expectedRoutes.includes(block.destinationRoute), `${block.blockCode} destination route is outside architecture`);
  assert(typeof block.destinationComposition === 'string' && block.destinationComposition.length > 0, `${block.blockCode} missing destination composition`);
  assert(block.copyPolicy === 'PRESERVE_MEANING_EN_ZH_ADAPTATION_ALLOWED_NO_SEMANTIC_WEAKENING', `${block.blockCode} copy policy drift`);
  assert(typeof block.visualPolicy === 'string' && block.visualPolicy.length > 0, `${block.blockCode} visual policy missing`);
  assert(block.successorVerified === false, `${block.blockCode} fabricates successor verification`);
  assert(block.deletionAllowedFromHomepage === false, `${block.blockCode} permits premature homepage deletion`);
  assert(block.actualScene === null, `${block.blockCode} prematurely assigns final scene`);
  if (block.deletionAllowedFromHomepage) assert(block.successorVerified, `${block.blockCode} deletion requires verified successor`);
  blocksByCode.set(block.blockCode, block);
}

assert(manifest.summary.semanticBlockCount === 39, 'manifest summary semantic block count drift');
assert(manifest.summary.destinationAssignedCount === 39, 'manifest summary destination count drift');
assert(manifest.summary.successorVerifiedCount === 0, 'W0 must not claim verified successors');
assert(manifest.summary.deletionAllowedFromHomepageCount === 0, 'W0 must not allow homepage deletion');
assert(manifest.summary.homepageSceneAssignmentCount === 0, 'W0 must not assign homepage scenes');
assert(manifest.summary.finalNineSceneAuthorityEstablished === false, 'W0 must not establish final nine-scene authority');
assert(manifest.summary.humanAcceptanceClaimed === false, 'W0 must not fabricate human acceptance');

assert(destinationMap.authority.sourceOfTruth === `${manifestPath}#semanticBlocks`, 'destination map source-of-truth drift');
assert(destinationMap.authority.projectionOnly === true, 'destination map must remain a projection');
assert(destinationMap.authority.secondDestinationAuthorityCreated === false, 'destination map must not claim second authority');
assert(destinationMap.authority.routeActivationOwnedHere === false, 'destination map must not own route activation');
sameMembers(destinationMap.routes.map((record) => record.route), expectedRoutes, 'destination routes');

const projectedCodes = [];
for (const routeRecord of destinationMap.routes) {
  assert(routeRecord.successorVerificationState === 'NOT_STARTED', `${routeRecord.route} fabricates successor verification`);
  assert(Array.isArray(routeRecord.blockCodes), `${routeRecord.route} blockCodes must be an array`);
  for (const code of routeRecord.blockCodes) {
    assert(blocksByCode.has(code), `${routeRecord.route} projects unknown block ${code}`);
    assert(blocksByCode.get(code).destinationRoute === routeRecord.route, `${code} manifest/map destination mismatch`);
    projectedCodes.push(code);
  }
}
sameMembers(projectedCodes, expectedCodes, 'destination projection block codes');
assert(destinationMap.summary.routeCount === 12, 'destination route summary drift');
assert(destinationMap.summary.mappedSemanticBlockCount === 39, 'mapped semantic block summary drift');
assert(destinationMap.summary.unmappedSemanticBlockCount === 0, 'unmapped semantic blocks are forbidden');
assert(destinationMap.summary.verifiedDestinationCount === 0, 'W0 must not claim verified destinations');
assert(destinationMap.summary.routeActivatedByHpc2W0Count === 0, 'W0 must not activate routes');
assert(destinationMap.summary.homepageSceneAssignedByHpc2W0Count === 0, 'W0 must not assign scenes');

assert(contract.status === 'ACTIVE_ADDITIVE_SUCCESSOR_PRESERVATION_ONLY', 'contract status drift');
assert(contract.authorityBoundary.semanticBlockAuthority === `${manifestPath}#semanticBlocks`, 'contract semantic authority mismatch');
assert(contract.authorityBoundary.destinationMapRole === 'DETERMINISTIC_PROJECTION_ONLY_NOT_SECOND_AUTHORITY', 'contract must forbid duplicate destination authority');
assert(contract.failClosedRules.everyV8SemanticBlockRequiresDestination === true, 'contract must require destinations');
assert(contract.failClosedRules.unmappedV8SemanticBlockAllowed === false, 'contract must fail closed on unmapped blocks');
assert(contract.failClosedRules.successorVerifiedDefault === false, 'successor verification must default false');
assert(contract.failClosedRules.deletionAllowedFromHomepageDefault === false, 'deletion must default false');
assert(contract.failClosedRules.deletionAllowedRequiresSuccessorVerified === true, 'deletion must require verified successor');
assert(contract.failClosedRules.humanAcceptanceMayNotBeSynthesized === true, 'contract must forbid fake human acceptance');
assert(contract.failClosedRules.finalSceneAssignmentBeforeHpc2W1Forbidden === true, 'contract must forbid W0 scene assignment');
for (const forbiddenOwner of ['HOMEPAGE_DOM_OR_RUNTIME', 'VISUAL_REGISTRY_AUTHORITY', 'KNOWLEDGE_AUTHORITY', 'READING_AUTHORITY', 'METHOD_AUTHORITY', 'PROFESSIONAL_JUDGMENT_AUTHORITY', 'ROUTE_ACTIVATION', 'HUMAN_ACCEPTANCE']) {
  assert(contract.doesNotOwn.includes(forbiddenOwner), `contract missing doesNotOwn ${forbiddenOwner}`);
}

assert(evidence.sourceAudit.repositorySha256 === sourceDigest, 'evidence source digest mismatch');
assert(evidence.sourceAudit.exactBytePreservation === true, 'evidence must record exact source preservation');
assert(evidence.sourceAudit.staticSectionCount === 13, 'source section audit drift');
assert(evidence.sourceAudit.interactiveScenarioCount === 3, 'source scenario audit drift');
sameMembers(evidence.sourceAudit.interactiveScenarios, ['work', 'pattern', 'methods'], 'interactive scenarios');
assert(evidence.sourceAudit.externalCitationLinkCount === 10, 'source citation link audit drift');
assert(evidence.sourceAudit.externalCitationVerificationState === 'NOT_PERFORMED_PRESERVATION_ONLY_NO_RESEARCH_AUTHORITY_CLAIM', 'W0 must not fabricate citation verification');
assert(evidence.semanticInventory.inventoriedBlockCount === 39, 'evidence inventory count drift');
assert(evidence.semanticInventory.unmappedCount === 0, 'evidence unmapped count drift');
assert(evidence.semanticInventory.successorVerifiedCount === 0, 'evidence fabricates successors');
assert(evidence.implementationBoundary.finalNineSceneAuthorityEstablished === false, 'evidence fabricates final scene authority');
assert(evidence.implementationBoundary.humanDecisionCreated === false, 'evidence fabricates human decision');

const p0Snapshots = new Map(p0Audit.sourceSnapshots.map((record) => [record.path, record.sha256]));
for (const snapshot of evidence.protectedConsumerSnapshots) {
  assert(p0Snapshots.get(snapshot.path) === snapshot.sha256, `W0 protected snapshot does not match P0: ${snapshot.path}`);
}

assert(acceptance.status === 'HPC2_W0_REPOSITORY_IMPLEMENTED_MACHINE_ACCEPTED_MIGRATION_UNVERIFIED', 'acceptance status drift');
assert(acceptance.acceptedFacts.semanticBlockCoverage === '39/39', 'acceptance semantic coverage drift');
assert(acceptance.acceptedFacts.destinationAssignmentCoverage === '39/39', 'acceptance destination coverage drift');
assert(acceptance.acceptedFacts.successorVerifiedCount === 0, 'acceptance fabricates successors');
assert(acceptance.acceptedFacts.deletionAllowedFromHomepageCount === 0, 'acceptance allows premature deletion');
assert(acceptance.acceptedFacts.finalNineSceneAuthorityEstablished === false, 'acceptance fabricates final scene authority');
assert(acceptance.acceptedFacts.homepageRuntimeCreated === false, 'acceptance fabricates homepage runtime');
assert(acceptance.acceptedFacts.humanAcceptanceClaimed === false, 'acceptance fabricates human acceptance');
assert(acceptance.humanAcceptance.claimed === false && acceptance.humanAcceptance.decisionRecord === null, 'human acceptance must remain unclaimed');
assert(acceptance.exitGate.noV8SemanticBlockWithoutDestination === true, 'W0 exit gate requires all destinations');
assert(acceptance.exitGate.noV8ContentDeleted === true, 'W0 exit gate requires no deletion');
assert(acceptance.exitGate.noSemanticWeakeningWithoutVersionedSuccessor === true, 'W0 exit gate requires no semantic weakening');
assert(acceptance.migrationState === 'NOT_STARTED_ALL_SUCCESSORS_UNVERIFIED', 'W0 must not claim migration');

assert(freeze.status === 'HPC2_W0_V8_CONTENT_PRESERVATION_FROZEN_ADDITIVE_SUCCESSOR_REQUIRED', 'freeze status drift');
assert(freeze.frozenFacts.semanticBlockCount === 39, 'freeze semantic block count drift');
assert(freeze.frozenFacts.destinationAssignedCount === 39, 'freeze destination count drift');
assert(freeze.frozenFacts.successorVerifiedCount === 0, 'freeze fabricates verified successors');
assert(freeze.frozenFacts.deletionAllowedFromHomepageCount === 0, 'freeze allows deletion');
assert(freeze.frozenFacts.homepageSceneAssignmentCount === 0, 'freeze assigns homepage scenes');
assert(freeze.frozenBoundaries.finalNineSceneAuthorityEstablished === false, 'freeze fabricates final scene authority');
assert(freeze.frozenBoundaries.routeActivated === false, 'freeze fabricates route activation');
assert(freeze.frozenBoundaries.humanDecisionCreated === false, 'freeze fabricates human decision');

const expectedFrozenPaths = [sourcePath, manifestPath, destinationMapPath, contractPath, evidencePath, acceptancePath];
sameMembers(freeze.frozenOutputs.map((record) => record.path), expectedFrozenPaths, 'frozen output paths');
for (const output of freeze.frozenOutputs) {
  assert(await sha256(output.path) === output.sha256, `frozen output digest drift: ${output.path}`);
}

assert(packageJson.scripts['check:hpc2-w0'] === 'node scripts/check-hpc2-w0.mjs', 'package check:hpc2-w0 wiring drift');
assert(packageJson.scripts['check:hpc2'].includes('npm run check:hpc2-w0'), 'check:hpc2 must include W0');
assert(packageJson.scripts['check:bfr-h'].includes('npm run check:hpc2-w0'), 'check:bfr-h must include W0');

console.log('HPC2-W0 V8 content preservation: ACCEPTED');
console.log('  source: 75f1b41729cc53038711bd31595897b137943c34f4f17a48289b525608f036b5 (98,898 bytes)');
console.log('  semantic blocks: 39/39 destination-assigned');
console.log('  successor verified: 0/39; deletion allowed: 0/39');
console.log('  final scenes: 0; routes activated: 0; human decisions created: 0');

import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const read=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const digest=path=>crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const audit=read('content/customer-experience-rebuild/r12r4b/cx-r12r4b-hdr-definitive-repository-audit-v1.json');
const freeze=read('content/professional/core-method-runtime/hdr-production-freeze-v1.json');
const registry=read('content/professional/method-production-activation/registries/method-registry-v4.json');
const capability=read('content/governance/production-capability-matrix/registries/production-capability-registry-v7.json');
const rights=read('content/professional/method-production-activation/registries/mpa-hdr-rights-license-boundary-v1.json');
const mappings=read('content/professional/method-production-activation/registries/mpa-hdr-mapping-authority-boundary-v1.json');
const meaning=read('content/professional/method-production-activation/registries/mpa-hdr-meaning-integration-boundary-v1.json');
const readiness=read('content/professional/method-production-activation/registries/mpa-hdr-boundary-readiness-v1.json');
const existing=read('content/professional/hdr2/audits/hdr2-existing-calculation-authority-audit-v1.json');

assert.equal(audit.work,'CX-R12R4B-W09');
assert.equal(audit.status,'W09_AUDIT_COMPLETE_REUSE_REQUIRED_W10_PUBLIC_IDENTITY_BLOCKED');
assert(audit.search.candidateCount>=80,'HDR audit scope unexpectedly small');
assert.deepEqual(Object.keys(audit.search.categoryCounts),['CALCULATION','DATA_TABLE','SOURCE','MEANING','VISUAL','CUSTOMER_UI','TEST','DEAD_OR_LEGACY']);
assert.equal(audit.inventory.length,audit.search.candidateCount);
assert(audit.inventory.every(item=>fs.existsSync(item.path)));
for(const authority of Object.values(audit.authorityDigests))assert.equal(digest(authority.path),authority.sha256,`HDR authority drift ${authority.path}`);

assert.equal(existing.status,'EXISTING_CALCULATION_COMPLETE_REIMPLEMENTATION_NOT_REQUIRED');
assert.equal(existing.decision.reimplementationRequired,false);
assert.equal(existing.decision.newGateWheelCalculationAllowed,false);
assert.equal(existing.decision.newDesignMomentCalculationAllowed,false);
assert.equal(existing.decision.newBodyGraphCalculationAllowed,false);
assert.equal(audit.reuseDecision.createSecondHdrAuthority,false);

const hdr=registry.methods.find(item=>item.pluginCode==='HDR');
assert.equal(hdr.methodCode,'HUMAN_DESIGN');
assert.equal(hdr.methodVersion,'1.0.0');
assert.equal(hdr.state,'BLOCKED');
assert.equal(hdr.productionEligible,false);
const hdrCapability=capability.capabilities.find(item=>item.methodRuntime?.pluginCode==='HDR');
assert.equal(hdrCapability.classification,'BLOCKED');
assert.equal(hdrCapability.userExecutable,false);
assert.equal(hdrCapability.productionAccepted,false);
assert.equal(hdrCapability.meaningReady,false);
assert.equal(hdrCapability.readingReady,false);

assert.equal(freeze.productionStatus,'blocked');
assert.equal(freeze.executionMode,'validation_only');
assert.equal(freeze.productionGates.productionExecutionAllowed,false);
assert.equal(rights.repositoryEvidence.explicitCommercialLicenseArtifactPresent,false);
assert.equal(rights.repositoryEvidence.authorizedGateMappingDatasetPresent,false);
assert.equal(rights.repositoryEvidence.authorizedBodyGraphStructureDatasetPresent,false);
assert.equal(rights.governanceDecision.commercialMethodActivationAllowed,false);
assert.equal(mappings.gateMapping.authorizedDatasetPresent,false);
assert.equal(mappings.structureResolution.authorizedDatasetPresent,false);
assert.equal(mappings.decision,'FAIL_CLOSED_RESTRICTED_MAPPING_AUTHORITY_UNRESOLVED');
assert.equal(meaning.observed.productionStatus,'validation_only');
assert.equal(meaning.observed.runtimeMappings,0);
assert.equal(meaning.observed.variableMappings,0);
assert.equal(meaning.observed.productionAuthorityCreated,false);
assert.equal(readiness.readyForW26,false);
assert.equal(readiness.productionExecutionAllowed,false);
assert.equal(readiness.publicMethodExecutionAllowed,false);

assert.equal(audit.sequentialGate.W09,'ACCEPTED_BY_DEFINITIVE_REPOSITORY_AUDIT');
assert.match(audit.sequentialGate.W10,/BLOCKED/);
assert.match(audit.sequentialGate.W11,/NOT_REACHABLE/);
assert.equal(audit.sequentialGate.W12_W78,'NOT_STARTED_SEQUENTIAL_GATE_PRESERVED');

console.log('✓ CX-R12R4B W09 definitive Human Design repository audit passed.');
console.log('  Existing calculation/projection must be reused; W10 public identity activation and W11 source authority remain fail-closed because rights, authorized mappings, production meaning, dispatch and customer publication are unresolved.');

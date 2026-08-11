import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { BASELINE, read, readJson, sha256File } from './lib/method-production-activation/mpa-hdr-boundary-v1.mjs';
import {
  evaluateHdrRestrictedBoundary,
  assertHdrRestrictedExecutionBlocked,
  assertPublicHdrVocabulary,
  MPA_HDR_BOUNDARY_DECISION_SCHEMA_VERSION
} from '../functions/method-production-activation/hdr-boundary-runtime.js';

const root='content/professional/method-production-activation';
const contract=readJson(`${root}/contracts/mpa-hdr-restricted-boundary-v1.json`);
const rights=readJson(`${root}/registries/mpa-hdr-rights-license-boundary-v1.json`);
const vocab=readJson(`${root}/registries/mpa-hdr-public-vocabulary-boundary-v1.json`);
const astronomy=readJson(`${root}/registries/mpa-hdr-astronomy-authority-boundary-v1.json`);
const mapping=readJson(`${root}/registries/mpa-hdr-mapping-authority-boundary-v1.json`);
const meaning=readJson(`${root}/registries/mpa-hdr-meaning-integration-boundary-v1.json`);
const professional=readJson(`${root}/registries/mpa-hdr-professional-boundary-v1.json`);
const regression=readJson(`${root}/registries/mpa-hdr-boundary-regression-freeze-v1.json`);
const readiness=readJson(`${root}/registries/mpa-hdr-boundary-readiness-v1.json`);
const schema=readJson(`${root}/schemas/mpa-hdr-boundary-readiness-v1.schema.json`);
const acceptance=readJson(`${root}/acceptance/mpa-w24-hdr-boundary-acceptance-v1.json`);
const methodRegistry=readJson(`${root}/registries/method-registry-v2.json`);
const capabilityMatrix=readJson(`${root}/registries/mpa-method-capability-matrix-v1.json`);
const mpaVocab=readJson(`${root}/registries/mpa-public-method-vocabulary-boundary-v1.json`);
const wprVocab=readJson('content/web-production/registries/wpr-public-vocabulary-registry-v2.json');
const hdrFreeze=readJson('content/professional/core-method-runtime/hdr-production-freeze-v1.json');
const hdrManifest=readJson('content/professional/core-method-runtime/hdr-runtime-manifest-v1.json');
const cmr=readJson('content/professional/canonical-meaning-runtime/acceptance/cmr-w7-hdr-mapping-acceptance-v1.json');
const w11=readJson(`${root}/registries/mpa-calculation-data-authority-registry-v1.json`);
const w15=readJson(`${root}/registries/mpa-cross-implementation-comparison-registry-v1.json`);

assert.equal(contract.work,'MPA-W24');
assert.equal(contract.baselineCommit,BASELINE);
assert.equal(contract.status,'ACTIVE_RESTRICTED_METHOD_BOUNDARY_NO_ACTIVATION');
for(const value of Object.values(contract.boundarySemantics)) assert.equal(value,false);
assert.equal(contract.publicPresentationPolicy.requiredPublicLabelEn,'Personal Runtime Projection');
assert.equal(contract.publicPresentationPolicy.requiredPublicLabelZhHans,'个人运行投射');
assert.equal(schema.properties.schemaVersion.const,MPA_HDR_BOUNDARY_DECISION_SCHEMA_VERSION);
assert.equal(schema.properties.productionEligible.const,false);
assert.equal(schema.properties.readyForW26.const,false);

// Historical/frozen authority must remain byte-for-byte unchanged.
for(const item of regression.frozenHistoricalAuthorities){
  assert.equal(sha256File(item.path),item.sha256,`HISTORICAL_AUTHORITY_DRIFT:${item.path}`);
}

const hdr=methodRegistry.methods.find(x=>x.methodCode==='HUMAN_DESIGN');
assert.ok(hdr); assert.equal(hdr.pluginCode,'HDR'); assert.equal(hdr.state,'BLOCKED');
assert.equal(hdr.productionEligible,false); assert.equal(hdr.professionalEligible,false);
for(const reason of ['RESTRICTED_LICENSE','EXTERNAL_ALGORITHM_AUTHORITY','PUBLIC_VOCABULARY_RESTRICTED','COMMERCIAL_ACTIVATION_NOT_APPROVED']) assert.ok(hdr.blockingReasons.includes(reason));
const caps=capabilityMatrix.methods.find(x=>x.methodCode==='HUMAN_DESIGN');
assert.equal(caps.capabilities.CALCULATION.state,'IMPLEMENTED_VALIDATION_ONLY');
assert.equal(caps.capabilities.PROJECTION.state,'IMPLEMENTED_VALIDATION_ONLY');
assert.equal(caps.capabilities.PROFESSIONAL.state,'BLOCKED'); assert.equal(caps.capabilities.PUBLIC.state,'BLOCKED');
assert.equal(hdrFreeze.productionStatus,'blocked'); assert.equal(hdrFreeze.executionMode,'validation_only');
assert.equal(hdrFreeze.productionGates.productionExecutionAllowed,false); assert.equal(hdrFreeze.productionGates.professionalReleaseAllowed,false);
assert.equal(hdrManifest.activation.productionEligible,false); assert.equal(hdrManifest.activation.professionalReleaseActivated,false);

// W4 historical MPA public vocabulary stays unresolved; WPR v2 owns current PUBLIC/CUSTOMER presentation.
const oldPublic=mpaVocab.internalTracks.find(x=>x.internalCode==='HDR');
assert.equal(oldPublic.publicLabel,null); assert.equal(oldPublic.directInternalNameExposureAllowed,false);
const publicEntry=wprVocab.entries.find(x=>x.vocabularyCode==='METHOD_HUMAN_DESIGN');
assert.ok(publicEntry); assert.equal(publicEntry.publicLabels.en,'Personal Runtime Projection'); assert.equal(publicEntry.publicLabels['zh-Hans'],'个人运行投射');
assert.equal(publicEntry.renderPolicy,'CONTROLLED_PUBLIC_LABEL_ONLY'); assert.equal(publicEntry.methodProductionEligibilityCreated,false);
assert.deepEqual(vocab.presentationAuthority.publicLabels,publicEntry.publicLabels);
assert.equal(vocab.publicCustomerRules.directInternalNameExposureAllowed,false);
assert.equal(vocab.publicCustomerRules.rawHdrProjectionVocabularyExposureAllowed,false);

// Audited public/customer pages must not render the restricted internal brand terms.
for(const file of vocab.surfaceAudit.files){
  const source=read(file); assert.equal(assertPublicHdrVocabulary({text:source,restrictedTerms:vocab.restrictedTerms}),true,`PUBLIC_TERM_LEAK:${file}`);
}
const compat=read('professional/human-design/index.html');
assert.ok(compat.includes('name="robots" content="noindex"'));
assert.ok(compat.includes('url=/professional/personal-runtime'));
assert.ok(compat.includes("location.replace('/professional/personal-runtime')"));

// Rights/licensing evidence is fail-closed and expressly does not create a legal opinion or a PHI license.
assert.equal(rights.repositoryEvidence.explicitCommercialLicenseArtifactPresent,false);
assert.equal(rights.repositoryEvidence.authorizedGateMappingDatasetPresent,false);
assert.equal(rights.repositoryEvidence.authorizedBodyGraphStructureDatasetPresent,false);
assert.equal(rights.governanceDecision.commercialMethodActivationAllowed,false);
assert.equal(rights.governanceDecision.productionMappingExecutionAllowed,false);
assert.equal(rights.rules.thisRecordIsLegalOpinion,false);
assert.equal(rights.rules.externalRightsClaimAcceptedAsProofOfPhiLicense,false);

// Astronomy can reuse W22 as technical evidence only; it cannot unlock restricted mapping or HDR Production.
assert.equal(astronomy.sharedTechnicalCandidate.version,'2.1.19');
assert.equal(astronomy.sharedTechnicalCandidate.releaseCommit,'61dc07020aaa6885d2c7f688a4d82beaf6edb9ef');
assert.equal(astronomy.sharedTechnicalCandidate.createsHdrMethodAuthority,false);
assert.equal(astronomy.hdrSpecificUnresolved.hdrRuntimeAdapterPinned,false);
assert.equal(astronomy.hdrSpecificUnresolved.northSouthNodeProductionAuthorityDemonstrated,false);
assert.equal(astronomy.hdrSpecificUnresolved.hdrTrustedReferenceComparisonPassed,false);
assert.equal(astronomy.boundary.astronomyTechnicalResolutionMayNotUnlockGateMapping,true);

// Gate/structure mapping remains unauthorized and may not be reconstructed or AI-inferred.
const gateAuthority=w11.authorities.find(x=>x.authorityCode==='HDR_GATE_MAPPING_AUTHORITY');
assert.ok(gateAuthority); assert.equal(gateAuthority.digest,null); assert.equal(gateAuthority.productionUse,'BLOCKED');
assert.equal(mapping.gateMapping.authorizedDatasetPresent,false); assert.equal(mapping.gateMapping.productionAllowed,false);
assert.equal(mapping.structureResolution.authorizedDatasetPresent,false); assert.equal(mapping.structureResolution.productionAllowed,false);
assert.ok(mapping.forbiddenWorkarounds.includes('USE_LLM_OR_PROMPT_AS_MAPPING_AUTHORITY'));
const compare=w15.methods.find(x=>x.methodCode==='HUMAN_DESIGN');
assert.equal(compare.currentState,'BLOCKED'); assert.equal(compare.productionComparisonSatisfied,false);

// CMR-W7 stays validation-only/partial and cannot create Production semantics or cure rights authority.
assert.equal(cmr.productionStatus,'validation_only'); assert.equal(cmr.results.structureMappings,100); assert.equal(cmr.results.runtimeMappings,0); assert.equal(cmr.results.variableMappings,0);
assert.equal(cmr.results.productionAuthorityCreated,false);
assert.equal(meaning.observed.productionStatus,'validation_only'); assert.equal(meaning.rules.cmrMayNotCureMissingMethodRights,true); assert.equal(meaning.rules.cmrMayNotCureMissingGateMappingAuthority,true);

// Professional path remains explicitly blocked.
assert.equal(professional.decision,'BLOCKED_NO_PROFESSIONAL_HANDOFF_OR_RELEASE');
assert.equal(professional.rules.sharedProfessionalRuntimeRequired,true); assert.equal(professional.rules.parallelHdrReleasePathAllowed,false);

// Legacy HDR validation checkers are rerun as regression evidence; passing does not activate HDR.
const pkg=readJson('package.json');
for(const alias of regression.checkerAliases){
  const command=pkg.scripts[alias]; assert.ok(command?.startsWith('node '),`HDR_CHECKER_ALIAS_MISSING:${alias}`);
  const run=spawnSync(process.execPath,[command.slice('node '.length)],{cwd:process.cwd(),encoding:'utf8'});
  assert.equal(run.status,0,`${alias}\n${run.stdout}\n${run.stderr}`);
}

const decision=evaluateHdrRestrictedBoundary({gates:readiness.gates,publicPresentation:readiness.publicPresentation});
assert.equal(decision.decision,'RESTRICTED_BOUNDARY_ESTABLISHED_NOT_ELIGIBLE_FOR_W26');
assert.equal(decision.boundaryEstablished,true); assert.equal(decision.methodSpecificReady,false); assert.equal(decision.readyForW26,false);
assert.equal(decision.productionEligible,false); assert.equal(decision.productionExecutionAllowed,false); assert.equal(decision.professionalEligible,false); assert.equal(decision.professionalReleaseAllowed,false);
assert.throws(()=>assertHdrRestrictedExecutionBlocked('production'),/MPA_HDR_RESTRICTED_METHOD_EXECUTION_BLOCKED/);
assert.equal(assertHdrRestrictedExecutionBlocked('validation'),true);

assert.equal(readiness.stateMustRemain,'BLOCKED'); assert.equal(readiness.globalEligibilityGate,'MPA-W26_EXCLUDED_WHILE_HDR_STATE_BLOCKED');
assert.equal(acceptance.status,'ACCEPT_HDR_RESTRICTED_BOUNDARY_FROZEN_NO_ACTIVATION_NO_W26_ELIGIBILITY');
assert.equal(acceptance.nextWork,'MPA-W25_FUTURE_METHOD_HOLDING');

assert.equal(pkg.scripts['check:mpa-w24'],'node scripts/check-mpa-w24-hdr-boundary.mjs');
assert.equal(pkg.scripts['check:mpa-hdr-boundary'],'npm run check:mpa-w24');
const segments=String(pkg.scripts['check:mpa']||'').split(' && ');
assert.deepEqual(segments.slice(0,8),[
  'npm run check:mpa-foundation','npm run check:mpa-input-calculation','npm run check:mpa-validation-evidence','npm run check:mpa-projection-integration',
  'npm run check:mpa-num-activation','npm run check:mpa-ast-activation','npm run check:mpa-bzr-activation','npm run check:mpa-hdr-boundary'
]);
assert.equal(String(pkg.scripts.postcheck||'').includes('check:mpa'),false);

console.log('✓ MPA-W24 HDR Boundary passed.');
console.log('  HDR remains BLOCKED: no rights/license, mapping, Production, Professional or raw public-method authority is created.');
console.log('  PUBLIC/CUSTOMER presentation is constrained to Personal Runtime Projection / 个人运行投射; MPA-W26 excludes HDR while blocked.');

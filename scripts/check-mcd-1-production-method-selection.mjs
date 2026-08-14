import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';

const readJson = path => JSON.parse(fs.readFileSync(path,'utf8'));
const sha256 = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const must = path => { assert.ok(fs.existsSync(path), path); return readJson(path); };

const selection=must('content/professional/method-client-delivery/registries/mcd-1-production-method-selection-v1.json');
const activation=must('content/professional/method-client-delivery/resolutions/mcd-1-production-activation-resolution-v1.json');
const hdr=must('content/professional/method-client-delivery/resolutions/mcd-1-hdr-restricted-method-resolution-v1.json');
const ast=must('content/professional/method-governance/successors/ast-production-policy-successor-v1.json');
const bzr=must('content/professional/method-governance/successors/bzr-commercial-license-successor-v1.json');
const num=must('content/professional/method-governance/successors/num-commercial-scope-successor-v1.json');
const mpa=must('content/professional/method-production-activation/successors/mpa-mcd-1-production-authority-successor-v1.json');
const acceptance=must('content/professional/method-client-delivery/acceptance/mcd-1-production-method-selection-acceptance-v1.json');

assert.equal(selection.status,'SELECTED_AUTHORITY_RESOLVED_ADAPTER_BINDING_PENDING');
assert.deepEqual(selection.methods.map(x=>x.pluginCode),['AST','BZR','NUM','HDR']);
assert.equal(selection.rules.mcdDoesNotGrantAuthority,true);
assert.equal(selection.rules.mpaControlsDispatchAllowed,true);
assert.equal(selection.rules.mcd2RequiredBeforeAnyProductionInvocation,true);
for (const code of ['AST','BZR','NUM']) {
  const x=selection.methods.find(v=>v.pluginCode===code); assert.equal(x.dispatchAllowedByMpa,true); assert.equal(x.productionDispatchActive,false); assert.equal(x.adapterBinding,'PENDING_MCD_2'); assert.equal(x.interpretationIncluded,false);
}
const hs=selection.methods.find(x=>x.pluginCode==='HDR');
assert.equal(hs.mcdStatus,'BLOCKED_VALIDATION_ONLY'); assert.equal(hs.dispatchAllowedByMpa,false); assert.equal(hs.productionDispatchActive,false);

assert.equal(ast.status,'APPROVED_INITIAL_PRODUCTION_SCOPE_FOR_MPA_SUCCESSOR');
assert.equal(ast.authorityOwner,'PHI_OS_AST_METHOD_GOVERNANCE');
assert.equal(ast.policy.housePolicy.included,false); assert.equal(ast.policy.aspectPolicy.included,false); assert.equal(ast.policy.nodePolicy.included,false);
assert.deepEqual(ast.clientProjectionScope,['PLANET']);
assert.equal(ast.boundaries.implicitDefaultsAllowed,false); assert.equal(ast.boundaries.createsInterpretation,false);
assert.equal(ast.astronomyDataAuthority.engine,'ASTRONOMY_ENGINE_JS'); assert.equal(ast.astronomyDataAuthority.license,'MIT');

assert.equal(bzr.status,'APPROVED_SCOPE_BOUND_SUCCESSOR');
assert.equal(bzr.resolution.historicalConditionalLicenseClosedBySuccessorForBoundScope,true);
assert.equal(bzr.resolution.commercialUseApprovedForBoundScope,true); assert.equal(bzr.resolution.apiUseApprovedForBoundScope,true); assert.equal(bzr.resolution.legalOpinionCreated,false);
const deps=Object.fromEntries(bzr.dependencyResolutions.map(x=>[x.dependencyCode,x]));
assert.equal(deps.IANA_TZDB.license,'PUBLIC_DOMAIN'); assert.equal(deps.ASTRONOMY_ENGINE_JS.license,'MIT'); assert.equal(deps.PHI_OS_BAZI_POLICY_V1.status,'APPROVED_FOR_BOUND_SCOPE');

assert.equal(num.status,'APPROVED_INTERNAL_RULE_SCOPE_FOR_MPA_SUCCESSOR');
assert.equal(num.externalCalculationDatasetDependency,false); assert.equal(num.externalCommercialLicenseRequiredForBoundScope,false); assert.equal(num.resolution.explicitProductionGrantStillOwnedByMPA,true);

assert.equal(mpa.authorityOwner,'MPA'); assert.equal(mpa.predecessorMutated,false); assert.equal(mpa.globalRules.onlyMpaDecisionControlsDispatchAllowed,true); assert.equal(mpa.globalRules.productionDispatchActiveBeforeMcd2,false);
for (const code of ['ASTROLOGY','BAZI','NUMEROLOGY']) {
  const x=mpa.methods.find(v=>v.methodCode===code); assert.equal(x.productionEligible,true); assert.deepEqual(x.eligibleCapabilities,['CALCULATION','PROJECTION']); assert.deepEqual(x.dispatchableCapabilities,['CALCULATION','PROJECTION']); assert.equal(x.productionDispatchActive,false); assert.equal(x.activationRequiresAdapterBindingAt,'MCD-2'); assert.equal(x.professionalEligible,false);
}
const hm=mpa.methods.find(x=>x.pluginCode==='HDR'); assert.equal(hm.state,'BLOCKED'); assert.equal(hm.productionEligible,false); assert.deepEqual(hm.dispatchableCapabilities,[]); assert.equal(hm.productionDispatchActive,false);
for (const {path,sha256:expected} of Object.values(mpa.frozenPredecessorDigests)) assert.equal(sha256(path),expected,`Frozen predecessor drift: ${path}`);

assert.equal(hdr.status,'REGISTERED_COMPLETE_BLOCKED_VALIDATION_ONLY');
assert.equal(hdr.method.pluginCode,'HDR'); assert.equal(hdr.currentAuthority.state,'BLOCKED'); assert.equal(hdr.currentAuthority.productionEligible,false); assert.equal(hdr.currentAuthority.professionalEligible,false); assert.equal(hdr.currentAuthority.executionMode,'validation_only'); assert.equal(hdr.currentAuthority.dispatchAllowed,false);
assert.equal(hdr.capabilities.CALCULATION,'IMPLEMENTED_VALIDATION_ONLY'); assert.equal(hdr.capabilities.PROJECTION,'IMPLEMENTED_VALIDATION_ONLY'); assert.equal(hdr.capabilities.PROFESSIONAL,'BLOCKED'); assert.equal(hdr.capabilities.PUBLIC,'BLOCKED');
for (const reason of ['RESTRICTED_LICENSE','EXTERNAL_ALGORITHM_AUTHORITY','PUBLIC_VOCABULARY_RESTRICTED','COMMERCIAL_ACTIVATION_NOT_APPROVED']) assert.ok(hdr.blockingReasons.includes(reason),reason);
assert.equal(hdr.historicalRuntimePreservation.chain.length,8); assert.equal(hdr.historicalRuntimePreservation.legacyCheckerPassCreatesProductionPermission,false);
assert.equal(hdr.rightsLicenseGate.allResolved,false); assert.equal(hdr.rightsLicenseGate.productionExecution,'BLOCKED'); assert.equal(hdr.mappingAuthority.resolved,false);
for (const mech of ['LLM','PROMPT','REVERSE_ENGINEERING_GUESS','UNVERIFIED_EXTERNAL_TABLE','GENERATED_MAPPING','AI_RECONSTRUCTION']) assert.ok(hdr.mappingAuthority.forbiddenRepairMechanisms.includes(mech),mech);
assert.equal(hdr.astronomyBoundary.createsHdrMappingAuthority,false); assert.equal(hdr.astronomyBoundary.createsHdrProductionAuthority,false);
assert.equal(hdr.publicVocabulary.internalOnly,true); assert.equal(hdr.publicVocabulary.publicSurfaceExposureAllowed,false); assert.equal(hdr.publicVocabulary.productionResultTabAllowed,false);
assert.equal(hdr.professionalBoundary.handoff,'BLOCKED'); assert.equal(hdr.professionalBoundary.release,'BLOCKED');

assert.equal(activation.status,'AUTHORITY_GAPS_RESOLVED_FOR_AST_BZR_NUM_HDR_REMAINS_BLOCKED'); assert.equal(activation.productionDispatch.active,false); assert.equal(activation.productionDispatch.nextWork,'MCD-2'); assert.equal(activation.authorityBoundary.grantOwner,'MPA'); assert.equal(activation.authorityBoundary.mcdGrantAuthority,false);
assert.equal(acceptance.status,'ACCEPTED_AUTHORITY_RESOLVED_NO_ADAPTER_BINDING'); assert.equal(acceptance.acceptedFacts.hdrStateBlocked,true); assert.equal(acceptance.acceptedFacts.hdrProductionDispatchImpossibleAtMcd1,true);

// MCD-1 must not silently wire the current frozen endpoint. The canonical endpoint still has its pre-MCD-2 adapter placeholder.
const api=fs.readFileSync('functions/api/method-execute.js','utf8');
assert.match(api,/METHOD_RUNTIME_ADAPTER_NOT_REGISTERED/); assert.doesNotMatch(api,/hdr-adapter/i);
console.log('✓ MCD-1 Production Method Selection passed.');
console.log('  AST policy authority, BZR conditional-license successor and NUM explicit MPA grant are resolved for MCD-2 binding; actual Production dispatch remains inactive until Adapter registration.');
console.log('  HDR is fully registered but remains BLOCKED / validation-only with zero Production, Professional or public customer execution authority.');

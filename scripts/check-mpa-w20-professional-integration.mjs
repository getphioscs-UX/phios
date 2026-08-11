import assert from 'node:assert/strict';
import { BASELINE, readJson, exists } from './lib/method-production-activation/mpa-projection-integration-v1.mjs';
import { evaluateProfessionalIntegration } from '../functions/method-production-activation/projection-integration-runtime.js';

const contract = readJson('content/professional/method-production-activation/contracts/mpa-professional-integration-v1.json');
const sharedProfessional = readJson('content/professional/method-runtime/shared-professional-runtime-v1.json');
const jrHandoff = readJson('content/runtime/journey-runtime/contracts/professional-handoff-package-contract-v1.json');
assert.equal(contract.work, 'MPA-W20');
assert.equal(contract.baselineCommit, BASELINE);
assert.equal(contract.separation.mpaOwnsProfessionalRelease, false);
assert.equal(contract.currentState.prV2CanonicalArtifactResolved, false);
assert.equal(contract.currentState.professionalReleaseActivated, false);
assert.equal(sharedProfessional.rules.allMethodsMustPass, true);
assert.equal(sharedProfessional.rules.bypassForbidden, true);
assert.equal(jrHandoff.rules.serviceSpecificConsentRequired, true);
assert.equal(jrHandoff.rules.handoffCreatesProfessionalResponsibility, false);
for (const track of Object.values(contract.methodTracks)) {
  assert.equal(track.currentProfessionalIntegration, 'blocked');
  assert.equal(exists(track.reference), true, track.reference);
}
const customer = evaluateProfessionalIntegration({methodCode:'NUMEROLOGY', mode:'CUSTOMER_CALCULATION'});
assert.equal(customer.decision, 'CUSTOMER_CALCULATION_SEPARATE_FROM_PROFESSIONAL_INTERPRETATION');
assert.equal(customer.professionalReleaseAllowed, false);
const blocked = evaluateProfessionalIntegration({methodCode:'NUMEROLOGY', mode:'PROFESSIONAL_INTERPRETATION', methodProfessionalEligible:false});
assert.equal(blocked.decision, 'PROFESSIONAL_INTEGRATION_BLOCKED');
assert.ok(blocked.blockingReasons.includes('prV2AuthorityResolved'));
assert.ok(blocked.blockingReasons.includes('methodProfessionalEligible'));
const ready = evaluateProfessionalIntegration({methodCode:'NUMEROLOGY', mode:'PROFESSIONAL_INTERPRETATION', methodProfessionalEligible:true, separateProfessionalEligibility:true, activeAssignment:true, activeServiceConsent:true, boundaryAcknowledged:true, workspaceAccess:true, prV2AuthorityResolved:true});
assert.equal(ready.decision, 'READY_FOR_SHARED_PROFESSIONAL_RUNTIME_HANDOFF');
assert.equal(ready.professionalRuntimeHandoffAllowed, true);
assert.equal(ready.professionalReleaseAllowed, false);
assert.equal(ready.professionalAuthorityCreatedByMpa, false);
assert.equal(contract.productionEligibilityChanged, false);
assert.equal(contract.professionalEligibilityChanged, false);
console.log('✓ MPA-W20 Professional Integration passed.');
console.log('  Customer calculation stays separate; Professional interpretation requires independent PR/PWS gates and MPA cannot sign or release.');

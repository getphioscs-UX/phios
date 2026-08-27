import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
import {
  createIChingFullProductionAuthorityPayload,
  validateIChingFullProductionAuthorityRecord,
  ICHING_FULL_PRODUCTION_RELEASE_ID,
  ICHING_FULL_PRODUCTION_AUTHORITY_SCHEMA
} from '../functions/iching-full-production/iching-full-production-v1.js';

assert.equal(ICHING_FULL_PRODUCTION_RELEASE_ID,'ICHING-1.0.1');
assert.equal(ICHING_FULL_PRODUCTION_AUTHORITY_SCHEMA,'PHI-OS-ICHING-FULL-PRODUCTION-AUTHORITY-v1.1.0');
const promotedSha='aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const laterSiteSha='bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const env={ICHING_FULL_PRODUCTION_GUEST_SESSION_SECRET:'0123456789abcdef0123456789abcdef0123456789abcdef'};
const authority=createIChingFullProductionAuthorityPayload({
  approvedCommitSha:promotedSha,
  rightsReviewId:'ICHING-GLOBAL-RIGHTS-CONTINUITY-TEST',
  promotedAt:'2026-08-27T09:00:00.000Z',
  active:true
});
assert.equal(authority.releaseId,'ICHING-1.0.1');
assert.equal(authority.authorityScope,'RELEASE');
assert.equal(authority.promotionCommitSha,promotedSha);
assert.equal(authority.gates.initialPromotionExactShaVerified,true);
assert.equal(authority.gates.releaseScopedDeploymentContinuity,true);
assert.equal(authority.deploymentContinuity.subsequentExactShaMatchRequired,false);

const exact=validateIChingFullProductionAuthorityRecord(authority,promotedSha,env);
assert.equal(exact.authorized,true);assert.equal(exact.runAllowed,true);assert.equal(exact.deploymentContinuityApplied,false);
assert.equal(exact.promotionCommitSha,promotedSha);assert.equal(exact.liveProductionSha,promotedSha);

const later=validateIChingFullProductionAuthorityRecord(authority,laterSiteSha,env);
assert.equal(later.authorized,true,'ordinary later site deployment must keep the promoted I Ching release active');
assert.equal(later.state,'FULL_PRODUCTION');assert.equal(later.runAllowed,true);assert.equal(later.fullProduction,true);
assert.equal(later.globalPublicExecution,true);assert.equal(later.guestPersistenceAllowed,true);
assert.equal(later.promotionCommitSha,promotedSha);assert.equal(later.liveProductionSha,laterSiteSha);
assert.equal(later.deploymentContinuityApplied,true);assert.equal(later.authorityScope,'RELEASE');

const disabled=validateIChingFullProductionAuthorityRecord(authority,laterSiteSha,{...env,ICHING_FULL_PRODUCTION_ENABLED:'false'});
assert.equal(disabled.runAllowed,false);assert.equal(disabled.state,'FULL_PRODUCTION_DISABLED_BY_ENV');
const secretMissing=validateIChingFullProductionAuthorityRecord(authority,laterSiteSha,{});
assert.equal(secretMissing.runAllowed,false);assert.equal(secretMissing.state,'GUEST_SESSION_SECRET_NOT_CONFIGURED');
const wrongRelease={...authority,releaseId:'ICHING-9.9.9'};
const wrong=validateIChingFullProductionAuthorityRecord(wrongRelease,laterSiteSha,env);
assert.equal(wrong.runAllowed,false);assert.equal(wrong.state,'FULL_PRODUCTION_AUTHORITY_INVALID_OR_INCOMPLETE');
const revoked={...authority,state:'REVOKED',runAllowed:false,fullProduction:false,globalPublicExecution:false,guestPersistenceAllowed:false,productionCapabilityPromoted:false};
assert.equal(validateIChingFullProductionAuthorityRecord(revoked,laterSiteSha,env).runAllowed,false);

console.log('✓ I Ching release-scoped Full Production continuity passed.');
console.log('  Initial promotion remains exact-SHA verified, but later unrelated site commits do not revoke ICHING-1.0.1 while release authority, D1 and guest-session secret remain valid.');
console.log('  Kill switch, release mismatch, missing secret and explicit revocation remain fail-closed.');

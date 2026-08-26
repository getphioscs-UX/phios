import assert from 'node:assert/strict';
import { onRequestGet, onRequestPost } from '../functions/api/iching-limited-production-diagnostics.js';

const sha='4a9ddcaff07abaab4c12be62cd74e0681e528af8';
const secrets={
  aud:'AUD_SECRET_DO_NOT_LEAK',
  email:'tester@example.invalid',
  rights:'RIGHTS_REVIEW_SECRET_DO_NOT_LEAK',
  session:'S'.repeat(48)
};
const context={
  env:{
    CF_PAGES_COMMIT_SHA:sha,
    ICHING_LIMITED_PRODUCTION_ENABLED:'true',
    ICHING_LIMITED_PRODUCTION_DEPLOYMENT_SHA:sha,
    ICHING_LIMITED_PRODUCTION_LIVE_BROWSER_ACCEPTED_SHA:sha,
    ICHING_LIMITED_PRODUCTION_COUNTRIES:'MY',
    ICHING_LIMITED_PRODUCTION_EMAILS:secrets.email,
    ICHING_LIMITED_PRODUCTION_RIGHTS_REVIEW_ID:secrets.rights,
    ICHING_LIMITED_PRODUCTION_SESSION_SECRET:secrets.session,
    PHIOS_ACCESS_TEAM_DOMAIN:'https://example.cloudflareaccess.com',
    PHIOS_ACCESS_AUD:secrets.aud,
    RUNTIME_DB:{prepare(){}}
  },
  request:{cf:{country:'MY'}}
};
const response=await onRequestGet(context);
assert.equal(response.status,200);
const payload=await response.json();
assert.equal(payload.ok,true);
assert.equal(payload.state,'EXTERNAL_PREFLIGHT_READY');
assert.deepEqual(payload.gates,{
  enabled:true,
  accessConfigured:true,
  deploymentShaAligned:true,
  rightsReviewPresent:true,
  sessionSecretReady:true,
  countryAllowed:true
});
assert.equal(payload.details.deploymentShaMatchesCurrent,true);
assert.equal(payload.details.browserAcceptedShaMatchesCurrent,true);
assert.equal(payload.details.accessTeamDomainShapeValid,true);
assert.equal(payload.details.runtimeDbBound,true);
assert.equal(payload.boundaries.secretValuesExposed,false);
assert.equal(payload.boundaries.grantsExecutionAuthority,false);
const serialized=JSON.stringify(payload);
for(const value of Object.values(secrets)) assert.equal(serialized.includes(value),false,`diagnostic response leaked protected value: ${value.slice(0,8)}...`);
const post=await onRequestPost();
assert.equal(post.status,405);
console.log('✓ ICH-PROD-W32R1D safe external-gate diagnostics static acceptance passed: six preflight booleans + safe presence/match detail are visible, secret values remain non-returned, and the route grants no execution authority.');

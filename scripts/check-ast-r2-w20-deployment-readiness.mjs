import assert from 'node:assert/strict';import fs from 'node:fs';
import {readJson} from './lib/ast-full-production/ast-r2-w17-w20-support.mjs';
const contract=readJson('content/professional/ast-full-production/customer-reading-v2/contracts/ast-r2-w20-deployment-live-smoke-freeze-contract-v1.json'),freeze=readJson('content/professional/ast-full-production/customer-reading-v2/freeze/ast-r2-w20-full-production-freeze-v1.json'),rollback=readJson('content/professional/ast-full-production/customer-reading-v2/freeze/ast-r2-w20-rollback-plan-v1.json'),w17=readJson('content/professional/ast-full-production/customer-reading-v2/acceptance/ast-r2-w17-production-machine-acceptance-v1.json'),w18=readJson('content/professional/ast-full-production/customer-reading-v2/review/ast-r2-w18-final-customer-human-review-results-v1.json'),w19=readJson('content/professional/ast-full-production/customer-reading-v2/admission/ast-r2-w19-method-scoped-production-admission-v1.json'),r3=readJson('content/professional/ast-full-production/acceptance/ast-fp-r3-independent-calculation-certification-v1.json');
const html=fs.readFileSync('perspectives/personal/index.html','utf8');
const client=fs.readFileSync('assets/customer-ui/js/surfaces/personal-reality.js','utf8');
const productHost=fs.readFileSync('assets/customer-ui/js/personal-products/personal-product-renderers.js','utf8');
const specialistHost=fs.readFileSync('assets/customer-ui/js/personal-products/specialist-renderer-host.js','utf8');
const specialistRegistry=fs.readFileSync('assets/customer-ui/js/personal-products/specialist-renderer-registry.js','utf8');
const astRenderer=fs.readFileSync('assets/customer-ui/js/specialists/ast/product-renderer.js','utf8');
const astSurface=fs.readFileSync('assets/customer-ui/js/specialists/ast/ast-specialist-surface-v3.js','utf8');
const hostCss=fs.readFileSync('assets/customer-ui/surfaces/ppr-r3-specialist-host.css','utf8');
const astCss=fs.readFileSync('assets/customer-ui/surfaces/astrology-specialist-v3.css','utf8');
const api=fs.readFileSync('functions/api/customer-personal-reality.js','utf8');
const statusApi=fs.readFileSync('functions/api/ast-full-production-status.js','utf8');
const smoke=fs.readFileSync('scripts/smoke-ast-r2-w20-live.mjs','utf8');
const astCxR3=readJson('content/professional/ast-full-production/customer-product-v3/acceptance/ast-cx-r3-w5-w8-specialist-surface-acceptance-v1.json');

// R2-W20's release gates remain authoritative, but the current customer route
// mounts AST through the frozen PPR-R3 specialist host. The retired static
// data-cx-astrology-workspace mount is compatibility-only and must not be
// required as the current production surface.
assert.match(html,/data-cx-specialist-products/);
assert.match(html,/data-cx-ast-target-input/);
assert.match(client,/renderProductRoute\(view\.productRoute/);
assert.match(client,/data-cx-specialist-products/);
assert.match(productHost,/mountApprovedSpecialistRenderer/);
assert.match(specialistHost,/data-ppr-r3-specialist-reading-mount/);
assert.match(specialistRegistry,/PPR_R3_AST_PRODUCT_V1/);
assert.match(specialistRegistry,/specialists\/ast\/product-renderer\.js/);
assert.match(astRenderer,/PHI-OS-AST-CUSTOMER-PRODUCT-PROJECTION-v3\.0\.0/);
assert.match(astRenderer,/compatibilityOnly:false/);
assert.match(astSurface,/data-ast-cx-r3-surface/);
assert.match(astSurface,/data-astcx-section="natal-chart"/);
assert.match(hostCss,/@media\(max-width:767px\)/);
assert.match(hostCss,/@media print/);
assert.match(astCss,/@media\(max-width:560px\)/);
assert.match(astCss,/@media print/);
assert.equal(astCxR3.status,'ENGINEERING_ACCEPTED');
assert.equal(astCxR3.oldAstrologyWorkspacePrimaryRenderer,false);
assert.match(api,/productRoute/);
assert.match(statusApi,/CF_PAGES_COMMIT_SHA/);
assert.match(statusApi,/AST_R2_METHOD_SCOPED_ADMISSION/);
assert.match(smoke,/ast-full-production-status/);
assert.match(smoke,/deployed commit does not match expected/);
assert.equal(rollback.status,'FROZEN_ROLLBACK_PROCEDURE');
assert.equal(rollback.otherMethodsRolledBack,false);
assert.equal(rollback.legacyPersonalRuntimeBecomesCanonical,false);
assert.equal(contract.requiredBeforeFreeze.canonicalRoute,'/perspectives/personal/');
assert.equal(contract.requiredBeforeFreeze.liveApi,'/api/customer-personal-reality');
assert.equal(w17.status,'MACHINE_ACCEPTED_241_OF_241');
const gates={w17MachineAccepted100Percent:true,w18FinalCustomerHumanAccepted:w18.status==='HUMAN_ACCEPTED_24_OF_24',w19AstMethodScopedCutoverAllowed:w19.customerCutoverAllowed===true,r3IndependentEphemerisCertification:r3.boundaries?.independentEphemerisAccuracyCertificationEstablished===true,liveCanonicalHtmlSmoke:freeze.releaseGates.liveCanonicalHtmlSmoke===true,liveCustomerAssetsSmoke:freeze.releaseGates.liveCustomerAssetsSmoke===true,liveApiConsentBoundarySmoke:freeze.releaseGates.liveApiConsentBoundarySmoke===true,liveAstEndToEndApiSmoke:freeze.releaseGates.liveAstEndToEndApiSmoke===true,deployedCommitMatchesExpected:freeze.releaseGates.deployedCommitMatchesExpected===true};const frozen=Object.values(gates).every(Boolean)&&Boolean(freeze.deployedCommit)&&Boolean(freeze.productionBaseUrl);assert.equal(freeze.astFullProductionFrozen,frozen);assert.equal(freeze.customerCutoverAllowed,frozen);if(!frozen){const expectedPending=gates.w19AstMethodScopedCutoverAllowed&&gates.r3IndependentEphemerisCertification?'AST_ADMITTED_AWAITING_EXACT_DEPLOYMENT_AND_LIVE_SMOKE':w18.status==='HUMAN_ACCEPTED_24_OF_24'?'DEPLOYMENT_READY_HUMAN_ACCEPTED_GATED_BY_R3_W19_AND_LIVE_SMOKE':'DEPLOYMENT_READY_GATED_NOT_FROZEN';assert.equal(freeze.status,expectedPending);}
console.log(JSON.stringify({status:'PASS',workCode:'R2-W20',engineeringDeploymentReadiness:true,canonicalRoute:contract.requiredBeforeFreeze.canonicalRoute,desktop:true,mobile:true,print:true,rollbackFrozen:true,releaseGates:gates,astFullProductionFrozen:frozen,liveSmokeCommand:'PHIOS_AST_SMOKE_BASE_URL=<url> PHIOS_AST_SMOKE_EXPECTED_COMMIT=<deployed sha> PHIOS_AST_SMOKE_PLACE_REF=<provider ref> npm run smoke:ast-r2-w20-live'},null,2));

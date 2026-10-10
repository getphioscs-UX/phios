import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';

const readJson = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const sha256 = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const BASE = 'content/products/runtime-reading';
const expectedBaselinePrefix = '812d7c8';
const requiredAudit = ['MPA','MCD','CMR','RMO','RRE','RNE','RDG','ICR','PR','RR','CPR'];

const w0 = readJson(`${BASE}/authority/runtime-reading-authority-baseline-v1.json`);
const w1 = readJson(`${BASE}/contracts/runtime-reading-product-contract-v1.json`);
const w2 = readJson(`${BASE}/registries/runtime-reading-source-authority-registry-v1.json`);
const w3 = readJson(`${BASE}/registries/runtime-reading-method-availability-v1.json`);
const w4 = readJson(`${BASE}/contracts/runtime-reading-method-consent-v1.json`);
const legacyMrmAuthorityPath = 'content/runtime-maturity/authority/master-runtime-authority-baseline-v1.json';
const legacyMrmCapabilityPath = 'content/runtime-maturity/registries/master-runtime-capability-inventory-v1.json';
const currentMrmArchitecturePath = 'content/runtime-maturity/evidence/architecture/architectural-evidence-registry-v1.json';
const currentMrmMatrixPath = 'content/runtime-maturity/matrices/master-evidence-maturity-matrix-v1.1.json';
const mrm0 = fs.existsSync(legacyMrmAuthorityPath) ? readJson(legacyMrmAuthorityPath) : null;
const mrm5 = fs.existsSync(legacyMrmCapabilityPath) ? readJson(legacyMrmCapabilityPath) : null;
const currentMrmArchitecture = fs.existsSync(currentMrmArchitecturePath) ? readJson(currentMrmArchitecturePath) : null;
const currentMrmMatrix = fs.existsSync(currentMrmMatrixPath) ? readJson(currentMrmMatrixPath) : null;
const mpa = readJson('content/professional/method-production-activation/successors/mpa-mcd-1-production-authority-successor-v1.json');
const mcd = readJson('content/professional/method-client-delivery/acceptance/mcd-5-canonical-projection-acceptance-v1.json');
const cmr = readJson('content/professional/canonical-meaning-runtime/contracts/canonical-meaning-runtime-v1.json');
const rdgConsent = readJson('content/governance/reality-data-governance/registries/canonical-consent-class-registry-v1.json');
const rdgPurpose = readJson('content/governance/reality-data-governance/registries/canonical-data-purpose-registry-v1.json');
const mcdRequest = readJson('content/professional/method-client-delivery/schemas/mcd-method-execution-request-v1.schema.json');

for (const doc of [w0,w1,w2,w3,w4]) assert.ok(String(doc.baselineCommit).startsWith(expectedBaselinePrefix), `${doc.work}: baseline not aligned to requested 812d7c8`);

assert.equal(w0.work, 'RRP-W0');
assert.equal(w0.status, 'AUTHORITY_RECONCILED_FOUNDATION_NO_SECOND_AUTHORITY');
assert.deepEqual(w0.auditedAuthorities.map(x=>x.runtimeCode), requiredAudit);
for (const item of w0.auditedAuthorities) {
  assert.ok(fs.existsSync(item.authorityReference.path), `W0 authority missing: ${item.runtimeCode}`);
  assert.equal(sha256(item.authorityReference.path), item.authorityReference.sha256, `W0 authority drift: ${item.runtimeCode}`);
}
for (const forbidden of ['CALCULATION_RUNTIME','MEANING_AUTHORITY','PROFESSIONAL_JUDGMENT','REPORT_FINALIZATION','REPORT_RELEASE','CUSTOMER_PRESENTATION','PDF_RENDERING','WORKSPACE_LAYOUT']) {
  assert.ok(w0.authorityBoundary.rrpDoesNotOwn.includes(forbidden), `W0 missing boundary ${forbidden}`);
}
assert.equal(w0.reconciliationResult.duplicateRrpAuthorityDetected, false);
assert.equal(w0.reconciliationResult.upstreamAuthorityRewritten, false);
assert.equal(w0.reconciliationResult.historicalFreezeMutated, false);
if (mrm0 && mrm5) {
  assert.ok(mrm0.reservedFutureRuntimeCodes.includes('RRP'), 'W0 must preserve RRP as MRM-S reserved until W27');
  assert.ok(mrm5.reservedFutureRuntimeCodes.includes('RRP'), 'W0 must preserve capability inventory reservation');
  assert.equal(mrm5.capabilities.some(x=>x.runtimeCode==='RRP'), false, 'W0-W14 must not prematurely register RRP capability maturity');
} else {
  assert.ok(currentMrmArchitecture && currentMrmMatrix, 'Current MRM-S successor evidence must exist when legacy reservation files are absent');
  assert.equal((currentMrmArchitecture.runtimeIndex ?? []).some(x=>x.runtimeCode==='RRP'), false, 'RRP must remain absent from MRM-S architectural evidence until W27');
  assert.equal((currentMrmMatrix.rows ?? currentMrmMatrix.capabilities ?? []).some(x=>x.runtimeCode==='RRP'), false, 'RRP must remain absent from current MRM-S maturity matrix until W27');
}

assert.equal(w1.work, 'RRP-W1');
assert.deepEqual(w1.productTypes.map(x=>x.productType), ['RRP-SELF','RRP-PRO']);
const self = w1.productTypes.find(x=>x.productType==='RRP-SELF');
const pro = w1.productTypes.find(x=>x.productType==='RRP-PRO');
assert.equal(self.professionalJudgmentAllowed, false);
assert.equal(pro.professionalJudgmentAllowed, true);
assert.equal(pro.professionalJudgmentAuthority, 'PR');
assert.equal(pro.systemMayImpersonateProfessional, false);
assert.equal(w1.rules.sampleTemplateDoesNotCreateRuntimeAuthority, true);
assert.equal(w1.rules.rrpMayFinalizeReport, false);
assert.equal(w1.rules.rrpMayReleaseReport, false);
assert.equal(w1.rules.rrpMayOwnPresentation, false);

assert.equal(w2.work, 'RRP-W2');
const sourceCodes = w2.sources.map(x=>x.sourceCode);
assert.deepEqual(sourceCodes, ['AST','BZR','NUM','HDR','ZWR','REALITY','CARRIER','TIMELINE','ENVIRONMENT','FINANCIAL','PROFESSIONAL_JUDGMENT']);
for (const source of w2.sources) {
  for (const field of w2.requiredSourceFields) assert.ok(Object.hasOwn(source, field), `W2 ${source.sourceCode} missing ${field}`);
}
assert.equal(w2.sources.find(x=>x.sourceCode==='HDR').reportAllowed, false);
assert.equal(w2.sources.find(x=>x.sourceCode==='ZWR').runtimeAuthority, null);
assert.equal(w2.sources.find(x=>x.sourceCode==='FINANCIAL').reportAllowed, false);
const professionalSource = w2.sources.find(x=>x.sourceCode==='PROFESSIONAL_JUDGMENT');
assert.equal(professionalSource.runtimeAuthority, 'content/runtime/professional-runtime/contracts/professional-authority-boundary-v2.json');
assert.equal(professionalSource.selfServiceAllowed, false);
assert.equal(professionalSource.professionalOnly, true);

assert.equal(w3.work, 'RRP-W3');
assert.deepEqual(w3.availabilityStates, ['AVAILABLE','PARTIAL','PROFESSIONAL_ONLY','UNAVAILABLE']);
const mpaByPlugin = Object.fromEntries(mpa.methods.map(x=>[x.pluginCode,x]));
const expectedMcdStatus = {
  AST:'PRODUCTION_CLIENT_PARTIAL_PROJECTION_WITH_EXPLICIT_UNKNOWN',
  BZR:'PRODUCTION_CLIENT_PARTIAL_PROJECTION_WITH_EXPLICIT_UNKNOWN',
  NUM:'PRODUCTION_CLIENT_COMPLETE_OR_PARTIAL_CANONICAL_PROJECTION'
};
for (const code of ['AST','BZR','NUM']) {
  const method = w3.methods.find(x=>x.methodCode===code);
  assert.ok(method, `W3 missing ${code}`);
  assert.equal(mpaByPlugin[code].dispatchAllowed, true, `${code} upstream MPA dispatch authority drift`);
  assert.ok(mpaByPlugin[code].dispatchableCapabilities.includes('CALCULATION'));
  assert.ok(mpaByPlugin[code].dispatchableCapabilities.includes('PROJECTION'));
  assert.equal(mcd.methodStatus[code], expectedMcdStatus[code], `${code} MCD status drift`);
  assert.equal(method.calculation, 'AVAILABLE');
  assert.equal(method.projection, 'AVAILABLE');
  assert.equal(method.meaning, 'UNAVAILABLE');
  assert.equal(method.availability, 'PARTIAL');
  assert.equal(method.selfServiceAllowed, true);
}
assert.equal(cmr.productionStatus, 'validation_only', 'CMR production status changed: RRP-W9 admission needs re-evaluation');
const hdr = w3.methods.find(x=>x.methodCode==='HDR');
assert.equal(mpaByPlugin.HDR.dispatchAllowed, false);
assert.equal(mcd.methodStatus.HDR, 'VALIDATION_ONLY_NOT_CLIENT_DISPATCHABLE');
assert.equal(hdr.availability, 'UNAVAILABLE');
assert.equal(hdr.selfServiceAllowed, false);
const zwr = w3.methods.find(x=>x.methodCode==='ZWR');
assert.equal(zwr.availability, 'UNAVAILABLE');
assert.equal(zwr.methodVersion, null);
assert.equal(w3.rules.attachmentPresenceDoesNotGrantMethodAvailability, true);
assert.equal(w3.rules.birthDataPresenceDoesNotExecuteMethod, true);
assert.equal(w3.rules.partialDoesNotPermitInventedMeaning, true);

assert.equal(w4.work, 'RRP-W4');
assert.ok(rdgConsent.consentClasses.includes(w4.allowedConsentClass));
assert.ok(rdgPurpose.purposeCodes.includes(w4.allowedPurposeCode));
assert.ok(mcdRequest.required.includes('consentRecordId'));
assert.equal(w4.rules.oneConsentDecisionPerSelectedMethod, true);
assert.equal(w4.rules.birthdayEnteredImpliesAllMethods, false);
assert.equal(w4.rules.singleGlobalMethodConsentAllowed, false);
assert.equal(w4.rules.unselectedMethodMayExecute, false);
assert.equal(w4.rules.withdrawnConsentMayExecute, false);
assert.equal(w4.rules.missingConsentFailsClosed, true);
assert.equal(w4.rules.consentMayBeInferredFromPriorPurpose, false);
assert.equal(w4.rules.rdgRemainsConsentAuthority, true);

console.log('✓ RRP-W0–W4 Authority, Product, Source Availability and Consent passed.');
console.log('  RRP remains a governed composition foundation only; AST/BZR/NUM are PARTIAL (projection without admissible production meaning), HDR/ZWR fail closed, and method execution requires explicit method-scoped consent.');

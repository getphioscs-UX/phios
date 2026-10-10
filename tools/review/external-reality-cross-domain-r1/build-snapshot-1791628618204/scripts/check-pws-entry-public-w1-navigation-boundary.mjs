import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFile(path.join(root, file), 'utf8');
const contract = JSON.parse(await read(
  'docs/pws/architecture/pws-entry-public-navigation-boundary-v1.json'
));
const w0 = JSON.parse(await read(
  'docs/pws/architecture/pws-entry-payment-boundary-v1.json'
));
const retirementSuccessor = JSON.parse(await read(
  'docs/pws/architecture/pws-entry-public-navigation-cx-retirement-successor-v1.json'
));
const redirects = await read('_redirects');
const redirectMap = new Map(redirects.split(/\r?\n/).map(line=>line.trim()).filter(line=>line && !line.startsWith('#')).map(line=>line.split(/\s+/)).filter(parts=>parts.length>=3).map(([source,destination,status])=>[source,{destination,status}]));
const fileExists = async rel => fs.access(path.join(root,rel)).then(()=>true).catch(()=>false);
const successorCandidates = destination => {
  const clean=String(destination||'').split(/[?#]/,1)[0].replace(/^\//,'');
  if(!clean)return ['index.html'];
  if(clean.endsWith('/'))return [`${clean}index.html`];
  if(/\.[A-Za-z0-9]+$/.test(clean))return [clean];
  return [clean,`${clean}.html`,`${clean}/index.html`];
};
async function requireHistoricalOrRedirectedSurface(surface){
  if(await fileExists(surface))return 'PRESENT';
  const route=`/${surface}`;
  const redirect=redirectMap.get(route);
  assert(redirect,`Missing historical PWS surface ${surface} requires an explicit compatibility redirect`);
  assert.equal(redirect.status,'308',`Retired PWS surface ${surface} must use permanent 308 redirect`);
  const resolved=[];
  for(const candidate of successorCandidates(redirect.destination))if(await fileExists(candidate))resolved.push(candidate);
  assert(resolved.length>0,`Retired PWS surface ${surface} redirect target ${redirect.destination} has no existing successor file`);
  const declared=(retirementSuccessor.currentRetirements||[]).find(x=>x.legacySurface===surface);
  assert(declared,`Retired PWS surface ${surface} must be registered in the current CX retirement successor`);
  assert.equal(declared.redirect,`${route} ${redirect.destination} 308`);
  assert(resolved.includes(declared.successorSurface),`Registered successor for ${surface} must resolve from redirect target`);
  return 'REDIRECTED_RETIRED';
}

assert.equal(contract.contractId, 'phi-os.pws-entry.public-navigation-boundary.v1');
assert.equal(contract.contractVersion, '1.0.0');
assert.equal(contract.displayStep, 'PWS-ENTRY-W1');
assert.equal(contract.sequenceKey, 'PWS-ENTRY-PUBLIC-W1');
assert.equal(contract.status, 'public-knowledge-free-navigation-frozen');
assert.equal(
  contract.baseline.commit,
  'd92761e78a81bd9a73bb5c010c8d8813b2eab362'
);

assert.deepEqual(contract.publicRoutes.map(route => route.routeType), [
  'articles',
  'books',
  'thesis',
  'atlas',
  'figures',
  'free-observation',
  'reality-journey-pass-information',
  'professional-service-information',
  'leave-save-return-later'
]);
assert(contract.publicRoutes.every(route => route.individualised === false));

for (const [rule, expected] of Object.entries({
  collectsCompletePersonalHistory: false,
  createsFormalJourney: false,
  createsFormalEvidence: false,
  createsIndividualReading: false,
  createsProfessionalResponsibility: false,
  usesHighCostIndividualProvider: false,
  maySavePublicNavigationPreference: true,
  maySavePersonalHistory: false,
  savedStateMayBecomeFormalRuntimeSilently: false
})) {
  assert.equal(contract.freeObservationBoundary[rule], expected, rule);
}

for (const [rule, expected] of Object.entries({
  specificPaidServiceIsDefault: false,
  paidServiceRankingByPersonalVulnerabilityAllowed: false,
  serviceInformationMayBeOneOption: true,
  nonCommercialExitRequired: true,
  leaveWithoutPurchaseAllowed: true,
  saveAndReturnWithoutPurchaseAllowed: true,
  publishedAvailabilityMustBeHonest: true,
  unpublishedFigureMayBePresentedAsPublished: false
})) {
  assert.equal(contract.routingRules[rule], expected, rule);
}

assert.deepEqual(contract.prohibitedBehaviours, [
  'default-to-specific-paid-service',
  'collect-complete-personal-history',
  'create-professional-responsibility',
  'call-high-cost-individual-provider',
  'present-prediction-as-understanding'
]);
assert.equal(contract.understandingBoundary.predictionPresentedAsUnderstanding, false);
assert.equal(contract.understandingBoundary.symbolicProjectionPresentedAsFact, false);
assert.equal(contract.understandingBoundary.observationLanguageRequired, true);
assert.equal(contract.understandingBoundary.unknownsRemainVisible, true);
assert.equal(contract.understandingBoundary.evidenceBoundaryRequired, true);

assert.equal(w0.status, 'pws-entry-w0-frozen');
assert.equal(w0.acceptance.serviceIsOnlyExit, false);
assert.equal(
  w0.operatingLayers.beforePayment.freeExploration.paidProviderUsed,
  false
);

for (const surfaces of Object.values(contract.surfaceReferences)) {
  for (const surface of surfaces) {
    if (surface === 'reality-demo.html') {
      await assert.rejects(fs.access(path.join(root, surface)), { code: 'ENOENT' });
      assert.match(redirects, /^\/reality-demo \/reality-journey 308$/m);
      continue;
    }
    await requireHistoricalOrRedirectedSurface(surface);
  }
}
assert.equal(retirementSuccessor.status,'CURRENT_CX_RETIREMENT_RECONCILED');
assert.equal(retirementSuccessor.boundaries.historicalPwsContractRewritten,false);
assert.equal(retirementSuccessor.boundaries.missingSurfaceAcceptedWithoutRedirect,false);

assert.equal(contract.namingCompatibility.replacementAllowed, false);
assert.equal(contract.namingCompatibility.uniqueSequenceKeyRequired, true);
assert.equal(contract.acceptance.routeFamiliesCount, 9);
assert.equal(contract.acceptance.prohibitedBehavioursCount, 5);
assert.equal(contract.acceptance.paymentRequiredForPublicKnowledge, false);
assert.equal(contract.acceptance.serviceIsOnlyExit, false);
assert.equal(contract.acceptance.highCostProviderBeforeEntitlement, false);
assert.equal(contract.acceptance.predictionMayReplaceUnderstanding, false);
assert.equal(contract.acceptance.pageChangeInThisStep, false);
assert.equal(contract.acceptance.visualAcceptance.status, 'not-applicable');

const document = await read(
  'docs/pws/architecture/PWS-ENTRY-W1-PUBLIC-KNOWLEDGE-FREE-NAVIGATION-FREEZE.md'
);
for (const phrase of [
  'no specific paid service becomes the default destination',
  'does not collect a complete personal history',
  'Prediction is not understanding',
  'Neither contract replaces the other'
]) {
  assert(document.includes(phrase), `Public W1 document missing: ${phrase}`);
}

const legacyW1 = await read(
  'scripts/check-pws-entry-w1-authorised-data-loader.mjs'
);
assert(
  legacyW1.includes("import './check-pws-entry-public-w1-navigation-boundary.mjs';"),
  'Historical W1 must enforce Public W1 before professional authorisation'
);

console.log('✓ PWS-ENTRY-PUBLIC-W1 knowledge and free navigation boundary frozen.');
console.log('  Nine public route families remain non-individual and non-coercive.');
console.log('  Five prohibited behaviours are closed; service is not the only exit.');

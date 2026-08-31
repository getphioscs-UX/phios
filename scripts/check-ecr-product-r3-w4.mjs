import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildExternalProfileExtractionIr} from '../functions/external-profile/external-profile-extraction-ir.js';
import {buildExternalProfileConfirmationDraft,confirmExternalProfile} from '../functions/external-profile/external-profile-confirmation.js';
import {
  HD_CONFIRMED_CONTEXT_TRANSPORT_VERSION,
  buildConfirmedHumanDesignContextTransport,
  normalizeConfirmedHumanDesignContextProfile
} from '../functions/external-profile/human-design-context-transport.js';
import {buildCrossPerspectiveInputIR} from '../functions/runtime-reading/cross-perspective-input-ir.js';
import {onRequestPost as personalRealityApi} from '../functions/api/customer-personal-reality.js';
import {buildBenchmark} from './smr-benchmark-support.mjs';

const acceptance=JSON.parse(fs.readFileSync('content/embodied-configuration/product-r3/acceptance/ecr-r3-w4-confirmed-human-design-context-transport-v1.json','utf8'));
assert.equal(acceptance.baselineCommit,'90ddc484ffb603a1f3a10e50dc638a0526eac717');
assert.equal(acceptance.status,'ENGINEERING_COMPLETE');
assert.equal(acceptance.transport.schemaVersion,HD_CONFIRMED_CONTEXT_TRANSPORT_VERSION);
assert.equal(acceptance.crossPerspective.xpfCountsTowardMethodAgreement,false);
assert.equal(acceptance.successorBoundary.ecrHumanDesignComparisonComposed,false);
assert.equal(acceptance.successorBoundary.comparisonIrCreated,false);

const pastedText=[
  'Type: Generator',
  'Strategy: Wait to Respond',
  'Authority: Sacral',
  'Profile: 5/1',
  'Definition: Single Definition',
  'Incarnation Cross: Right Angle Cross of W4 Transport',
  'Signature: Satisfaction',
  'Not-Self Theme: Frustration',
  'Channels: 43-23 | 29-46',
  'Defined Centers: Ajna, Throat, G Center, Sacral',
  'Open Centers: Head, Spleen, Root',
  'Design activated Gates: 29.1 46.2',
  'Personality activated Gates: 43.5 23.5'
].join('\n');
const extraction=buildExternalProfileExtractionIr({
  intakeId:'ECR-R3-W4-HD-CONTEXT',
  sources:[{sourceType:'CUSTOMER_PASTED_TEXT',sourceAuthority:'CUSTOMER'}],
  pastedText,
  manualFields:{environment:'Markets',cognition:'Inner Vision'}
});
const draft=buildExternalProfileConfirmationDraft(extraction);
const confirmed=confirmExternalProfile({confirmationDraft:draft,confirmedAt:'2026-08-30T15:20:00.000Z'});
assert.equal(normalizeConfirmedHumanDesignContextProfile(confirmed),confirmed);

const transportOptions={locale:'zh-Hans',intent:'ECR-R3-W4 transport regression',generatedAt:'2026-08-30T15:21:00.000Z'};
const context=buildConfirmedHumanDesignContextTransport(confirmed,transportOptions);
const repeated=buildConfirmedHumanDesignContextTransport(confirmed,transportOptions);
assert.equal(context.schemaVersion,HD_CONFIRMED_CONTEXT_TRANSPORT_VERSION);
assert.equal(context.contextType,'CONFIRMED_HUMAN_DESIGN_EXTERNAL_CONTEXT');
assert.equal(context.authorityClass,'CUSTOMER_SUPPLIED_EXTERNAL_CONTEXT');
assert.equal(context.sourceProfileDigest,confirmed.profileDigest);
assert.equal(context.canonicalHumanDesignChart.sourceProfileDigest,confirmed.profileDigest);
assert.equal(context.canonicalHumanDesignChart.provenance.phiosCalculated,false);
assert.equal(context.canonicalHumanDesignChart.provenance.automaticHumanDesignCalculationUsed,false);
assert.equal(context.readingAvailability.customerPublishable,true);
assert.equal(context.humanDesignReading.publicationDecision.customerPublishable,true);
assert.equal(context.humanDesignReading.boundaries.hdrPublicExecutionUsed,false);
assert.equal(context.humanDesignRealityComposition.boundaries.createsRuntimeEvidence,false);
assert.equal(context.lineage.profileDigest,confirmed.profileDigest);
assert.equal(context.lineage.chartDigest,context.canonicalHumanDesignChart.chartDigest);
assert.equal(context.lineage.readingDigest,context.humanDesignReading.readingDigest);
assert.equal(context.lineage.compositionDigest,context.humanDesignRealityComposition.compositionDigest);
assert.equal(context.transportDigest,repeated.transportDigest);
for(const [key,expected] of Object.entries({
  customerConfirmedProfileRequired:true,
  rawUploadTransported:false,
  unconfirmedExtractionAccepted:false,
  confirmedProfileEchoed:false,
  clientDerivedChartTrusted:false,
  serverRebuiltCanonicalChart:true,
  phiosHumanDesignCalculationAuthorityCreated:false,
  automaticHumanDesignCalculationUsed:false,
  hdrPublicExecutionUsed:false,
  xpfCountsTowardMethodAgreement:false,
  ecrHumanDesignComparisonComposed:false,
  comparisonIrCreated:false,
  currentRealityEvidenceCreated:false,
  persisted:false,
  runtimeMemoryWritten:false
}))assert.equal(context.boundary[key],expected,`W4 transport boundary drift: ${key}`);
assert.equal(Object.prototype.hasOwnProperty.call(context,'confirmedExternalProfile'),false);

const tampered=JSON.parse(JSON.stringify(confirmed));
tampered.records[0].value='Projector';
assert.throws(()=>buildConfirmedHumanDesignContextTransport(tampered,transportOptions),error=>error?.code==='HD_CONTEXT_PROFILE_DIGEST_MISMATCH');
const unconfirmed=JSON.parse(JSON.stringify(confirmed));
unconfirmed.provenance.customerConfirmed=false;
assert.throws(()=>buildConfirmedHumanDesignContextTransport(unconfirmed,transportOptions),error=>error?.code==='HD_CONTEXT_CUSTOMER_CONFIRMATION_REQUIRED');

// The canonical personal route must fail closed without explicit context transport consent,
// reject a digest-tampered profile, and rebuild the accepted external context server-side.
const baseRequest={birthDate:'1989-11-15',birthTime:null,birthTimeUnknown:true,placeRef:null,intent:'W4 route transport',methods:['numeric'],consent:true,locale:'zh-Hans'};
async function callPersonal(extra={}){
  const request=new Request('https://example.test/api/customer-personal-reality',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...baseRequest,...extra})});
  const response=await personalRealityApi({request,env:{}});
  return {response,payload:await response.json()};
}
const noContextConsent=await callPersonal({confirmedExternalProfile:confirmed,externalProfileContextConsent:false});
assert.equal(noContextConsent.response.status,403);
assert.equal(noContextConsent.payload.error,'EXTERNAL_PROFILE_CONTEXT_CONSENT_REQUIRED');
const badContext=await callPersonal({confirmedExternalProfile:tampered,externalProfileContextConsent:true});
assert.equal(badContext.response.status,422);
assert.equal(badContext.payload.error,'HD_CONTEXT_PROFILE_DIGEST_MISMATCH');
const transported=await callPersonal({confirmedExternalProfile:confirmed,externalProfileContextConsent:true});
assert.equal(transported.response.status,200);
assert.equal(transported.payload.ok,true);
assert.equal(transported.payload.privacy.saved,false);
assert.equal(transported.payload.view.humanDesignContext.schemaVersion,HD_CONFIRMED_CONTEXT_TRANSPORT_VERSION);
assert.equal(transported.payload.view.humanDesignContext.sourceProfileDigest,confirmed.profileDigest);
assert.equal(transported.payload.view.humanDesignContext.boundary.serverRebuiltCanonicalChart,true);
assert.equal(transported.payload.view.humanDesignContext.boundary.confirmedProfileEchoed,false);
assert.equal(Object.prototype.hasOwnProperty.call(transported.payload.view,'confirmedExternalProfile'),false);

// XPF may now reach the existing cross-perspective input IR, but it remains context only.
const ast=await buildBenchmark('AST');
const ecr=await buildBenchmark('ECR');
const crossInput=await buildCrossPerspectiveInputIR({
  acceptedMethodReadingEnvelopes:[ast.envelope,ecr.envelope],
  claimCollections:[ast.claims,ecr.claims],
  confirmedXpf:confirmed
});
assert.equal(crossInput.methodInputs.length,2);
assert.deepEqual(crossInput.methodInputs.map(item=>item.methodId),['AST','ECR']);
assert.equal(crossInput.xpfContext.profileDigest,confirmed.profileDigest);
assert.equal(crossInput.xpfContext.countsTowardMethodAgreement,false);
assert.equal(crossInput.boundaries.xpfCountsTowardAgreement,false);
assert.equal(crossInput.methodInputs.some(item=>item.methodId==='XPF'),false);

const client=fs.readFileSync('assets/customer-ui/js/surfaces/personal-reality.js','utf8');
const api=fs.readFileSync('functions/api/customer-personal-reality.js','utf8');
const routeHtml=fs.readFileSync('perspectives/personal/index.html','utf8');
for(const token of [
  'confirmedExternalProfile:externalEnabled?confirmedExternalProfile:null',
  'externalProfileContextConsent:externalEnabled&&Boolean(confirmedExternalProfile)&&form.elements.externalProfileProcessingConsent?.checked===true',
  'EXTERNAL_PROFILE_CONFIRM_FIRST',
  'payload.view?.humanDesignContext',
  'hdContext.canonicalHumanDesignChart',
  'hdContext.humanDesignReading',
  'hdContext.humanDesignRealityComposition'
])assert(client.includes(token),`W4 client transport binding missing: ${token}`);
assert.equal(client.includes('externalProfileIntake:external,confirmedExternalProfile,canonicalHumanDesignChart,humanDesignReading,humanDesignRealityComposition'),false,'Client-local HD result overlay must not remain the main-route authority');
for(const token of [
  "from '../external-profile/human-design-context-transport.js'",
  'EXTERNAL_PROFILE_CONTEXT_CONSENT_REQUIRED',
  'normalizeConfirmedHumanDesignContextProfile(body.confirmedExternalProfile)',
  'buildConfirmedHumanDesignContextTransport(confirmedXpf',
  'confirmedXpf,hdrInternalReading:null'
])assert(api.includes(token),`W4 server transport binding missing: ${token}`);
const viewProjection=api.match(/const view=freeze\(\{([^;]+)\}\);/)?.[1]?.replace(/\s+/g,'')||'';
for(const field of ['crossPerspectiveReading','humanDesignContext']){
  assert(new RegExp(`(?:^|,)${field}(?:,|$)`).test(viewProjection),`W4 server transport view binding missing: ${field}`);
}
assert.equal(api.includes('confirmedXpf:null'),false,'Confirmed Human Design context must no longer be hard-coded out of cross input');
assert(routeHtml.includes('<script type="module" src="/assets/customer-ui/js/surfaces/personal-reality.js"></script>'),'W4 must patch the canonical loaded personal surface, not the retired duplicate');

console.log('✓ ECR-R3-W4 Confirmed Human Design Context Transport passed.');
console.log('  Confirmed XPF is digest-validated, rebuilt server-side, returned as governed humanDesignContext, and admitted to cross input as non-voting context only.');
console.log('  ECR × Human Design semantic comparison remains intentionally unopened for W5/W6.');

import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { createRuntimeReadingReportCandidate, buildRRReportCandidateSubmission } from '../functions/runtime-reading/report-candidate-runtime.js';
const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const B='content/products/runtime-reading';
const hand=j(`${B}/contracts/rrp-rr-handoff-contract-v1.json`);
const acceptance=j(`${B}/acceptance/runtime-reading-product-acceptance-v1.json`);
const freeze=j(`${B}/freeze/runtime-reading-product-freeze-v1.json`);
const rrCandidate=j('content/runtime/customer-report-runtime/contracts/report-candidate-contract-v2.json');
const rrLifecycle=j('content/runtime/customer-report-runtime/registries/report-lifecycle-state-registry-v2.json');
const rrRelease=j('content/runtime/customer-report-runtime/contracts/report-release-contract-v2.json');
const cpr=j('content/professional/canonical-presentation-runtime/contracts/canonical-presentation-contract-v1.json');
const f11=j(`${B}/fixtures/cases/F11/input.json`);

assert.equal(hand.status,'ACTIVE_FINAL_RRP_TO_RR_CANDIDATE_SUBMISSION_BOUNDARY');
assert.equal(hand.work,'RRP-W23');
assert.equal(hand.workFinalizedBy,'RRP-W28.1');
assert.equal(hand.handoffObject,'RuntimeReadingReportCandidate');
assert.equal(hand.submissionObject,'RRReportCandidateSubmission');
for(const f of ['rrpCandidateReference','rrpCandidateDigest','caseReference','customerReference','reportProductCode','productVersion','sectionCount','sourceAuthorityReferences','professionalCompletionRequired','unknownCount','contradictionCount','limitationCount','visualSemanticReferences','submittedAt']) assert.ok(hand.requiredSubmissionFields.includes(f));
assert.equal(hand.rrpTerminalState,'CANDIDATE');
for(const f of ['released','customerVisible','published','downloadReady']) assert.ok(hand.forbiddenRrpStatesAndFields.includes(f));
assert.equal(hand.rules.rrpMayFinalizeReport,false);
assert.equal(hand.rules.rrpMayReleaseReport,false);
assert.equal(hand.rules.customerReferenceIsSubjectReferenceNotAuthorization,true);

assert.equal(rrCandidate.runtimeCode,'RR');
assert.ok(rrLifecycle.states.includes('CANDIDATE'));
assert.ok(rrLifecycle.states.includes('APPROVED'));
assert.ok(rrLifecycle.states.includes('RELEASED'));
assert.equal(rrRelease.runtimeCode,'RR');
assert.equal(cpr.productionStatus,'validation_only');

const cand=await createRuntimeReadingReportCandidate(f11);
const sub1=await buildRRReportCandidateSubmission(cand,'2026-08-22T10:45:00.000Z');
const sub2=await buildRRReportCandidateSubmission(cand,'2026-08-22T10:45:00.000Z');
assert.deepEqual(sub1,sub2);
assert.equal(sub1.rrpCandidateDigest,cand.candidateDigest);
assert.equal(sub1.sectionCount,cand.sections.length);
assert.equal(sub1.unknownCount,cand.unknowns.length);
assert.equal(sub1.contradictionCount,cand.contradictions.length);
assert.equal(sub1.limitationCount,cand.limitations.length);
for(const forbidden of ['released','customerVisible','published','downloadReady','releaseEligibility','workspaceProjection','PDFProjection']) assert.equal(Object.hasOwn(sub1,forbidden),false);

assert.equal(acceptance.status,'ARCHITECTURALLY_ACCEPTED_FIXTURE_VALIDATED_NOT_YET_PILOT_VERIFIED');
assert.deepEqual(acceptance.acceptanceStates,['ARCHITECTURALLY_ACCEPTED','FIXTURE_VALIDATED','NOT_YET_PILOT_VERIFIED']);
assert.equal(acceptance.productionMature,false);
assert.equal(acceptance.pilotVerified,false);
assert.equal(acceptance.scenarios.length,13);
for(const s of ['HDR_CUSTOMER_AUTO_RUN','METHOD_WITHOUT_CONSENT','PROFESSIONAL_JUDGMENT_WITHOUT_SIGNATURE_OR_SOURCE','STATEMENT_WITHOUT_SOURCE','UNKNOWN_SILENTLY_DELETED','RRP_CONTAINS_RELEASE_AUTHORITY','RRP_CONTAINS_PRESENTATION_LAYOUT']) assert.equal(acceptance.scenarios.find(x=>x.scenario===s)?.expectedResult,'BLOCK');
assert.equal(acceptance.scenarios.find(x=>x.scenario==='VALID_RR_HANDOFF')?.expectedResult,'PASS');
assert.equal(acceptance.cprCustBoundary.customerReferenceAllowedAsReportSubject,true);
for(const f of ['customerAuthorization','releaseEligibility','audienceAccess','clientVisibleFiltering','workspaceProjection','PDFProjection']) assert.ok(acceptance.cprCustBoundary.forbiddenRrpFields.includes(f));

assert.equal(freeze.status,'FROZEN_CANONICAL_RRP_REPORT_CANDIDATE_PRODUCT_BOUNDARY');
assert.ok(freeze.canonicalStatement.includes('stops at RR handoff'));
for(const x of freeze.frozenAuthorities){ assert.ok(fs.existsSync(x.path),`missing frozen authority ${x.path}`); assert.equal(x.sha256,sha(x.path),`freeze digest drift ${x.path}`); }
assert.deepEqual(freeze.explicitlyNotFrozen,['CUSTOMER_PAGE','PDF_STYLE','CPR_CUST_PRESENTATION']);
assert.equal(freeze.rules.rrpMayReleaseReport,false);
assert.equal(freeze.rules.rrpMayAuthorizeCustomer,false);
assert.equal(freeze.rules.rrpMayDecideClientVisibility,false);
assert.equal(freeze.rules.rrpMayOwnPdfWorkspaceLayout,false);
assert.equal(freeze.rules.rrRemainsFinalReportAuthority,true);
assert.equal(freeze.rules.cprCustRemainsCustomerPresentationAuthority,true);
assert.equal(freeze.rules.mrmSOwnsMaturityEvidenceInterpretation,true);

const pkg=j('package.json');
assert.equal(pkg.scripts['check:rrp'],'node scripts/check-rrp-w24-canonical-report-payload.mjs && node scripts/check-rrp-w25-visual-reference-binding.mjs && node scripts/check-rrp-w26-product-fixtures.mjs && node scripts/check-rrp-w27-mrm-evidence-binding.mjs && node scripts/check-rrp-w28-rr-handoff-freeze.mjs');

console.log('✓ RRP-W28 Acceptance + RR Handoff + Freeze passed.');
console.log('  RRP terminates at a canonical candidate submission; RR owns report lifecycle/release, CPR owns customer presentation, and no Pilot/production-mature claim is made.');

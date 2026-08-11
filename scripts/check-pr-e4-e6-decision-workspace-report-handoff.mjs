import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  approveProfessionalDecision,
  authorizeProfessionalAccess,
  buildProfessionalCase,
  releaseProfessionalDecision,
  reviewProfessionalDecision,
  signProfessionalDecision,
  validateProfessionalCapabilityBoundary
} from './lib/professional-runtime/pr-v2.mjs';
import { materializeProfessionalCaseVersion, resolveProfessionalEvidencePackage } from './lib/professional-runtime/pr-production-extension-v1.mjs';
import {
  buildPwsProfessionalDecisionHandoff,
  buildRrProfessionalApprovalHandoff,
  buildRrProfessionalSectionRegistryProjection,
  materializeProfessionalDecision
} from './lib/professional-runtime/pr-decision-workspace-report-integration-v1.mjs';
import { assembleReport, approveReportCandidate, buildCanonicalReport, createReportCandidate, reviewReportCandidate } from './lib/customer-report-runtime/report-runtime-v2.mjs';

const root=process.cwd(), base='content/runtime/professional-runtime/extensions/production';
const readText=file=>fs.readFile(path.join(root,file),'utf8'); const read=async file=>JSON.parse(await readText(file));
const norm=s=>s.replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n'); const digestFile=async file=>crypto.createHash('sha256').update(norm(await readText(file)),'utf8').digest('hex');

const foundation=await read(`${base}/freeze/pr-e1-e3-production-foundation-freeze-v1.json`); assert.equal(foundation.status,'FROZEN_POST_FREEZE_PRODUCTION_FOUNDATION_PERSISTENCE_BLOCKED');
const preservation=await read(`${base}/freeze/pr-e1-e3-upstream-preservation-manifest-v1.json`); for(const item of preservation.preserved) assert.equal(await digestFile(item.reference),item.sha256,`PR_E4_E6_PRESERVATION:${item.reference}`);
const contract=await read(`${base}/contracts/pr-decision-materialization-contract-v1.json`); assert.equal(contract.rules.onlyHumanProfessionalMayAuthorObservationJudgmentRecommendation,true); assert.equal(contract.rules.aiMayAuthorJudgment,false);
const pwsContract=await read(`${base}/contracts/pr-pws-workspace-integration-contract-v1.json`); assert.equal(pwsContract.rules.prMutatesPwsWorkspace,false); assert.equal(pwsContract.rules.existingDeliverableRequired,true);
const rrContract=await read(`${base}/contracts/pr-rr-professional-approval-handoff-contract-v1.json`); assert.equal(rrContract.rules.rrMayCreateProfessionalApproval,false); assert.equal(rrContract.rules.reportAssemblyAuthorityRemainsRr,true);
const rrConsumer=await read('content/runtime/customer-report-runtime/extensions/pr-professional-handoff/contracts/rr-pr-professional-decision-consumer-extension-v1.json'); assert.equal(rrConsumer.sourceRegistryMutated,false); assert.equal(rrConsumer.extension.requiredOutcomeKind,'PROFESSIONAL_RECOMMENDATION');

const pwsStates=await read('docs/pws/contracts/pws-canonical-states-v1.json'); const deliverableState=pwsStates.stateFamilies.find(x=>x.objectName==='Deliverable'); assert.deepEqual(deliverableState.allowedStates,['draft','review_required','approved','signed','released','superseded','withdrawn']);
const pwsOps=await read('docs/pws/contracts/pws-canonical-operations-v1.json'); for(const code of ['deliverable.freeze','deliverable.sign','deliverable.release']) assert.ok(pwsOps.operations.some(x=>x.operationCode===code)); assert.equal(pwsOps.operations.some(x=>x.operationCode==='deliverable.create'),false);
const pwsObjects=await read('docs/pws/contracts/pws-canonical-object-registry-v1.json'); assert.equal(pwsObjects.objects.find(x=>x.canonicalName==='Assignment').deprecatedAliases.includes('Case'),true); assert.equal(pwsObjects.objects.find(x=>x.canonicalName==='Deliverable').ownerModule,'runtime/deliverable');

const baseFixture=await read(`${base}/fixtures/pr-production-extension.valid.json`); const fixture=await read(`${base}/fixtures/pr-e4-e6-production-slice.valid.json`);
const caseContext=buildProfessionalCase(baseFixture.case); const access=authorizeProfessionalAccess(caseContext,baseFixture.access); const caseVersion=materializeProfessionalCaseVersion(caseContext,baseFixture.caseVersion); const resolved=resolveProfessionalEvidencePackage(caseVersion,access,baseFixture.evidenceRequest,baseFixture.sourceCatalogue); const capability=validateProfessionalCapabilityBoundary(caseContext,fixture.capability);
const materialization=materializeProfessionalDecision(caseContext,caseVersion,resolved,capability,{...fixture.materialization,caseVersionDigest:caseVersion.versionDigest});
assert.equal(materialization.objectClass,'PR_DECISION_MATERIALIZATION'); assert.equal(materialization.judgment.dataType,'PROFESSIONAL_JUDGMENT_RECORD'); assert.equal(materialization.recommendation.dataType,'OUTCOME_RECORD'); assert.equal(materialization.recommendation.outcomeKind,'PROFESSIONAL_RECOMMENDATION'); assert.equal(materialization.authorityFlags.humanProfessionalAttributable,true); assert.equal(materialization.authorityFlags.aiJudgmentCreated,false); assert.equal(materialization.evidenceProjection.sourcePayloadCopied,false); assert.equal(Object.isFrozen(materialization),true);
assert.throws(()=>materializeProfessionalDecision(caseContext,caseVersion,resolved,capability,{...fixture.materialization,caseVersionDigest:caseVersion.versionDigest,aiAuthoredJudgment:true}),/Automated Professional semantic authoring/);

const draft=materialization.decisionPackage; const reviewed=reviewProfessionalDecision(draft,fixture.review); const approved=approveProfessionalDecision(reviewed,fixture.approval); const signed=signProfessionalDecision(approved,fixture.signature); const released=releaseProfessionalDecision(signed,fixture.release);
assert.deepEqual([draft.state,reviewed.state,approved.state,signed.state,released.state],['DRAFT','REVIEWED','APPROVED','SIGNED','RELEASED']);

const workspaceBase=fixture.workspace; const handoffs=[
  buildPwsProfessionalDecisionHandoff(materialization,draft,{...workspaceBase,currentDeliverableState:'draft'}),
  buildPwsProfessionalDecisionHandoff(materialization,reviewed,{...workspaceBase,currentDeliverableState:'review_required'}),
  buildPwsProfessionalDecisionHandoff(materialization,approved,{...workspaceBase,currentDeliverableState:'approved'}),
  buildPwsProfessionalDecisionHandoff(materialization,signed,{...workspaceBase,currentDeliverableState:'signed'}),
  buildPwsProfessionalDecisionHandoff(materialization,released,{...workspaceBase,currentDeliverableState:'released'})
];
assert.deepEqual(handoffs.map(x=>x.requestedOperation),[null,'deliverable.freeze','deliverable.sign','deliverable.release',null]); assert.ok(handoffs.every(x=>x.executionFlags.workspaceMutatedByPr===false&&x.executionFlags.pwsOperationExecutedByPr===false&&x.executionFlags.pwsPersistencePerformedByPr===false));
assert.throws(()=>buildPwsProfessionalDecisionHandoff(materialization,reviewed,{...workspaceBase,currentDeliverableState:'approved'}),/state mismatch/); assert.throws(()=>buildPwsProfessionalDecisionHandoff(materialization,reviewed,{...workspaceBase,currentDeliverableState:'review_required',deliverableProvisionedExternally:false}),/externally provisioned/);

assert.throws(()=>buildRrProfessionalApprovalHandoff(materialization,approved,{...fixture.rr,signatureRequired:true}),/signature required/);
const rrHandoff=buildRrProfessionalApprovalHandoff(materialization,released,fixture.rr); assert.equal(rrHandoff.handoffState,'READY_FOR_RR_PROFESSIONAL_APPROVAL_GATE'); assert.equal(rrHandoff.professionalApproval.authorityRuntime,'PR'); assert.equal(rrHandoff.professionalApproval.signatureReference,fixture.signature.signatureReference); assert.equal(rrHandoff.authorityFlags.rrCreatesProfessionalApproval,false); assert.deepEqual(rrHandoff.professionalSources.map(x=>x.sectionCode),['PROFESSIONAL_OBSERVATION','PROFESSIONAL_JUDGMENT','RECOMMENDATION']);

const rrBaseRegistry=await read('content/runtime/customer-report-runtime/registries/canonical-report-section-registry-v2.json'); const before=JSON.stringify(rrBaseRegistry); const rrProjected=buildRrProfessionalSectionRegistryProjection(rrBaseRegistry,rrConsumer); assert.equal(JSON.stringify(rrBaseRegistry),before); const recommendation=rrProjected.sections.find(x=>x.sectionCode==='RECOMMENDATION'); assert.ok(recommendation.acceptedDataTypes.includes('OUTCOME_RECORD')); assert.equal(rrProjected.baseRegistryMutated,false);
const reportInput=fixture.rr.report; const dynamicSections=rrHandoff.professionalSources.map(src=>({sectionCode:src.sectionCode,sourceReferences:[src]})); const assembly=assembleReport({...reportInput,sections:[...reportInput.staticSections,...dynamicSections],unavailableSources:[],assembledAt:'2026-08-11T12:00:00Z'},rrProjected); const candidate=createReportCandidate(assembly,{createdAt:'2026-08-11T12:05:00Z'}); const review=reviewReportCandidate(assembly,candidate,{reviewReference:'RR-PR-REVIEW-001',reviewedAt:'2026-08-11T12:10:00Z'}); assert.equal(review.reviewState,'REVIEW_PASSED'); const rrApproval=approveReportCandidate(assembly,candidate,review,{professionalApproval:rrHandoff.professionalApproval}); assert.equal(rrApproval.approvalState,'APPROVED'); assert.equal(rrApproval.authorityRuntime,'PR'); assert.equal(rrApproval.professionalApprovalCreatedByRr,false); const report=buildCanonicalReport(assembly,candidate,review,rrApproval); assert.equal(report.dataType,'REPORT_RECORD'); assert.equal(report.authorityFlags.professionalJudgmentCreated,false);

for (const schemaFile of [
  `${base}/schemas/pr-decision-materialization-v1.schema.json`,
  `${base}/schemas/pr-pws-decision-handoff-v1.schema.json`,
  `${base}/schemas/pr-rr-professional-approval-handoff-v1.schema.json`
]) { const schema=await read(schemaFile); assert.equal(schema.$schema,'https://json-schema.org/draft/2020-12/schema'); assert.equal(schema.additionalProperties,false); assert.ok(Array.isArray(schema.required)&&schema.required.length>0); }

const acceptance=await read(`${base}/acceptance/pr-e4-e6-acceptance-v1.json`); assert.ok(Object.values(acceptance.requiredAssertions).every(Boolean));
const freeze=await read(`${base}/freeze/pr-e4-e6-decision-integration-freeze-v1.json`); assert.deepEqual(freeze.completedExtensions,['PR-E4','PR-E5','PR-E6']); assert.equal(freeze.pwsMutationExecutionActive,false); assert.equal(freeze.rrProfessionalApprovalHandoffActive,true); assert.equal(freeze.finalExtensionFreeze,false); for(const output of freeze.outputs) await fs.access(path.join(root,output));

const pkg=await read('package.json'); assert.equal(pkg.scripts['check:pr-e4-e6'],'node scripts/check-pr-e4-e6-decision-workspace-report-handoff.mjs'); assert.equal(pkg.scripts['check:pr-decision-integration'],'npm run check:pr-e4-e6'); assert.equal(pkg.scripts['check:pr-production'],'npm run check:pr-production-foundation'); assert.equal(pkg.scripts['check:pr-production-e4-e6'],'npm run check:pr-production && npm run check:pr-decision-integration'); const cmds=String(pkg.scripts.postcheck||'').split('&&').map(x=>x.trim()).filter(Boolean); const basePrIndex=cmds.indexOf('npm run check:pr'); const foundationIndex=cmds.indexOf('npm run check:pr-production-foundation'); const integrationIndex=cmds.indexOf('npm run check:pr-decision-integration'); assert.ok(basePrIndex>=0&&foundationIndex>basePrIndex&&integrationIndex>foundationIndex); assert.equal(cmds.filter(x=>x==='npm run check:pr-production-foundation').length,1); assert.equal(cmds.filter(x=>x==='npm run check:pr-decision-integration').length,1);

console.log('✓ PR-E4-E6 Professional decision, PWS workspace and RR approval handoff passed.');
console.log('✓ Human-attributable Observation → Judgment → Recommendation → Decision Package materialization is active and case/evidence/capability bound.');
console.log('✓ PWS receives canonical state/operation intents only; PR creates no Assignment/Deliverable, executes no PWS operation and performs no workspace persistence.');
console.log('✓ RR consumes PR approval/signature and Professional Observation/Judgment/Recommendation by reference; RR creates no Professional approval or judgment.');
console.log('✓ Frozen RR v2 section registry remains unchanged; PR OUTCOME_RECORD Recommendation is enabled only by a versioned consumer successor projection.');

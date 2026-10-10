import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  authorizeProfessionalAccess,
  buildProfessionalCase,
  buildProfessionalEvidencePackage,
  validateProfessionalCapabilityBoundary,
  createProfessionalObservation,
  createProfessionalJudgment,
  createProfessionalRecommendation,
  createProfessionalDecisionPackage,
  reviewProfessionalDecision,
  approveProfessionalDecision,
  signProfessionalDecision,
  releaseProfessionalDecision,
  validateProfessionalRuntimeProductionSlice
} from './lib/professional-runtime/pr-v2.mjs';

const root=process.cwd();
const base='content/runtime/professional-runtime';
const readText=file=>fs.readFile(path.join(root,file),'utf8');
const read=async file=>JSON.parse(await readText(file));
const digest=async file=>crypto.createHash('sha256')
  .update((await readText(file)).replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n'),'utf8').digest('hex');

const baseline='9cd28c6ad24ebffeeb553cfe65fb572ef562d3ed';

const migration=await read('content/governance/canonical-master-work/registries/canonical-master-work-migration-registry-v1.json');
const migrationEntry=migration.entries.find(entry=>entry.legacyWorkCode==='PR-W0-W10');
assert.ok(migrationEntry,'PR_MIGRATION_ENTRY_MISSING');
assert.deepEqual({
  legacyRuntime:migrationEntry.legacyRuntime,
  canonicalWorkCode:migrationEntry.canonicalWorkCode,
  canonicalRuntime:migrationEntry.canonicalRuntime,
  migrationStatus:migrationEntry.migrationStatus
},{
  legacyRuntime:'PR_V1',canonicalWorkCode:'PR-W0-W13',canonicalRuntime:'PR',migrationStatus:'UPGRADED'
});
assert.equal(migrationEntry.migrationReason,'Professional authority preserved with data/readout/capability boundaries.');

const master=await read('content/governance/canonical-master-work/registries/canonical-master-work-registry-v1.json');
const works=master.entries.filter(entry=>/^PR-W(?:[0-9]|1[0-3])$/.test(entry.workCode));
assert.deepEqual(works.map(entry=>entry.workCode),Array.from({length:14},(_,i)=>`PR-W${i}`));
assert.deepEqual(works.map(entry=>entry.executionOrder),Array.from({length:14},(_,i)=>192+i));
assert.ok(works.every(entry=>entry.runtimeCode==='PR'&&entry.status==='PLANNED'));

const audit=await read(`${base}/audits/pr-w0-professional-reconciliation-v2.json`);
assert.equal(audit.status,'reconciled');
assert.equal(audit.baselineCommit,baseline);
assert.equal(audit.caseIdentityDecision.newPwsCaseObjectCreated,false);
assert.equal(audit.authorityBoundary.prDoesNotOwn.includes('Report assembly'),true);

const rdg=await read('content/governance/reality-data-governance/registries/canonical-data-contract-registry-v1.json');
const pr=rdg.entries.find(entry=>entry.runtimeCode==='PR');
assert.ok(pr,'RDG_PR_ENTRY_MISSING');
assert.deepEqual(pr.producedDataTypes,['PROFESSIONAL_JUDGMENT_RECORD','OUTCOME_RECORD']);
assert.deepEqual(pr.writeAuthority.dataTypes,['PROFESSIONAL_JUDGMENT_RECORD','OUTCOME_RECORD']);
assert.equal(pr.permissions.professionalDataWrite,'ALLOW_PR_AUTHORITY');

const rdgSuccessor=await read('content/governance/reality-data-governance/extensions/pr-v2/registries/pr-v2-data-contract-successor-v1.json');
assert.equal(rdgSuccessor.status,'ACTIVE_SUCCESSOR_EXTENSION');
assert.equal(rdgSuccessor.baselineCommit,baseline);
assert.equal(rdgSuccessor.preservedLegacyAuthority.mutated,false);
assert.deepEqual(rdgSuccessor.preservedLegacyAuthority.writeAuthority,['PROFESSIONAL_JUDGMENT_RECORD','OUTCOME_RECORD']);
for (const type of ['REALITY_INPUT_RECORD','REALITY_READOUT_RECORD','CAPABILITY_EVIDENCE_RECORD','NAVIGATION_RECORD','OUTCOME_RECORD']) {
  assert.ok(rdgSuccessor.addedReadOnlyDataTypes.includes(type),`PR_RDG_READ_EXTENSION_MISSING:${type}`);
}
assert.equal(rdgSuccessor.permissions.metricWrite,'DENY');
assert.equal(rdgSuccessor.permissions.readoutWrite,'DENY');
assert.equal(rdgSuccessor.permissions.reportWrite,'DENY');

const pwsObjects=await read('docs/pws/contracts/pws-canonical-object-registry-v1.json');
assert.equal(pwsObjects.objects.some(item=>item.canonicalName==='Case'),false);
for (const [name,owner] of [
  ['Professional','runtime/professional'],
  ['Capability','runtime/capability'],
  ['Credential','runtime/credential'],
  ['Assignment','runtime/assignment'],
  ['Signature','runtime/deliverable/signature']
]) {
  assert.equal(pwsObjects.objects.find(item=>item.canonicalName===name)?.ownerModule,owner,`PWS_${name}_OWNER`);
}
assert.ok(pwsObjects.objects.find(item=>item.canonicalName==='Assignment').deprecatedAliases.includes('Case'));

const states=await read('docs/pws/contracts/pws-canonical-states-v1.json');
const deliverable=states.stateFamilies.find(item=>item.objectName==='Deliverable');
assert.ok(deliverable);
assert.deepEqual(deliverable.allowedStates,['draft','review_required','approved','signed','released','superseded','withdrawn']);

const alrCapability=await read('content/academy/academy-learning-runtime/registries/capability-registry-v1.json');
const formation=alrCapability.capabilities.find(item=>item.capabilityCode==='ALR-CAP-BOUNDED-PROFESSIONAL-FORMATION');
assert.ok(formation);
assert.ok(formation.boundaries.includes('NOT_CREDENTIAL'));
assert.ok(formation.boundaries.includes('NOT_PROFESSIONAL_READINESS_DECISION'));

const preservation=await read(`${base}/freeze/pr-v2-legacy-upstream-preservation-manifest-v1.json`);
assert.equal(preservation.baselineCommit,baseline);
for (const item of preservation.preserved) {
  assert.equal(await digest(item.reference),item.sha256,`PR_PRESERVATION_DIGEST:${item.reference}`);
}

const authority=await read(`${base}/contracts/professional-authority-boundary-v2.json`);
assert.equal(authority.rules.rawDataIsEvidence,false);
assert.equal(authority.rules.metricIsJudgment,false);
assert.equal(authority.rules.readoutIsJudgment,false);
assert.equal(authority.rules.onlyPrW4MayCreateProfessionalJudgment,true);

const lifecycle=await read(`${base}/registries/professional-lifecycle-state-registry-v2.json`);
assert.deepEqual(lifecycle.states.map(item=>item.stateCode),['DRAFT','REVIEWED','APPROVED','SIGNED','RELEASED']);
assert.equal(lifecycle.skipAllowed,false);

const fixture=await read(`${base}/fixtures/pr-v2-production-slice.valid.json`);
const caseContext=buildProfessionalCase(fixture.case);
assert.equal(caseContext.objectClass,'PR_CASE_CONTEXT');
assert.equal(caseContext.pwsCaseObjectCreated,false);

const access=authorizeProfessionalAccess(caseContext,{
  professionalId:'PRO-001',customerId:'CUSTOMER-001',purpose:'PROFESSIONAL_SERVICE',scopes:['runtime_review']
});
assert.equal(access.decision,'ALLOW_MINIMUM_NECESSARY_PROFESSIONAL_ACCESS');
assert.equal(access.purposeBound,true);
assert.equal(access.consentBound,true);
assert.equal(access.scopeBound,true);

const capability=validateProfessionalCapabilityBoundary(caseContext,{
  capabilityDecision:fixture.capability,
  credentialDecision:fixture.credential,
  alrCapabilityReferences:['ALR-CAP-BOUNDED-PROFESSIONAL-FORMATION']
});
assert.equal(capability.decision,'PROFESSIONAL_CAPABILITY_BOUNDARY_SATISFIED');
assert.equal(capability.alrPermissionEffect,'NONE');
assert.equal(capability.accountRolePermissionEffect,'NONE');

const evidence=buildProfessionalEvidencePackage(fixture.evidencePackage);
assert.equal(evidence.rawDataCountsAsEvidence,false);
assert.equal(evidence.metricCountsAsJudgment,false);
assert.equal(evidence.readoutCountsAsJudgment,false);

const observation=createProfessionalObservation(caseContext,evidence,{
  observationReference:'PR-OBS-001',
  observation:fixture.texts.observation,
  createdAt:'2026-08-11T06:01:00Z'
});
assert.equal(observation.dataType,'OUTCOME_RECORD');
assert.equal(observation.outcomeKind,'PROFESSIONAL_OBSERVATION');
assert.equal(observation.systemReadoutModified,false);

const judgment=createProfessionalJudgment(caseContext,evidence,observation,capability,{
  judgmentReference:'PR-JUDGMENT-001',
  judgment:fixture.texts.judgment,
  scope:['runtime_review'],
  limitations:['Bounded to the supplied evidence package and current service scope.'],
  createdAt:'2026-08-11T06:02:00Z'
});
assert.equal(judgment.dataType,'PROFESSIONAL_JUDGMENT_RECORD');
assert.equal(judgment.authoredBy.type,'HUMAN_PROFESSIONAL');
assert.equal(judgment.readoutCreated,false);
assert.equal(judgment.metricCreated,false);

const recommendation=createProfessionalRecommendation(caseContext,evidence,judgment,capability,{
  recommendationReference:'PR-REC-001',
  recommendation:fixture.texts.recommendation,
  scope:['runtime_review'],
  limitations:['Does not replace customer decision authority.'],
  alternativeReferences:['ALT-001'],
  createdAt:'2026-08-11T06:03:00Z'
});
assert.equal(recommendation.outcomeKind,'PROFESSIONAL_RECOMMENDATION');
assert.equal(recommendation.newJudgmentCreated,false);
assert.equal(recommendation.metricCreated,false);

const draft=createProfessionalDecisionPackage(caseContext,observation,judgment,recommendation,{
  packageReference:'PR-DECISION-001',
  version:'1.0.0',
  unknown:[{reference:'READOUT-UNKNOWN-001',authority:'RRE'}],
  alternative:[{reference:'ALT-001',description:'Alternative remains available.'}],
  boundary:['Professional Judgment is bounded to service scope and current evidence.'],
  createdAt:'2026-08-11T06:04:00Z'
});
assert.equal(draft.state,'DRAFT');

const reviewed=reviewProfessionalDecision(draft,{
  reviewReference:'PR-REVIEW-001',
  reviewerProfessionalId:'PRO-002',
  role:'SECOND_PROFESSIONAL',
  outcome:'PASS_WITH_LIMITATIONS',
  limitations:['Independent review confirms bounded scope only.'],
  reviewedAt:'2026-08-11T06:05:00Z'
});
assert.equal(reviewed.state,'REVIEWED');
assert.equal(reviewed.review.independent,true);

const approved=approveProfessionalDecision(reviewed,{
  approvalReference:'PR-APPROVAL-001',
  approverProfessionalId:'PRO-001',
  approvedAt:'2026-08-11T06:06:00Z'
});
assert.equal(approved.state,'APPROVED');

const signed=signProfessionalDecision(approved,{
  signatureReference:'PWS-SIGNATURE-001',
  signerProfessionalId:'PRO-001',
  signedAt:'2026-08-11T06:07:00Z'
});
assert.equal(signed.state,'SIGNED');

const released=releaseProfessionalDecision(signed,{
  releaseReference:'PR-RELEASE-001',
  releasedBy:'PRO-001',
  releasedAt:'2026-08-11T06:08:00Z'
});
assert.equal(released.state,'RELEASED');
assert.equal(released.release.reportCreated,false);
assert.equal(released.auditTrail.length,5);
for (let i=1;i<released.auditTrail.length;i++) {
  assert.equal(released.auditTrail[i].previousEventDigest,released.auditTrail[i-1].eventDigest);
}
assert.equal(validateProfessionalRuntimeProductionSlice({
  case:caseContext,evidence,observation,judgment,recommendation,reviewed,approved,signed,released
}),'VALID_PR_V2_PRODUCTION_SLICE');

assert.throws(()=>authorizeProfessionalAccess(caseContext,{
  professionalId:'PRO-001',customerId:'CUSTOMER-001',purpose:'PROFESSIONAL_SERVICE',scopes:['runtime_review'],
  accountRoleUsedAsAuthority:true
}),/Account role/);
assert.throws(()=>validateProfessionalCapabilityBoundary(caseContext,{
  capabilityDecision:{...fixture.capability,capabilityAuthority:'ALR'},
  credentialDecision:fixture.credential
}),/runtime\/capability/);
assert.throws(()=>createProfessionalJudgment(caseContext,evidence,observation,capability,{
  judgmentReference:'BAD',judgment:'bad',scope:['runtime_review'],limitations:['x'],
  aiAttribution:true,createdAt:'2026-08-11T06:02:00Z'
}),/human Professional attributable/);
assert.throws(()=>approveProfessionalDecision(draft,{
  approvalReference:'SKIP',approverProfessionalId:'PRO-001',approvedAt:'2026-08-11T06:06:00Z'
}),/REVIEWED before APPROVED/);
assert.throws(()=>reviewProfessionalDecision(draft,{
  reviewReference:'SELF-INDEPENDENT',reviewerProfessionalId:'PRO-001',role:'PEER_REVIEW',outcome:'PASS',
  reviewedAt:'2026-08-11T06:05:00Z'
}),/must differ/);

const freeze=await read(`${base}/freeze/pr-v2-freeze-v1.json`);
assert.equal(freeze.status,'PR-v2.0.0-FROZEN');
assert.equal(freeze.scope,'PR-W0-W13');
assert.deepEqual(freeze.completedWorks,Array.from({length:14},(_,i)=>`PR-W${i}`));
assert.equal(freeze.nonAuthority.prCreatesReport,false);
assert.equal(freeze.nonAuthority.prCreatesReadout,false);
assert.equal(freeze.nonAuthority.prCreatesMetric,false);

const pkg=await read('package.json');
assert.equal(pkg.scripts['check:pr-w0-w13'],'node scripts/check-pr-w0-w13-professional-runtime-v2.mjs');
assert.equal(pkg.scripts['check:pr'],'npm run check:pr-w0-w13');
assert.equal(pkg.scripts['check:pr-v2'],'npm run check:pr');
const postcheckCommands=pkg.scripts.postcheck.split('&&').map(command=>command.trim()).filter(Boolean);
const rreIndex=postcheckCommands.indexOf('npm run check:rre');
const rrIndex=postcheckCommands.indexOf('npm run check:rr');
const prIndex=postcheckCommands.indexOf('npm run check:pr');
assert.ok(rreIndex>=0&&rrIndex===rreIndex+1&&prIndex===rrIndex+1,'POSTCHECK_RRE_RR_PR_ORDER');

console.log('✓ PR v2 W0-W13 Professional Runtime passed.');
console.log('✓ Canonical PR Case Context binds active PWS Assignment without creating a new PWS Case object.');
console.log('✓ Raw Data, Reality, Readout, Metrics, Meaning, Knowledge, Journey and Unknown remain source-labelled and authority-separated.');
console.log('✓ Only human-attributable PR-W4 creates PROFESSIONAL_JUDGMENT_RECORD; Observation/Recommendation/Review/Approval/Signature/Audit/Release remain bounded OUTCOME_RECORD subtypes.');
console.log('✓ Draft → Reviewed → Approved → Signed → Released is non-skippable; independent review, RDG access and Capability/Credential boundaries fail closed.');
console.log('✓ PR v2 is frozen without granting authority to account roles, ALR learning capability, RR, RRE, JR or Metric creation.');

import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';

const ROOT='content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const authority=read(`${ROOT}/source/HD-PRO-R3-W2-source-school-authority-registry-v1.json`);
const admission=read(`${ROOT}/source/HD-PRO-R3-W2A-user-authored-source-admission-v1.json`);
const units=read(`${ROOT}/source/HD-PRO-R3-W2A-user-authored-source-units-v1.json`);
const drive=read(`${ROOT}/source/HD-PRO-R3-W2B-google-drive-source-census-v1.json`);
const reconciliation=read(`${ROOT}/source/HD-PRO-R3-W2C-source-school-reconciliation-v1.json`);
const ownerMap=read(`${ROOT}/audit/HD-PRO-R3-W0-current-owner-map.json`);
const r2Cutover=read('content/customer-experience-rebuild/hd-pro-r2/hd-w10-production-cutover-v1.json');
const semanticRegistry='knowledge/external-readers/human-design/registry/entries.json';
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

assert.equal(authority.schemaVersion,'PHI-OS-HD-PRO-R3-W2-SOURCE-SCHOOL-AUTHORITY-REGISTRY-v1.0.0');
assert.equal(authority.baselineCommit,'791e1a130750affa13831f248e89a8b921e54743');
assert.equal(authority.status,'SOURCE_SCHOOL_AUTHORITY_REGISTRY_ACTIVE_R3_SHADOW');
assert.equal(authority.publication.r2State,'CUSTOMER_PUBLISHED');
assert.equal(authority.publication.r3State,'SHADOW_CANDIDATE');
assert.equal(authority.publication.r3CustomerCutoverAllowed,false);
assert.equal(authority.hardBoundaries.phiosHumanDesignBirthCalculationAuthority,false);
assert.equal(authority.hardBoundaries.externalConfirmedChartAuthority,true);
assert.equal(authority.hardBoundaries.sourceAdmissionEqualsSemanticAdmission,false);
assert.equal(authority.hardBoundaries.aiMayFillSourceGap,false);
assert.equal(authority.reusedOwners.semanticRegistry,semanticRegistry);
const frozenSemanticOwner=ownerMap.owners.semanticRegistryOwner;
const currentSemanticSha=sha(semanticRegistry);
if(currentSemanticSha!==frozenSemanticOwner.sha256){
  const ownerReconciliation=read(`${ROOT}/audit/HD-PRO-R3-W4-current-owner-reconciliation-v1.json`);
  const semanticSuccessor=ownerReconciliation.reconciledOwners.find(x=>x.role==='semanticRegistryOwner');
  assert(semanticSuccessor,'later semantic-registry drift requires an explicit same-owner successor reconciliation');
  assert.equal(semanticSuccessor.path,semanticRegistry,'semantic successor must keep the canonical W2 registry path');
  assert.equal(semanticSuccessor.w0FrozenSha256,frozenSemanticOwner.sha256,'semantic successor must preserve the W0 digest as lineage');
  assert.equal(semanticSuccessor.currentMainSha256,currentSemanticSha,'semantic successor digest must match the current canonical registry');
  assert.equal(semanticSuccessor.ownerPathChanged,false,'W4 must extend the existing semantic registry rather than create a second owner');
}else assert.equal(frozenSemanticOwner.path,semanticRegistry,'W2 must reuse the canonical semantic registry owner');

assert.equal(admission.status,'USER_AUTHORED_PRIMARY_SOURCES_ADMITTED_AS_SOURCE_NOT_SEMANTIC_TRUTH');
assert.equal(admission.admittedSources.length,2);
assert.equal(admission.admittedSources[0].sourceId,'HD-UA-WORKBOOK-001');
assert.equal(admission.admittedSources[0].admissionStatus,'SOURCE_ADMITTED');
assert.equal(admission.admittedSources[1].sourceId,'HD-UA-REPORT-001');
assert.equal(admission.admittedSources[1].pageCount,58);
assert.equal(admission.sourceUnitAdmission.total,222);
assert.equal(admission.sourceUnitAdmission.sourceAdmitted,222);
assert.equal(admission.sourceUnitAdmission.semanticAdmitted,0);
assert.equal(admission.sourceUnitAdmission.compositionSupported,0);
assert.equal(admission.sourceUnitAdmission.customerPublishableR3,0);
assert(admission.sourceUnitAdmission.boundaryRewriteRequired>0,'sensitive legacy source claims were not routed to boundary rewrite');

assert.equal(units.status,'USER_AUTHORED_SOURCE_UNITS_EXTRACTED_AND_SOURCE_ADMITTED_R3_SHADOW');
assert.equal(units.counts.total,222);
const expectedCounts={TYPE:5,AUTHORITY:6,PROFILE:12,DEFINITION:4,CENTER:27,CHANNEL:36,GATE_CHANNEL_RELATION:72,DETERMINATION:12,ENVIRONMENT:12,COGNITION:6,SENSE:6,PERSPECTIVE:6,MOTIVATION:6,TRAJECTORY:12};
assert.deepEqual(units.counts.byCategory,expectedCounts);
assert.equal(new Set(units.sourceUnits.map(x=>x.sourceUnitId)).size,222);
for(const unit of units.sourceUnits){
  assert.equal(unit.source.sourceId,'HD-UA-WORKBOOK-001');
  assert.equal(unit.source.provenanceClass,'USER_AUTHORED_PRIMARY');
  assert.equal(unit.sourceAdmissionStatus,'SOURCE_ADMITTED');
  assert.equal(unit.semanticAdmissionStatus,'SEMANTIC_REVIEW_PENDING');
  assert.equal(unit.compositionSupported,false);
  assert.equal(unit.customerPublishableR3,false);
  assert(unit.source.coordinates.length>=1,`${unit.sourceUnitId} missing source coordinates`);
  assert(/^[a-f0-9]{64}$/.test(unit.sourceTextSha256),`${unit.sourceUnitId} missing source digest`);
}
assert.equal(units.sourceUnits.filter(x=>x.category==='CHANNEL').length,36);
const gateContexts=units.sourceUnits.filter(x=>x.category==='GATE_CHANNEL_RELATION');
assert.equal(gateContexts.length,72);
assert.equal(new Set(gateContexts.map(x=>x.metadata.gate)).size,64,'Gate relation source coverage must reach all 64 identities');

assert.equal(drive.status,'DRIVE_SOURCE_CENSUS_REGISTERED_METADATA_ONLY');
assert.equal(drive.rootFolder.id,'11BtItRfTYZ41Q4nnN_x1PFqQPmzMXISR');
assert.equal(drive.rootFolder.directChildrenObserved,30);
assert.equal(drive.directChildren.length,30);
assert.equal(drive.censusBoundary.drivePresenceDoesNotEstablishAuthorship,true);
assert.equal(drive.censusBoundary.drivePresenceDoesNotEstablishLicense,true);
assert.equal(drive.censusBoundary.thirdPartyLongFormTextImportedIntoRepo,false);
assert(drive.clientReportCollection.minimumObservedExampleCount>=20);
for(const item of drive.directChildren.filter(x=>['SUPPORTING_REFERENCE','SPECIALIST_SCOPE'].includes(x.censusClass))){
  assert.equal(item.sourceAdmissionStatus,'SOURCE_PENDING');
  assert.equal(item.licenseStatus,'UNKNOWN_NOT_ADMITTED_FOR_DIRECT_REPRODUCTION');
}

assert.equal(reconciliation.status,'SOURCE_RECONCILIATION_COMPLETE_SEMANTIC_ADMISSION_STILL_PENDING');
const byScope=Object.fromEntries(reconciliation.reconciliation.map(x=>[x.scope,x]));
assert.equal(byScope.TYPE.userSourceUnits,5);
assert.equal(byScope.AUTHORITY.canonicalExpected,8);
assert.equal(byScope.AUTHORITY.userSourceFamilies,6);
assert.equal(byScope.AUTHORITY.status,'SCHOOL_VARIANT');
assert.equal(byScope.PROFILE.userSourceUnits,12);
assert.equal(byScope.DEFINITION.userSourceUnits,4);
assert(byScope.DEFINITION.pending.includes('NO_DEFINITION'));
assert.equal(byScope.CENTER.userSourceUnits,27);
assert.match(byScope.CENTER.structuralGap,/UNDEFINED_VS_COMPLETELY_OPEN/);
assert.equal(byScope.CHANNEL.userSourceUnits,36);
assert.equal(byScope.GATE.userGateChannelRelationUnits,72);
assert.equal(byScope.VARIABLE_PHS.coverage.SENSE,6);
assert.equal(byScope.BG5.status,'SCHOOL_VARIANT');
assert.equal(byScope.DREAMRAVE.status,'SCHOOL_VARIANT');
assert.equal(byScope.GENE_KEYS.status,'SCHOOL_VARIANT');
assert.equal(reconciliation.publicationBoundary.sourceAdmittedUnitCount,222);
assert.equal(reconciliation.publicationBoundary.semanticAdmittedClaimCount,0);
assert.equal(reconciliation.publicationBoundary.r3CustomerPublishableClaimCount,0);

assert.equal(r2Cutover.cutover.customerInterpretiveReading,'CUSTOMER_PUBLISHED');
assert.equal(r2Cutover.cutover.realityComposition,'CUSTOMER_PUBLISHED');

console.log('✓ HD-PRO-R3-W2 / W2A / W2B / W2C source authority passed.');
console.log('  222 user-authored value-specific source units admitted as SOURCE only; semantic/composition/customer publication remain blocked.');

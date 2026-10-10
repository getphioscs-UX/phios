import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {buildPersonalEvidencePublicationProjection} from '../functions/profile/personal-evidence-publication-projection.js';
import {buildPersonalEvidenceRealityHandoff,buildPersonalEvidenceDomainHandoffs} from '../functions/profile/personal-evidence-handoffs.js';
import {buildCurrentRealityBundle} from '../functions/reality-orchestration/reality-orchestrator.js';

const root=process.cwd();
const readJson=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

const w6=readJson('content/profile/successors/personal-evidence-r1/personal-evidence-dossier-publication-v1.json');
const w7=readJson('content/profile/successors/personal-evidence-r1/personal-evidence-reality-handoff-v1.json');
const w8=readJson('content/profile/successors/personal-evidence-r1/personal-evidence-domain-handoff-v1.json');
const profileHtml=read('perspectives/profile/index.html');
const profileClient=read('assets/customer-ui/js/surfaces/profile-progressive.js');
const handoffApi=read('functions/api/customer-reality-handoff.js');

assert.equal(w6.status,'PUBLICATION_PROJECTION_ACTIVE_RR_HANDOFF_GATED');
assert.equal(w6.reportIdentity.reportClass,'EVIDENCE_DOSSIER_NOT_METHOD_REPORT');
assert.equal(w6.rules.liveLlmWritingRequired,false);
assert.equal(w6.rules.profilePprMayEnterRrEvidenceSectionDirectly,false);
assert.equal(w7.rules.explicitEvidenceSelectionRequired,true);
assert.equal(w7.rules.explicitConsentRequired,true);
assert.equal(w7.rules.automaticPersistence,false);
assert.equal(w8.rules.handoffDoesNotMutateTargetRuntime,true);
assert.equal(w8.handoffs.financial.rules.includes('NOT_FAR_INPUT_DIRECTLY'),true);

const profileView={
  schemaVersion:'PHI-OS-PROGRESSIVE-PROFILE-VIEW-v1',
  profileViewId:'PRF-VIEW-TEST',
  participantRef:'PERSON-A',
  asOfDate:'2026-10-04',
  semanticDigest:'a'.repeat(64),
  signalCards:[
    {signalRef:'SIG-WORK',sourceClass:'STANDARDIZED_SELF_REPORT',sourceLabel:'Career interests',providerFamily:'O_NET',domainId:'RIASEC::SOCIAL',facetId:null,assessmentDate:'2026-10-04',freshness:{state:'RECENT_RESULT'}},
    {signalRef:'SIG-FIN',sourceClass:'CUSTOMER_SELF_REPORT',sourceLabel:'Financial capability',providerFamily:'PHI',domainId:'FINANCIAL_CAPABILITY',facetId:'PLANNING',assessmentDate:'2026-10-04',freshness:{state:'RECENT_RESULT'}},
    {signalRef:'SIG-REL',sourceClass:'CUSTOMER_SELF_REPORT',sourceLabel:'Relationship evidence',providerFamily:'PHI',domainId:'EMOTIONAL_SOCIAL_REGULATION',facetId:'RELATIONSHIP_REGULATION',assessmentDate:'2026-10-04',freshness:{state:'RECENT_RESULT'}}
  ],
  boundaries:['No master score.']
};
const pfig=id=>({pfig:id,state:'READY',evidenceRefs:id==='PFIG-006'?['SIG-WORK']:id==='PFIG-007'?['SIG-REL']:id==='PFIG-008'?['SIG-FIN']:[],data:{},customerLabel:{en:id,'zh-Hans':id}});
const visualProjection={participantRef:'PERSON-A',asOfDate:'2026-10-04',figures:['PFIG-001','PFIG-002','PFIG-003','PFIG-004','PFIG-005','PFIG-006','PFIG-007','PFIG-008','PFIG-009'].map(pfig)};

const publication=buildPersonalEvidencePublicationProjection({profileView,visualProjection,locale:'en',consentReferences:['PRF-CONSENT-TEST']});
assert.equal(publication.reportClass,'EVIDENCE_DOSSIER_NOT_METHOD_REPORT');
assert.equal(publication.presentationPlan.staticPages.length,5);
assert.equal(publication.presentationPlan.sections.length,10);
assert.equal(publication.rrEligibility.publicationProjectionReady,true);
assert.equal(publication.rrEligibility.rrHandoffReady,true);
assert.equal(publication.rrEligibility.rrHandoffBlock,null);
assert.equal(publication.governance.rawSectionContentIncluded,false);

const handoff=buildPersonalEvidenceRealityHandoff({profileView,selectedEvidenceRefs:['SIG-FIN']});
assert.deepEqual(handoff.selectedEvidenceRefs,['SIG-FIN']);
assert.equal(handoff.customerSelected,true);
assert.equal(handoff.automaticPersistence,false);
assert.equal(handoff.evidenceReferences[0].realityFact,false);
assert.throws(()=>buildPersonalEvidenceRealityHandoff({profileView,selectedEvidenceRefs:[]}),/EXPLICIT_SELECTION_REQUIRED/);

const bundle=await buildCurrentRealityBundle({sourceType:'PERSONAL_RUNTIME',source:{evidenceReferences:handoff.evidenceReferences,reportedContext:[],projectionReferences:[],unknown:[]},locale:'en'});
assert.equal(bundle.lanes.externalEvidence.length,1);
assert.equal(bundle.lanes.externalEvidence[0].authorityClass,'PERSON_EVIDENCE_REFERENCE');
assert.equal(bundle.lanes.externalEvidence[0].realityFact,false);
assert.equal(bundle.governance.persisted,false);

const domains=buildPersonalEvidenceDomainHandoffs({profileView,visualProjection,financialSummary:{instrumentId:'FIN'}});
assert.equal(domains.relationship.state,'AVAILABLE');
assert.equal(domains.career.state,'AVAILABLE');
assert.equal(domains.financial.state,'AVAILABLE');
assert.equal(domains.financial.governance.directFarInputAllowed,false);
assert.equal(domains.financial.governance.fdrFactCreated,false);
assert.equal(domains.relationship.governance.compatibilityScoreAllowed,false);

assert.ok(profileHtml.includes('data-prf-handoff-consent'));
assert.ok(profileHtml.includes('data-prf-handoff'));
assert.ok(profileClient.includes('data-prf-handoff-signal'));
assert.ok(profileClient.includes("sourceType:'PERSONAL_EVIDENCE'"));
assert.ok(handoffApi.includes("sourceType==='PERSONAL_EVIDENCE'"));
assert.ok(handoffApi.includes("automaticPersistence!==false"));

for(const file of [
  'functions/profile/personal-evidence-publication-projection.js',
  'functions/profile/personal-evidence-handoffs.js',
  'functions/reality-orchestration/reality-orchestrator.js',
  'functions/api/customer-reality-handoff.js',
  'functions/api/profile-progressive.js',
  'assets/customer-ui/js/surfaces/profile-progressive.js'
]){
  const result=spawnSync(process.execPath,['--check',file],{cwd:root,encoding:'utf8'});
  assert.equal(result.status,0,`${file} syntax failed: ${result.stderr}`);
}

console.log('PASS PRD-W6/W7/W8: Personal Evidence dossier publication projection is active with RR admission correctly gated; explicit selected-evidence Personal Reality handoff is implemented; Relationship/Career/Financial reference handoffs are bounded and non-mutating.');

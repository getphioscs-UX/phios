import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createCustomerDeliverySnapshot} from '../../functions/personal-reading/narrative/report-section-snapshot.js';
import {sha256Stable} from '../../functions/interpretation-runtime/mir7-utils.js';
import {buildZwrVfrDiagramData} from '../../functions/personal-reading/visual-first/ziwei-vfr-diagram-data.js';
import {buildZwrVfrDeepPublicationIr} from '../../functions/personal-reading/visual-first/ziwei-vfr-deep-publication.js';
import {buildZwrVfrPagePlan,validateZwrVfrPagePlan} from '../../functions/personal-reading/visual-first/ziwei-vfr-page-plan.js';
import {assertMethodGeneration} from '../../functions/report-delivery/method-render-contract.js';
import {ZWR_VFR_METHOD_PROFILE as profile} from '../../functions/report-delivery/ziwei-vfr-profile-policy.js';
export const sourceAcceptanceDigest='81e31ab108602135616965c0c92d838085ddb0f5561c02c02ceb09f8958dc611';
export async function buildAcceptedZwrRendererCandidate(){
 const root='docs/reports/ziwei/vfr-r1/',raw=p=>fs.readFileSync(root+p,'utf8'),read=p=>JSON.parse(raw(p)),hash=s=>createHash('sha256').update(s).digest('hex');
 assert.equal(hash(raw('HUMAN-DECISION.json')),sourceAcceptanceDigest,'Accepted source changed; review required');
 const decision=read('HUMAN-DECISION.json');assert.equal(decision.decision,'ACCEPT');
 assert.equal(hash(raw('five-call-experiment/REPAIRED-RESULT.json')),decision.repairedResultSha256);
 assert.equal(hash(raw('DEEP-PUBLICATION-IR.json')),decision.publicationIrSha256);
 const pack=read('COMPACT-AUTHORING-PACK.json'),repaired=read('five-call-experiment/REPAIRED-RESULT.json');
 const rebuilt=await buildZwrVfrDeepPublicationIr({pack,repairedResult:repaired}),ir=read('DEEP-PUBLICATION-IR.json');
 // The accepted reference predates the increased planner safety limit. Retain
 // its original bytes and compare every semantic field before native rendering.
 const {publicationIrDigest:_new,maxPhysicalPages:_newLimit,...newContent}=rebuilt;
 const {publicationIrDigest:_accepted,maxPhysicalPages:_acceptedLimit,...acceptedContent}=ir;
 assert.deepEqual(newContent,acceptedContent);
 const evidence=JSON.parse(fs.readFileSync('docs/reports/ziwei/production-admission/zpa-v1/ZPA-CONTROLLED-02-en.json','utf8')).evidence;
 const diagrams=await buildZwrVfrDiagramData({evidence});assert.deepEqual(diagrams,read('DIAGRAM-DATA.json'));
 const pages=buildZwrVfrPagePlan({sections:ir.sections}),check=validateZwrVfrPagePlan({diagramIds:diagrams.diagrams.map(d=>d.id),pages,sections:ir.sections});assert.equal(check.accepted,true);
 const snapshot=await createCustomerDeliverySnapshot({methodId:'ZWR',locale:'en',subjectFingerprint:await sha256Stable(pack.subjectBinding),inputFingerprint:pack.subjectBinding.inputFingerprint,compositionVersion:profile.compositionVersion,authorityVersion:'ZIWEI_PRO_R2_AUTHORITY_V2',claimIrVersion:profile.publicationIrVersion,verifierVersion:profile.rendererContractVersion,semanticContent:{evidence,visualReportIr:ir,vfrCompactAuthoringPackDigest:pack.authorityDigest,vfrDeepManuscriptDigest:repaired.resultDigest,vfrDiagramData:diagrams,vfrPagePlan:pages,vfrPublicationFit:check.fitProfile,vfrLineage:{profileVersion:profile.profileVersion,rendererContractVersion:profile.rendererContractVersion,pagePlanDigest:await sha256Stable(pages)}}});
 const candidate={schemaVersion:'ZWR-VFR-R1-ACCEPTED-RENDERER-FIXTURE-v1',scope:'CONTROLLED_QA_ONLY',personId:pack.subjectBinding.subjectId,locale:'en',snapshot,generationSuccessor:profile.generationVersion,naturalCompositionSummary:{providerCalls:0,semanticReviewCalls:0,completenessStatus:'PASS'},productionAdmissionGranted:false};
 await assertMethodGeneration(candidate);return candidate;
}

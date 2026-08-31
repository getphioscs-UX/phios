import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {assertPprCurrentSharedOwner,assertPprCurrentSharedOwnerRegistry} from './lib/ppr-current-shared-owner.mjs';
import {parseHumanDesignProfileText} from '../functions/external-profile/hd-profile-parser.js';
import {buildExternalProfileExtractionIr} from '../functions/external-profile/external-profile-extraction-ir.js';
import {buildExternalProfileConfirmationDraft,confirmExternalProfile} from '../functions/external-profile/external-profile-confirmation.js';
import {buildCanonicalHumanDesignExternalChart,HD_CENTER_CODES} from '../functions/external-profile/human-design-canonical-chart.js';
import {buildHumanDesignExternalReadingIr} from '../functions/external-profile/human-design-reading-runtime.js';
import {composeHumanDesignRealityBridge} from '../functions/external-profile/human-design-reality-composition.js';
import {HD_EXTERNAL_CATEGORY_AUTHORITY,HD_EXTERNAL_PRODUCTION} from '../functions/external-profile/human-design-external-authority.js';
import {onRequestPost as intakeApi} from '../functions/api/customer-external-profile-intake.js';
import {onRequestPost as confirmApi} from '../functions/api/customer-external-profile-confirm.js';

const readJson=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const sha=path=>crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const root='content/customer-experience-rebuild/hd-pro-r2';
const w0=readJson(`${root}/hd-w0-current-authority-audit-v1.json`);
const w1=readJson(`${root}/hd-w1-canonical-chart-intake-contract-v1.json`);
const w2=readJson(`${root}/hd-w2-intake-adapter-contract-v1.json`);
const w3=readJson(`${root}/hd-w3-confirmation-ux-contract-v1.json`);
const w4=readJson(`${root}/hd-w4-structure-contract-v1.json`);
const w5=readJson(`${root}/hd-w5-composition-contract-v1.json`);
const w6=readJson(`${root}/hd-w6-variable-phs-boundary-v1.json`);
const w7=readJson(`${root}/hd-w7-reading-ir-contract-v1.json`);
const w8=readJson(`${root}/hd-w8-reality-composition-contract-v1.json`);
const w9m=readJson(`${root}/hd-w9-machine-acceptance-v1.json`);
const w9h=readJson(`${root}/hd-w9-human-review-status-v1.json`);
const w10=readJson(`${root}/hd-w10-production-cutover-v1.json`);
const hdrFreeze=readJson('content/professional/core-method-runtime/hdr-production-freeze-v1.json');
const hdrReadiness=readJson('content/professional/method-production-activation/registries/mpa-hdr-boundary-readiness-v1.json');
const sharedSuccessor=readJson('content/professional/personal-reality/r5/authority/ppr-r5-hd-pro-r2-successor-v1.json');
const publishSuccessor=readJson('content/professional/personal-reality/r5/authority/ppr-r5-hd-pro-r2-customer-published-successor-v1.json');
const reviewCases=readJson(`${root}/review/hd-w9-human-review-cases-v1.json`);
const reviewResults=readJson(`${root}/review/hd-w9-human-review-results-v1.json`);
const w11=readJson(`${root}/hd-w11-official-chart-pdf-intake-adapter-successor-v1.json`);
const currentSharedOwnerRegistry=readJson('content/professional/personal-reality/current/ppr-current-shared-owner-registry-v1.json');
const r3W25OwnerReconciliation=readJson('content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/audit/HD-PRO-R3-W25-current-owner-reconciliation-v1.json');
const r3W25OwnerByPath=new Map((r3W25OwnerReconciliation.reconciledOwners||[]).map(item=>[item.path,item]));
const assertCurrentPublishedOwner=(path,{historicalDigest=null,label='HD current owner'}={})=>{
  if(currentSharedOwnerRegistry.files[path])return assertPprCurrentSharedOwner(path,{historicalDigest,label});
  const record=r3W25OwnerByPath.get(path);
  assert(record,`${label}: unregistered current successor owner: ${path}`);
  assert.equal(record.ownerPathChanged,false,`${label}: current successor owner path changed: ${path}`);
  assert.equal(record.currentMainSha256,sha(path),`${label}: reconciled current digest drift: ${path}`);
  if(historicalDigest)assert((record.recognizedPredecessors||[]).includes(historicalDigest),`${label}: historical predecessor not recognized: ${path}`);
  return record;
};

assert.equal(w0.baselineCommit,'3d66a5037a0c184ba2059c958a5f7e580696b786');
assert.equal(w0.methodBoundary.authorityClass,'CUSTOMER_SUPPLIED_EXTERNAL_CONTEXT');
assert.equal(w0.methodBoundary.phiosHumanDesignCalculationAuthority,false);
assert.equal(w0.methodBoundary.publicHdrExecutionAllowed,false);
assert.equal(hdrFreeze.productionStatus,'blocked');
assert.equal(hdrFreeze.executionMode,'validation_only');
assert.equal(hdrReadiness.productionExecutionAllowed,false);
assert.equal(hdrReadiness.publicMethodExecutionAllowed,false);
assert.equal(HD_EXTERNAL_PRODUCTION.phiosHumanDesignCalculationAllowed,false);
assert.equal(HD_EXTERNAL_PRODUCTION.hdrPublicExecutionAllowed,false);
assert.equal(HD_EXTERNAL_PRODUCTION.advancedVariableAutomaticCalculationAllowed,false);

assert.deepEqual(w1.coreFields,['type','strategy','authority','profile','definition','incarnationCross','signature','notSelfTheme']);
assert.deepEqual(w4.centers,HD_CENTER_CODES);
assert.equal(w5.compositionLevel,'CATEGORY_LEVEL_ONLY');
assert.equal(w6.rules.automaticCalculationAllowed,false);
assert.equal(w7.publication.humanReviewAccepted,true);
assert.equal(w7.publication.customerPublishable,true);
assert.equal(w8.rules.createsRuntimeEvidence,false);
assert.equal(w8.publication.humanReviewAccepted,true);
assert.equal(w8.publication.customerPublishable,true);
assert.equal(w9h.status,'HUMAN_ACCEPTED_24_OF_24');
assert.equal(w9h.acceptedCount,24);
assert.equal(w9h.rejectedCount,0);
assert.equal(w9h.pendingCount,0);
assert.equal(w10.cutover.customerInterpretiveReading,'CUSTOMER_PUBLISHED');
assert.equal(w10.cutover.realityComposition,'CUSTOMER_PUBLISHED');
assert.equal(w10.cutover.hdrPublicCalculation,'UNCHANGED_BLOCKED');
assert.equal(w9m.status,'MACHINE_VERIFIED_24_OF_24');
assert.equal(w9m.passedCount,24);
assert.equal(HD_EXTERNAL_PRODUCTION.humanReviewAccepted,true);
assert.equal(HD_EXTERNAL_PRODUCTION.customerReadingPublicationAllowed,true);
assert.equal(reviewCases.cases.length,24);
assert.equal(reviewResults.status,'HUMAN_ACCEPTED_24_OF_24');
assert.equal(w11.status,'OFFICIAL_CHART_PDF_INTAKE_ADAPTER_SUCCESSOR_ACTIVE');
assert.equal(w11.baselineCommit,'ccac579a7e81dc27f7f6403df1c6446fba38bc25');
assert.equal(w11.boundaries.phiosHumanDesignCalculationAuthorityCreated,false);
assert.equal(w11.boundaries.missingAdvancedFieldsInferred,false);
for(const [path,proof] of Object.entries(w11.runtimeSuccessorProof)){const currentSha=sha(path);if(currentSha!==proof.successorSha256){if(path==='content/professional/personal-reality/current/ppr-current-shared-owner-registry-v1.json')assertPprCurrentSharedOwnerRegistry();else assertPprCurrentSharedOwner(path,{historicalDigest:proof.successorSha256,label:'HD W11 runtime'});}assert.notEqual(proof.predecessorSha256,proof.successorSha256,`HD W11 successor must record a real delta: ${path}`)}
assert.deepEqual(reviewResults.summary,{accepted:24,rejected:0,pending:0});
assert.deepEqual(reviewResults.cases.map(item=>item.caseId),reviewCases.cases.map(item=>item.caseId));
assert(reviewResults.cases.every(item=>item.decision==='ACCEPT'));
assert.equal(sharedSuccessor.status,'HD_PRO_R2_EXTERNAL_PROFILE_SUCCESSOR_IMPLEMENTED');
assert.equal(sharedSuccessor.baselineCommit,w0.baselineCommit);
assert.equal(publishSuccessor.status,'HD_PRO_R2_CUSTOMER_PUBLISHED_SUCCESSOR_ACTIVE');
assert.equal(publishSuccessor.baselineCommit,'0c5a4bc220131b5f468fddcbacb849f30b32e99a');
assert.equal(publishSuccessor.humanAdmission.status,'HUMAN_ACCEPTED_24_OF_24');
assert.equal(publishSuccessor.cutover.customerPublicationState,'CUSTOMER_PUBLISHED');
for(const [path,proof] of Object.entries(sharedSuccessor.sharedFileSuccessorProof)){
  const successor=publishSuccessor.runtimeSuccessorProof[path];
  if(successor){assert.equal(successor.predecessorSha256,proof.successorSha256,`HD publish predecessor digest mismatch: ${path}`);if(successor.successorSha256!==sha(path))assertCurrentPublishedOwner(path,{historicalDigest:successor.successorSha256,label:'HD publish'})}
  else if(w11.runtimeSuccessorProof[path])assert.equal(w11.runtimeSuccessorProof[path].predecessorSha256,proof.successorSha256,`HD W11 predecessor mismatch: ${path}`);else assert.equal(proof.successorSha256,sha(path),`HD shared successor digest drift without declared publication successor: ${path}`);
  assert.equal(proof.createsPHIOSHumanDesignCalculationAuthority,false);assert.equal(proof.createsHdrPublicExecutionAuthority,false);assert.equal(proof.createsAutomaticVariableCalculationAuthority,false);
}
for(const [path,proof] of Object.entries(sharedSuccessor.addedRuntimeFiles)){
  const successor=publishSuccessor.runtimeSuccessorProof[path];
  if(successor){assert.equal(successor.predecessorSha256,proof.sha256,`HD publish runtime predecessor digest mismatch: ${path}`);if(successor.successorSha256!==sha(path))assertCurrentPublishedOwner(path,{historicalDigest:successor.successorSha256,label:'HD publish runtime'})}
  else if(w11.runtimeSuccessorProof[path])assert.equal(w11.runtimeSuccessorProof[path].predecessorSha256,proof.sha256,`HD W11 added-runtime predecessor mismatch: ${path}`);else assert.equal(proof.sha256,sha(path),`HD added runtime digest drift without declared publication successor: ${path}`);
}
for(const [path,proof] of Object.entries(publishSuccessor.runtimeSuccessorProof)){if(proof.successorSha256!==sha(path))assertCurrentPublishedOwner(path,{historicalDigest:proof.successorSha256,label:'HD publication runtime'});assert.equal(proof.createsPHIOSHumanDesignCalculationAuthority,false);assert.equal(proof.createsHdrPublicExecutionAuthority,false);assert.equal(proof.createsAutomaticVariableCalculationAuthority,false)}
for(const [path,proof] of Object.entries(publishSuccessor.admissionArtifacts))assert.equal(proof.sha256,sha(path),`HD admission artifact digest drift: ${path}`);
assert.equal(fs.existsSync('tools/review/HD-PRO-R2-W9-HUMAN-REVIEW.html'),true);
assert.equal(fs.existsSync(`${root}/review/hd-w9-human-review-cases-v1.json`),true);
assert.equal(fs.existsSync(`${root}/review/hd-w9-human-review-results-v1.json`),true);

const parsed=parseHumanDesignProfileText(`Type: Generator\nStrategy: Wait to Respond\nAuthority: Emotional\nProfile: 5/1\nDefinition: Triple Split Definition\nIncarnation Cross: Example Cross\nSignature: Satisfaction\nNot-Self Theme: Frustration\nChannels: 43-23 | 29-46\nDefined Centers: Ajna, Throat, G Center, Sacral\nOpen Centers: Head, Spleen, Root\nDesign activated Gates: 29.1 30.2\nPersonality activated Gates: 43.5 23.5`);
const parsedMap=Object.fromEntries(parsed.candidates.map(item=>[item.field,item.normalizedValue]));
for(const field of ['type','strategy','authority','profile','definition','incarnationCross','signature','notSelfTheme'])assert(parsedMap[field],`Parser missing ${field}`);
assert(parsed.structuralCandidates.some(item=>item.field==='channels'));
assert(parsed.structuralCandidates.some(item=>item.field==='definedCenters'));
assert(parsed.candidates.every(item=>item.customerConfirmed===false&&item.phiosCalculated===false));


// Jovian Archive / Maia Mechanics official PDFs can present labels and values in columns or stacked blocks.
const maiaStackedText=`tt
Projector · 1/3 · Self Projected
birth data
Name
tt
Date and Time (Local)
November 11, 2000, 10:10
Date and Time (UTC)
November 11, 2000, 02:10
Location
Beijing, China
properties
Type
Projector
Strategy
Wait for Recognition and the
Invitation
Signature
Success
Not-Self Theme
Bitterness
Authority
Self Projected
Definition
Single
Incarnation Cross
Right Angle Cross of
Explanation (43/23 | 4/49)
Profile
1/3
Variable
PRL DRL
Generated by Maia Mechanics | Powered by Jovian Archive`;
const maiaStacked=parseHumanDesignProfileText(maiaStackedText,{sourceType:'CUSTOMER_UPLOADED_DOCUMENT',sourceRegionPrefix:'DOCUMENT'});
const maiaStackedMap=Object.fromEntries(maiaStacked.candidates.map(item=>[item.field,item.normalizedValue]));
assert.deepEqual(Object.fromEntries(['type','strategy','signature','notSelfTheme','authority','definition','incarnationCross','profile','variable'].map(field=>[field,maiaStackedMap[field]])),{
  type:'Projector',strategy:'Wait for Recognition and the Invitation',signature:'Success',notSelfTheme:'Bitterness',authority:'Self Projected',definition:'Single',incarnationCross:'Right Angle Cross of Explanation (43/23 | 4/49)',profile:'1/3',variable:'PRL DRL'
});
assert.equal(maiaStacked.conflicts.length,0);

const maiaColumnText=`properties

     Type                                     Strategy                                     Signature
\uE943 Projector                             \uE955 Wait for Recognition and the         \uE97B Success
                                              Invitation

     Not-Self Theme                           Authority                                    Definition
\uE97A Bitterness                            \uE909 Self Projected                         \uE932 Single

     Incarnation Cross                        Profile                                      Variable
\uE90C Right Angle Cross of                  \uE90B 1/3                                    \uE958 PRL DRL
     Explanation (43/23 | 4/49)`;
const maiaColumn=parseHumanDesignProfileText(maiaColumnText,{sourceType:'CUSTOMER_UPLOADED_DOCUMENT',sourceRegionPrefix:'DOCUMENT'});
const maiaColumnMap=Object.fromEntries(maiaColumn.candidates.map(item=>[item.field,item.normalizedValue]));
for(const [field,value] of Object.entries({type:'Projector',strategy:'Wait for Recognition and the Invitation',signature:'Success',notSelfTheme:'Bitterness',authority:'Self Projected',definition:'Single',incarnationCross:'Right Angle Cross of Explanation (43/23 | 4/49)',profile:'1/3',variable:'PRL DRL'}))assert.equal(maiaColumnMap[field],value,`Maia column adapter mismatch: ${field}`);
assert.equal(maiaColumn.conflicts.length,0);

const jovianTwoColumn=parseHumanDesignProfileText(`Type: Generator                                                     Determination: Low
Profile: 5 / 1                                                      Cognition: Inner Vision
Definition: Triple Split Definition                                 Environment: Kitchens
Inner authority: Emotional - Solar Plexus                           Motivation: Need
Strategy: To Respond                                                Sense: Judgment
Not Self theme: Frustration                                         Transference: Fear
Variable: PRL - DRL                                                 View: Survival
Birth date (Local): 1989/11/15, 22:50                               Design date (UT): 1989/8/18, 04:38:04
Incarnation Cross: Left Angle Cross of Dedication (43/23 | 29/30)`,{sourceType:'CUSTOMER_UPLOADED_DOCUMENT',sourceRegionPrefix:'DOCUMENT'});
const jovianMap=Object.fromEntries(jovianTwoColumn.candidates.map(item=>[item.field,item.normalizedValue]));
for(const [field,value] of Object.entries({type:'Generator',determination:'Low',profile:'5 / 1',cognition:'Inner Vision',definition:'Triple Split Definition',environment:'Kitchens',authority:'Emotional - Solar Plexus',motivation:'Need',strategy:'To Respond',notSelfTheme:'Frustration',variable:'PRL - DRL',perspective:'Survival',incarnationCross:'Left Angle Cross of Dedication (43/23 | 29/30)'}))assert.equal(jovianMap[field],value,`Jovian two-column adapter mismatch: ${field}`);
assert.equal(jovianTwoColumn.conflicts.length,0);

// End-to-end uploaded PDF conversion keeps upload success separate from field-recognition state.
const uploadedPdfForm=new FormData();uploadedPdfForm.set('profileFamily','HUMAN_DESIGN');uploadedPdfForm.set('consent','true');uploadedPdfForm.set('file',new File([Buffer.from('%PDF-1.7\n% HD fixture')],'tt.pdf',{type:'application/pdf'}));
const uploadedPdfResponse=await intakeApi({request:new Request('https://example.test/api/customer-external-profile-intake',{method:'POST',body:uploadedPdfForm}),env:{AI:{toMarkdown:async()=>[{format:'markdown',data:maiaStackedText,mimetype:'application/pdf'}]}}});
assert.equal(uploadedPdfResponse.status,200);const uploadedPdfPayload=await uploadedPdfResponse.json();
assert.equal(uploadedPdfPayload.externalProfileIntake.intakeState,'NEEDS_CONFIRMATION');
assert.equal(uploadedPdfPayload.externalProfileIntake.recognitionSummary.recognizedCount,9);
assert.equal(uploadedPdfPayload.externalProfileIntake.recognitionSummary.pendingCount,0);
assert.equal(uploadedPdfPayload.externalProfileIntake.confirmationDraft.fields.type.value,'Projector');
assert.equal(uploadedPdfPayload.externalProfileIntake.confirmationDraft.fields.variable.value,'PRL DRL');
assert.equal(uploadedPdfPayload.externalProfileIntake.boundary.workersAiUsedForDocumentConversion,true);

const coreVariants=[
  {type:'Generator',strategy:'Wait to Respond',authority:'Sacral',profile:'5/1',definition:'Single Definition',signature:'Satisfaction',notSelfTheme:'Frustration'},
  {type:'Projector',strategy:'Wait for Recognition and Invitation',authority:'Splenic',profile:'3/5',definition:'Split Definition',signature:'Success',notSelfTheme:'Bitterness'},
  {type:'Manifestor',strategy:'Inform before action',authority:'Emotional',profile:'2/4',definition:'Single Definition',signature:'Peace',notSelfTheme:'Anger'},
  {type:'Reflector',strategy:'Wait through a lunar cycle',authority:'Lunar',profile:'6/2',definition:'No Definition',signature:'Surprise',notSelfTheme:'Disappointment'}
];
const locales=['en','zh-Hans'];
let passCount=0;
for(let i=0;i<24;i++){
  const c=coreVariants[i%coreVariants.length];
  const includeStructure=i%3!==2,includeAdvanced=i%4!==3,includeCross=i%5!==4;
  const text=[
    `Type: ${c.type}`,
    `Strategy: ${c.strategy}`,
    `Authority: ${c.authority}`,
    `Profile: ${c.profile}`,
    `Definition: ${c.definition}`,
    includeCross?`Incarnation Cross: Review Cross ${i+1}`:'',
    `Signature: ${c.signature}`,
    `Not-Self Theme: ${c.notSelfTheme}`,
    includeStructure?'Channels: 43-23 | 29-46':'',
    includeStructure?'Defined Centers: Ajna, Throat, G Center, Sacral':'',
    includeStructure?'Open Centers: Head, Spleen, Root':'',
    includeStructure?'Design activated Gates: 29.1 46.2':'',
    includeStructure?'Personality activated Gates: 43.5 23.5':''
  ].filter(Boolean).join('\n');
  const manualFields=includeAdvanced?{cognition:`Cognition ${i+1}`,determination:`Determination ${i+1}`,environment:`Environment ${i+1}`,perspective:`Perspective ${i+1}`,motivation:`Motivation ${i+1}`,trajectory:`Trajectory ${i+1}`}:{ };
  const ir=buildExternalProfileExtractionIr({intakeId:`HD-MACHINE-${String(i+1).padStart(2,'0')}`,sources:[{sourceType:'CUSTOMER_PASTED_TEXT',sourceAuthority:'CUSTOMER'}],pastedText:text,manualFields});
  const draft=buildExternalProfileConfirmationDraft(ir);
  const confirmed=confirmExternalProfile({confirmationDraft:draft,confirmedAt:`2026-08-${String((i%28)+1).padStart(2,'0')}T00:00:00.000Z`});
  const chart=buildCanonicalHumanDesignExternalChart(confirmed,{generatedAt:'2026-08-30T09:00:00.000Z'});
  const reading=buildHumanDesignExternalReadingIr(chart,{locale:locales[i%2],intent:`machine review case ${i+1}`});
  const bridge=composeHumanDesignRealityBridge(reading);
  assert.equal(chart.provenance.phiosCalculated,false);
  assert.equal(chart.provenance.automaticHumanDesignCalculationUsed,false);
  assert.equal(reading.publicationDecision.machineCandidate,true);
  assert.equal(reading.publicationDecision.humanReviewRequired,true);
  assert.equal(reading.publicationDecision.humanReviewAccepted,true);
  assert.equal(reading.publicationDecision.customerPublishable,true);
  assert.equal(reading.boundaries.hdrPublicExecutionUsed,false);
  assert.equal(reading.boundaries.automaticVariableCalculationUsed,false);
  assert.equal(reading.boundaries.interpretationCreatesRealityFact,false);
  assert.equal(bridge.prompts.length,5);
  assert.equal(bridge.boundaries.createsRuntimeEvidence,false);
  assert.equal(bridge.boundaries.resonanceAloneIsEvidence,false);
  assert.equal(bridge.prompts.at(-1).code,'CONTRADICTION');
  if(includeStructure){assert.deepEqual(chart.structure.channels,['29-46','43-23']);assert(chart.structure.gateNumbers.includes(29));assert(chart.structure.definedCenters.includes('AJNA'))}else{assert.equal(chart.structure.channels.length,0);assert.equal(chart.structure.gateNumbers.length,0)}
  if(includeAdvanced)assert.equal(chart.completeness.advancedPresent,6);else assert.equal(chart.completeness.advancedPresent,0);
  passCount++;
}
assert.equal(passCount,w9m.caseCount);
assert.equal(passCount,w9m.requiredPassCount);

// Manual-only API route proves a Human Design chart can now be prepared without selecting another PHI OS method.
const form=new FormData();
form.set('profileFamily','HUMAN_DESIGN');form.set('consent','true');
form.set('manualType','Generator');form.set('manualStrategy','Wait to Respond');form.set('manualAuthority','Sacral');form.set('manualProfile','5/1');form.set('manualDefinition','Single Definition');form.set('manualSignature','Satisfaction');form.set('manualNotSelfTheme','Frustration');
form.set('manualChannels','43-23, 29-46');form.set('manualDefinedCenters','Ajna, Throat, G Center, Sacral');form.set('manualOpenCenters','Head, Spleen, Root');form.set('manualDesignActivations','29.1 46.2');form.set('manualPersonalityActivations','43.5 23.5');
form.set('variable','PRL DRL');form.set('environment','Markets');
const intakeResponse=await intakeApi({request:new Request('https://example.test/api/customer-external-profile-intake',{method:'POST',body:form}),env:{}});
assert.equal(intakeResponse.status,200);const intakePayload=await intakeResponse.json();
assert.equal(intakePayload.ok,true);assert.equal(intakePayload.externalProfileIntake.intakeState,'NEEDS_CONFIRMATION');
assert.equal(intakePayload.externalProfileIntake.confirmationDraft.fields.type.value,'Generator');
assert.deepEqual(intakePayload.externalProfileIntake.confirmationDraft.structure.channels.value,['29-46','43-23']);
const confirmResponse=await confirmApi({request:new Request('https://example.test/api/customer-external-profile-confirm',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({confirmationDraft:intakePayload.externalProfileIntake.confirmationDraft,edits:{authority:'Sacral Authority'},structureEdits:{channels:'43-23, 37-40',definedCenters:'Ajna, Throat, G, Sacral',openCenters:'Head, Spleen, Root'},locale:'zh-Hans',intent:'publication check',consent:true})})});
assert.equal(confirmResponse.status,200);const confirmPayload=await confirmResponse.json();
assert.equal(confirmPayload.ok,true);assert.equal(confirmPayload.canonicalHumanDesignChart.core.authority.value,'Sacral Authority');assert.deepEqual(confirmPayload.canonicalHumanDesignChart.structure.channels,['37-40','43-23']);assert.equal(confirmPayload.canonicalHumanDesignChart.provenance.phiosCalculated,false);assert.equal(confirmPayload.readingAvailability.state,'CUSTOMER_PUBLISHED');assert.equal(confirmPayload.readingAvailability.humanReviewAccepted,true);assert.equal(confirmPayload.readingAvailability.customerPublishable,true);assert.equal(confirmPayload.humanDesignReading.publicationDecision.customerPublishable,true);assert.equal(confirmPayload.humanDesignReading.publicationDecision.humanReviewAccepted,true);assert.equal(confirmPayload.humanDesignReading.locale,'zh-Hans');assert.equal(confirmPayload.humanDesignRealityComposition.prompts.length,5);assert.equal(confirmPayload.humanDesignRealityComposition.prompts.at(-1).code,'CONTRADICTION');assert.equal(confirmPayload.humanDesignReading.boundaries.hdrPublicExecutionUsed,false);

for(const category of w5.admittedCategories)assert(HD_EXTERNAL_CATEGORY_AUTHORITY[category]?.sourceRef?.includes('knowledge/external-readers/human-design/registry/entries.json'));
for(const category of w6.authorityCategories)assert(HD_EXTERNAL_CATEGORY_AUTHORITY[category]);

const html=fs.readFileSync('perspectives/personal/index.html','utf8');
const client=fs.readFileSync('assets/customer-ui/js/surfaces/personal-reality.js','utf8');
const css=fs.readFileSync('assets/customer-ui/surfaces/personal-reality.css','utf8');
for(const token of ['data-cx-external-profile-process','data-cx-external-profile-processing-consent','name="manualType"','name="manualStrategy"','name="manualChannels"','data-cx-hd-canonical-chart','data-cx-hd-published-reading','data-cx-hd-reading-sections','data-cx-hd-reality-bridge','name="externalVariable"','name="externalProfileChartVerified"','data-cx-external-profile-recognition-status','data-cx-external-profile-advanced-confirmation-fields','name="externalAdvancedAvailability"','https://jovianarchive.com/pages/get-your-human-design-chart','Read this chart'])assert(html.includes(token),`HD W3 surface missing ${token}`);
for(const token of ['prepareExternalProfileIntake','collectExternalProfileEdits','renderCanonicalHumanDesignChart','renderPublishedHumanDesignReading','EXTERNAL_PROFILE_PROCESS_FIRST','canonicalHumanDesignChart','humanDesignReading','humanDesignRealityComposition','externalProfileProcessingConsent','data-cx-external-profile-edit','data-cx-external-profile-structure-edit','collectExternalProfileStructureEdits','recognitionSummary','externalAdvancedAvailability','externalProfileChartVerified','externalVariable'])assert(client.includes(token),`HD W3 client binding missing ${token}`);
for(const token of ['.cx-hd-intake-steps','.cx-hd-process-row','.cx-hd-canonical-chart','.cx-hd-confirm-field','.cx-hd-published-reading','.cx-hd-reading-section','.cx-hd-reality-prompts','.cx-hd-official-source','.cx-hd-recognition-status','.cx-hd-advanced-confirmation','.cx-hd-final-confirm'])assert(css.includes(token),`HD W3 style missing ${token}`);
for(const forbidden of ['name="externalActivatedGates"','name="externalChannels"','name="externalDefinedCenters"','name="externalOpenCenters"'])assert.equal(html.includes(forbidden),false,`Legacy normal structural field must remain absent: ${forbidden}`);

const pkg=readJson('package.json');
assert.equal(pkg.scripts['check:hd-pro-r2'],'node scripts/check-hd-pro-r2-w0-w10.mjs');
assert(pkg.scripts.check.includes('npm run check:hd-pro-r2'));

console.log(`✓ HD-PRO-R2 W0-W10 machine campaign passed ${passCount}/${w9m.caseCount}.`);
console.log('  Customer-supplied chart intake now has explicit Read -> editable confirmation -> canonical chart flow; HDR public calculation and automatic Variable/PHS calculation remain blocked.');
console.log('  W9 human review is 24/24 accepted; the admitted external-chart reading and Reality Comparison are CUSTOMER_PUBLISHED on the canonical personal route.');

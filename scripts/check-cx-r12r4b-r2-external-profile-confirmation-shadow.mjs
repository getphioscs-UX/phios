import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseHumanDesignProfileText} from '../functions/external-profile/hd-profile-parser.js';
import {buildExternalProfileExtractionIr} from '../functions/external-profile/external-profile-extraction-ir.js';
import {extractUploadedExternalProfileDocument} from '../functions/external-profile/upload-document-extractor.js';
import {buildExternalProfileConfirmationDraft,confirmExternalProfile} from '../functions/external-profile/external-profile-confirmation.js';
import {compareConfirmedExternalProfileToHdrShadow,runHdrShadowValidation} from '../functions/external-profile/hdr-shadow-validation.js';
import {onRequestPost as externalProfileIntake} from '../functions/api/customer-external-profile-intake.js';
import {onRequestPost as externalProfileConfirm} from '../functions/api/customer-external-profile-confirm.js';

const readJson=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const extractionAuthority=readJson('content/customer-experience-rebuild/r12r4b/external-profile-extraction-authority-v2.json');
const provenance=readJson('content/customer-experience-rebuild/r12r4b/external-profile-provenance-contract-v1.json');
const shadowContract=readJson('content/customer-experience-rebuild/r12r4b/hdr-shadow-validation-contract-v1.json');
const acceptance=readJson('content/customer-experience-rebuild/r12r4b/cx-r12r4b-r2-acceptance-v1.json');
const r1=readJson('content/customer-experience-rebuild/r12r4b/cx-r12r4b-r1-acceptance-v1.json');

assert.equal(extractionAuthority.work,'CX-R12R4B-R2-W16R-W17R');
assert.equal(extractionAuthority.predecessor,'content/customer-experience-rebuild/r12r4b/human-design-external-profile-contract-v1.json');
assert.equal(extractionAuthority.authorityClass,'CUSTOMER_SUPPLIED_EXTERNAL_CONTEXT');
assert.equal(extractionAuthority.rules.machineExtractionIsCandidateOnly,true);
assert.equal(extractionAuthority.rules.customerConfirmationRequired,true);
assert.equal(extractionAuthority.documentConversion.runtime,'CLOUDFLARE_WORKERS_AI_MARKDOWN_CONVERSION');
assert.equal(extractionAuthority.documentConversion.conversionCreatesMeaning,false);
assert.deepEqual(extractionAuthority.structuralDetail,['activations','channels','definedCenters','openCenters']);
assert.equal(provenance.confirmation.machineExtractionAuthority,false);
assert.equal(provenance.confirmation.customerConfirmationCreatesExternalContextAuthority,true);
assert.equal(shadowContract.authorityClass,'INTERNAL_VALIDATION_ONLY');
assert.equal(shadowContract.rules.customerProfileOverwriteForbidden,true);
assert.equal(shadowContract.rules.hdrCustomerProjectionForbidden,true);
assert.equal(r1.status,'R4B_R1_ACCEPTED_BY_EXECUTABLE_CHECKS');

const extractedText=`Type: 生产者\nAuthority: 情绪权威\nProfile: 5/1\nDefinition: 三重分离\nIncarnation Cross: 左角奉献十字（43/23｜29/30）\nCognition: 内视\nDetermination: 低音\nEnvironment: 湿｜厨房\nPerspective: Survival\nMotivation: Need\nTrajectory: Novice\nDesign activated Gates: 29.1 30.1 37.5 14.2\nPersonality activated Gates: 43.5 23.5 12.4 47.4\nChannels: 43-23 | 29-46 | 37-40\nDefined Centers: Ajna, Throat, G Center, Ego, Solar Plexus, Sacral\nOpen Centers: Head, Spleen, Root`;
const parsed=parseHumanDesignProfileText(extractedText,{sourceType:'CUSTOMER_UPLOADED_IMAGE',sourceRegionPrefix:'UPLOADED_MATERIAL'});
const byField=Object.fromEntries(parsed.candidates.map(item=>[item.field,item.normalizedValue]));
assert.equal(byField.type,'生产者');
assert.equal(byField.authority,'情绪权威');
assert.equal(byField.profile,'5/1');
assert.equal(byField.definition,'三重分离');
const structure=Object.fromEntries(parsed.structuralCandidates.map(item=>[item.field,item.normalizedValue]));
assert.deepEqual(structure.channels,['29-46','37-40','43-23']);
assert.deepEqual(structure.definedCenters,['AJNA','EGO','G','SACRAL','SOLAR_PLEXUS','THROAT']);
assert.deepEqual(structure.openCenters,['HEAD','ROOT','SPLEEN']);
assert(structure.activations.some(item=>item.layer==='DESIGN'&&item.gateLine==='29.1'));
assert(structure.activations.some(item=>item.layer==='PERSONALITY'&&item.gateLine==='43.5'));

const fakeAi={async toMarkdown(){return {id:'md-test',name:'chart.png',format:'markdown',mimetype:'image/png',tokens:100,data:extractedText}}};
const file=new File([new Uint8Array([1,2,3,4])],'chart.png',{type:'image/png'});
const converted=await extractUploadedExternalProfileDocument({file,env:{AI:fakeAi}});
assert.equal(converted.status,'EXTRACTED');
assert.equal(converted.aiServiceUsed,true);
assert.equal(converted.meaningCreated,false);

const ir=buildExternalProfileExtractionIr({
  intakeId:'XPF-R2-TEST',
  sources:[{sourceType:'CUSTOMER_UPLOADED_IMAGE',fileName:'chart.png',fileType:'png',mimeType:'image/png',fileSize:4,sha256:'a'.repeat(64),fileContentPersisted:false,sourceAuthority:'CUSTOMER'}],
  documentExtraction:converted,
  manualFields:{trajectory:'Novice'}
});
assert.equal(ir.boundary.binaryDocumentExtractionPerformed,true);
assert.equal(ir.boundary.documentConversionCreatesMeaning,false);
assert(ir.candidates.some(item=>item.field==='type'&&item.customerConfirmed===false));
assert(ir.candidates.some(item=>item.field==='channels'));
const draft=buildExternalProfileConfirmationDraft(ir);
assert.equal(draft.fields.type.value,'生产者');
assert.deepEqual(draft.structure.channels.value,['29-46','37-40','43-23']);
assert.equal(draft.boundary.customerConfirmationRequired,true);

const confirmed=confirmExternalProfile({confirmationDraft:draft,confirmedAt:'2026-08-27T08:00:00.000Z'});
assert.equal(confirmed.authorityClass,'CUSTOMER_SUPPLIED_EXTERNAL_CONTEXT');
assert.equal(confirmed.provenance.customerConfirmed,true);
assert.equal(confirmed.provenance.phiosCalculated,false);
assert.match(confirmed.profileDigest,/^[a-f0-9]{64}$/);
assert(confirmed.records.some(item=>item.field==='type'&&item.value==='生产者'&&item.customerConfirmed===true));
assert(confirmed.records.some(item=>item.field==='channels'&&Array.isArray(item.value)));

const shadowProfile={type:'GENERATOR',authority:'EMOTIONAL',profile:'5/1',definition:'TRIPLE_SPLIT_DEFINITION',channels:['29-46','37-40','43-23'],definedCenters:['AJNA','EGO','G','SACRAL','SOLAR_PLEXUS','THROAT'],openCenters:['HEAD','ROOT','SPLEEN'],activations:[]};
const comparison=compareConfirmedExternalProfileToHdrShadow({confirmedProfile:confirmed,shadowProfile});
assert.equal(comparison.state,'REFERENCE_MATCH');
assert.equal(comparison.mismatchCount,0);
const mismatch=compareConfirmedExternalProfileToHdrShadow({confirmedProfile:confirmed,shadowProfile:{...shadowProfile,profile:'6/2'}});
assert.equal(mismatch.state,'PROFILE_DISCREPANCY');
assert.equal(mismatch.mismatchCount,1);
assert.equal(mismatch.boundary.customerProfileOverwritten,false);

const fakeReport={visibility:'INTERNAL_ONLY',status:'AWAITING_PROFESSIONAL_REVIEW',sections:[
  {sectionCode:'type',content:{typeCode:'GENERATOR'}},{sectionCode:'authority',content:{authorityCode:'EMOTIONAL'}},{sectionCode:'profile',content:{profile:{profileCode:'5/1'}}},{sectionCode:'definition',content:{definition:{definitionCode:'TRIPLE_SPLIT_DEFINITION'}}},{sectionCode:'centers',content:{definedCenters:shadowProfile.definedCenters,undefinedCenters:shadowProfile.openCenters}},{sectionCode:'channels',content:{channels:shadowProfile.channels}},{sectionCode:'key_gates',content:{activations:[]}}
]};
const fakeRuntimeFactory=()=>({async generate(request){assert.equal(request.canonicalBirthInput.consent.hdrInternalValidation,true);return fakeReport}});
const shadowRun=await runHdrShadowValidation({canonicalBirthInput:{birthDate:'1989-11-15',birthTime:'22:50:00',birthPlace:{displayName:'Taiping',latitude:4.85,longitude:100.74},timezone:{iana:'Asia/Kuala_Lumpur',utcOffsetAtBirth:'+08:00'},timeAccuracy:'EXACT',locale:'zh-Hans',consent:{recordId:'CONSENT',granted:true},inputVersion:'MCD-3-CANONICAL-BIRTH-INPUT-v1.0.0'},confirmedProfile:confirmed,runtimeFactory:fakeRuntimeFactory,requestId:'HDR-SHADOW-TEST'});
assert.equal(shadowRun.comparison.state,'REFERENCE_MATCH');
assert.equal(shadowRun.governance.productionDispatchAuthorityCreated,false);
assert.equal(shadowRun.governance.clientDeliveryAllowed,false);

const form=new FormData();form.set('profileFamily','HUMAN_DESIGN');form.set('consent','true');form.set('file',file);
const intakeResponse=await externalProfileIntake({request:new Request('https://example.test/api/customer-external-profile-intake',{method:'POST',body:form}),env:{AI:fakeAi}});
assert.equal(intakeResponse.status,200);const intakePayload=await intakeResponse.json();
assert.equal(intakePayload.externalProfileIntake.nextAction,'CUSTOMER_CONFIRMATION_REQUIRED');
assert.equal(intakePayload.externalProfileIntake.extractionIr.boundary.binaryDocumentExtractionPerformed,true);
assert.equal(intakePayload.externalProfileIntake.confirmationDraft.fields.type.value,'生产者');
assert.equal(intakePayload.externalProfileIntake.boundary.workersAiCreatesMeaning,false);

const confirmResponse=await externalProfileConfirm({request:new Request('https://example.test/api/customer-external-profile-confirm',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({confirmationDraft:intakePayload.externalProfileIntake.confirmationDraft,consent:true})})});
assert.equal(confirmResponse.status,200);const confirmPayload=await confirmResponse.json();assert.equal(confirmPayload.confirmedExternalProfile.provenance.customerConfirmed,true);assert.equal(confirmPayload.privacy.saved,false);

const html=fs.readFileSync('perspectives/personal/index.html','utf8'),client=fs.readFileSync('assets/customer-ui/js/surfaces/personal-reality.js','utf8');
for(const token of ['data-cx-external-profile-confirmation','data-cx-external-profile-confirm','externalProfileShadowCheck','Cloudflare document-conversion service'])assert(html.includes(token),`R2 customer confirmation surface missing ${token}`);
for(const token of ['/api/customer-external-profile-confirm','/api/customer-external-profile-shadow-check','renderExternalProfileConfirmation','confirmPreparedExternalProfile','runExternalProfileShadowCheck'])assert(client.includes(token),`R2 client binding missing ${token}`);
for(const forbidden of ['name="externalActivatedGates"','name="externalChannels"','name="externalDefinedCenters"','name="externalOpenCenters"'])assert.equal(html.includes(forbidden),false,`Structural detail must not become normal manual input: ${forbidden}`);

const pkg=readJson('package.json');
assert.equal(pkg.scripts['check:cx-r12r4b:r2'],'node scripts/check-cx-r12r4b-r2-external-profile-confirmation-shadow.mjs');
assert(pkg.scripts['check:cx-r12r4b'].endsWith('&& npm run check:cx-r12r4b:r2'));
assert.equal(acceptance.status,'R4B_R2_ACCEPTED_BY_EXECUTABLE_CHECKS');
assert.equal(acceptance.claims.liveCloudflareDocumentConversionClaimed,false);
assert.equal(acceptance.claims.liveHdrShadowCalculationClaimed,false);
assert.equal(acceptance.claims.globalCxCheckOrderCompatibilityReconciled,true);
assert.equal(acceptance.claims.humanDesignCustomerCalculationPromoted,false);
assert.equal(acceptance.nextSequentialWork,'CX-R12R4B-R3-W22R_ECR_CANONICAL_ONTOLOGY');

console.log('✓ CX-R12R4B R2 W16R–W21R External Profile extraction, confirmation, provenance and HDR shadow validation passed.');
console.log('  Upload-derived fields remain unconfirmed candidates until customer confirmation; Cloudflare document conversion creates no meaning; HDR remains internal validation-only and cannot overwrite XPF.');
